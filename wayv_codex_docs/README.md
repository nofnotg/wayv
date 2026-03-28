# wayv 문서 세트

이 폴더는 wayv를 실제 개발에 투입하기 위한 Markdown 문서 세트다.  
대상은 PM, Codex, 구현 담당자이며, 철학 설명보다 **바로 만들 수 있는 구조**에 초점을 둔다.

## 문서 구성

### 핵심 제품 문서
- `00_product_north_star.md` — 제품 정체성, 금지 원칙, 성공 정의
- `01_PRD.md` — MVP 제품 요구사항 문서
- `02_UX_IA.md` — 정보구조, 주요 화면, 사용자 흐름
- `03_wave_system_logic.md` — 파도 로직, 가중치, 감쇠, 알림 규칙
- `04_onboarding_question_engine.md` — 질문형 온보딩과 초기 개인화 설계
- `05_copy_persona_guide.md` — 시스템 언어, 페르소나 톤, 금지/권장 문구
- `06_technical_architecture.md` — 기술 스택, 서비스 구조, 비기능 요구
- `07_database_schema.md` — DB 스키마 초안
- `08_api_contracts.md` — API 계약 초안
- `09_moderation_safety_ops.md` — 운영·모더레이션·위기 대응
- `10_metrics_rollout.md` — 지표, 실험, 출시 단계
- `11_codex_delivery_guide.md` — Codex 작업 원칙, 브랜치/PR 규칙

### 태스크 문서
- `tasks/00_master_backlog.md` — 전체 백로그 및 우선순위
- `tasks/01_foundation_setup.md`
- `tasks/02_auth_profile_onboarding.md`
- `tasks/03_post_and_wave_reactions.md`
- `tasks/04_personalized_wave_feed_notifications.md`
- `tasks/05_rest_mode_and_digest.md`
- `tasks/06_wave_weather_and_archiving.md`
- `tasks/07_moderation_and_safety.md`
- `tasks/08_observability_and_experimentation.md`

### Codex 프롬프트 문서
- `prompts/00_codex_kickoff.md` — 첫 투입용 지시문
- `prompts/01_codex_task_template.md` — 개별 태스크 지시 템플릿

## 읽는 순서

1. `00_product_north_star.md`
2. `01_PRD.md`
3. `03_wave_system_logic.md`
4. `06_technical_architecture.md`
5. `tasks/00_master_backlog.md`

## 운영 원칙 요약
- wayv는 조언 플랫폼이 아니라 **실패를 사회적으로 외부화해 고립을 약화시키는 경험 공유 플랫폼**이다.
- 파도는 비교 지표가 아니라 **상태 언어**다.
- 공개 레이어는 **날씨**, 개인 레이어는 **나에게 닿는 파도**가 중심이다.
- 숫자는 내부 계산에만 쓰고, 사용자에게는 상태 문장으로 번역한다.
- 시스템 언어는 따뜻하지만 집행은 분명해야 한다.
