alter table public.notification_delivery_runs
  add column if not exists attempt_aggregates jsonb;
