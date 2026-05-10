# wayv Product & Design Charter

> KR: 이 문서는 wayv를 디자인하거나 구현하기 전에 반드시 읽어야 하는 제품 철학과 UX 구현 계약입니다.  
> EN: This charter is the required product philosophy and UX implementation contract for anyone designing or building wayv.

## 1. The Product Soul / 제품의 중심

KR: wayv는 실패를 해결책으로 빠르게 바꾸는 제품이 아닙니다. 실패를 멋진 서사로 포장하는 제품도 아닙니다. wayv는 사람이 말하지 못한 경험을 조금 더 안전한 형태로 바깥에 놓아두고, 다른 사람의 경험을 보며 자기 안에 남은 작은 윤곽을 발견하게 하는 조용한 공명 시스템입니다.

EN: wayv is not a product that quickly converts failure into advice. It is not a product that polishes failure into an impressive story. wayv is a quiet resonance system where a person can place an unsaid experience outside themselves in a safer form, then meet another person’s experience and notice a small outline left inside.

KR: 여기서 중요한 것은 “좋은 답”이 아니라 “말할 수 있게 된 상태”입니다. 사용자는 고쳐져야 할 대상이 아니며, 파도는 진단되어야 할 증상이 아닙니다. 파도는 잠시 표면 위로 올라온 경험입니다.

EN: The important state is not “having the right answer.” It is “being able to say it.” The user is not a subject to be fixed, and a wave is not a symptom to be diagnosed. A wave is an experience that has briefly reached the surface.

## 2. The Promise / 사용자에게 주는 약속

KR: wayv는 사용자가 이런 느낌을 받을 수 있어야 합니다.

- “여기서는 실패를 성과처럼 꾸미지 않아도 된다.”
- “누군가 내 이야기를 해결하려 들지 않고 봐주었다.”
- “숫자로 증명하지 않아도 내 경험은 남아 있을 수 있다.”
- “다른 사람의 파도를 보고, 내 안의 작은 윤곽이 조금 더 선명해졌다.”

EN: wayv should let users feel:

- “I do not have to dress failure up as achievement here.”
- “Someone saw my experience without trying to solve me.”
- “My experience can remain without being proven by numbers.”
- “After seeing another person’s wave, a small outline inside me became clearer.”

## 3. Non-Negotiable Principles / 절대 원칙

KR:

- 조언보다 관찰이 먼저입니다.
- 공개 반응보다 사적인 잔상이 먼저입니다.
- 순위보다 공명이 중요합니다.
- 진단보다 윤곽이 중요합니다.
- 분석보다 느낌이 먼저입니다.
- 강요된 성찰보다 가벼운 선택이 중요합니다.
- 인기도보다 안전한 흐름이 중요합니다.
- 사용자의 글은 사용자의 말로 남아야 합니다.

EN:

- Observation comes before action.
- Private trace comes before public performance.
- Resonance matters more than ranking.
- Outline matters more than diagnosis.
- Feeling comes before analysis.
- Lightweight choice matters more than forced reflection.
- Safe flow matters more than popularity.
- A user’s writing must remain their own words.

## 4. What wayv Must Not Become / wayv가 되면 안 되는 것

KR: wayv는 다음이 아닙니다.

- 코칭 제품
- 상담 또는 치료 제품
- 자기계발 설문지
- 실패 극복 자랑 플랫폼
- 인기투표 또는 랭킹 시스템
- 조언 교환 게시판
- 감정 분석 대시보드
- 작가에게 검증 점수를 주는 반응 집계 도구

EN: wayv is not:

- a coaching product
- a therapy or counseling product
- a self-help questionnaire
- a failure-overcoming showcase
- a popularity or ranking system
- an advice exchange board
- an emotion analytics dashboard
- a reaction aggregation tool that gives authors validation scores

## 5. Core Metaphor / 핵심 은유

KR: wayv의 기본 단위는 “글”이 아니라 “파도”입니다. 파도는 한 사람의 경험이 잠시 표면에 올라왔다가, 다른 사람에게 닿고, 시간이 지나며 약해지고, 때로 다시 일렁이는 흐름입니다.

EN: The core unit of wayv is not a “post.” It is a “wave.” A wave is an experience that surfaces briefly, touches another person, softens over time, and sometimes rekindles.

KR: 이 은유는 UI 장식이 아니라 시스템 구조입니다. feed, detail, reaction, trace, notification, moderation 모두 파도의 움직임을 해치지 않아야 합니다.

EN: This metaphor is not decoration. It is system architecture. Feed, detail, reaction, trace, notification, and moderation should all preserve the movement of a wave.

## 6. Core Features / 핵심 기능

### 6.1 Wave Writing / 파도 남기기

KR: 사용자는 실패, 막힘, 부끄러움, 무너짐, 해내지 못함 같은 경험을 파도로 남깁니다. UI는 사용자를 설득하거나 자기분석으로 몰아가지 않아야 합니다. 제목은 선택적이어도 되고, 본문은 사용자의 말투를 보존해야 합니다.

EN: Users leave waves about failure, stuckness, shame, collapse, or not being able to do something. The UI should not persuade users or push them into self-analysis. A title may be optional, and the body should preserve the user’s own voice.

Implementation implications:

- KR: user text auto-rewrite 금지
- EN: no automatic rewriting of user text
- KR: 작성 중 moderation은 deterministic-first
- EN: writing moderation is deterministic-first
- KR: guidance는 명령이 아니라 조용한 안내
- EN: guidance is quiet orientation, not instruction

### 6.2 Wave Detail / 파도 보기

KR: 상세 페이지는 해결책을 찾는 장소가 아니라 한 파도 곁에 잠시 머무는 장소입니다. 본문이 중심이어야 하며, 반응과 댓글과 private trace는 본문 아래에서 낮은 목소리로 이어져야 합니다.

EN: The detail page is not a place to find solutions. It is a place to stay near one wave for a moment. The body should remain central, while reactions, comments, and private traces continue below it in a lower voice.

Design requirements:

- KR: 메인 콘텐츠보다 반응 UI가 더 크거나 시끄럽지 않아야 합니다.
- EN: reaction UI must not be louder than the main content.
- KR: public metrics를 눈에 띄게 만들지 않습니다.
- EN: do not make public metrics visually prominent.
- KR: 작성자를 평가하는 느낌을 만들지 않습니다.
- EN: do not create a feeling that the author is being rated.

### 6.3 Quiet Reactions / 조용한 반응

KR: 반응은 “좋아요”보다 부드러워야 합니다. 반응은 작성자에게 점수를 주기 위한 것이 아니라, 파도가 누군가에게 닿았음을 조용히 기록하는 방식입니다.

EN: Reactions should be softer than “likes.” They are not scores for the author. They are quiet records that a wave touched someone.

Acceptable direction:

- KR: “닿았어요”, “저도 그래요”, “제 파도를 보탤게요”, “조용히 머물게요”
- EN: “It reached me,” “I have been there too,” “I will add my wave,” “I will stay quietly”

Avoid:

- KR: 좋아요 수, 인기, 급상승, 순위, 베스트
- EN: like counts, popularity, trending, rankings, best-of lists

### 6.4 Private Resonance Trace / 사적인 잔상

KR: 다른 사람의 파도를 본 사용자는 자신에게만 보이는 잔상을 남길 수 있습니다. 이것은 댓글이 아니고, 작성자에게 보내는 피드백도 아니고, 감정 분석도 아닙니다. 작은 사적인 표시입니다.

EN: After viewing another person’s wave, a user may leave a trace visible only to themselves. This is not a comment, not feedback to the author, and not emotion analysis. It is a small private mark.

UX intent:

- KR: “이 파도는 어디쯤 닿았나요?”
- EN: “Where did this wave reach you?”
- KR: “혼자만 볼 수 있는 잔상으로 남겨둘 수 있어요.”
- EN: “You can leave it as an afterimage only you can see.”
- KR: “아직 이름 붙이지 않아도 괜찮아요.”
- EN: “It is okay if you cannot name it yet.”

Privacy requirements:

- KR: 작성자는 다른 사용자의 private trace를 볼 수 없습니다.
- EN: authors cannot see other users’ private traces.
- KR: public API는 `private_note` 또는 private trace를 노출하지 않습니다.
- EN: public APIs must not expose `private_note` or private traces.
- KR: owner-scoped RLS 또는 동등한 접근 제어가 필수입니다.
- EN: owner-scoped RLS or equivalent access control is required.

### 6.5 My Traces / 내 잔상

KR: “내 잔상”은 사용자가 자신에게 남은 파도들을 최신순으로 다시 보는 조용한 공간입니다. 리포트나 차트가 아닙니다. 성장 그래프가 아닙니다. 개인이 자기 안에 남은 결을 다시 확인하는 목록입니다.

EN: “My Traces” is a quiet place where users can revisit the waves that remained with them, latest-first. It is not a report, chart, or growth graph. It is a list for noticing what remained.

Required behavior:

- KR: latest-first
- EN: latest-first
- KR: wave title or snippet, selected resonance choice, timestamp, link back to wave
- EN: wave title or snippet, selected resonance choice, timestamp, and link back to the wave
- KR: private note는 owner에게만 표시
- EN: private notes are shown only to the owner

### 6.6 Rest Mode / 쉬어가기

KR: 사용자가 파도에서 잠시 벗어나고 싶을 때, wayv는 붙잡지 않아야 합니다. 쉬어가기 기능은 참여율을 낮추는 기능이 아니라 신뢰를 높이는 기능입니다.

EN: When users want to step away from the waves, wayv should not hold them back. Rest mode is not a feature that lowers engagement. It is a feature that increases trust.

Implementation implications:

- KR: 추천과 알림 강도를 낮춥니다.
- EN: reduce recommendation and notification intensity.
- KR: 중요한 운영 안내 외에는 조용해져야 합니다.
- EN: become quiet except for necessary operational notices.
- KR: 복귀를 압박하지 않습니다.
- EN: do not pressure the user to return.

### 6.7 Moderation / 운영 보호

KR: moderation은 사용자를 꾸짖기 위한 장치가 아니라 파도가 안전하게 흐르도록 만드는 방파제입니다. deterministic-first 원칙을 지키며, 런타임 LLM moderation은 현재 금지입니다.

EN: Moderation is not a device for scolding users. It is a breakwater that keeps waves safe enough to move. It must remain deterministic-first, and runtime LLM moderation is currently prohibited.

Rules:

- KR: no ridicule, no blame, no public shaming
- EN: no ridicule, no blame, no public shaming
- KR: no unsolicited advice
- EN: no unsolicited advice
- KR: no user-text auto-rewrite
- EN: no user-text auto-rewrite
- KR: moderation feedback는 운영 검증용으로 최소 수집
- EN: moderation feedback is collected minimally for operational validation

## 7. Design Language / 디자인 언어

KR: wayv의 디자인은 “따뜻하지만 달콤하지 않은”, “조용하지만 흐릿하지 않은”, “감성적이지만 치료적으로 과장되지 않은” 방향이어야 합니다.

EN: wayv’s design should feel warm but not sugary, quiet but not vague, emotional but not therapeutically inflated.

### 7.1 Visual Temperature / 시각 온도

KR:

- 여백은 사용자가 숨 쉴 수 있도록 넓게 둡니다.
- 카드와 섹션은 날카로운 박스보다 부드러운 표면처럼 느껴져야 합니다.
- 색은 경고와 보상을 과장하지 않고, 상태를 낮은 강도로 알려야 합니다.
- 숫자보다 상태 문장과 작은 label이 먼저 보여야 합니다.

EN:

- Use enough space for the user to breathe.
- Cards and sections should feel like soft surfaces, not sharp boxes.
- Color should communicate state gently, without exaggerating warning or reward.
- State phrases and small labels should appear before numbers.

### 7.2 Typography / 타이포그래피

KR: 제목은 감정을 밀어붙이지 않고 장면을 열어야 합니다. 본문은 긴 호흡을 견딜 수 있어야 하고, 보조 문구는 사용자를 가르치지 않아야 합니다.

EN: Headings should open a scene without forcing emotion. Body text should support slower reading. Helper text should not teach or correct the user.

Copy guidance:

- KR: “조용히”, “잠시”, “남겨둘 수 있어요”, “괜찮아요” 같은 단어는 가능하지만 남용하지 않습니다.
- EN: Words like “quietly,” “for a moment,” “you can leave it,” and “it is okay” are useful, but should not be overused.
- KR: “분석”, “진단”, “성장”, “치유”, “성공”, “성과”는 기본 UI copy에서 피합니다.
- EN: Avoid “analysis,” “diagnosis,” “growth,” “healing,” “success,” and “performance” in default UI copy.

### 7.3 Motion / 움직임

KR: 움직임은 유혹이 아니라 호흡이어야 합니다. 로딩, 저장, 비우기, 알림 전환은 작고 예측 가능하게 움직입니다.

EN: Motion should feel like breathing, not seduction. Loading, saving, clearing, and notification transitions should be small and predictable.

Design direction:

- KR: 큰 confetti, streak, achievement animation 금지
- EN: no large confetti, streaks, or achievement animations
- KR: 저장 성공은 조용한 문장과 작은 상태 변화로 충분
- EN: save success only needs a quiet sentence and small state change
- KR: 실패나 제한 상태도 사용자 탓처럼 보이지 않게 표현
- EN: failure or limited states should not look like blame

### 7.4 Empty States / 빈 상태

KR: 빈 상태는 사용자를 재촉하지 않아야 합니다. “아직 없다”는 결핍이 아니라, “아직 남겨도 되고 지나가도 되는” 상태입니다.

EN: Empty states should not hurry the user. “Nothing yet” is not a deficiency. It is a state where leaving something or passing by are both okay.

Good direction:

- KR: “아직 남은 잔상이 없어요. 어떤 파도는 그냥 지나가도 괜찮아요.”
- EN: “No traces have remained yet. Some waves can simply pass by.”

Avoid:

- KR: “활동을 시작하세요”, “더 많은 반응을 남겨보세요”, “성장을 기록하세요”
- EN: “Start being active,” “leave more reactions,” “track your growth”

## 8. Interaction Rules / 상호작용 규칙

KR:

- 사용자가 보기 전에 행동을 요구하지 않습니다.
- 선택지는 짧고 판단이 없어야 합니다.
- 저장, 비우기, 취소는 모두 쉽게 가능해야 합니다.
- private action과 public action은 시각적으로 명확히 분리합니다.
- private note는 placeholder와 helper text 모두에서 private임을 확인시켜야 합니다.
- 작성자에게 보이는 것과 viewer에게만 보이는 것을 절대 섞지 않습니다.

EN:

- Do not ask users to act before they have observed.
- Choices should be short and non-judgmental.
- Saving, clearing, and canceling should all be easy.
- Private and public actions must be visually distinct.
- Private-note placeholder and helper text should reinforce privacy.
- Never mix what the author sees with what only the viewer sees.

## 9. Data & API Contracts / 데이터와 API 계약

KR: 제품 철학은 데이터 구조에도 반영되어야 합니다. 공개 데이터와 사적 데이터의 경계가 흐려지면 wayv의 신뢰는 무너집니다.

EN: Product philosophy must be reflected in data structure. If public and private data boundaries blur, wayv loses trust.

Required contracts:

- KR: private trace는 owner만 read/write/delete 가능해야 합니다.
- EN: private traces must be readable, writable, and deletable only by the owner.
- KR: public post detail response는 private note를 포함하지 않아야 합니다.
- EN: public post detail responses must not include private notes.
- KR: author-facing counts, summaries, or dashboards for private resonance는 만들지 않습니다.
- EN: do not create author-facing counts, summaries, or dashboards for private resonance.
- KR: route handler는 auth/validation/response boundary만 담당하고 business logic은 service에 둡니다.
- EN: route handlers should handle auth, validation, and response boundaries only; business logic belongs in services.
- KR: internal HTTP self-call 금지
- EN: no internal HTTP self-calls

## 10. Moderation & Safety Tone / 운영 보호 톤

KR: 안전 장치는 차갑게 막는 벽이 아니라, 잠시 멈추게 하는 낮은 난간처럼 느껴져야 합니다.

EN: Safety systems should not feel like cold walls. They should feel like low railings that invite a pause.

Good direction:

- KR: “지금 이 내용은 잠시 숨을 고르고 안전하게 살펴보고 있어요.”
- EN: “This is being held for a moment so we can look at it safely.”
- KR: “같은 마음을 조금 더 다치지 않는 말로 남겨볼 수 있어요.”
- EN: “You can leave the same feeling in words that hurt a little less.”

Avoid:

- KR: “위반했습니다”, “부적절합니다”, “문제가 있습니다”를 기본 사용자 copy로 남발
- EN: overusing “violated,” “inappropriate,” or “problematic” in default user-facing copy

## 11. Current V1 Priorities / 현재 V1 우선순위

KR:

1. closed beta access and auth stability
2. wave writing and reading
3. deterministic moderation baseline
4. quiet reactions
5. private resonance traces
6. private traces list
7. operational proof before expansion

EN:

1. closed beta access and auth stability
2. wave writing and reading
3. deterministic moderation baseline
4. quiet reactions
5. private resonance traces
6. private traces list
7. operational proof before expansion

Do not jump to:

- KR: charts, weekly reports, monetization, wave rooms, runtime LLM moderation, recommendation engines
- EN: charts, weekly reports, monetization, wave rooms, runtime LLM moderation, or recommendation engines

## 12. How To Judge A New Feature / 새 기능 판단 기준

KR: 새 기능을 제안하거나 구현하기 전에 아래 질문에 답해야 합니다.

- 이 기능은 사용자를 더 조용하게 안전하게 말할 수 있게 하는가?
- 이 기능은 숫자와 순위의 압력을 키우지 않는가?
- 이 기능은 조언이나 진단처럼 느껴지지 않는가?
- 이 기능은 private/public boundary를 흐리지 않는가?
- 이 기능은 쉬어갈 권리를 보존하는가?
- 이 기능은 route-thin/service-thick 구조를 지키는가?
- 이 기능은 운영 proof 없이 확장되지 않는가?

EN: Before proposing or implementing a new feature, answer:

- Does this help the user speak more safely and quietly?
- Does this avoid increasing pressure from numbers and rankings?
- Does this avoid feeling like advice or diagnosis?
- Does this preserve the private/public boundary?
- Does this preserve the right to step away?
- Does this follow thin-route/thick-service architecture?
- Does this avoid expansion without operational proof?

## 13. Designer’s North Star / 디자이너를 위한 북극성

KR: wayv의 좋은 화면은 사용자를 설득하지 않습니다. 대신 사용자가 이미 느끼고 있던 것을 너무 크게 부르지 않고 알아차릴 수 있게 합니다. 좋은 버튼은 행동을 강요하지 않습니다. 좋은 빈 상태는 죄책감을 만들지 않습니다. 좋은 반응은 작성자를 평가하지 않습니다. 좋은 trace는 자기 안에 남은 것을 조용히 확인하게 합니다.

EN: A good wayv screen does not persuade the user. It lets them notice what they were already feeling without calling it too loudly. A good button does not force action. A good empty state does not create guilt. A good reaction does not rate the author. A good trace lets the user quietly recognize what remained inside.

KR: wayv는 크게 외치는 제품이 아닙니다. 하지만 흐릿해서도 안 됩니다. 정확한 경계, 낮은 목소리, 충분한 여백, 사적인 선택, 그리고 숫자를 숨길 용기가 이 제품의 디자인 언어입니다.

EN: wayv is not a loud product. But it should not be vague. Clear boundaries, a low voice, generous space, private choice, and the courage to hide numbers are its design language.

## 14. Final Implementation Reminder / 구현 전 마지막 확인

KR: 어떤 화면을 만들든, 사용자가 “내가 평가받고 있다”가 아니라 “내 경험이 잠시 안전하게 놓였다”고 느껴야 합니다.

EN: Whatever screen you build, the user should not feel “I am being evaluated.” They should feel “my experience has been safely placed here for a moment.”
