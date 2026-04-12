create table if not exists public.moderation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users (id) on delete set null,
  target_type text not null,
  target_id uuid null,
  action text not null,
  reasons text[] not null default '{}',
  guidance_family text null,
  choice text not null,
  free_text text null,
  path text null,
  retry_attempted boolean not null default false,
  retry_succeeded boolean null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.moderation_feedback
  drop constraint if exists moderation_feedback_target_type_check;

alter table public.moderation_feedback
  add constraint moderation_feedback_target_type_check
  check (
    target_type in (
      'post_title',
      'post_body',
      'comment_body',
      'beta_application_note',
      'profile_bio',
      'feedback_message'
    )
  );

alter table public.moderation_feedback
  drop constraint if exists moderation_feedback_action_check;

alter table public.moderation_feedback
  add constraint moderation_feedback_action_check
  check (action in ('allow_with_guidance', 'soft_hold', 'safety_hold', 'hard_block'));

alter table public.moderation_feedback
  drop constraint if exists moderation_feedback_guidance_family_check;

alter table public.moderation_feedback
  add constraint moderation_feedback_guidance_family_check
  check (
    guidance_family is null
    or guidance_family in (
      'advice_or_preaching',
      'ridicule_or_mockery',
      'blame_or_attack',
      'profanity_or_harsh_tone',
      'privacy_exposure',
      'crisis_signal'
    )
  );

alter table public.moderation_feedback
  drop constraint if exists moderation_feedback_choice_check;

alter table public.moderation_feedback
  add constraint moderation_feedback_choice_check
  check (
    choice in (
      'understood',
      'felt_too_strict',
      'still_confusing',
      'tone_felt_okay',
      'tone_felt_cold',
      'felt_necessary'
    )
  );

create index if not exists moderation_feedback_created_at_idx
  on public.moderation_feedback (created_at desc);

create index if not exists moderation_feedback_action_idx
  on public.moderation_feedback (action, created_at desc);

create index if not exists moderation_feedback_target_idx
  on public.moderation_feedback (target_type, created_at desc);

create index if not exists moderation_feedback_user_idx
  on public.moderation_feedback (user_id, created_at desc);
