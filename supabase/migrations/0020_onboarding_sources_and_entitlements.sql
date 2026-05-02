create table if not exists public.product_plans (
  key text primary key
    check (key in ('free', 'swim', 'surfer')),
  display_name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_key text not null references public.product_plans(key),
  source text not null
    check (source in ('beta_operator_grant', 'manual_operator_grant', 'payment')),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'revoked', 'expired')),
  starts_at timestamptz not null default timezone('utc', now()),
  ends_at timestamptz,
  granted_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists user_entitlements_one_active_idx
  on public.user_entitlements (user_id)
  where status = 'active';

create index if not exists user_entitlements_user_status_idx
  on public.user_entitlements (user_id, status);

create table if not exists public.onboarding_question_sources (
  key text primary key,
  version integer not null default 3,
  label text not null,
  intent text not null,
  psychological_basis text not null,
  type text not null
    check (type in ('single_choice', 'multi_choice', 'scale', 'short_text')),
  profile_targets text[] not null default '{}',
  max_select integer,
  order_index integer not null default 100,
  is_required boolean not null default true,
  is_clarifier boolean not null default false,
  is_active boolean not null default true,
  operator_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.onboarding_question_phrasings (
  id uuid primary key default gen_random_uuid(),
  source_key text not null references public.onboarding_question_sources(key) on delete cascade,
  locale text not null default 'ko',
  text text not null,
  subtitle text,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists onboarding_question_phrasings_source_idx
  on public.onboarding_question_phrasings (source_key, is_active);

create unique index if not exists onboarding_question_phrasings_source_text_idx
  on public.onboarding_question_phrasings (source_key, text);

create table if not exists public.onboarding_question_options (
  id uuid primary key default gen_random_uuid(),
  source_key text not null references public.onboarding_question_sources(key) on delete cascade,
  option_key text not null,
  label text not null,
  description text,
  seed_patch jsonb not null default '{}'::jsonb,
  order_index integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (source_key, option_key)
);

create index if not exists onboarding_question_options_source_idx
  on public.onboarding_question_options (source_key, is_active, order_index);

create table if not exists public.onboarding_question_branches (
  id uuid primary key default gen_random_uuid(),
  source_key text not null references public.onboarding_question_sources(key) on delete cascade,
  depends_on_source_key text not null references public.onboarding_question_sources(key) on delete cascade,
  any_of text[] not null default '{}',
  order_index integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists onboarding_question_branches_source_idx
  on public.onboarding_question_branches (source_key, is_active, order_index);

create unique index if not exists onboarding_question_branches_rule_idx
  on public.onboarding_question_branches (source_key, depends_on_source_key, any_of);

create table if not exists public.onboarding_question_audit_logs (
  id uuid primary key default gen_random_uuid(),
  source_key text,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_label text not null,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists onboarding_question_audit_logs_source_created_idx
  on public.onboarding_question_audit_logs (source_key, created_at desc);

drop trigger if exists product_plans_set_updated_at on public.product_plans;
create trigger product_plans_set_updated_at
before update on public.product_plans
for each row execute function public.set_updated_at();

drop trigger if exists user_entitlements_set_updated_at on public.user_entitlements;
create trigger user_entitlements_set_updated_at
before update on public.user_entitlements
for each row execute function public.set_updated_at();

drop trigger if exists onboarding_question_sources_set_updated_at on public.onboarding_question_sources;
create trigger onboarding_question_sources_set_updated_at
before update on public.onboarding_question_sources
for each row execute function public.set_updated_at();

drop trigger if exists onboarding_question_phrasings_set_updated_at on public.onboarding_question_phrasings;
create trigger onboarding_question_phrasings_set_updated_at
before update on public.onboarding_question_phrasings
for each row execute function public.set_updated_at();

drop trigger if exists onboarding_question_options_set_updated_at on public.onboarding_question_options;
create trigger onboarding_question_options_set_updated_at
before update on public.onboarding_question_options
for each row execute function public.set_updated_at();

drop trigger if exists onboarding_question_branches_set_updated_at on public.onboarding_question_branches;
create trigger onboarding_question_branches_set_updated_at
before update on public.onboarding_question_branches
for each row execute function public.set_updated_at();

alter table public.product_plans enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.onboarding_question_sources enable row level security;
alter table public.onboarding_question_phrasings enable row level security;
alter table public.onboarding_question_options enable row level security;
alter table public.onboarding_question_branches enable row level security;
alter table public.onboarding_question_audit_logs enable row level security;

drop policy if exists "product_plans_read_active" on public.product_plans;
create policy "product_plans_read_active"
on public.product_plans for select
using (is_active = true);

drop policy if exists "user_entitlements_select_own" on public.user_entitlements;
create policy "user_entitlements_select_own"
on public.user_entitlements for select
using (auth.uid() = user_id);

drop policy if exists "onboarding_question_sources_read_active" on public.onboarding_question_sources;
create policy "onboarding_question_sources_read_active"
on public.onboarding_question_sources for select
using (is_active = true);

drop policy if exists "onboarding_question_phrasings_read_active" on public.onboarding_question_phrasings;
create policy "onboarding_question_phrasings_read_active"
on public.onboarding_question_phrasings for select
using (is_active = true);

drop policy if exists "onboarding_question_options_read_active" on public.onboarding_question_options;
create policy "onboarding_question_options_read_active"
on public.onboarding_question_options for select
using (is_active = true);

drop policy if exists "onboarding_question_branches_read_active" on public.onboarding_question_branches;
create policy "onboarding_question_branches_read_active"
on public.onboarding_question_branches for select
using (is_active = true);

insert into public.product_plans (key, display_name, description, is_active, updated_at)
values
  ('free', 'Free', '흐름을 가볍게 느껴보는 제한된 시작 플랜', true, timezone('utc', now())),
  ('swim', 'Swim', '베타 사용자의 기본 이용권한이 되는 중심 플랜', true, timezone('utc', now())),
  ('surfer', 'Surfer', '향후 더 깊은 사용 흐름을 위한 확장 플랜 자리', true, timezone('utc', now()))
on conflict (key) do update
set
  display_name = excluded.display_name,
  description = excluded.description,
  is_active = excluded.is_active,
  updated_at = excluded.updated_at;

insert into public.onboarding_question_sources
  (key, version, label, intent, psychological_basis, type, profile_targets, max_select, order_index, is_required, is_clarifier, is_active, operator_note, updated_at)
values
  ('primary_topic', 3, '현재 머무는 생활 영역', '사용자가 처음 보고 싶은 파도의 생활 맥락을 부드럽게 잡는다.', '초기 선택 부담을 낮추는 preference profiling. 진단이 아니라 피드 주제 가중치의 deterministic seed다.', 'single_choice', array['topics'], 1, 10, true, false, true, '기본 3문항 중 첫 질문', timezone('utc', now())),
  ('emotion_relief', 3, '덜 혼자였으면 하는 감정', '사용자가 공감받고 싶은 감정 결을 낮은 압력으로 고른다.', '감정 라벨링을 강제하지 않고 감정 태그 가중치만 만든다.', 'single_choice', array['emotions'], 1, 20, true, false, true, '기본 3문항 중 둘째 질문', timezone('utc', now())),
  ('preferred_tone', 3, '처음 만나는 파도의 온도', '초기 피드의 말투, 거리감, 알림 톤의 기초 선호를 잡는다.', '사용자의 자극 민감도와 공감 선호를 직접 진단하지 않고 상호작용 톤으로 번역한다.', 'single_choice', array['preferredWaveTone','empathyPreference'], 1, 30, true, false, true, '기본 3문항 중 셋째 질문', timezone('utc', now())),
  ('privacy_preference', 3, '처음 드러나는 정도', '조용한/가벼운 톤을 고른 사용자에게 공개 범위를 확인한다.', '불확실한 노출 감각을 한 번 더 확인하는 clarifier다.', 'single_choice', array['privacyPreference'], 1, 40, false, true, true, 'preferred_tone 기반 분기', timezone('utc', now())),
  ('relationship_detail', 3, '사람과 거리의 세부 결', '관계 주제를 고른 사용자의 맥락을 하나 더 분명하게 한다.', '세부 감정 가중치를 살짝 보정하되 설명 의무를 만들지 않는다.', 'single_choice', array['emotions'], 1, 50, false, true, true, 'primary_topic 기반 분기', timezone('utc', now())),
  ('stimulation_sensitivity', 3, '잔잔한 흐름의 필요 정도', '조용한 톤을 고른 사용자의 자극 민감도를 낮은 해상도로 확인한다.', '숫자는 분석 점수가 아니라 피드 강도와 알림 빈도의 안전한 제한값으로만 쓴다.', 'scale', array['exposureTolerance','restModeAffinity'], null, 60, false, true, true, 'preferred_tone 기반 분기', timezone('utc', now())),
  ('notification_tone', 3, '다시 불러주는 거리', '공명형 톤을 고른 사용자에게 알림 거리감을 묻는다.', '재방문 유도보다 사용자의 리듬 보호를 우선하는 notification preference seed다.', 'single_choice', array['notificationTone'], 1, 70, false, true, true, 'preferred_tone 기반 분기', timezone('utc', now()))
on conflict (key) do update
set
  version = excluded.version,
  label = excluded.label,
  intent = excluded.intent,
  psychological_basis = excluded.psychological_basis,
  type = excluded.type,
  profile_targets = excluded.profile_targets,
  max_select = excluded.max_select,
  order_index = excluded.order_index,
  is_required = excluded.is_required,
  is_clarifier = excluded.is_clarifier,
  is_active = excluded.is_active,
  operator_note = excluded.operator_note,
  updated_at = excluded.updated_at;

insert into public.onboarding_question_phrasings
  (source_key, locale, text, subtitle, is_primary, is_active, updated_at)
values
  ('primary_topic', 'ko', '요즘 마음이 자주 머무는 곳은 어디에 가까워요?', '정확히 설명하지 않아도 괜찮아요. 가장 가까운 쪽만 골라 주세요.', true, true, timezone('utc', now())),
  ('primary_topic', 'ko', '요즘 어떤 파도가 가장 자주 안쪽을 지나가나요?', null, false, true, timezone('utc', now())),
  ('primary_topic', 'ko', '지금의 생활에서 가장 오래 남는 결은 어느 쪽인가요?', null, false, true, timezone('utc', now())),
  ('emotion_relief', 'ko', '읽고 난 뒤 조금 가벼워졌으면 하는 감정은 무엇에 가까워요?', null, true, true, timezone('utc', now())),
  ('emotion_relief', 'ko', '다른 사람의 파도를 볼 때, 무엇이 조금 덜 혼자였으면 하나요?', null, false, true, timezone('utc', now())),
  ('emotion_relief', 'ko', 'wayv가 조용히 받아주었으면 하는 감정은 어느 쪽인가요?', null, false, true, timezone('utc', now())),
  ('preferred_tone', 'ko', '처음에는 어떤 온도의 파도가 편할까요?', null, true, true, timezone('utc', now())),
  ('preferred_tone', 'ko', '지금 내게 너무 세지 않은 흐름은 어느 쪽일까요?', null, false, true, timezone('utc', now())),
  ('preferred_tone', 'ko', '처음 만나는 wayv가 어떤 거리였으면 하나요?', null, false, true, timezone('utc', now())),
  ('privacy_preference', 'ko', '처음의 나는 어느 정도로 드러나는 게 편할까요?', '나중에 언제든 바꿀 수 있어요.', true, true, timezone('utc', now())),
  ('relationship_detail', 'ko', '사람과 거리라면, 어느 결이 더 가까워요?', '선택을 조금 더 분명하게 하기 위한 짧은 질문이에요.', true, true, timezone('utc', now())),
  ('stimulation_sensitivity', 'ko', '지금은 얼마나 잔잔한 흐름이 편한가요?', '1은 조금 더 열려 있음, 5는 아주 조용한 흐름이 필요한 상태예요.', true, true, timezone('utc', now())),
  ('notification_tone', 'ko', '다시 불러줄 때는 어느 정도가 편할까요?', null, true, true, timezone('utc', now()))
on conflict do nothing;

insert into public.onboarding_question_options
  (source_key, option_key, label, seed_patch, order_index, is_active, updated_at)
values
  ('primary_topic', 'work', '일과 방향', '{"topics":{"work":3}}'::jsonb, 10, true, timezone('utc', now())),
  ('primary_topic', 'relationships', '사람과 거리', '{"topics":{"relationships":3}}'::jsonb, 20, true, timezone('utc', now())),
  ('primary_topic', 'daily_life', '하루의 리듬', '{"topics":{"daily_life":3}}'::jsonb, 30, true, timezone('utc', now())),
  ('emotion_relief', 'isolation', '혼자 남은 느낌', '{"emotions":{"isolation":3}}'::jsonb, 10, true, timezone('utc', now())),
  ('emotion_relief', 'anxiety', '앞이 흔들리는 느낌', '{"emotions":{"anxiety":3}}'::jsonb, 20, true, timezone('utc', now())),
  ('emotion_relief', 'frustration', '말이 막히는 느낌', '{"emotions":{"frustration":3}}'::jsonb, 30, true, timezone('utc', now())),
  ('preferred_tone', 'quiet', '조용히 곁에 있는 느낌', '{"preferredWaveTone":"quiet","empathyPreference":"quiet"}'::jsonb, 10, true, timezone('utc', now())),
  ('preferred_tone', 'resonant', '내 이야기와 닿는 느낌', '{"preferredWaveTone":"resonant","empathyPreference":"shared"}'::jsonb, 20, true, timezone('utc', now())),
  ('preferred_tone', 'light', '가볍게 지나갈 수 있는 느낌', '{"preferredWaveTone":"light","empathyPreference":"gentle_prompt"}'::jsonb, 30, true, timezone('utc', now())),
  ('privacy_preference', 'anonymous', '익명으로 조용히', '{"privacyPreference":"anonymous"}'::jsonb, 10, true, timezone('utc', now())),
  ('privacy_preference', 'semi_anonymous', '별명 정도만', '{"privacyPreference":"semi_anonymous"}'::jsonb, 20, true, timezone('utc', now())),
  ('privacy_preference', 'nickname_visible', '닉네임은 보여도 괜찮아요', '{"privacyPreference":"nickname_visible"}'::jsonb, 30, true, timezone('utc', now())),
  ('relationship_detail', 'distance', '멀어진 거리', '{"emotions":{"grief":1}}'::jsonb, 10, true, timezone('utc', now())),
  ('relationship_detail', 'misunderstanding', '오해와 어긋남', '{"emotions":{"frustration":1}}'::jsonb, 20, true, timezone('utc', now())),
  ('relationship_detail', 'care', '아끼지만 어려운 마음', '{"emotions":{"quiet_hope":1}}'::jsonb, 30, true, timezone('utc', now())),
  ('notification_tone', 'off', '지금은 알림 없이', '{"notificationTone":"off"}'::jsonb, 10, true, timezone('utc', now())),
  ('notification_tone', 'quiet', '가끔 조용히', '{"notificationTone":"quiet"}'::jsonb, 20, true, timezone('utc', now())),
  ('notification_tone', 'balanced', '필요할 때는 알려주세요', '{"notificationTone":"balanced"}'::jsonb, 30, true, timezone('utc', now()))
on conflict (source_key, option_key) do update
set
  label = excluded.label,
  seed_patch = excluded.seed_patch,
  order_index = excluded.order_index,
  is_active = excluded.is_active,
  updated_at = excluded.updated_at;

insert into public.onboarding_question_branches
  (source_key, depends_on_source_key, any_of, order_index, is_active, updated_at)
values
  ('privacy_preference', 'preferred_tone', array['quiet','light'], 10, true, timezone('utc', now())),
  ('relationship_detail', 'primary_topic', array['relationships'], 10, true, timezone('utc', now())),
  ('stimulation_sensitivity', 'preferred_tone', array['quiet'], 10, true, timezone('utc', now())),
  ('notification_tone', 'preferred_tone', array['resonant'], 10, true, timezone('utc', now()))
on conflict do nothing;
