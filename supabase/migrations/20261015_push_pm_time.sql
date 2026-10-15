-- The person sets the time of the afternoon check (2026-10-15). Rows from before keep 15:00.
-- Run this before the new push function is deployed: the function writes this column.
alter table public.push_subs
  add column if not exists pmt text not null default '15:00'
  check (pmt ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
