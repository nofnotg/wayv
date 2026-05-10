import type {
  OnboardingAnswer,
  OnboardingQuestion,
  OnboardingSeedProfile,
  PublicProfileVisibility
} from "@/lib/domain/types";

const MAX_ONBOARDING_QUESTIONS = 5;

function visibilityPatch(value: PublicProfileVisibility) {
  return { privacyPreference: value } as const;
}

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    key: "primary_topic",
    order: 10,
    type: "single_choice",
    title: "요즘 마음이 자주 머무는 곳은 어디에 가까워요?",
    titleVariants: [
      "요즘 어떤 파도가 가장 자주 안쪽을 지나가나요?",
      "지금의 생활에서 가장 오래 남는 결은 어느 쪽인가요?"
    ],
    subtitle: "정확히 설명하지 않아도 괜찮아요. 가장 가까운 쪽만 골라 주세요.",
    options: [
      { key: "work", label: "일과 방향", seedPatch: { topics: { work: 3 } } },
      { key: "relationships", label: "사람과 거리", seedPatch: { topics: { relationships: 3 } } },
      { key: "daily_life", label: "하루의 리듬", seedPatch: { topics: { daily_life: 3 } } }
    ]
  },
  {
    key: "emotion_relief",
    order: 20,
    type: "single_choice",
    title: "읽고 난 뒤 조금 가벼워졌으면 하는 감정은 무엇에 가까워요?",
    titleVariants: [
      "다른 사람의 파도를 볼 때, 무엇이 조금 덜 혼자였으면 하나요?",
      "wayv가 조용히 받아주었으면 하는 감정은 어느 쪽인가요?"
    ],
    options: [
      { key: "isolation", label: "혼자 남은 느낌", seedPatch: { emotions: { isolation: 3 } } },
      { key: "anxiety", label: "앞이 흔들리는 느낌", seedPatch: { emotions: { anxiety: 3 } } },
      { key: "frustration", label: "말이 막히는 느낌", seedPatch: { emotions: { frustration: 3 } } }
    ]
  },
  {
    key: "preferred_tone",
    order: 30,
    type: "single_choice",
    title: "처음에는 어떤 온도의 파도가 편할까요?",
    titleVariants: [
      "지금 내게 너무 세지 않은 흐름은 어느 쪽일까요?",
      "처음 만나는 wayv가 어떤 거리였으면 하나요?"
    ],
    options: [
      {
        key: "quiet",
        label: "조용히 곁에 있는 느낌",
        seedPatch: { preferredWaveTone: "quiet", empathyPreference: "quiet" }
      },
      {
        key: "resonant",
        label: "내 이야기와 닿는 느낌",
        seedPatch: { preferredWaveTone: "resonant", empathyPreference: "shared" }
      },
      {
        key: "light",
        label: "가볍게 지나갈 수 있는 느낌",
        seedPatch: { preferredWaveTone: "light", empathyPreference: "gentle_prompt" }
      }
    ]
  },
  {
    key: "privacy_preference",
    order: 40,
    type: "single_choice",
    title: "처음의 나는 어느 정도로 드러나는 게 편할까요?",
    subtitle: "나중에 언제든 바꿀 수 있어요.",
    clarifyOnly: true,
    branchRules: [{ questionKey: "preferred_tone", anyOf: ["quiet", "light"] }],
    options: [
      {
        key: "anonymous",
        label: "익명으로 조용히",
        seedPatch: visibilityPatch("anonymous")
      },
      {
        key: "semi_anonymous",
        label: "별명 정도만",
        seedPatch: visibilityPatch("semi_anonymous")
      },
      {
        key: "nickname_visible",
        label: "닉네임은 보여도 괜찮아요",
        seedPatch: visibilityPatch("nickname_visible")
      }
    ]
  },
  {
    key: "relationship_detail",
    order: 50,
    type: "single_choice",
    title: "사람과 거리라면, 어느 결이 더 가까워요?",
    subtitle: "선택을 조금 더 분명하게 하기 위한 짧은 질문이에요.",
    allowSkip: true,
    clarifyOnly: true,
    branchRules: [{ questionKey: "primary_topic", anyOf: ["relationships"] }],
    options: [
      { key: "distance", label: "멀어진 거리", seedPatch: { emotions: { grief: 1 } } },
      {
        key: "misunderstanding",
        label: "오해와 어긋남",
        seedPatch: { emotions: { frustration: 1 } }
      },
      {
        key: "care",
        label: "아끼지만 어려운 마음",
        seedPatch: { emotions: { quiet_hope: 1 } }
      }
    ]
  },
  {
    key: "stimulation_sensitivity",
    order: 60,
    type: "scale",
    title: "지금은 얼마나 잔잔한 흐름이 편한가요?",
    subtitle: "1은 조금 더 열려 있음, 5는 아주 조용한 흐름이 필요한 상태예요.",
    min: 1,
    max: 5,
    step: 1,
    allowSkip: true,
    clarifyOnly: true,
    branchRules: [
      { questionKey: "preferred_tone", anyOf: ["quiet"] },
      { questionKey: "exposure_tolerance", anyOf: ["low"] }
    ]
  },
  {
    key: "notification_tone",
    order: 70,
    type: "single_choice",
    title: "다시 불러줄 때는 어느 정도가 편할까요?",
    allowSkip: true,
    clarifyOnly: true,
    branchRules: [{ questionKey: "preferred_tone", anyOf: ["resonant"] }],
    options: [
      { key: "off", label: "지금은 알림 없이", seedPatch: { notificationTone: "off" } },
      { key: "quiet", label: "가끔 조용히", seedPatch: { notificationTone: "quiet" } },
      { key: "balanced", label: "필요할 때는 알려주세요", seedPatch: { notificationTone: "balanced" } }
    ]
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

  return question.branchRules.some((rule) => {
    const answer = answers.find((entry) => entry.questionKey === rule.questionKey);
    const values = normalizeAnswerValue(answer?.value ?? null);
    return values.some((value) => rule.anyOf.includes(value));
  });
}

function stableIndex(seed: string, length: number) {
  if (length <= 0) {
    return 0;
  }

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash % length;
}

export function personalizeOnboardingQuestions(
  questions: OnboardingQuestion[],
  stableKey: string
) {
  return questions.map((question) => {
    const variants = [question.title, ...(question.titleVariants ?? [])];
    return {
      ...question,
      title: variants[stableIndex(`${stableKey}:${question.key}`, variants.length)]
    };
  });
}

export function getActiveOnboardingQuestions(
  answers: OnboardingAnswer[] = [],
  catalog: OnboardingQuestion[] = onboardingQuestions
) {
  return catalog
    .filter((question) => shouldIncludeQuestion(question, answers))
    .sort((left, right) => (left.order ?? 999) - (right.order ?? 999))
    .slice(0, MAX_ONBOARDING_QUESTIONS);
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
