alter table public.content_guardrail_flags
  drop constraint if exists content_guardrail_flags_target_type_check;

alter table public.content_guardrail_flags
  add constraint content_guardrail_flags_target_type_check
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

alter table public.content_guardrail_flags
  drop constraint if exists content_guardrail_flags_action_check;

alter table public.content_guardrail_flags
  add constraint content_guardrail_flags_action_check
  check (action in ('allow_with_guidance', 'soft_hold', 'safety_hold', 'hard_block'));

alter table public.content_guardrail_flags
  add column if not exists original_text text null,
  add column if not exists severity text not null default 'low',
  add column if not exists suggested_action text not null default 'allow_with_guidance',
  add column if not exists guidance_family text null;

alter table public.content_guardrail_flags
  drop constraint if exists content_guardrail_flags_severity_check;

alter table public.content_guardrail_flags
  add constraint content_guardrail_flags_severity_check
  check (severity in ('low', 'medium', 'high', 'critical'));

alter table public.content_guardrail_flags
  drop constraint if exists content_guardrail_flags_suggested_action_check;

alter table public.content_guardrail_flags
  add constraint content_guardrail_flags_suggested_action_check
  check (suggested_action in ('allow_with_guidance', 'soft_hold', 'safety_hold', 'hard_block'));

alter table public.content_guardrail_flags
  drop constraint if exists content_guardrail_flags_guidance_family_check;

alter table public.content_guardrail_flags
  add constraint content_guardrail_flags_guidance_family_check
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

create index if not exists content_guardrail_flags_action_idx
  on public.content_guardrail_flags (action, created_at desc);

create index if not exists content_guardrail_flags_severity_idx
  on public.content_guardrail_flags (severity, created_at desc);
