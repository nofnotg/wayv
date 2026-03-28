create extension if not exists "pgcrypto";

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text not null,
  display_name text,
  profile_visibility text not null default 'anonymous'
    check (profile_visibility in ('anonymous', 'semi_anonymous', 'nickname_visible', 'profile_visible')),
  avatar_url text,
  bio text,
  onboarding_completed_at timestamptz,
  rest_mode_enabled boolean not null default false,
  notification_opt_in boolean not null default true,
  last_active_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.onboarding_questions (
  key text primary key,
  version integer not null default 1,
  type text not null,
  title text not null,
  subtitle text,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.onboarding_answers (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_key text not null,
  answer_value jsonb,
  skipped boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, question_key)
);

create table if not exists public.onboarding_seed_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  topic_weights jsonb not null default '{}'::jsonb,
  emotion_weights jsonb not null default '{}'::jsonb,
  preferred_wave_tone text not null default 'mixed',
  exposure_tolerance text not null default 'medium',
  privacy_preference text not null default 'anonymous',
  rest_mode_affinity text not null default 'medium',
  notification_tone text not null default 'balanced',
  reading_preference text not null default 'mixed',
  empathy_preference text not null default 'quiet',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wave_posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null,
  visibility_scope text not null default 'public'
    check (visibility_scope in ('public', 'private_archive')),
  moderation_status text not null default 'active'
    check (moderation_status in ('active', 'limited', 'removed', 'under_review')),
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wave_post_categories (
  post_id uuid not null references public.wave_posts(id) on delete cascade,
  category_key text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, category_key)
);

create table if not exists public.wave_post_emotions (
  post_id uuid not null references public.wave_posts(id) on delete cascade,
  emotion_key text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, emotion_key)
);

create table if not exists public.wave_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.wave_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null
    check (reaction_type in ('touched', 'ive_been_there', 'add_wave', 'stay_quiet', 'meaningful_comment', 'save', 'qualified_dwell')),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists wave_reactions_user_post_reaction_idx
  on public.wave_reactions(user_id, post_id, reaction_type);

create table if not exists public.wave_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.wave_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  moderation_status text not null default 'active'
    check (moderation_status in ('active', 'limited', 'removed', 'under_review')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wave_state_snapshots (
  post_id uuid primary key references public.wave_posts(id) on delete cascade,
  raw_energy numeric not null default 0,
  decayed_energy numeric not null default 0,
  velocity numeric not null default 0,
  current_state text not null default 'calm'
    check (current_state in ('calm', 'spreading', 'surging', 'lingering', 'rekindled', 'fading')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  digest_mode text not null default 'light'
    check (digest_mode in ('off', 'light', 'normal')),
  quiet_hours_start text,
  quiet_hours_end text,
  max_daily_notifications integer not null default 2,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null
    check (type in ('for_you_wave', 'rekindled_wave', 'quiet_digest', 'operational_notice', 'safety_notice')),
  channel text not null default 'inapp'
    check (channel in ('inapp', 'email', 'push')),
  title text not null,
  body text not null,
  state text not null default 'pending'
    check (state in ('pending', 'sent', 'read', 'dismissed')),
  created_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  read_at timestamptz
);

create table if not exists public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('web', 'ios', 'android')),
  push_provider text,
  device_token text not null,
  app_build text,
  device_label text,
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists notification_devices_user_platform_token_idx
  on public.notification_devices(user_id, platform, device_token);

create table if not exists public.rest_mode_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  started_at timestamptz,
  ends_at timestamptz,
  allow_operational_notifications boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'user')),
  target_id uuid not null,
  reason_key text not null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists wave_posts_author_created_idx
  on public.wave_posts(author_user_id, created_at desc);

create index if not exists wave_posts_visibility_created_idx
  on public.wave_posts(visibility_scope, created_at desc);

create index if not exists wave_reactions_post_created_idx
  on public.wave_reactions(post_id, created_at desc);

create index if not exists wave_comments_post_created_idx
  on public.wave_comments(post_id, created_at desc);

create index if not exists notification_events_user_state_created_idx
  on public.notification_events(user_id, state, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists onboarding_questions_set_updated_at on public.onboarding_questions;
create trigger onboarding_questions_set_updated_at
before update on public.onboarding_questions
for each row execute function public.set_updated_at();

drop trigger if exists onboarding_answers_set_updated_at on public.onboarding_answers;
create trigger onboarding_answers_set_updated_at
before update on public.onboarding_answers
for each row execute function public.set_updated_at();

drop trigger if exists onboarding_seed_profiles_set_updated_at on public.onboarding_seed_profiles;
create trigger onboarding_seed_profiles_set_updated_at
before update on public.onboarding_seed_profiles
for each row execute function public.set_updated_at();

drop trigger if exists wave_posts_set_updated_at on public.wave_posts;
create trigger wave_posts_set_updated_at
before update on public.wave_posts
for each row execute function public.set_updated_at();

drop trigger if exists wave_comments_set_updated_at on public.wave_comments;
create trigger wave_comments_set_updated_at
before update on public.wave_comments
for each row execute function public.set_updated_at();

drop trigger if exists wave_state_snapshots_set_updated_at on public.wave_state_snapshots;
create trigger wave_state_snapshots_set_updated_at
before update on public.wave_state_snapshots
for each row execute function public.set_updated_at();

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

drop trigger if exists notification_devices_set_updated_at on public.notification_devices;
create trigger notification_devices_set_updated_at
before update on public.notification_devices
for each row execute function public.set_updated_at();

drop trigger if exists rest_mode_settings_set_updated_at on public.rest_mode_settings;
create trigger rest_mode_settings_set_updated_at
before update on public.rest_mode_settings
for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.onboarding_questions enable row level security;
alter table public.onboarding_answers enable row level security;
alter table public.onboarding_seed_profiles enable row level security;
alter table public.wave_posts enable row level security;
alter table public.wave_post_categories enable row level security;
alter table public.wave_post_emotions enable row level security;
alter table public.wave_reactions enable row level security;
alter table public.wave_comments enable row level security;
alter table public.wave_state_snapshots enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_events enable row level security;
alter table public.notification_devices enable row level security;
alter table public.rest_mode_settings enable row level security;
alter table public.moderation_reports enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
on public.user_profiles for select
using (auth.uid() = id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
on public.user_profiles for update
using (auth.uid() = id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
on public.user_profiles for insert
with check (auth.uid() = id);

drop policy if exists "onboarding_questions_read_all" on public.onboarding_questions;
create policy "onboarding_questions_read_all"
on public.onboarding_questions for select
using (is_active = true);

drop policy if exists "onboarding_answers_select_own" on public.onboarding_answers;
create policy "onboarding_answers_select_own"
on public.onboarding_answers for select
using (auth.uid() = user_id);

drop policy if exists "onboarding_answers_upsert_own" on public.onboarding_answers;
create policy "onboarding_answers_upsert_own"
on public.onboarding_answers for insert
with check (auth.uid() = user_id);

drop policy if exists "onboarding_answers_update_own" on public.onboarding_answers;
create policy "onboarding_answers_update_own"
on public.onboarding_answers for update
using (auth.uid() = user_id);

drop policy if exists "onboarding_seed_profiles_select_own" on public.onboarding_seed_profiles;
create policy "onboarding_seed_profiles_select_own"
on public.onboarding_seed_profiles for select
using (auth.uid() = user_id);

drop policy if exists "onboarding_seed_profiles_upsert_own" on public.onboarding_seed_profiles;
create policy "onboarding_seed_profiles_upsert_own"
on public.onboarding_seed_profiles for insert
with check (auth.uid() = user_id);

drop policy if exists "onboarding_seed_profiles_update_own" on public.onboarding_seed_profiles;
create policy "onboarding_seed_profiles_update_own"
on public.onboarding_seed_profiles for update
using (auth.uid() = user_id);

drop policy if exists "wave_posts_public_read" on public.wave_posts;
create policy "wave_posts_public_read"
on public.wave_posts for select
using (visibility_scope = 'public' and moderation_status = 'active' or auth.uid() = author_user_id);

drop policy if exists "wave_posts_insert_own" on public.wave_posts;
create policy "wave_posts_insert_own"
on public.wave_posts for insert
with check (auth.uid() = author_user_id);

drop policy if exists "wave_posts_update_own" on public.wave_posts;
create policy "wave_posts_update_own"
on public.wave_posts for update
using (auth.uid() = author_user_id);

drop policy if exists "wave_post_categories_read_public" on public.wave_post_categories;
create policy "wave_post_categories_read_public"
on public.wave_post_categories for select
using (
  exists (
    select 1 from public.wave_posts p
    where p.id = post_id
      and (p.visibility_scope = 'public' and p.moderation_status = 'active' or p.author_user_id = auth.uid())
  )
);

drop policy if exists "wave_post_categories_insert_owner" on public.wave_post_categories;
create policy "wave_post_categories_insert_owner"
on public.wave_post_categories for insert
with check (
  exists (
    select 1 from public.wave_posts p
    where p.id = post_id and p.author_user_id = auth.uid()
  )
);

drop policy if exists "wave_post_emotions_read_public" on public.wave_post_emotions;
create policy "wave_post_emotions_read_public"
on public.wave_post_emotions for select
using (
  exists (
    select 1 from public.wave_posts p
    where p.id = post_id
      and (p.visibility_scope = 'public' and p.moderation_status = 'active' or p.author_user_id = auth.uid())
  )
);

drop policy if exists "wave_post_emotions_insert_owner" on public.wave_post_emotions;
create policy "wave_post_emotions_insert_owner"
on public.wave_post_emotions for insert
with check (
  exists (
    select 1 from public.wave_posts p
    where p.id = post_id and p.author_user_id = auth.uid()
  )
);

drop policy if exists "wave_reactions_read_public" on public.wave_reactions;
create policy "wave_reactions_read_public"
on public.wave_reactions for select
using (
  exists (
    select 1 from public.wave_posts p
    where p.id = post_id
      and (p.visibility_scope = 'public' and p.moderation_status = 'active' or p.author_user_id = auth.uid())
  )
);

drop policy if exists "wave_reactions_insert_own" on public.wave_reactions;
create policy "wave_reactions_insert_own"
on public.wave_reactions for insert
with check (auth.uid() = user_id);

drop policy if exists "wave_comments_read_public" on public.wave_comments;
create policy "wave_comments_read_public"
on public.wave_comments for select
using (
  exists (
    select 1 from public.wave_posts p
    where p.id = post_id
      and (p.visibility_scope = 'public' and p.moderation_status = 'active' or p.author_user_id = auth.uid())
  )
);

drop policy if exists "wave_comments_insert_own" on public.wave_comments;
create policy "wave_comments_insert_own"
on public.wave_comments for insert
with check (auth.uid() = user_id);

drop policy if exists "wave_comments_update_own" on public.wave_comments;
create policy "wave_comments_update_own"
on public.wave_comments for update
using (auth.uid() = user_id);

drop policy if exists "wave_state_snapshots_read_public" on public.wave_state_snapshots;
create policy "wave_state_snapshots_read_public"
on public.wave_state_snapshots for select
using (
  exists (
    select 1 from public.wave_posts p
    where p.id = post_id
      and (p.visibility_scope = 'public' and p.moderation_status = 'active' or p.author_user_id = auth.uid())
  )
);

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
on public.notification_preferences for select
using (auth.uid() = user_id);

drop policy if exists "notification_preferences_upsert_own" on public.notification_preferences;
create policy "notification_preferences_upsert_own"
on public.notification_preferences for insert
with check (auth.uid() = user_id);

drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own"
on public.notification_preferences for update
using (auth.uid() = user_id);

drop policy if exists "notification_events_select_own" on public.notification_events;
create policy "notification_events_select_own"
on public.notification_events for select
using (auth.uid() = user_id);

drop policy if exists "notification_devices_select_own" on public.notification_devices;
create policy "notification_devices_select_own"
on public.notification_devices for select
using (auth.uid() = user_id);

drop policy if exists "notification_devices_upsert_own" on public.notification_devices;
create policy "notification_devices_upsert_own"
on public.notification_devices for insert
with check (auth.uid() = user_id);

drop policy if exists "notification_devices_update_own" on public.notification_devices;
create policy "notification_devices_update_own"
on public.notification_devices for update
using (auth.uid() = user_id);

drop policy if exists "rest_mode_settings_select_own" on public.rest_mode_settings;
create policy "rest_mode_settings_select_own"
on public.rest_mode_settings for select
using (auth.uid() = user_id);

drop policy if exists "rest_mode_settings_upsert_own" on public.rest_mode_settings;
create policy "rest_mode_settings_upsert_own"
on public.rest_mode_settings for insert
with check (auth.uid() = user_id);

drop policy if exists "rest_mode_settings_update_own" on public.rest_mode_settings;
create policy "rest_mode_settings_update_own"
on public.rest_mode_settings for update
using (auth.uid() = user_id);

drop policy if exists "moderation_reports_insert_own" on public.moderation_reports;
create policy "moderation_reports_insert_own"
on public.moderation_reports for insert
with check (auth.uid() = reporter_user_id);
