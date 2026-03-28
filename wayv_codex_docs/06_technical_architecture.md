# 06. Technical Architecture

## 1. 권장 스택
### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand 또는 React Context (경량 상태)

### Backend
- Next.js Route Handlers + Server Actions (초기)
- Supabase Auth
- Supabase Postgres
- pgvector
- Supabase Realtime / Queue 대체로는 cron + job table
- Edge/Background jobs for notification digest

### Infra
- Vercel
- Supabase
- Sentry
- PostHog
- Upstash Redis (rate limit / ephemeral cache 용도 선택)
- Resend 또는 FCM/APNs/email provider

## 2. 왜 이 조합인가
- 비개발자 PM + Codex 환경에서 가장 구현 마찰이 적다
- 타입 안정성과 배포 속도가 좋다
- 초기 단계에서 managed service 의존으로 운영 복잡도를 줄일 수 있다
- 파도 계산/추천/알림은 Postgres + cron + job table로 충분히 시작 가능

## 3. 시스템 구성도
```text
[Next.js Web/App]
   |
   +-- Auth / Session
   |
   +-- API Routes / Server Actions
   |
   +-- Postgres (users, posts, reactions, notifications, moderation, onboarding)
   |
   +-- Vector Search (pgvector)
   |
   +-- Background Jobs
         - wave score refresh
         - personalized feed materialization
         - notification digest
         - archive / decay update
```

## 4. 서비스 모듈
- auth
- profiles
- onboarding
- posts
- reactions
- wave-engine
- personalized-feed
- notifications
- moderation
- analytics
- admin

## 5. 권장 디렉토리 구조
```text
apps/web
  app/
  components/
  features/
    auth/
    onboarding/
    posts/
    waves/
    notifications/
    rest-mode/
    admin/
  lib/
    db/
    auth/
    analytics/
    wave/
    moderation/
  types/
```

## 6. 핵심 구현 전략
### 6.1 파도 계산
초기에는 실시간 완전 계산보다 **배치 + 이벤트 혼합**이 좋다.

- reaction/post/comment 이벤트 발생 시 lightweight update
- 5~15분 주기 re-score job
- 1시간 단위 category weather 계산
- daily archive/decay maintenance

### 6.2 개인화 피드
초기에는 heavy ML recommender 금지.

V1:
- 온보딩 seed
- 작성 글 유사도
- 반응 기록 유사도
- 카테고리/감정 태그
- 최근성
- rest mode filter

### 6.3 검색
- 키워드 검색
- 유사 파동 추천은 pgvector로 시작
- RAG형 서사 활용은 V2 이후

## 7. 비기능 요구사항
- 모바일 우선
- 1초대 초반 홈 렌더 목표
- 개인정보 최소 저장
- soft delete / archive separation
- audit log for moderation actions
- feature flags

## 8. 보안/프라이버시
- row-level security
- 공개 프로필과 내부 계정 식별자 분리
- 신고/차단/뮤트 로직 서버 측 강제
- 관리자 접근 권한 분리
- PII 최소화
- 민감문구 로깅 최소화 및 접근 통제

## 9. 이벤트/잡 구조 예시
- `wave_event_created`
- `wave_score_refresh_requested`
- `personalized_feed_refresh_requested`
- `notification_digest_requested`
- `post_archival_check_requested`

## 10. 향후 확장 포인트
- mobile app
- richer moderation ML
- wave memory / personal timeline
- AI-assisted paraphrase / rewrite
- optional guided journaling
