# Task 08. Observability & Experimentation

## 목표
제품 학습을 위한 로그/실험 기반을 만든다.

## 범위
- analytics
- error tracking
- feature flags
- experiment scaffolding

## 상세 작업
1. event taxonomy
2. PostHog wiring
3. Sentry wiring
4. feature flag helper
5. experiment assignment helper

## 주요 이벤트
- onboarding_completed
- first_post_created
- reaction_sent
- personalized_wave_opened
- rest_mode_started
- rest_mode_ended
- notification_opened

## Acceptance Criteria
- 핵심 이벤트가 추적된다
- 에러가 Sentry에 기록된다
- feature flag로 문구/레인 순서 테스트 가능
