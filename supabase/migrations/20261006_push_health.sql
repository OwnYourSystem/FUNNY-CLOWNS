-- F8 server side: push health record, alert checks, log cleanup. Additive: new tables, views, functions and two jobs.
-- Nothing existing is touched. Everything is closed to browser roles; only the service role and the database itself use it.

create table if not exists public.push_status (
  id int primary key default 1 check (id = 1),
  last_run timestamptz,
  last_ok timestamptz,
  last_sent timestamptz
);
insert into public.push_status (id) values (1) on conflict (id) do nothing;

create table if not exists public.push_hourly (
  hour timestamptz primary key,
  runs int not null default 0,
  due int not null default 0,
  sent int not null default 0,
  gone int not null default 0,      -- dead addresses and devices removed after repeated failures: normal churn
  failed int not null default 0     -- real send failures
);

create table if not exists public.push_alerts (
  id bigint generated always as identity primary key,
  kind text not null,
  detail text,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  emailed_open_at timestamptz,
  emailed_resolved_at timestamptz
);
create unique index if not exists push_alerts_one_open on public.push_alerts (kind) where resolved_at is null;

alter table public.push_status enable row level security;
alter table public.push_hourly enable row level security;
alter table public.push_alerts enable row level security;
revoke all on public.push_status, public.push_hourly, public.push_alerts from anon, authenticated, public;

-- the push function reports each run here (counts only: no address, no key, no text)
create or replace function public.push_record(p_due int, p_sent int, p_gone int, p_failed int)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.push_hourly (hour, runs, due, sent, gone, failed)
  values (date_trunc('hour', now()), 1, p_due, p_sent, p_gone, p_failed)
  on conflict (hour) do update set
    runs = push_hourly.runs + 1, due = push_hourly.due + excluded.due, sent = push_hourly.sent + excluded.sent,
    gone = push_hourly.gone + excluded.gone, failed = push_hourly.failed + excluded.failed;
  update public.push_status
     set last_run = now(), last_ok = now(), last_sent = case when p_sent > 0 then now() else last_sent end
   where id = 1;
end $$;
revoke all on function public.push_record(int, int, int, int) from public, anon, authenticated;
grant execute on function public.push_record(int, int, int, int) to service_role;

-- the watcher: three checks, one open alert per kind, one mail when it opens and one when it clears.
-- It runs in the database, so a dead edge function is still noticed. p_now and p_notify let tests drive it.
create or replace function public.push_watch(p_now timestamptz default now(), p_notify boolean default true)
returns table (kind text, state text, detail text) language plpgsql security definer set search_path = '' as $$
declare
  subs int; oldest timestamptz; st public.push_status%rowtype;
  d int; s int; g int; f int;
  k text; bad boolean; det text; open_id bigint; new_id bigint;
begin
  select count(*), min(created_at) into subs, oldest from public.push_subs;
  select * into st from public.push_status where id = 1;
  select coalesce(sum(due), 0), coalesce(sum(sent), 0), coalesce(sum(gone), 0), coalesce(sum(failed), 0)
    into d, s, g, f from public.push_hourly where hour >= date_trunc('hour', p_now - interval '24 hours');

  for k, bad, det in
    select * from (values
      ('job_stopped',
        subs > 0 and ((st.last_ok is null and oldest < p_now - interval '15 minutes') or st.last_ok < p_now - interval '15 minutes'),
        'last good run: ' || coalesce(st.last_ok::text, 'never')),
      ('send_failures',
        (d >= 5 and f::numeric / d > 0.2) or (d >= 1 and s = 0 and f >= 1),
        'last 24 hours: due ' || d || ', sent ' || s || ', failed ' || f || ', dead addresses removed ' || g),
      ('nothing_sent',
        subs > 0 and oldest < p_now - interval '36 hours' and (st.last_sent is null or st.last_sent < p_now - interval '36 hours'),
        'last push sent: ' || coalesce(st.last_sent::text, 'never'))
    ) as t(kind, bad, detail)
  loop
    select a.id into open_id from public.push_alerts a where a.kind = k and a.resolved_at is null;
    if bad and open_id is null then
      insert into public.push_alerts (kind, detail, opened_at) values (k, det, p_now) returning id into new_id;
      kind := k; state := 'open'; detail := det; return next;
      if p_notify then
        perform net.http_post(
          url := 'https://phicqgnzqnuwugzbgxxw.supabase.co/functions/v1/alert',
          headers := jsonb_build_object('content-type', 'application/json', 'x-tick', (select value from public.push_config where key = 'tick')),
          body := jsonb_build_object('id', new_id, 'kind', k, 'state', 'open', 'detail', det),
          timeout_milliseconds := 20000);
      end if;
    elsif not bad and open_id is not null then
      update public.push_alerts a set resolved_at = p_now where a.id = open_id;
      kind := k; state := 'resolved'; detail := det; return next;
      if p_notify then
        perform net.http_post(
          url := 'https://phicqgnzqnuwugzbgxxw.supabase.co/functions/v1/alert',
          headers := jsonb_build_object('content-type', 'application/json', 'x-tick', (select value from public.push_config where key = 'tick')),
          body := jsonb_build_object('id', open_id, 'kind', k, 'state', 'resolved', 'detail', det),
          timeout_milliseconds := 20000);
      end if;
    end if;
  end loop;
end $$;
revoke all on function public.push_watch(timestamptz, boolean) from public, anon, authenticated;

-- retention: job logs 7 days, hourly counts and closed alerts 90 days
create or replace function public.push_clean()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from cron.job_run_details where end_time < now() - interval '7 days';
  delete from net._http_response where created < now() - interval '7 days';
  delete from public.push_hourly where hour < now() - interval '90 days';
  delete from public.push_alerts where resolved_at < now() - interval '90 days';
end $$;
revoke all on function public.push_clean() from public, anon, authenticated;

-- the owner's status view: today's and recent numbers, no addresses
create or replace view public.push_health_daily with (security_invoker = true) as
  select date_trunc('day', hour) as day, sum(runs) as runs, sum(due) as due, sum(sent) as sent, sum(gone) as gone, sum(failed) as failed
  from public.push_hourly group by 1 order by 1 desc;
create or replace view public.push_status_now with (security_invoker = true) as
  select (select count(*) from public.push_subs) as subscribed_devices, s.last_run, s.last_ok, s.last_sent,
         (select count(*) from public.push_alerts a where a.resolved_at is null) as open_alerts
  from public.push_status s where s.id = 1;
revoke all on public.push_health_daily, public.push_status_now from anon, authenticated, public;

select cron.schedule('push-watch', '*/5 * * * *', $job$ select public.push_watch() $job$);
select cron.schedule('push-clean', '10 3 * * *', $job$ select public.push_clean() $job$);
