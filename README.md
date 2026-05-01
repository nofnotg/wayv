# wayv

> KR: 실패를 조언이나 평가로 바꾸지 않고, 조용히 말할 수 있는 파도로 바꾸는 제품입니다.
> EN: wayv turns failure into a quiet wave people can safely name, meet, and let pass without advice, ranking, or spectacle.

## Read This First / 먼저 읽어야 할 문서

This repository is not only an implementation artifact. It carries a product philosophy that should guide every UI decision, data model, API boundary, moderation rule, and future feature.

이 레포는 단순한 구현 저장소가 아닙니다. 모든 UI 결정, 데이터 모델, API 경계, moderation 규칙, 다음 기능의 방향을 제한하고 안내하는 제품 철학을 포함합니다.

Required reading before design or implementation:

1. [Product & Design Charter](./PRODUCT_DESIGN_CHARTER.md)
2. [PRD](./wayv_codex_docs/01_PRD.md)
3. [Wave System Logic](./wayv_codex_docs/03_wave_system_logic.md)
4. [Master Backlog](./wayv_codex_docs/tasks/00_master_backlog.md)

If any document appears garbled or conflicts with the live code, treat the charter and current repository behavior as the source of orientation, then verify with implementation evidence.

문서가 깨져 보이거나 현재 코드와 충돌하면, 이 README와 Product & Design Charter를 방향 기준으로 삼고 실제 구현 증거로 확인합니다.

## Product In One Sentence / 제품 한 문장

KR: wayv는 사람들이 실패, 막힘, 무너짐, 부끄러움 같은 경험을 경쟁이나 조언의 장이 아니라 조용한 공명의 흐름 안에서 말하고, 다른 사람의 파도를 보며 자기 안에 남은 작은 윤곽을 발견하게 하는 제품입니다.

EN: wayv is a quiet resonance product where people can speak about failure, stuckness, collapse, and shame without turning those experiences into competition or advice, then notice the small outline that remains in themselves after meeting another person’s wave.

## What wayv Is / wayv가 하는 일

- KR: 사용자가 자신의 경험을 “파도”로 남깁니다. 파도는 성공담이나 해결책이 아니라, 말할 수 있게 된 실패의 형태입니다.
- EN: Users leave a “wave.” A wave is not a success story or a solution. It is a failure or difficult experience made safe enough to name.
- KR: 다른 사용자는 숫자나 순위 대신 짧은 공명 방식으로 반응합니다.
- EN: Other users respond through quiet resonance gestures, not counts or rankings.
- KR: 사용자는 다른 사람의 파도를 본 뒤, 자신에게만 보이는 private resonance trace를 남길 수 있습니다.
- EN: After viewing a wave, a user may leave a private resonance trace visible only to themselves.
- KR: moderation은 먼저 결정론적으로 작동해야 하며, 런타임 LLM moderation이나 사용자 글 자동 재작성은 아직 허용하지 않습니다.
- EN: Moderation must remain deterministic-first. Runtime LLM moderation and automatic user-text rewriting are not currently allowed.

## Product Boundaries / 제품 경계

wayv must not become:

- KR: 코칭 제품, 상담 제품, 자기계발 설문, 인기투표, 해결책 경연장
- EN: a coaching product, therapy product, self-help questionnaire, popularity contest, or solution marketplace

wayv must preserve:

- KR: 공감, 지지, 조용한 인정, 관찰 후 행동, 사적인 잔상, 숫자 비노출, 조언 강요 없음
- EN: empathy, support, quiet recognition, observation before action, private trace before public performance, number de-emphasis, and no unsolicited advice

## Current Implementation Shape / 현재 구현 형태

- Framework: `Next.js 15`, `React 19`, `TypeScript`, `Tailwind CSS 4`
- Package manager: `pnpm`
- Auth and database: `Supabase Auth`, `Supabase Postgres`, `@supabase/ssr`
- Main folders: `app`, `features`, `lib`, `supabase`, `tests`
- Architecture rule: thin routes, thick services, deterministic validation, no internal HTTP self-calls

## Core Feature Areas / 핵심 기능 영역

- Closed beta access gate
- Magic-link authentication
- Wave writing and wave detail
- Quiet reactions without public ranking
- Private resonance traces
- Comments with restrained copy and moderation boundaries
- Rest mode and notification pacing
- Deterministic moderation baseline and operator review surfaces

## Local Development / 로컬 개발

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
```

Create `.env.local` from `.env.example` and provide the Supabase values required by the app:

```bash
cp .env.example .env.local
```

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Common environment keys:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_REDIRECT_URL`
- `MOBILE_AUTH_REDIRECTS`
- `CRON_SECRET`

## Engineering Rules / 구현 원칙

- KR: route는 얇게, service/domain 계층은 두껍게 유지합니다.
- EN: Keep routes thin and services/domain logic thick.
- KR: business logic을 route handler에 누적하지 않습니다.
- EN: Do not accumulate business logic in route handlers.
- KR: 내부 HTTP self-call을 만들지 않습니다.
- EN: Do not create internal HTTP self-calls.
- KR: 공개 API는 private note, private trace, 운영 내부 데이터를 노출하지 않습니다.
- EN: Public APIs must not expose private notes, private traces, or internal operator data.
- KR: 숫자, 순위, raw counts는 사용자 경험의 중심이 아닙니다.
- EN: Numbers, rankings, and raw counts are not the center of the product experience.

Before adding or changing a feature, read [Product & Design Charter](./PRODUCT_DESIGN_CHARTER.md). It is the shared contract for product, design, and engineering.
