-- The live schema, written down (2026-10-21, flaw 2 of the agent review).
-- The boards table and the push health tables were made on the live database (project
-- phicqgnzqnuwugzbgxxw, eu-north-1) by migrations that never reached this folder:
-- board_per_user, remove_board_table, boards_one_row_per_user, pin_touch_updated_at_search_path,
-- and the monitoring part of push_reminders. This file records them as they are live, read on
-- 2026-10-21 from pg_class, pg_policies, pg_proc, pg_trigger and cron.job.
-- It is idempotent: on the live database it changes nothing. On a fresh database it builds the
-- same tables, rules, functions and jobs. Grants are tightened in a separate file
-- (20261021090100_boards_tighten_grants.sql), so this one stays a faithful record.

-- ---- boards: one row per person, the synced board --------------------------------------------
create table if not exists public.boards (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.boards enable row level security;

-- a person reads, adds, changes and deletes only their own row
drop policy if exists boards_select_own on public.boards;
create policy boards_select_own on public.boards for select to authenticated using (auth.uid() = user_id);
drop policy if exists boards_insert_own on public.boards;
create policy boards_insert_own on public.boards for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists boards_update_own on public.boards;
create policy boards_update_own on public.boards for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists boards_delete_own on public.boards;
create policy boards_delete_own on public.boards for delete to authenticated using (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  new.updated_at = now();
  return new;
end $function$;
drop trigger if exists boards_touch_updated_at on public.boards;
create trigger boards_touch_updated_at before update on public.boards
  for each row execute function public.touch_updated_at();

-- ---- push health: counts only, closed to every browser role -------------------------------------
create table if not exists public.push_status (
  id int primary key default 1 check (id = 1),
  last_run timestamptz,
  last_ok timestamptz,
  last_sent timestamptz
);
insert into public.push_status (id) values (1) on conflict (id) do nothing;
alter table public.push_status enable row level security;
revoke all on public.push_status from anon, authenticated, public;

create table if not exists public.push_hourly (
  hour timestamptz primary key,
  runs int not null default 0,
  due int not null default 0,
  sent int not null default 0,
  gone int not null default 0,
  failed int not null default 0
);
alter table public.push_hourly enable row level security;
revoke all on public.push_hourly from anon, authenticated, public;

create table if not exists public.push_alerts (
  id bigint generated always as identity primary key,
  kind text not null,
  detail text,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  emailed_open_at timestamptz,
  emailed_resolved_at timestamptz
);
alter table public.push_alerts enable row level security;
revoke all on public.push_alerts from anon, authenticated, public;

create or replace view public.push_health_daily as
  select date_trunc('day', hour) as day, sum(runs) as runs, sum(due) as due, sum(sent) as sent,
         sum(gone) as gone, sum(failed) as failed
    from public.push_hourly group by date_trunc('day', hour) order by date_trunc('day', hour) desc;
create or replace view public.push_status_now as
  select (select count(*) from public.push_subs) as subscribed_devices, last_run, last_ok, last_sent,
         (select count(*) from public.push_alerts a where a.resolved_at is null) as open_alerts
    from public.push_status s where id = 1;
revoke all on public.push_health_daily, public.push_status_now from anon, authenticated, public;

-- called by the push function after each run (service role only)
create or replace function public.push_record(p_due integer, p_sent integer, p_gone integer, p_failed integer)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.push_hourly (hour, runs, due, sent, gone, failed)
  values (date_trunc('hour', now()), 1, p_due, p_sent, p_gone, p_failed)
  on conflict (hour) do update set
    runs = push_hourly.runs + 1, due = push_hourly.due + excluded.due, sent = push_hourly.sent + excluded.sent,
    gone = push_hourly.gone + excluded.gone, failed = push_hourly.failed + excluded.failed;
  update public.push_status
     set last_run = now(), last_ok = now(), last_sent = case when p_sent > 0 then now() else last_sent end
   where id = 1;
end $function$;

-- every 5 minutes: opens or resolves an alert and asks the alert function to mail the owner
create or replace function public.push_watch(p_now timestamp with time zone default now(), p_notify boolean default true)
returns table(kind text, state text, detail text)
language plpgsql
security definer
set search_path to ''
as $function$
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
end $function$;

-- daily: drops job logs and old counts
create or replace function public.push_clean()
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  delete from cron.job_run_details where end_time < now() - interval '7 days';
  delete from net._http_response where created < now() - interval '7 days';
  delete from public.push_hourly where hour < now() - interval '90 days';
  delete from public.push_alerts where resolved_at < now() - interval '90 days';
end $function$;

-- the 3 functions run with the owner's rights, so only the server role may call them
revoke all on function public.push_record(integer, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.push_watch(timestamp with time zone, boolean) from public, anon, authenticated;
revoke all on function public.push_clean() from public, anon, authenticated;
grant execute on function public.push_record(integer, integer, integer, integer) to service_role;
grant execute on function public.push_watch(timestamp with time zone, boolean) to service_role;
grant execute on function public.push_clean() to service_role;

-- the jobs (push-tick is in 20261005_push.sql); cron.schedule replaces a job of the same name
select cron.schedule('push-watch', '*/5 * * * *', $job$ select public.push_watch() $job$);
select cron.schedule('push-clean', '10 3 * * *', $job$ select public.push_clean() $job$);
