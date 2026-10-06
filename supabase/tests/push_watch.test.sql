-- Runs push_watch against synthetic clocks and rows, asserts, then ROLLS BACK by raising an exception.
-- Safe on the live database: nothing persists, and p_notify = false sends no mail.
do $$
declare r record; n int; t0 timestamptz := '2026-10-10 12:00:00+00';
begin
  delete from public.push_alerts; delete from public.push_hourly;
  update public.push_status set last_run = t0, last_ok = t0, last_sent = t0 where id = 1;
  insert into public.push_subs (endpoint, p256dh, auth, tz, created_at) values ('https://fcm.googleapis.com/fcm/send/WATCHTEST', 'x', 'y', 'UTC', t0 - interval '3 days');

  -- 1. healthy: nothing opens
  select count(*) into n from public.push_watch(t0 + interval '5 minutes', false);
  if n <> 0 then raise exception 'FAIL 1 healthy opened % alerts', n; end if;

  -- 2. the job stops: opens once, does not repeat, resolves when it runs again
  select count(*) into n from public.push_watch(t0 + interval '20 minutes', false);
  if n <> 1 then raise exception 'FAIL 2a expected 1 alert, got %', n; end if;
  select count(*) into n from public.push_watch(t0 + interval '25 minutes', false);
  if n <> 0 then raise exception 'FAIL 2b repeated the open alert'; end if;
  update public.push_status set last_ok = t0 + interval '26 minutes' where id = 1;
  select count(*) into n from public.push_watch(t0 + interval '27 minutes', false) where state = 'resolved' and kind = 'job_stopped';
  if n <> 1 then raise exception 'FAIL 2c did not resolve'; end if;

  -- 3. send failures: 5 of 10 failed opens; dead addresses alone do not
  update public.push_status set last_ok = t0 + interval '1 hour', last_sent = t0 + interval '1 hour' where id = 1;
  insert into public.push_hourly (hour, runs, due, sent, gone, failed) values (t0, 10, 10, 5, 0, 5);
  select count(*) into n from public.push_watch(t0 + interval '1 hour 1 minute', false) where kind = 'send_failures' and state = 'open';
  if n <> 1 then raise exception 'FAIL 3a failure rate did not open'; end if;
  delete from public.push_alerts; delete from public.push_hourly;
  insert into public.push_hourly (hour, runs, due, sent, gone, failed) values (t0, 10, 10, 5, 5, 0);
  select count(*) into n from public.push_watch(t0 + interval '1 hour 1 minute', false) where kind = 'send_failures';
  if n <> 0 then raise exception 'FAIL 3b dead addresses raised an alert'; end if;
  delete from public.push_hourly;
  insert into public.push_hourly (hour, runs, due, sent, gone, failed) values (t0, 3, 1, 0, 0, 1);
  select count(*) into n from public.push_watch(t0 + interval '1 hour 1 minute', false) where kind = 'send_failures' and state = 'open';
  if n <> 1 then raise exception 'FAIL 3c single total failure did not open'; end if;
  delete from public.push_alerts; delete from public.push_hourly;

  -- 4. nothing sent for 36 hours while a device is old enough
  update public.push_status set last_ok = t0 + interval '40 hours', last_sent = t0 where id = 1;
  select count(*) into n from public.push_watch(t0 + interval '40 hours', false) where kind = 'nothing_sent' and state = 'open';
  if n <> 1 then raise exception 'FAIL 4a silence did not open'; end if;
  update public.push_status set last_sent = t0 + interval '40 hours' where id = 1;
  select count(*) into n from public.push_watch(t0 + interval '40 hours 5 minutes', false) where kind = 'nothing_sent' and state = 'resolved';
  if n <> 1 then raise exception 'FAIL 4b silence did not resolve'; end if;

  -- 5. no devices subscribed: nothing opens even though the job is silent
  delete from public.push_alerts; delete from public.push_subs where endpoint = 'https://fcm.googleapis.com/fcm/send/WATCHTEST';
  select count(*) into n from public.push_subs;
  if n = 0 then
    update public.push_status set last_ok = t0 - interval '5 days', last_sent = t0 - interval '5 days' where id = 1;
    select count(*) into n from public.push_watch(t0, false);
    if n <> 0 then raise exception 'FAIL 5 opened with no devices'; end if;
  end if;

  raise exception 'ALL PASS (rolled back)';
end $$;
