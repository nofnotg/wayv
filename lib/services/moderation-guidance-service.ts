import type {
  ContentGuardrailGuidance,
  ContentGuardrailGuidanceFamily,
  ContentGuardrailReason,
  ContentGuardrailTargetType
} from "@/lib/domain/types";

type GuidanceTemplate = {
  title: string;
  description: string;
};

const waveKeeperTemplates: Record<ContentGuardrailGuidanceFamily, GuidanceTemplate[]> = {
  advice_or_preaching: [
    {
      title: "파도지기가 공감 쪽으로 결을 맞춰 볼게요",
      description:
        "wayv에서는 해결책보다 지금의 마음을 알아보는 말이 더 잘 어울려요. 조언을 건네기보다 함께 머무는 표현으로 한 번 더 남겨 주세요."
    },
    {
      title: "답을 주기보다 곁에 서는 말이 더 가까워요",
      description:
        "무엇을 해야 한다고 이끌기보다, 어떤 마음이었는지 조용히 짚어 주는 문장이 이 공간의 톤과 더 잘 맞아요."
    }
  ],
  ridicule_or_mockery: [
    {
      title: "조금 더 다치지 않는 말로 이어 볼게요",
      description:
        "비웃거나 가볍게 다루는 결이 섞이면 wayv의 조용한 공감이 흐려질 수 있어요. 상대를 낮추지 않는 표현으로 다시 남겨 주세요."
    },
    {
      title: "웃음거리보다 이해에 가까운 말이 좋아요",
      description:
        "누군가를 가볍게 만드는 문장보다, 마음의 결을 알아보는 말이 이 공간과 더 잘 어울려요."
    }
  ],
  blame_or_attack: [
    {
      title: "대상을 겨누기보다 경험 쪽으로 옮겨 볼게요",
      description:
        "누가 잘못했는지를 강하게 가리키는 말보다, 내가 무엇을 겪었는지에 가까운 문장이 wayv의 방향과 더 잘 맞아요."
    },
    {
      title: "비난보다 경험의 무게를 남겨 주세요",
      description:
        "공격적인 단정은 다른 사람을 움츠리게 할 수 있어요. 판단보다 경험과 감정 쪽으로 문장을 옮겨 주세요."
    }
  ],
  profanity_or_harsh_tone: [
    {
      title: "거친 결을 조금만 낮춰서 이어 볼게요",
      description:
        "지금 마음이 거칠 수 있다는 점은 이해하고 있어요. 다만 더 부드러운 말로 남겨 주면 다른 사람도 덜 놀라며 함께 머물 수 있어요."
    },
    {
      title: "날카로운 표현을 조금만 가라앉혀 주세요",
      description:
        "감정의 크기는 그대로 두어도 괜찮아요. 표현의 온도만 조금 낮추면 wayv의 조용한 흐름 안에서 더 잘 이어질 수 있어요."
    }
  ],
  privacy_exposure: [
    {
      title: "연락 정보는 바깥에 남겨 두지 않을게요",
      description:
        "전화번호, 메일, 외부 연락 단서가 들어가면 이 공간의 안전이 흐려질 수 있어요. 그런 정보는 빼고 다시 남겨 주세요."
    },
    {
      title: "개인정보 없이도 마음은 충분히 전해질 수 있어요",
      description:
        "직접 연결되는 정보는 wayv 안에 남기지 않는 쪽을 기본으로 지켜요. 연락 단서는 덜어내고 문장을 다시 정리해 주세요."
    }
  ],
  crisis_signal: [
    {
      title: "이 문장은 파도지기가 먼저 조용히 살펴볼게요",
      description:
        "지금은 응답보다 안전을 먼저 살피는 쪽이 맞다고 판단했어요. 혼자 버티고 있다면 현재 있는 곳의 긴급 도움이나 가까운 지원 자원과 바로 연결해 주세요."
    },
    {
      title: "지금은 안전 확인이 먼저예요",
      description:
        "이 표현은 운영 쪽에서 먼저 확인해 볼게요. 즉시 도움이 필요하다고 느껴진다면 지역 응급 자원이나 신뢰할 수 있는 가까운 사람에게 바로 닿아 주세요."
    }
  ]
};

function pickGuidanceFamily(reasons: ContentGuardrailReason[]): ContentGuardrailGuidanceFamily | null {
  if (reasons.includes("crisis_signal")) {
    return "crisis_signal";
  }
  if (reasons.includes("privacy_exposure") || reasons.includes("spam_or_external_pull")) {
    return "privacy_exposure";
  }
  if (reasons.includes("ridicule_or_mockery")) {
    return "ridicule_or_mockery";
  }
  if (reasons.includes("blame_or_attack")) {
    return "blame_or_attack";
  }
  if (reasons.includes("unsolicited_advice")) {
    return "advice_or_preaching";
  }
  if (reasons.includes("explicit_profanity") || reasons.includes("harsh_tone")) {
    return "profanity_or_harsh_tone";
  }

  return null;
}

function hashVariantKey(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 2147483647;
  }

  return Math.abs(hash);
}

export function buildWaveKeeperGuidance(input: {
  reasons: ContentGuardrailReason[];
  userId?: string | null;
  text: string;
  targetType: ContentGuardrailTargetType;
}): ContentGuardrailGuidance | null {
  const family = pickGuidanceFamily(input.reasons);
  if (!family) {
    return null;
  }

  const templates = waveKeeperTemplates[family];
  const seed = `${input.userId ?? "guest"}:${input.targetType}:${input.text.trim().length}:${family}`;
  const template = templates[hashVariantKey(seed) % templates.length];

  return {
    persona: "wave_keeper",
    family,
    title: template.title,
    description: template.description
  };
}
