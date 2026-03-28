# Task 02. Auth, Profile, Onboarding

## 목표
회원가입부터 초기 개인화 seed 생성까지 연결한다.

## 범위
- auth
- profile visibility
- onboarding question flow
- onboarding answer save
- onboarding seed profile materialize

## 상세 작업
1. login/logout flow
2. public profile settings
3. onboarding question config 파일
4. branching logic service
5. answer persistence
6. seed profile generation
7. first-run redirect and completion flag

## Acceptance Criteria
- 신규 사용자가 로그인 후 온보딩으로 이동한다
- 6~8문항 내에서 flow 완료 가능
- 답변에 따라 다음 질문이 달라진다
- 완료 후 onboarding_profile이 생성된다
- 사용자는 나중에 답변 수정 가능
