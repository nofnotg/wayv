alter table public.notification_delivery_attempt_logs
  add column if not exists sender_mode text;

create index if not exists notification_delivery_attempt_logs_retry_category_idx
  on public.notification_delivery_attempt_logs (retry_category, created_at desc);
