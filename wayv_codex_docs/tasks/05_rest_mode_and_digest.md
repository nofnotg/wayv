# Task 05. Rest Mode & Digest

## 목표
사용자가 외부 자극을 조절할 수 있는 해변 모드와 묶음 알림을 구현한다.

## 범위
- rest mode start/end
- UI toggle
- feed suppression
- notification suppression
- digest mode

## 상세 작업
1. rest_mode table/service
2. settings UI
3. home query filters
4. push suppression
5. digest grouping
6. recovery from rest mode

## Acceptance Criteria
- 사용자가 오늘/3일/7일 휴식 모드를 설정할 수 있다
- 휴식 모드 동안 추천성 푸시가 중단된다
- 홈 레인 노출이 완화된다
- digest 알림이 묶음으로 동작한다
