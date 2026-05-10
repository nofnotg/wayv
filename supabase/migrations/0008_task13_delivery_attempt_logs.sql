create table if not exists public.notification_delivery_attempt_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.notification_delivery_runs(id) on delete cascade,
  claim_token uuid not null,
  event_id uuid not null references public.notification_events(id) on delete cascade,
  channel text not null,
  adapter_key text not null,
  outcome text not null,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists notification_delivery_attempt_logs_run_id_idx
  on public.notification_delivery_attempt_logs (run_id, created_at desc);

create index if not exists notification_delivery_attempt_logs_event_id_idx
  on public.notification_delivery_attempt_logs (event_id, created_at desc);
