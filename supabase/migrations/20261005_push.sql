-- Push reminders. Additive: two new tables and one job. Nothing existing is touched.
-- The tables are closed to every browser role. Only the push function (service role) reads them.
create table if not exists public.push_subs (
  id bigint generated always as identity primary key,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  tz text not null,
  brief text not null default '07:30',
  wind text not null default '22:30',
  am boolean not null default true,
  pm boolean not null default true,
  last_am text,
  last_pm text,
  fails int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.push_subs enable row level security;
revoke all on public.push_subs from anon, authenticated, public;

create table if not exists public.push_config (
  key text primary key,
  value text not null
);
alter table public.push_config enable row level security;
revoke all on public.push_config from anon, authenticated, public;
insert into public.push_config (key, value)
  values ('tick', encode(extensions.gen_random_bytes(24), 'hex'))
  on conflict (key) do nothing;

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- Every minute, and only while at least one device is subscribed.
select cron.schedule('push-tick', '* * * * *', $job$
  select net.http_post(
    url := 'https://phicqgnzqnuwugzbgxxw.supabase.co/functions/v1/push/tick',
    headers := jsonb_build_object('content-type', 'application/json',
                                  'x-tick', (select value from public.push_config where key = 'tick')),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000)
  where exists (select 1 from public.push_subs)
$job$);
