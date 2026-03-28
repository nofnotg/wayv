# 07. Database Schema

## 1. 핵심 테이블

### users
- id (uuid, pk)
- email
- auth_provider
- created_at
- status
- is_admin

### public_profiles
- user_id (pk/fk)
- nickname
- visibility_level (`anonymous` | `semi` | `nickname`)
- age_band
- context_tags jsonb
- intro_short
- avatar_style
- created_at
- updated_at

### onboarding_responses
- id
- user_id
- question_key
- answer_key
- answer_value
- version
- created_at

### onboarding_profiles
- user_id
- topic_weights jsonb
- emotion_weights jsonb
- preferred_wave_tone
- exposure_tolerance
- privacy_preference
- rest_mode_affinity
- confidence_score
- updated_at

### posts
- id
- user_id
- title
- body
- category_key
- emotion_tags jsonb
- visibility_scope (`public` | `followers_like` | `private_archive`)
- status (`active` | `limited` | `archived` | `removed`)
- archived_at
- created_at
- updated_at

### post_embeddings
- post_id
- embedding vector
- model_version
- updated_at

### reactions
- id
- post_id
- user_id
- reaction_type (`touched` | `ive_been_there` | `add_wave` | `stay_quiet`)
- created_at

### comments
- id
- post_id
- user_id
- body
- status (`active` | `limited` | `removed`)
- moderation_flags jsonb
- created_at
- updated_at

### post_wave_scores
- post_id
- raw_energy
- decayed_energy
- velocity_1h
- velocity_6h
- current_state
- rekindle_score
- score_updated_at

### user_topic_affinity
- user_id
- topic_key
- affinity_score
- source_breakdown jsonb
- updated_at

### personalized_feed_items
- id
- user_id
- post_id
- lane_key (`for_you` | `quiet` | `rekindled`)
- score
- reason_codes jsonb
- generated_at
- expires_at

### notifications
- id
- user_id
- type
- title
- body
- target_post_id
- state (`pending` | `sent` | `read` | `dismissed`)
- delivery_channel (`push` | `email` | `inapp`)
- created_at
- sent_at
- read_at

### notification_preferences
- user_id
- push_enabled
- digest_mode (`off` | `light` | `normal`)
- quiet_hours_start
- quiet_hours_end
- max_daily_notifications
- updated_at

### rest_modes
- id
- user_id
- state (`active` | `ended`)
- reason_key optional
- starts_at
- ends_at
- created_at

### mutes
- id
- user_id
- muted_topic_key nullable
- muted_post_id nullable
- muted_user_id nullable
- expires_at
- created_at

### reports
- id
- reporter_user_id
- target_type (`post` | `comment` | `user`)
- target_id
- reason_key
- note
- created_at

### moderation_cases
- id
- target_type
- target_id
- severity (`low` | `medium` | `high`)
- case_status (`open` | `reviewing` | `resolved`)
- action_summary
- created_at
- resolved_at

### admin_audit_logs
- id
- actor_user_id
- action_type
- target_type
- target_id
- metadata jsonb
- created_at

## 2. 추천 인덱스
- posts(category_key, created_at desc)
- reactions(post_id, created_at desc)
- comments(post_id, created_at desc)
- personalized_feed_items(user_id, lane_key, score desc)
- notifications(user_id, state, created_at desc)
- post_wave_scores(current_state, score_updated_at desc)
- GIN on jsonb tag fields
- ivfflat/hnsw on post_embeddings.embedding

## 3. 설계 노트
- 공개 프로필과 인증 계정은 분리
- wave score는 materialized table로 보관
- rest mode는 단순 boolean보다 기간 기록이 낫다
- reason_codes를 저장해 추천 설명 및 디버깅에 활용
