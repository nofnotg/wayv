import type {
  OnboardingAnswer,
  OnboardingQuestion,
  OnboardingSeedProfile,
  PublicProfileVisibility
} from "@/lib/domain/types";

function visibilityPatch(value: PublicProfileVisibility) {
  return { privacyPreference: value } as const;
}

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    key: "primary_topic",
    type: "single_choice",
    title: "요즘 가장 자주 마음에 걸리는 흐름은 어떤 쪽인가요?",
    options: [
      { key: "work", label: "일과 커리어", seedPatch: { topics: { work: 3 } } },
      { key: "money", label: "돈과 생활", seedPatch: { topics: { money: 3 } } },
      {
        key: "relationships",
        label: "관계",
        seedPatch: { topics: { relationships: 3 } }
      },
      { key: "family", label: "가족", seedPatch: { topics: { family: 3 } } },
      { key: "study", label: "학업과 진로", seedPatch: { topics: { study: 3 } } },
      { key: "health", label: "건강", seedPatch: { topics: { health: 3 } } },
      {
        key: "daily_life",
        label: "일상 전반",
        seedPatch: { topics: { daily_life: 2 } }
      }
    ]
  },
  {
    key: "emotion_relief",
    type: "multi_choice",
    title: "비슷한 이야기를 볼 때 어떤 감정이 먼저 가벼워지면 좋겠나요?",
    subtitle: "여러 개를 골라도 괜찮아요.",
    options: [
      { key: "isolation", label: "고립감", seedPatch: { emotions: { isolation: 2 } } },
      {
        key: "self_blame",
        label: "자책감",
        seedPatch: { emotions: { self_blame: 2 } }
      },
      { key: "anxiety", label: "불안감", seedPatch: { emotions: { anxiety: 2 } } },
      {
        key: "frustration",
        label: "답답함",
        seedPatch: { emotions: { frustration: 2 } }
      },
      { key: "grief", label: "상실감", seedPatch: { emotions: { grief: 2 } } },
      { key: "quiet_hope", label: "조용한 희망", seedPatch: { emotions: { quiet_hope: 1 } } }
    ]
  },
  {
    key: "preferred_tone",
    type: "single_choice",
    title: "지금 더 닿았으면 하는 흐름은 어떤 쪽인가요?",
    options: [
      {
        key: "quiet",
        label: "조용한 공감",
        seedPatch: { preferredWaveTone: "quiet", empathyPreference: "quiet" }
      },
      {
        key: "resonant",
        label: "나도 그랬다는 연결감",
        seedPatch: { preferredWaveTone: "resonant", empathyPreference: "shared" }
      },
      {
        key: "light",
        label: "조금 가벼운 숨통",
        seedPatch: { preferredWaveTone: "light", empathyPreference: "gentle_prompt" }
      },
      {
        key: "mixed",
        label: "길게 머무는 위로",
        seedPatch: { preferredWaveTone: "mixed", empathyPreference: "gentle_prompt" }
      }
    ]
  },
  {
    key: "privacy_preference",
    type: "single_choice",
    title: "처음에는 어떤 방식이 편한가요?",
    options: [
      {
        key: "anonymous",
        label: "완전 익명으로 둘러볼래요",
        seedPatch: visibilityPatch("anonymous")
      },
      {
        key: "semi_anonymous",
        label: "반익명으로 가볍게 시작할래요",
        seedPatch: visibilityPatch("semi_anonymous")
      },
      {
        key: "nickname_visible",
        label: "닉네임으로 써도 괜찮아요",
        seedPatch: visibilityPatch("nickname_visible")
      },
      {
        key: "profile_visible",
        label: "프로필도 천천히 열어둘래요",
        seedPatch: visibilityPatch("profile_visible")
      }
    ]
  },
  {
    key: "exposure_tolerance",
    type: "single_choice",
    title: "요즘은 어떤 흐름이 덜 부담스러울까요?",
    options: [
      {
        key: "low",
        label: "짧고 조용한 이야기",
        seedPatch: { exposureTolerance: "low", readingPreference: "short" }
      },
      {
        key: "medium",
        label: "비슷한 경험이 모이는 이야기",
        seedPatch: { exposureTolerance: "medium", readingPreference: "mixed" }
      },
      {
        key: "high",
        label: "긴 글도 괜찮아요",
        seedPatch: { exposureTolerance: "high", readingPreference: "long" }
      }
    ]
  },
  {
    key: "notification_tone",
    type: "single_choice",
    title: "조용한 알림으로 다시 닿아와도 괜찮을까요?",
    options: [
      {
        key: "off",
        label: "지금은 알림 없이 둘러볼래요",
        seedPatch: { notificationTone: "off" }
      },
      {
        key: "quiet",
        label: "가끔만 잔잔하게 알려 주세요",
        seedPatch: { notificationTone: "quiet" }
      },
      {
        key: "balanced",
        label: "필요할 때는 알려 주세요",
        seedPatch: { notificationTone: "balanced" }
      }
    ]
  },
  {
    key: "rest_affinity",
    type: "single_choice",
    title: "가끔 파도에서 벗어나 쉬는 기능이 있으면 좋을까요?",
    options: [
      { key: "high", label: "자주 쓸 것 같아요", seedPatch: { restModeAffinity: "high" } },
      {
        key: "medium",
        label: "가끔 필요할 것 같아요",
        seedPatch: { restModeAffinity: "medium" }
      },
      { key: "low", label: "아직은 모르겠어요", seedPatch: { restModeAffinity: "low" } }
    ]
  },
  {
    key: "relationship_detail",
    type: "single_choice",
    title: "관계 이야기라면 어떤 결이 더 가깝나요?",
    subtitle: "선택 질문이에요.",
    allowSkip: true,
    branchRules: [{ questionKey: "primary_topic", anyOf: ["relationships"] }],
    options: [
      { key: "distance", label: "멀어진 거리감", seedPatch: { emotions: { grief: 1 } } },
      {
        key: "misunderstanding",
        label: "오해와 엇갈림",
        seedPatch: { emotions: { frustration: 1 } }
      },
      {
        key: "breakup",
        label: "끝난 관계",
        seedPatch: { emotions: { grief: 2, isolation: 1 } }
      }
    ]
  },
  {
    key: "stimulation_sensitivity",
    type: "scale",
    title: "지금은 얼마나 잔잔한 흐름이 편한가요?",
    subtitle: "1은 조금 더 열어 둔 상태, 5는 아주 잔잔한 상태예요.",
    min: 1,
    max: 5,
    step: 1,
    allowSkip: true,
    branchRules: [{ questionKey: "exposure_tolerance", anyOf: ["low"] }]
  }
];

function normalizeAnswerValue(value: OnboardingAnswer["value"]) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return [value];
  }

  return [];
}

function shouldIncludeQuestion(question: OnboardingQuestion, answers: OnboardingAnswer[]) {
  if (!question.branchRules?.length) {
    return true;
  }

  return question.branchRules.every((rule) => {
    const answer = answers.find((entry) => entry.questionKey === rule.questionKey);
    const values = normalizeAnswerValue(answer?.value ?? null);
    return values.some((value) => rule.anyOf.includes(value));
  });
}

export function getActiveOnboardingQuestions(answers: OnboardingAnswer[] = []) {
  return onboardingQuestions.filter((question) => shouldIncludeQuestion(question, answers));
}

export function buildSeedProfile(answers: OnboardingAnswer[]): OnboardingSeedProfile {
  const profile: OnboardingSeedProfile = {
    topicWeights: {},
    emotionWeights: {},
    preferredWaveTone: "mixed",
    exposureTolerance: "medium",
    privacyPreference: "anonymous",
    restModeAffinity: "medium",
    notificationTone: "balanced",
    readingPreference: "mixed",
    empathyPreference: "quiet"
  };

  for (const answer of answers) {
    if (answer.skipped || answer.value === null) {
      continue;
    }

    const question = onboardingQuestions.find((item) => item.key === answer.questionKey);
    if (!question) {
      continue;
    }

    const values = normalizeAnswerValue(answer.value);

    for (const value of values) {
      const option = question.options?.find((item) => item.key === value);
      if (!option?.seedPatch) {
        continue;
      }

      for (const [topic, weight] of Object.entries(option.seedPatch.topics ?? {})) {
        profile.topicWeights[topic as keyof typeof profile.topicWeights] =
          (profile.topicWeights[topic as keyof typeof profile.topicWeights] ?? 0) + (weight ?? 0);
      }

      for (const [emotion, weight] of Object.entries(option.seedPatch.emotions ?? {})) {
        profile.emotionWeights[emotion as keyof typeof profile.emotionWeights] =
          (profile.emotionWeights[emotion as keyof typeof profile.emotionWeights] ?? 0) +
          (weight ?? 0);
      }

      profile.preferredWaveTone =
        option.seedPatch.preferredWaveTone ?? profile.preferredWaveTone;
      profile.exposureTolerance =
        option.seedPatch.exposureTolerance ?? profile.exposureTolerance;
      profile.privacyPreference =
        option.seedPatch.privacyPreference ?? profile.privacyPreference;
      profile.restModeAffinity = option.seedPatch.restModeAffinity ?? profile.restModeAffinity;
      profile.notificationTone = option.seedPatch.notificationTone ?? profile.notificationTone;
      profile.readingPreference = option.seedPatch.readingPreference ?? profile.readingPreference;
      profile.empathyPreference = option.seedPatch.empathyPreference ?? profile.empathyPreference;
    }

    if (answer.questionKey === "stimulation_sensitivity" && typeof answer.value === "number") {
      if (answer.value >= 4) {
        profile.exposureTolerance = "low";
        profile.restModeAffinity = "high";
      } else if (answer.value <= 2) {
        profile.exposureTolerance = "high";
        profile.restModeAffinity = "low";
      }
    }
  }

  return profile;
}
