create table if not exists public.notification_delivery_runs (
  id uuid primary key default gen_random_uuid(),
  claim_token uuid not null,
  ran_at timestamptz not null default now(),
  requested_limit integer,
  claimed_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  retryable_count integer not null default 0,
  guardrail_skipped_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists notification_delivery_runs_ran_at_idx
  on public.notification_delivery_runs (ran_at desc);
