# 08. API Contracts

## 1. 인증
### POST /api/auth/signin
### POST /api/auth/signout
### GET /api/me

## 2. 온보딩
### GET /api/onboarding/questions
현재 사용자 상태에 맞는 다음 질문 세트를 반환

Response:
```json
{
  "questions": [
    {
      "key": "primary_topic",
      "type": "single_choice",
      "title": "요즘 가장 자주 떠오르는 흐름은 어떤 쪽인가요?",
      "options": [
        {"key": "work", "label": "일/커리어"},
        {"key": "money", "label": "돈/생활"}
      ]
    }
  ]
}
```

### POST /api/onboarding/answers
사용자 답변 저장 및 seed profile 갱신

### GET /api/onboarding/profile
내부 seed profile 확인용

## 3. 글
### POST /api/posts
### GET /api/posts/:id
### GET /api/feed/home
lane별 카드 반환

Response:
```json
{
  "weather": [
    {"topic": "work", "state": "lingering", "copy": "오늘은 일 주제의 파도가 길게 이어지고 있어요"}
  ],
  "lanes": {
    "for_you": [],
    "quiet": [],
    "rekindled": []
  }
}
```

### POST /api/posts/:id/archive
### POST /api/posts/:id/mute

## 4. 반응
### POST /api/posts/:id/reactions
Body:
```json
{
  "reactionType": "ive_been_there"
}
```

### DELETE /api/posts/:id/reactions/:reactionType

## 5. 댓글
### POST /api/posts/:id/comments
### PATCH /api/comments/:id
### DELETE /api/comments/:id

## 6. 알림
### GET /api/notifications
### POST /api/notifications/:id/read
### PATCH /api/notification-preferences

## 7. 휴식 모드
### POST /api/rest-mode/start
Body:
```json
{
  "duration": "3d"
}
```

### POST /api/rest-mode/end
### GET /api/rest-mode

## 8. 신고/모더레이션
### POST /api/reports
### GET /api/admin/moderation/cases
### POST /api/admin/moderation/cases/:id/actions

## 9. 내부 배치 엔드포인트
### POST /internal/jobs/wave-score-refresh
### POST /internal/jobs/personalized-feed-refresh
### POST /internal/jobs/notification-digest
### POST /internal/jobs/archive-maintenance

## 10. API 원칙
- 숫자 raw count는 일반 사용자 응답에 넣지 않는다
- 상태 copy는 서버에서 번역해 내려주거나 번역 키를 내려준다
- 개인정보 관련 필드는 최소화
- 관리자 API는 별도 권한 검증 필수
