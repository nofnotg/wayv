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
      'sent',
      'read',
      'dismissed'
    )
  ) not valid;

alter table public.notification_events
  add column if not exists post_id uuid references public.wave_posts(id) on delete set null,
  add column if not exists lane text,
  add column if not exists suppression_reason text,
  add column if not exists dedupe_key text;

alter table public.notification_events
  drop constraint if exists notification_events_lane_check;

alter table public.notification_events
  add constraint notification_events_lane_check
  check (
    lane is null or lane in ('for_you', 'rekindled', 'quiet_digest', 'operational')
  ) not valid;

alter table public.notification_events
  drop constraint if exists notification_events_suppression_reason_check;

alter table public.notification_events
  add constraint notification_events_suppression_reason_check
  check (
    suppression_reason is null or suppression_reason in (
      'rest_mode',
      'preferences_disabled',
      'quiet_hours',
      'duplicate_window',
      'operational_disabled'
    )
  ) not valid;

create index if not exists notification_events_user_created_idx
  on public.notification_events(user_id, created_at desc);

create index if not exists notification_events_user_dedupe_created_idx
  on public.notification_events(user_id, dedupe_key, created_at desc)
  where dedupe_key is not null;

create index if not exists notification_events_post_created_idx
  on public.notification_events(post_id, created_at desc)
  where post_id is not null;
