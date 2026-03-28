export const systemCopy = {
  brand: {
    name: "wayv",
    tagline: "실패를 말해도 되는 흐름으로 바꾸기",
    description:
      "wayv는 실패를 해결책으로 밀어붙이기보다, 말해도 되는 경험으로 바꾸고 고립을 조금 덜어내는 공간이에요."
  },
  auth: {
    title: "이메일로 조용히 들어오세요",
    description:
      "비밀번호 대신 이메일 링크로 들어올 수 있어요. 처음에는 가볍게 둘러봐도 괜찮아요.",
    submit: "로그인 링크 보내기",
    sent: "이메일로 들어오는 길을 보냈어요. 받은 편지함을 한 번 확인해 주세요.",
    missingEnv: "Supabase 연결값을 채우면 바로 로그인 흐름을 확인할 수 있어요.",
    signedOut: "잠시 파도에서 나와 있어요. 다시 돌아오면 이어서 볼 수 있어요."
  },
  home: {
    weatherTitle: "Today's Wave Weather",
    forYouTitle: "Waves Reaching Me",
    quietTitle: "Quietly Continuing Waves",
    rekindledTitle: "Waves Rippling Again",
    forYouRestingTitle: "쉬는 동안에는 나에게 닿는 파도를 조금 줄여 둘게요",
    forYouRestingDescription:
      "고요를 고른 동안에는 먼저 닿는 흐름을 잠시 덜어 두고, 필요한 안내만 남겨 둘게요.",
    restModeBanner: "오늘은 파도에서 조금 떨어져 쉬고 있어요",
    onboardingPrompt: "몇 가지 질문으로 지금의 흐름과 닿고 싶은 파도를 가볍게 맞춰 볼까요?",
    loggedOutTitle: "말하지 못한 경험을 안전하게 남겨 두는 곳",
    loggedOutDescription:
      "조언보다 공감이 먼저 필요한 시간을 위해, 숫자 없이 이어지는 실패 경험의 흐름을 준비했어요."
  },
  onboarding: {
    title: "처음에는 가볍게, 지금의 흐름만 맞춰 볼게요",
    subtitle: "답을 건너뛰어도 괜찮아요. 이 선택은 언제든 다시 바꿀 수 있어요.",
    submit: "이 흐름으로 시작할게요",
    saving: "지금의 흐름을 정리하고 있어요...",
    error: "아직 저장되지 않았어요. 잠시 후 다시 시도해 주세요."
  },
  profile: {
    title: "내 흐름이 드러나는 방식",
    description: "프로필과 공개 범위를 지금의 편안함에 맞춰 둘 수 있어요.",
    submit: "프로필 저장하기"
  },
  settings: {
    title: "설정",
    description: "알림과 휴식, 공개 범위를 조용하게 조절해요.",
    notificationsTitle: "알림 조절",
    restModeTitle: "해변에서 쉬기"
  },
  restMode: {
    title: "조금 쉬어도 괜찮아요",
    description: "쉬는 동안에는 추천과 알림을 조금 더 잔잔하게 둘게요.",
    enable: "해변에서 쉬기",
    disable: "다시 파도로 돌아가기"
  },
  write: {
    title: "파도 남기기",
    description: "지금의 흐름을 숫자 없이, 조용하게 남겨 둘 수 있어요.",
    submit: "파도 남기기"
  },
  reactions: {
    title: "이 파도에 닿은 방식을 남겨 보세요",
    description: "숫자 대신 닿은 방식만 조용히 기록할게요.",
    touched_me: "닿았어요",
    me_too: "나도 그래요",
    add_my_wave: "내 파도도 보탤게요",
    stay_quietly: "조용히 머물게요",
    signInPrompt: "반응을 남기려면 먼저 로그인해 주세요.",
    saved: "이 방식으로 마음을 남겨 두었어요."
  },
  comments: {
    title: "조용히 이어지는 말",
    description: "짧은 말 한 줄도 다음 파도에 작은 숨을 더해 줄 수 있어요.",
    empty: "아직 이어진 말이 없어요. 첫 번째로 조심스럽게 말을 남겨 보셔도 괜찮아요.",
    placeholder: "지금 닿은 마음을 짧게 남겨도 괜찮아요.",
    submit: "짧은 말 남기기",
    saving: "말을 남기는 중이에요...",
    signInPrompt: "짧은 말을 남기려면 먼저 로그인해 주세요.",
    invalid: "짧은 말은 2자 이상 500자 이하로 남겨 주세요.",
    saveError: "말을 남기지 못했어요. 잠시 후 다시 시도해 주세요."
  },
  reporting: {
    title: "조금 더 안전하게 살펴봐야 할 흐름인가요?",
    description: "이유를 짧게 남겨 주시면 운영 흐름에서 먼저 확인할게요.",
    triggerPost: "이 파도 알리기",
    triggerComment: "이 말 알리기",
    submit: "운영 흐름에 남기기",
    saving: "운영 흐름에 남기는 중이에요...",
    success: "운영 흐름에 조용히 남겨 두었어요.",
    duplicate: "이미 확인할 수 있도록 전해 두었어요.",
    error: "아직 운영 흐름에 남기지 못했어요. 잠시 후 다시 시도해 주세요.",
    signInPrompt: "알리려면 먼저 로그인해 주세요.",
    notePlaceholder: "필요하다면 짧은 설명을 덧붙여도 괜찮아요.",
    reasons: {
      harmful_expression: "누군가를 다치게 할 수 있는 표현",
      personal_attack: "개인을 직접 겨누는 표현",
      privacy_exposure: "개인정보가 드러난 내용",
      graphic_or_triggering: "자극이 큰 내용",
      spam_or_promotion: "반복적인 홍보 또는 스팸",
      other: "다른 이유"
    }
  },
  notifications: {
    quietDigest: "오늘은 여러 흐름이 잔잔하게 이어지고 있어요.",
    operationalNotice: "필요한 안내만 조용히 전할게요.",
    candidateForYouTitle: "지금 닿을 만한 파도가 있어요",
    candidateRekindledTitle: "다시 일렁이는 파도가 있어요",
    candidateRestingSuppressed: "쉬는 동안에는 먼저 닿는 알림을 잠시 줄여 둘게요.",
    quietHoursSuppressed: "지금은 조용한 시간이라, 알림은 잠시 머물러 둘게요."
  },
  moderation: {
    gentleRewrite: "같은 마음도 조금 더 안전한 말로 전해 볼 수 있어요.",
    safetyPause: "지금 이 내용은 잠시 숨을 고르고 더 안전하게 살펴보고 있어요.",
    limitedPostTitle: "이 파도는 조금 더 조심스럽게 이어지고 있어요",
    limitedPostDescription:
      "지금은 넓게 퍼지기보다, 직접 찾아온 흐름 안에서만 조심스럽게 남겨 두고 있어요.",
    underReviewTitle: "이 파도는 잠시 살펴보고 있어요",
    underReviewDescription:
      "조금 더 안전하게 닿을 수 있는지 먼저 확인하고 있어요. 확인이 끝나면 다시 이어질 수 있어요.",
    removedTitle: "이 파도는 잠시 내려 두었어요",
    removedDescription:
      "지금은 그대로 두기보다 잠시 걷어 두는 편이 더 안전하다고 판단했어요.",
    limitedComment: "이 말은 조금 더 조심스러운 방식으로만 남겨 두고 있어요.",
    underReviewComment: "이 말은 잠시 살펴보고 있어요.",
    removedComment: "이 말은 잠시 내려 두었어요.",
    interactionsPaused: "이 흐름은 지금 잠시 살펴보는 중이라, 반응과 말을 잠시 쉬고 있어요.",
    myCommentLabel: "내가 남긴 말",
    anonymousCommentLabel: "익명의 파도"
  },
  waveStates: {
    calm: "잔잔한 파도",
    spreading: "번져가는 파도",
    surging: "거세지는 파도",
    lingering: "길게 머무는 파도",
    rekindled: "다시 일렁이는 파도",
    fading: "잠잠해지는 파도"
  },
  wave: {
    publicLabel: "공개 파도",
    privateLabel: "보관 파도",
    untitled: "제목 없이 닿은 파도"
  }
} as const;
