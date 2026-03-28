export const systemCopy = {
  brand: {
    name: "wayv",
    tagline: "실패를 말해도 되는 흐름으로 바꾸는 곳",
    description:
      "wayv는 실패를 해결책으로 밀어붙이지 않고, 말해도 되는 경험으로 바꾸는 공감 중심 플랫폼이에요."
  },
  auth: {
    title: "이메일로 조용히 들어와요",
    description:
      "비밀번호 대신 메일로 로그인 링크를 보내 드릴게요. 처음에는 가볍게 둘러봐도 괜찮아요.",
    submit: "로그인 링크 보내기",
    sent: "이메일로 들어오는 길을 보냈어요. 받은 편지함을 한 번 확인해 주세요.",
    missingEnv: "Supabase 연결값을 채우면 바로 로그인 흐름을 확인할 수 있어요.",
    signedOut: "잠시 파도에서 쉬고 있어요. 필요할 때 다시 돌아오면 돼요."
  },
  home: {
    weatherTitle: "오늘의 파도 날씨",
    forYouTitle: "나에게 닿은 파도",
    quietTitle: "조용히 이어지는 파도",
    rekindledTitle: "다시 일렁이는 파도",
    restModeBanner: "오늘은 파도에서 벗어나 해변에서 쉬고 있어요.",
    onboardingPrompt: "먼저 몇 가지 질문으로 지금의 흐름과 닮은 파도를 맞춰 볼까요?",
    loggedOutTitle: "말하지 못한 경험도 안전하게 둘 수 있어요",
    loggedOutDescription:
      "조언보다 공감이 먼저 필요한 순간을 위해, 숫자 없이 닿는 흐름을 준비했어요."
  },
  onboarding: {
    title: "처음에는 가볍게, 지금의 흐름만 맞춰 볼게요",
    subtitle: "답을 건너뛰어도 괜찮아요. 나중에 언제든 다시 바꿀 수 있어요.",
    submit: "이 흐름으로 시작할게요",
    saving: "지금의 흐름을 정리하고 있어요...",
    error: "아직 저장되지 않았어요. 잠시 뒤 다시 시도해 주세요."
  },
  profile: {
    title: "내 흐름을 드러내는 방식",
    description: "프로필과 공개 범위를 지금의 편안한 수준에 맞춰 둘 수 있어요.",
    submit: "프로필 저장하기"
  },
  settings: {
    title: "설정",
    description: "알림과 휴식, 공개 범위를 잔잔하게 조절해요.",
    notificationsTitle: "알림 톤 조절",
    restModeTitle: "해변에서 쉬기"
  },
  restMode: {
    title: "잠시 고요를 선택해도 괜찮아요",
    description: "쉬는 동안에는 추천과 알림을 조금 더 잔잔하게 둘게요.",
    enable: "해변에서 쉬기",
    disable: "다시 파도로 돌아가기"
  },
  write: {
    title: "파도 남기기",
    description: "지금의 흐름을 숫자 없이, 조용하게 남길 수 있어요.",
    submit: "파도 남기기"
  },
  reactions: {
    touched: "닿았어요",
    ive_been_there: "나도 그랬어요",
    add_wave: "파도를 보탤게요",
    stay_quiet: "조용히 머물게요"
  },
  notifications: {
    quietDigest: "오늘은 여러 흐름이 잔잔하게 이어지고 있어요.",
    operationalNotice: "필요한 안내만 조용히 전해 드릴게요."
  },
  moderation: {
    gentleRewrite: "같은 마음이 조금 더 안전하게 닿도록, 표현을 조금 다듬어 볼게요.",
    safetyPause:
      "지금 이 내용은 잠시 숨을 고르고, 더 안전하게 전할 수 있는 방법을 먼저 살펴볼게요."
  },
  waveStates: {
    calm: "잔잔한 파도",
    spreading: "번지는 파도",
    surging: "거세지는 파도",
    lingering: "길게 머무는 파도",
    rekindled: "다시 일렁이는 파도",
    fading: "잦아드는 파도"
  }
} as const;
