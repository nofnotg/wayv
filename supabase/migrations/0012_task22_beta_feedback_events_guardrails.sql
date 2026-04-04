create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  category text not null check (category in ('bug', 'confusing', 'suggestion', 'emotional_discomfort', 'exit_reason')),
  message text not null,
  page_path text null,
  contact_email text null,
  created_at timestamptz not null default now()
);

create index if not exists beta_feedback_created_at_idx
  on public.beta_feedback (created_at desc);

create index if not exists beta_feedback_category_idx
  on public.beta_feedback (category);

create table if not exists public.product_event_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  event_key text not null check (
    event_key in (
      'signup_started',
      'signup_completed',
      'onboarding_completed',
      'post_created',
      'comment_created',
      'reaction_added',
      'rest_mode_started',
      'rest_mode_ended',
      'feedback_submitted'
    )
  ),
  target_type text null,
  target_id text null,
  metadata jsonb not null default '{}'::jsonb,
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_event_logs_created_at_idx
  on public.product_event_logs (created_at desc);

create index if not exists product_event_logs_event_key_idx
  on public.product_event_logs (event_key);

create table if not exists public.content_guardrail_flags (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid null,
  user_id uuid null references auth.users(id) on delete set null,
  action text not null check (action in ('block', 'allow_but_flag')),
  reasons text[] not null default '{}',
  matched_terms text[] not null default '{}',
  content_excerpt text null,
  created_at timestamptz not null default now()
);

create index if not exists content_guardrail_flags_created_at_idx
  on public.content_guardrail_flags (created_at desc);

create index if not exists content_guardrail_flags_target_idx
  on public.content_guardrail_flags (target_type, target_id);

alter table public.wave_posts
  add column if not exists is_seed boolean not null default false,
  add column if not exists seed_batch text null,
  add column if not exists seed_author_type text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'wave_posts_seed_author_type_check'
  ) then
    alter table public.wave_posts
      add constraint wave_posts_seed_author_type_check
      check (seed_author_type is null or seed_author_type in ('operator', 'community_manager', 'system'));
  end if;
end $$;

create index if not exists wave_posts_is_seed_idx
  on public.wave_posts (is_seed, created_at desc);
