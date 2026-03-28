# wayv

wayv는 실패를 안전하게 외부화하고, 숫자 없는 공명 경험을 만드는 웹 우선 제품입니다.  
이번 1차 구현은 `Next.js + Supabase` 기반으로 시작하되, 인증/온보딩/프로필/피드/휴식모드 API가 추후 iOS/Android 앱에서도 그대로 재사용될 수 있도록 설계합니다.

## 현재 레포 분석 요약

- 프레임워크/런타임: `Next.js 15`, `React 19`, `TypeScript`, `Tailwind CSS 4`
- 패키지 매니저: `pnpm`
- 인증/DB: `Supabase Auth`, `Supabase Postgres`, `@supabase/ssr`
- 구조: 루트 단일 앱 구조 (`app`, `components`, `features`, `lib`, `supabase`)
- 현재 구현 초점: 인증, 프로필, 온보딩, 휴식모드, 파도 도메인, 최소 홈 피드
- 모바일 연동 방식: 이번 턴에는 앱 자체를 만들지 않고, 모바일에서도 재사용 가능한 HTTP API와 DB 스키마를 마련

## 문서 기준

다음 문서를 기준으로 구현합니다.

1. `wayv_codex_docs/01_PRD.md`
2. `wayv_codex_docs/03_wave_system_logic.md`
3. `wayv_codex_docs/tasks/00_master_backlog.md`

## 구현 범위

- 이메일 Magic Link 로그인
- 세션 유지 / 로그아웃
- 프로필 / 공개 범위 / 기본 설정
- 질문형 온보딩 V1
- 휴식 모드 저장 및 제어
- 파도 도메인 타입과 순수 함수 기반 로직
- 최소 홈 / 작성 / 상세 / 설정 화면
- 모바일도 재사용 가능한 JSON API 계약
- Supabase SQL 마이그레이션과 RLS 초안

## 이번 턴 비범위

- 실제 iOS/Android 앱
- APNs/FCM 발송
- 소셜 로그인
- 랭킹 / 급상승 / 인기 지표
- 유료화 / 1:1 메시지 / 전문가 연결

## 로컬 실행

1. 의존성 설치

```bash
pnpm install
```

2. `.env.local` 생성

```bash
cp .env.example .env.local
```

Windows PowerShell에서는:

```powershell
Copy-Item .env.example .env.local
```

3. `.env.local` 값 채우기

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_REDIRECT_URL`
- `MOBILE_AUTH_REDIRECTS`
- `CRON_SECRET`

4. 개발 서버 실행

```bash
pnpm dev
```

5. 품질 확인

```bash
pnpm typecheck
pnpm test
```

## Supabase 세팅

### 필수 수동 작업

1. Supabase에서 프로젝트 `wayv` 생성
2. Auth 설정에 웹 콜백 URL 등록
   - `http://localhost:3000/auth/callback`
3. 향후 모바일 딥링크/유니버설 링크 등록 위치도 함께 메모
4. SQL migration 적용

### SQL migration 적용

레포의 SQL 파일:

- `supabase/migrations/0001_mvp_foundation.sql`

적용 방법:

```bash
supabase init
supabase link --project-ref <your-project-ref>
supabase db push
```

또는 Supabase SQL Editor에서 직접 실행할 수 있습니다.

## 모바일 연동 전제

이번 턴은 모바일 앱 자체를 만들지 않지만, 아래 전제를 지킵니다.

- 인증/온보딩/프로필/피드/휴식모드는 JSON API로도 동작
- 웹 UI는 같은 서비스 계층을 사용
- `notification_devices` 테이블로 웹/iOS/Android 장치 토큰 저장 가능
- `MOBILE_AUTH_REDIRECTS`로 향후 모바일 로그인 딥링크를 검증할 수 있도록 준비

## 주요 API

- `POST /api/auth/signin`
- `POST /api/auth/signout`
- `GET /api/me`
- `GET /api/onboarding/questions`
- `POST /api/onboarding/answers`
- `GET /api/onboarding/profile`
- `GET/PATCH /api/profile`
- `GET/PATCH /api/notification-preferences`
- `GET/PATCH /api/rest-mode`
- `POST /api/rest-mode/start`
- `POST /api/rest-mode/end`
- `POST /api/posts`
- `GET /api/posts/:id`
- `GET /api/feed/home`

## 테스트 우선순위

- 파도 점수 계산 단위 테스트
- 온보딩 분기 테스트
- 휴식 모드 필터 테스트
- 스키마 검증 테스트

## 남은 리스크

- 실제 Supabase 프로젝트 연결 전에는 인증/DB 동작을 끝까지 검증할 수 없음
- 모바일 앱 로그인 딥링크는 다음 턴에서 실제 클라이언트와 함께 검증 필요
- 내부 배치 job endpoint는 현재 stub 상태
