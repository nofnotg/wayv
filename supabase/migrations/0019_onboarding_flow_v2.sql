insert into public.onboarding_questions (key, version, type, title, subtitle, config, is_active, updated_at)
values
  (
    'primary_topic',
    2,
    'single_choice',
    '요즘 마음이 자주 머무는 곳은 어디에 가까워요?',
    '정확히 설명하지 않아도 괜찮아요. 가장 가까운 쪽만 골라 주세요.',
    '{
      "order": 10,
      "titleVariants": [
        "요즘 어떤 파도가 가장 자주 안쪽을 지나가나요?",
        "지금의 생활에서 가장 오래 남는 결은 어느 쪽인가요?"
      ],
      "options": [
        { "key": "work", "label": "일과 방향", "seedPatch": { "topics": { "work": 3 } } },
        { "key": "relationships", "label": "사람과 거리", "seedPatch": { "topics": { "relationships": 3 } } },
        { "key": "daily_life", "label": "하루의 리듬", "seedPatch": { "topics": { "daily_life": 3 } } }
      ]
    }'::jsonb,
    true,
    timezone('utc', now())
  ),
  (
    'emotion_relief',
    2,
    'single_choice',
    '읽고 난 뒤 조금 가벼워졌으면 하는 감정은 무엇에 가까워요?',
    null,
    '{
      "order": 20,
      "titleVariants": [
        "다른 사람의 파도를 볼 때, 무엇이 조금 덜 혼자였으면 하나요?",
        "wayv가 조용히 받아주었으면 하는 감정은 어느 쪽인가요?"
      ],
      "options": [
        { "key": "isolation", "label": "혼자 남은 느낌", "seedPatch": { "emotions": { "isolation": 3 } } },
        { "key": "anxiety", "label": "앞이 흔들리는 느낌", "seedPatch": { "emotions": { "anxiety": 3 } } },
        { "key": "frustration", "label": "말이 막히는 느낌", "seedPatch": { "emotions": { "frustration": 3 } } }
      ]
    }'::jsonb,
    true,
    timezone('utc', now())
  ),
  (
    'preferred_tone',
    2,
    'single_choice',
    '처음에는 어떤 온도의 파도가 편할까요?',
    null,
    '{
      "order": 30,
      "titleVariants": [
        "지금 내게 너무 세지 않은 흐름은 어느 쪽일까요?",
        "처음 만나는 wayv가 어떤 거리였으면 하나요?"
      ],
      "options": [
        { "key": "quiet", "label": "조용히 곁에 있는 느낌", "seedPatch": { "preferredWaveTone": "quiet", "empathyPreference": "quiet" } },
        { "key": "resonant", "label": "내 이야기와 닿는 느낌", "seedPatch": { "preferredWaveTone": "resonant", "empathyPreference": "shared" } },
        { "key": "light", "label": "가볍게 지나갈 수 있는 느낌", "seedPatch": { "preferredWaveTone": "light", "empathyPreference": "gentle_prompt" } }
      ]
    }'::jsonb,
    true,
    timezone('utc', now())
  ),
  (
    'privacy_preference',
    2,
    'single_choice',
    '처음의 나는 어느 정도로 드러나는 게 편할까요?',
    '나중에 언제든 바꿀 수 있어요.',
    '{
      "order": 40,
      "clarifyOnly": true,
      "branchRules": [{ "questionKey": "preferred_tone", "anyOf": ["quiet", "light"] }],
      "options": [
        { "key": "anonymous", "label": "익명으로 조용히", "seedPatch": { "privacyPreference": "anonymous" } },
        { "key": "semi_anonymous", "label": "별명 정도만", "seedPatch": { "privacyPreference": "semi_anonymous" } },
        { "key": "nickname_visible", "label": "닉네임은 보여도 괜찮아요", "seedPatch": { "privacyPreference": "nickname_visible" } }
      ]
    }'::jsonb,
    true,
    timezone('utc', now())
  ),
  (
    'relationship_detail',
    2,
    'single_choice',
    '사람과 거리라면, 어느 결이 더 가까워요?',
    '선택을 조금 더 분명하게 하기 위한 짧은 질문이에요.',
    '{
      "order": 50,
      "allowSkip": true,
      "clarifyOnly": true,
      "branchRules": [{ "questionKey": "primary_topic", "anyOf": ["relationships"] }],
      "options": [
        { "key": "distance", "label": "멀어진 거리", "seedPatch": { "emotions": { "grief": 1 } } },
        { "key": "misunderstanding", "label": "오해와 어긋남", "seedPatch": { "emotions": { "frustration": 1 } } },
        { "key": "care", "label": "아끼지만 어려운 마음", "seedPatch": { "emotions": { "quiet_hope": 1 } } }
      ]
    }'::jsonb,
    true,
    timezone('utc', now())
  ),
  (
    'stimulation_sensitivity',
    2,
    'scale',
    '지금은 얼마나 잔잔한 흐름이 편한가요?',
    '1은 조금 더 열려 있음, 5는 아주 조용한 흐름이 필요한 상태예요.',
    '{
      "order": 60,
      "allowSkip": true,
      "clarifyOnly": true,
      "min": 1,
      "max": 5,
      "step": 1,
      "branchRules": [
        { "questionKey": "preferred_tone", "anyOf": ["quiet"] },
        { "questionKey": "exposure_tolerance", "anyOf": ["low"] }
      ]
    }'::jsonb,
    true,
    timezone('utc', now())
  ),
  (
    'notification_tone',
    2,
    'single_choice',
    '다시 불러줄 때는 어느 정도가 편할까요?',
    null,
    '{
      "order": 70,
      "allowSkip": true,
      "clarifyOnly": true,
      "branchRules": [{ "questionKey": "preferred_tone", "anyOf": ["resonant"] }],
      "options": [
        { "key": "off", "label": "지금은 알림 없이", "seedPatch": { "notificationTone": "off" } },
        { "key": "quiet", "label": "가끔 조용히", "seedPatch": { "notificationTone": "quiet" } },
        { "key": "balanced", "label": "필요할 때는 알려주세요", "seedPatch": { "notificationTone": "balanced" } }
      ]
    }'::jsonb,
    true,
    timezone('utc', now())
  )
on conflict (key) do update
set
  version = excluded.version,
  type = excluded.type,
  title = excluded.title,
  subtitle = excluded.subtitle,
  config = excluded.config,
  is_active = excluded.is_active,
  updated_at = excluded.updated_at;
