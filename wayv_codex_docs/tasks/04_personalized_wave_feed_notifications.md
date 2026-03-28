# Task 04. Personalized Wave Feed & Notifications

## 목표
홈 핵심 가치를 만드는 개인화 피드와 알림을 구현한다.

## 범위
- wave score refresh job
- personalized scoring
- 4개 홈 레인
- notification generation
- in-app notification center

## 상세 작업
1. wave score service
2. lane query builders
3. weather copy mapper
4. personalized reason codes
5. notification templates
6. max daily frequency gate
7. in-app list and read state

## Acceptance Criteria
- 홈에서 4개 레인이 보인다
- 개인화 레인은 사용자의 authored_similarity를 가장 크게 반영한다
- notification 생성 시 숫자 문구가 없다
- 하루 빈도 제한이 작동한다
