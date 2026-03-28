# 03. Wave System Logic

## 1. 설계 목적
파도 로직은 인기 랭킹을 만들기 위한 것이 아니다.  
목적은 다음 4가지다.

1. 숫자를 드러내지 않고도 공명 흐름을 표현한다
2. 시간이 지나면 자연스럽게 잦아드는 흐름을 만든다
3. 개인에게 의미 있는 파도를 먼저 닿게 한다
4. 자극적인 글이 구조적으로 이득을 보지 못하게 한다

## 2. 핵심 개념

### 2.1 Wave State
사용자에게 보이는 상태 언어. 내부 숫자를 감춘 번역 레이어다.

상태 예시:
- 잔잔한 파도
- 번지는 파도
- 거세지는 파도
- 길게 머무는 파도
- 다시 일렁이는 파도
- 잦아드는 파도

### 2.2 Wave Energy
현재까지 축적된 공명의 총량

### 2.3 Wave Velocity
짧은 시간 안에 얼마나 빠르게 공명이 붙는지

### 2.4 Wave Decay
시간 경과에 따라 자연스럽게 줄어드는 정도

### 2.5 Wave Rekindle
한동안 잠잠했던 파도가 다시 반응을 얻는 현상

## 3. 입력 신호

### 3.1 반응 가중치 초안
- 닿았어요: 1.0
- 조용히 머물게요: 0.8
- 파도를 보탤게요: 1.2
- 나도 그랬어요: 1.6
- 의미 있는 댓글 작성: 2.0
- 저장/보관: 0.9
- 상세 페이지 체류 기준 충족: 0.4

설명:
- “나도 그랬어요”는 가장 강한 동일시 신호이므로 높은 가중치
- 댓글은 클릭보다 큰 행위이므로 더 높은 가중치
- 단순 조회는 파도 신호에 직접 포함하지 않거나 매우 낮게 반영

### 3.2 작성 행위 가중치
개인화 추천에서 사용자가 **직접 쓴 글**은 클릭 반응보다 훨씬 강한 신호다.

사용자-주제 친밀도 계산 시:
- 내가 쓴 글: 5.0
- 내가 댓글 쓴 글: 3.0
- 내가 “나도 그랬어요” 누른 글: 2.2
- 내가 “파도를 보탤게요” 누른 글: 1.8
- 내가 “닿았어요” 누른 글: 1.0
- 내가 오래 읽은 글: 0.8

## 4. 내부 계산 모델

### 4.1 Raw Energy
```text
raw_energy =
  1.0 * touched +
  0.8 * stayed_quietly +
  1.2 * added_wave +
  1.6 * ive_been_there +
  2.0 * meaningful_comments +
  0.9 * saves +
  0.4 * qualified_dwell_events
```

### 4.2 Decayed Energy
```text
decayed_energy = raw_energy * e^(-elapsed_hours / tau)
```

추천 기본값:
- tau = 36h ~ 72h 범위에서 실험
- 카테고리별로 अलग-अलग tuning 가능

### 4.3 Velocity
```text
velocity = (decayed_energy_now - decayed_energy_6h_ago) / 6
```

### 4.4 Rekindle Score
```text
rekindle_score =
  current_recent_energy * silence_gap_factor * similarity_boost
```

의미:
- 일정 시간 잠잠함
- 다시 반응 발생
- 과거와 닮은 공명 재발

## 5. 상태 판정 규칙
숫자를 그대로 보여주지 않고 상태 언어로만 매핑한다.

예시:
- decayed_energy 낮음 + velocity 상승: 번지는 파도
- decayed_energy 중간 + velocity 높음: 거세지는 파도
- decayed_energy 높음 + velocity 안정: 길게 머무는 파도
- recent drop 명확: 잦아드는 파도
- silence 이후 재상승: 다시 일렁이는 파도

## 6. 공개 레이어 vs 개인 레이어

### 6.1 공개 레이어
공개 피드에는 개별 글 랭킹을 만들지 않는다.

보이는 것:
- 오늘의 파도 날씨
- 카테고리별 흐름 문장
- 전체적으로 어떤 주제가 일렁이는지

보이지 않는 것:
- 정확한 공감 수
- “오늘 가장 큰 파도”
- 순위
- 급상승 목록

### 6.2 개인 레이어
핵심 영역. 사용자가 체감해야 할 주 경험.

추천 기준:
- 내가 직접 쓴 글과의 유사도
- 내가 자주 반응한 주제
- 감정 태그 유사도
- 카테고리 유사도
- 최근 반응 흐름
- 휴식 모드 여부
- 알림 피로도 점수

개인 추천 점수 예시:
```text
personal_wave_score =
  0.35 * authored_similarity +
  0.20 * interaction_similarity +
  0.15 * emotion_similarity +
  0.10 * category_similarity +
  0.10 * wave_state_relevance +
  0.10 * freshness
```

권장:
- authored_similarity 비중을 가장 높게 둔다
- 단순 버튼 반응보다 “내가 쓴 글”을 훨씬 강하게 본다

## 7. 온보딩 seed와 연결
초기에는 사용자 행동 데이터가 부족하므로 온보딩 답변으로 seed profile을 만든다.

seed profile 예시:
- 주제 관심도
- 감정 결
- 보고 싶은 흐름(조용함/강한 공명/짧은 위로 등)
- 피하고 싶은 자극
- 공개 성향

이 seed는 개인 추천의 임시 priors로 사용하고, 실제 행동 데이터가 쌓이면 점차 비중을 낮춘다.

## 8. 알림 로직

### 8.1 알림 종류
- 나에게 닿은 파도
- 내 과거 글과 닮은 파도
- 다시 일렁이는 파도
- 조용히 이어지는 파도 digest
- 운영/안전 알림

### 8.2 알림 우선순위
1. 내가 쓴 글과 유사한 새 파도
2. 내가 쓴 글에 대한 새 공명
3. 내가 자주 반응한 주제의 재점화
4. 일반 추천성 알림

### 8.3 빈도 제한
- 기본: 하루 1~3회
- 묶음 알림 우선
- 비슷한 주제는 1개 카드로 합치기
- 야간 시간대 제한
- 휴식 모드 시 모든 추천성 푸시 정지

### 8.4 알림 메시지 원칙
- 숫자 금지
- “인기” 금지
- 과장 금지
- 나에게 도달했다는 감각 강조

예시:
- 예전에 남긴 이야기와 닮은 파도가 닿았어요
- 조용히 이어지던 흐름이 다시 일렁이고 있어요
- 당신이 마음을 두었던 주제에 새로운 파동이 생겼어요

## 9. 휴식 모드 로직

### 9.1 목적
사용자가 외부 자극을 피하고 싶을 때 파도를 잠시 막을 수 있어야 한다.

### 9.2 동작
- 개인화 추천 강도 감소
- 추천성 푸시 중단
- 홈에서 개인 파도 섹션 접기
- 작성/조회는 유지
- 운영/안전 알림만 예외 허용

### 9.3 카피
- 오늘은 파도에서 벗어나 해변에서 쉴게요
- 잠시 고요를 선택해도 괜찮아요

## 10. 운영 보호 장치
- 급격한 반응 폭증이 있어도 공개 확산은 제한
- 신고/차단/고위험 패턴은 파도 증폭 대상에서 제외 가능
- 자극적 표현만으로 velocity가 높아지지 않도록 텍스트 품질/신뢰도 보정 적용 가능

## 11. 구현 권장
### V1
- energy
- velocity
- decay
- personalized score
- rest mode
- hidden thresholds

### V2
- rekindle
- category weather
- digest optimization
- text quality moderation coefficient

### V3
- long-term personal wave memory
- seasonal recurrence
- user-tuned wave sensitivity
