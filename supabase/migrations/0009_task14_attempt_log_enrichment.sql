alter table public.notification_delivery_attempt_logs
  add column if not exists provider_key text,
  add column if not exists external_message_id text,
  add column if not exists retry_category text,
  add column if not exists provider_status_code text;

create index if not exists notification_delivery_attempt_logs_provider_key_idx
  on public.notification_delivery_attempt_logs (provider_key, created_at desc);
