# wayv 외부 정리본 통합 검토 및 적용안

## 1. 검토 대상

이번 통합은 업로드된 12개 파일을 기준으로 진행했다.

- 정규화 계열
  - `normalization_research_report.md`
  - `prompt1_normalization_research_answer.md`
  - `normalization_lexicon.json`
  - `normalization_lexicon_draft.md`
  - `evasion_patterns.json`
  - `evasion_rules_draft.md`
- 페르소나/카피 계열
  - `persona_guidance_strategy.md`
  - `prompt2_persona_guidance_library_answer.md`
  - `wave_keeper_message_library.json`
  - `wave_keeper_message_library.md`
  - `negative_phrase_paraphrase_map.md`
  - `message_selection_rules.md`

추가로 현재 `wayv` 원격 기준 Phase 0 baseline과의 적합성도 함께 봤다. 현재 repo는 이미 확장된 moderation taxonomy와 guidance service, 댓글 220자 제한, 입력면 확대를 반영한 상태다. fileciteturn127file0L1-L1

---

## 2. 총평

전체 품질은 **생각보다 높다**. 특히 아래 두 축은 바로 실무에 쓸 수 있다.

1. **정규화 계열**
   - `normalization_lexicon.json`
   - `evasion_patterns.json`
   - `normalization_research_report.md`
2. **페르소나/안내문 계열**
   - `wave_keeper_message_library.json`
   - `negative_phrase_paraphrase_map.md`
   - `message_selection_rules.md`

다만 그대로 전량 채택하는 것보다, `wayv`의 현재 코드와 철학에 맞게 **세 가지 보정**이 필요하다.

- 현재 repo reason taxonomy에 맞춰 카테고리명을 정렬할 것
- Beta 즉시 적용 세트와 운영 중 확장 세트를 분리할 것
- 파도지기 문구에서 여전히 남아 있는 직접 부정형을 더 줄일 것

---

## 3. 그대로 써도 되는 것

### A. 거의 그대로 써도 되는 자료

#### 1) `normalization_lexicon.json`
- 장점: 구조가 명확하고, canonical / family / variants / confidence / notes가 잘 나뉘어 있다
- 용도: 정규화 사전 seed 데이터
- 판단: **기본 구조는 그대로 채택 가능**

#### 2) `evasion_patterns.json`
- 장점: pipeline order, keyboard layout preset, crisis fast path까지 포함돼 있어 구현용으로 좋다
- 용도: 정규화 엔진 파이프라인 정의
- 판단: **가장 실사용성이 높음**

#### 3) `message_selection_rules.md`
- 장점: reason / severity / content_type / dedupe / fallback 규칙이 실무형이다
- 용도: 메시지 선택 엔진 설계 기준
- 판단: **설계 문서로 거의 그대로 사용 가능**

#### 4) `negative_phrase_paraphrase_map.md`
- 장점: 부정형 우회 방향이 명확하다
- 용도: 현재 repo guidance 문구 polish 기준
- 판단: **카피 검수 기준표로 그대로 사용 가능**

---

## 4. 그대로 쓰기보다 다듬어야 하는 것

### A. `prompt1_normalization_research_answer.md`
- 장점: 조사량이 많고 분류가 풍부하다
- 한계: 구현용보다는 리서치 보고서 성격이 강하다
- 판단: **직접 코드 투입용이 아니라 리서치 레퍼런스 문서로 보관**

### B. `prompt2_persona_guidance_library_answer.md`
- 장점: 페르소나 정의, 금지 표현, 대체 방향이 아주 잘 정리돼 있다
- 한계: 문장이 많고 다소 시적인 문장도 있어 그대로 넣으면 제품 톤이 들쭉날쭉할 수 있다
- 판단: **설계 철학 문서로는 우수, 런타임 라이브러리로는 선별 필요**

### C. `wave_keeper_message_library.json`
- 장점: family 기반 구조와 selection rule summary가 좋다
- 한계: 일부 family는 variant 수가 비대칭이고, 현재 repo guidance service 구조와는 1:1 대응 조정이 필요하다
- 판단: **기본 뼈대는 채택, message pool은 선별·축소해서 v1 시작 권장**

---

## 5. wayv 기준 최종 적용 판단

### A. 정규화 자료
정규화 자료는 다음처럼 쓰는 게 맞다.

- **즉시 채택**
  - `normalization_lexicon.json` 구조
  - `evasion_patterns.json` 파이프라인
  - `normalization_research_report.md`의 Beta Minimum Set 개념
- **보정 후 채택**
  - 카테고리명을 현재 repo reason taxonomy로 매핑
  - `beta_minimum` / `expansion` 스테이지 분리
- **나중 확장**
  - euphemism crisis
  - sarcasm-only ridicule
  - imperative ending only advice

즉, 정규화 계열은 **70~80%는 바로 쓸 수 있고, 20~30%만 보수적으로 보류**하면 된다.

### B. 페르소나/안내문 자료
페르소나 자료는 다음처럼 쓰는 게 맞다.

- **즉시 채택**
  - `파도지기` 페르소나 자체
  - `negative_phrase_paraphrase_map.md`의 부정형 우회 방향
  - `message_selection_rules.md`의 dedupe/fallback 구조
- **보정 후 채택**
  - `wave_keeper_message_library.json`을 현재 repo family 구조에 맞게 축소
  - crisis는 브랜드 톤보다 안전 명확성 우선
- **보류**
  - 지나치게 시적이라 의미가 흐려지는 문장
  - 법적/안전 고지에 부정확성이 생길 수 있는 문장

즉, 페르소나 계열은 **철학은 매우 좋고, 런타임 문구는 v1용으로 정제해서 넣는 것이 맞다.**

---

## 6. 현재 repo와의 적합성 평가

현재 `wayv`는 이미 Phase 0 moderation baseline을 repo에 반영했다. 확장 reason taxonomy와 입력면 확대, 댓글 220자 제한, guidance service가 올라와 있다. fileciteturn127file0L1-L1

하지만 현재 guidance service 문구에는 여전히:
- `남길 수 없어요`
- `잘 맞지 않아요`
- `다시 남겨 주세요`
같은 직접 부정형이 남아 있다. fileciteturn129file0L1-L1

따라서 외부 자료를 현재 코드에 적용할 때 우선순위는 아래가 맞다.

1. **정규화 엔진 seed 보강**
2. **파도지기 guidance 문구 polish**
3. **message selection / dedupe 규칙 도입**
4. **운영 로그 기반 확장**

---

## 7. 이번 통합에서 실제로 만든 파일

이번 검토 결과를 바탕으로, 바로 wayv에 맞춰 쓰기 좋은 두 파일을 따로 만들었다.

### A. `wayv_normalization_seed_v1.json`
성격:
- `normalization_lexicon.json` + `evasion_patterns.json` + Beta Minimum Set 개념을 현재 reason taxonomy에 맞게 재정렬한 seed 파일

핵심:
- reason을 현재 repo 이름으로 정렬
- `beta_minimum` / `expansion` 구분
- pipeline order, keyboard preset, crisis fast path 포함

### B. `wayv_wave_keeper_guidance_seed_v1.json`
성격:
- `wave_keeper_message_library.json` + `negative_phrase_paraphrase_map.md` + `message_selection_rules.md`를 합쳐, 현재 repo guidance service를 교체/확장하기 좋은 seed 파일

핵심:
- `파도지기` 페르소나 정의
- family별 title/message pool
- 부정형 우회 기준
- selection rule summary

---

## 8. 최종 권고

### 바로 적용해도 좋은 것
- 정규화 seed v1
- 파도지기 guidance seed v1
- 부정형 패러프레이즈 기준표
- message selection dedupe/fallback 구조

### 그대로 넣으면 안 되는 것
- 모든 euphemism crisis 표현을 하드블록 규칙으로 바로 연결
- 지나치게 시적인 안내문을 전량 런타임 메시지로 투입
- advice/harsh_tone 계열을 문맥 없이 광범위 regex로 확장

### 가장 좋은 적용 순서
1. `wayv_normalization_seed_v1.json`을 기준으로 normalization layer 강화
2. `wayv_wave_keeper_guidance_seed_v1.json`을 기준으로 guidance service 문구 교체
3. `message_selection_rules.md` 개념을 코드화
4. 운영 로그를 보고 expansion set 확장

---

## 9. 결론

이번 외부 정리본은 **재료 품질이 높고, 버릴 것이 거의 없다.**
다만 `wayv`에 바로 넣는다면 **그대로 전량 적용**보다 **seed 파일 형태로 추려서 넣는 것이 최선**이다.

가장 실무적인 결론은 이렇다.

- 정규화 계열은 **구조와 자료가 좋아서 바로 seed로 채택 가능**
- 페르소나 계열은 **철학이 매우 좋아서 채택 가치가 높음**
- 다만 런타임 문구는 **조금 더 짧고 일관되게 다듬은 v1**로 시작하는 것이 맞다

