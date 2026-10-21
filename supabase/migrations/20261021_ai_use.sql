-- How often a person used an AI feature, per day (2026-10-21, flaw 1 of the agent review).
-- Additive: one new table and one function. Nothing existing is touched.
-- api/order.js calls ai_use_take() with the person's own session token, so the count is per
-- person and survives every server instance. The table is closed to every browser role: the
-- function (security definer) is the only way in, and it can only count, never reset.
-- The table holds a user id, a feature name, a date and 3 numbers. No content, no names.
-- Rows older than 7 days are removed as the person makes the next call.
create table if not exists public.ai_use (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('order', 'tutor')),
  day date not null,
  n int not null default 0,
  minute bigint not null default 0,
  minute_n int not null default 0,
  primary key (user_id, kind, day)
);
alter table public.ai_use enable row level security;
revoke all on public.ai_use from anon, authenticated, public;

-- true: go ahead (and counted); false: over a limit (not counted).
-- The caller passes the limits; a person who calls this directly only counts themselves up.
create or replace function public.ai_use_take(p_kind text, p_per_min int, p_per_day int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  d date := (now() at time zone 'utc')::date;
  m bigint := floor(extract(epoch from now()) / 60);
  r public.ai_use;
begin
  if uid is null or p_kind not in ('order', 'tutor') then
    return false;
  end if;
  delete from public.ai_use where user_id = uid and day < d - 7;
  insert into public.ai_use (user_id, kind, day, minute) values (uid, p_kind, d, m)
    on conflict (user_id, kind, day) do nothing;
  select * into r from public.ai_use where user_id = uid and kind = p_kind and day = d for update;
  if r.minute <> m then
    r.minute := m; r.minute_n := 0;
  end if;
  if r.n >= p_per_day or r.minute_n >= p_per_min then
    update public.ai_use set minute = r.minute, minute_n = r.minute_n
      where user_id = uid and kind = p_kind and day = d;
    return false;
  end if;
  update public.ai_use set n = r.n + 1, minute = r.minute, minute_n = r.minute_n + 1
    where user_id = uid and kind = p_kind and day = d;
  return true;
end;
$$;
revoke all on function public.ai_use_take(text, int, int) from public, anon;
grant execute on function public.ai_use_take(text, int, int) to authenticated;
