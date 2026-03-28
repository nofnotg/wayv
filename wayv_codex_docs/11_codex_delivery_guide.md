# 11. Codex Delivery Guide

## 1. Codex에게 기대하는 역할
- 문서를 읽고 임의 해석하지 말고 명시된 우선순위를 따른다
- 작은 기능부터 완성도 있게 구현한다
- 파도 개념을 UI 장식으로 소비하지 말고 상태 로직으로 구현한다
- 숫자 공개를 기본값으로 넣지 않는다
- 테스트 가능한 단위로 PR을 쪼갠다

## 2. 작업 방식
1. 한 번에 한 기능 묶음
2. 각 태스크마다 acceptance criteria 충족
3. 스키마/타입/API/화면/테스트를 같은 흐름으로 처리
4. 불확실한 부분은 문서에 TODO 남기고 과한 확장 금지

## 3. 브랜치 전략
- main: 배포 기준
- feat/<task-name>
- fix/<issue-name>
- chore/<infra-name>

## 4. PR 원칙
PR마다 포함:
- 변경 요약
- 설계 이유
- 스크린샷
- 테스트 결과
- 남은 TODO

## 5. 코딩 원칙
- TypeScript strict
- zod validation
- server/client boundary 분리
- component size control
- feature-folder structure
- magic number 금지(파도 가중치는 config로 분리)
- copy text는 dictionary/file로 분리

## 6. 테스트 우선순위
- wave score calculation unit test
- personalized ranking unit test
- rest mode filter test
- onboarding branching test
- moderation gating test

## 7. 금지
- 초반부터 복잡한 AI agent 구조
- 실시간 websocket 집착
- 과한 microservice 분리
- “급상승/인기” 유혹에 끌려가는 UI
- 숫자 count 노출 기본 적용
