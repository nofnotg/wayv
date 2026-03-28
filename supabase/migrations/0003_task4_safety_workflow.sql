alter table public.moderation_reports
  add constraint moderation_reports_reason_key_check
  check (
    reason_key in (
      'harmful_expression',
      'personal_attack',
      'privacy_exposure',
      'graphic_or_triggering',
      'spam_or_promotion',
      'other'
    )
  ) not valid;

create index if not exists moderation_reports_target_created_idx
  on public.moderation_reports(target_type, target_id, created_at desc);

create index if not exists moderation_reports_reporter_created_idx
  on public.moderation_reports(reporter_user_id, created_at desc);

create unique index if not exists moderation_reports_reporter_target_reason_uidx
  on public.moderation_reports(reporter_user_id, target_type, target_id, reason_key);
