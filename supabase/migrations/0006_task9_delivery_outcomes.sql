alter table public.notification_events
  drop constraint if exists notification_events_state_check;

alter table public.notification_events
  add constraint notification_events_state_check
  check (
    state in (
      'pending',
      'suppressed',
      'skipped_duplicate',
      'operational_only',
      'retryable',
      'failed',
      'sent',
      'read',
      'dismissed'
    )
  ) not valid;

alter table public.notification_events
  add column if not exists claim_token text,
  add column if not exists claimed_at timestamptz,
  add column if not exists claim_expires_at timestamptz,
  add column if not exists next_retry_at timestamptz,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists last_error text,
  add column if not exists attempt_count integer not null default 0;

create index if not exists notification_events_delivery_ready_idx
  on public.notification_events(state, created_at asc)
  where state in ('pending', 'operational_only', 'retryable');

create index if not exists notification_events_claim_expiry_idx
  on public.notification_events(claim_expires_at asc)
  where claim_token is not null;

create index if not exists notification_events_retry_window_idx
  on public.notification_events(next_retry_at asc)
  where state = 'retryable';
