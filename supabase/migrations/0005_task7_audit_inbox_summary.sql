create table if not exists public.moderation_audit_logs (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  previous_status text not null
    check (previous_status in ('active', 'limited', 'removed', 'under_review')),
  next_status text not null
    check (next_status in ('active', 'limited', 'removed', 'under_review')),
  actor_label text not null default 'internal-token',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.moderation_audit_logs enable row level security;

create index if not exists moderation_audit_logs_target_created_idx
  on public.moderation_audit_logs(target_type, target_id, created_at desc);

create index if not exists moderation_audit_logs_created_idx
  on public.moderation_audit_logs(created_at desc);

create index if not exists notification_events_user_unread_created_idx
  on public.notification_events(user_id, created_at desc)
  where read_at is null and state in ('pending', 'operational_only', 'sent');
