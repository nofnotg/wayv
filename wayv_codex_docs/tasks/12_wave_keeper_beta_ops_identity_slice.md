# Task 12 — Wave Keeper, Beta Ops, and Operating Identity Slice

## Purpose

이번 슬라이스는 다음 네 방향을 실제 repo 운영 흐름에 연결하기 위한 최소 구현이다.

1. `wave_keeper`를 내부 시스템 persona로 유지하되, 외부 문구는 더 흐름 중심으로 정리한다.
2. moderation 자체를 beta feedback 대상으로 다룬다.
3. operator console을 실제 beta 운영 검토 도구에 더 가깝게 만든다.
4. `wayv`의 상업적 운영 정체성과 향후 수익 구조 방향을 문서적으로 고정한다.

이 작업은 아직 다음을 하지 않는다.

- runtime LLM moderation
- 자동 사용자 문장 rewrite
- monetization UI rollout
- full wave room productization
- B2B circulation productization

## Wave Keeper voice contract

### Internal

- 내부 concept name은 계속 `wave_keeper`를 사용한다.
- reason family, guidance family, seed/config naming, operator review labels에서 유지한다.

### External

- 외부 사용자 문구는 “누가 지켜본다”보다 “이 공간의 흐름이 어떻게 머무는가”를 설명한다.
- 가능한 한 다음 표현 방향을 우선한다.
  - 이 흐름은 해결보다 곁에 머무는 말에 더 오래 남아요.
  - 이 파도는 사람을 밀어내는 말보다 다정한 읽힘에 더 가까워져요.
  - 이 해안은 바깥으로 닿는 식별자 없이도 충분히 이어질 수 있어요.

### Forbidden tone

- 감시받는 느낌
- 판정/징계 중심 언어
- 설교체
- 고객센터 boilerplate
- 과도한 시적 표현

## Beta moderation feedback loop

moderation 결과 직후에 짧은 운영 피드백을 남길 수 있어야 한다.

현재 수집 기준:

- quick choice 1개
- optional free text
- auto metadata:
  - created_at
  - user_id
  - target_type
  - target_id
  - action
  - reasons
  - guidance_family
  - path
  - retry_attempted
  - retry_succeeded

현재 quick choice set:

- understood
- felt_too_strict
- still_confusing
- tone_felt_okay
- tone_felt_cold
- felt_necessary

## Operator operations

operator는 moderation feedback를 다음 관점에서 바로 볼 수 있어야 한다.

- latest-first
- second precision timestamp
- action filter
- target filter
- reason filter
- free-text 유무 구분
- user filter
- multi-select
- raw copy / TSV copy / summary copy

이것은 analytics dashboard가 아니라 beta tuning용 운영 surface다.

## Operating identity

`wayv`는 commercial empathy-centered SNS다.

고정 방향:

- 광고는 금지 대상이 아니다.
- 금지 대상은 과열, 랭킹 중독, 갈등 farming, engagement trap이다.
- free core와 paid expansion의 분리를 제품 계획에서 열어 둔다.
- temporary / self-dissolving wave room은 future exploration이다.
- B2B circulation-system 가능성은 research direction이지 현재 commitment가 아니다.

## Ad policy principles

- low-noise placement
- clear sponsorship labeling
- frequency control
- emotion-heavy lane에는 더 보수적인 배치
- flow quality를 해치는 aggressive optimization 금지

## Free vs paid planning examples

### Free core

- posting
- comments / reactions baseline
- moderation protection baseline
- public or anonymous choice

### Paid expansion candidates

- weekly or monthly summaries
- deeper archive
- refined filtering / flow controls
- optional ad-light or ad-free mode

## Post-deploy operator checklist

1. `0016_task12_moderation_feedback_ops.sql` migration 적용 여부 확인
2. `POST /api/moderation-feedback` 승인 사용자 기준 동작 확인
3. `GET /api/internal/review/moderation-feedback` json/csv 확인
4. operator page에서 moderation feedback panel의 filter / copy 동작 확인
5. guidance copy가 다시 blunt tone으로 되돌지 않았는지 sample review
