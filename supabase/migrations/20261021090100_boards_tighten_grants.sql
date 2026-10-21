-- Tighten what browser roles hold on boards (2026-10-21, flaw 2 of the agent review). NOT applied yet.
-- Live, anon and authenticated hold every table privilege on public.boards (Supabase's default),
-- including TRUNCATE, TRIGGER and REFERENCES. Row-level security limits select, insert, update and
-- delete to the person's own row, but it does not cover TRUNCATE. The REST interface offers no
-- TRUNCATE, so this is not reachable today; it is closed here so it never becomes reachable.
-- A signed-out visitor (anon) has no policy on boards and never needs it, so anon loses everything.
-- The app is not affected: sync runs only when signed in, with select, insert, update and delete.
revoke all on public.boards from anon;
revoke truncate, trigger, references on public.boards from authenticated;
grant select, insert, update, delete on public.boards to authenticated;
