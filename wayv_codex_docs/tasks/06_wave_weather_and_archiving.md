# Task 06. Wave Weather & Archiving

## 목표
공개 날씨 표현과 파도 수명 주기를 구현한다.

## 범위
- category weather aggregation
- state copy mapping
- archive lifecycle
- rekindle logic v1

## 상세 작업
1. weather score batch
2. category state thresholds
3. archival cron
4. rekindle detection
5. “다시 일렁이는 파도” lane population

## Acceptance Criteria
- 홈 상단에 오늘의 파도 날씨가 표시된다
- 개별 글 랭킹 없이 상태만 보여준다
- 오래된 파도가 아카이브 정책을 따른다
- silence 이후 재상승 글이 다시 일렁이는 파도에 들어간다
