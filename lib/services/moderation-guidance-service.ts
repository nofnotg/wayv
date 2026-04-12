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
      title: "파도지기가 잠깐 곁에 섰어요",
      description:
        "wayv에서는 누군가를 고치려는 말보다 먼저 함께 머무는 말을 지켜요. 조언보다 지금 느낀 마음에 가까운 표현으로 다시 남겨 주세요."
    },
    {
      title: "조언보다 공감에 더 가까워지면 좋아요",
      description:
        "이 공간은 답을 주기보다 마음을 알아보는 쪽에 가까워요. 방향을 제시하는 말 대신 곁을 지키는 말로 다시 남겨 주세요."
    }
  ],
  ridicule_or_mockery: [
    {
      title: "비웃는 결은 잠시 내려둘게요",
      description:
        "wayv에서는 누군가를 가볍게 다루거나 웃음거리로 만드는 말이 이어지지 않도록 지켜요. 조용한 인정에 더 가까운 표현으로 다시 남겨 주세요."
    },
    {
      title: "이 공간의 결을 다시 맞춰 볼게요",
      description:
        "조롱처럼 들리는 표현은 마음을 더 닫게 만들 수 있어요. 상대를 낮추지 않는 말로 다시 남겨 주시면 더 잘 어울려요."
    }
  ],
  blame_or_attack: [
    {
      title: "누구의 잘못인지 가르는 말은 잠시 멈출게요",
      description:
        "wayv에서는 공격이나 단정 대신, 겪은 마음을 나누는 표현을 먼저 지켜요. 비난보다 경험에 가까운 문장으로 다시 남겨 주세요."
    },
    {
      title: "날카로운 겨냥보다 마음의 자리로 돌아가 볼게요",
      description:
        "상대를 몰아세우는 말은 이 공간의 호흡과 잘 맞지 않아요. 책임을 겨누기보다 내가 느낀 장면 쪽으로 다시 적어 주세요."
    }
  ],
  profanity_or_harsh_tone: [
    {
      title: "거친 결은 조금만 낮춰 볼게요",
      description:
        "마음이 거칠어진 순간이라는 건 이해해요. 다만 너무 날카로운 표현은 대화를 닫게 해서, 조금 덜 아픈 말로 다시 남겨 주세요."
    },
    {
      title: "세게 밀어내는 말은 잠시 쉬어 갈게요",
      description:
        "wayv에서는 서로를 버티게 하는 말투를 먼저 지켜요. 거친 표현을 줄인 문장으로 다시 남겨 주시면 더 잘 머물 수 있어요."
    }
  ],
  privacy_exposure: [
    {
      title: "개인 정보는 이 공간 밖으로 새지 않게 지킬게요",
      description:
        "전화번호, 메일, 외부 연락 단서처럼 바로 이어질 수 있는 정보는 남길 수 없어요. 그런 정보는 빼고 다시 남겨 주세요."
    },
    {
      title: "바깥 연결 정보는 잠시 멈출게요",
      description:
        "wayv 안에서는 서로를 외부 채널로 끌어내지 않는 것을 기본으로 지켜요. 연락 단서를 제외한 문장으로 다시 남겨 주세요."
    }
  ],
  crisis_signal: [
    {
      title: "지금은 안전 확인을 먼저 할게요",
      description:
        "이 문장은 운영자가 먼저 조용히 확인할게요. 혼자 버티고 있다면 지금 있는 곳에서 바로 도움을 부를 수 있는 사람이나 지역 긴급 지원과 먼저 연결해 주세요."
    },
    {
      title: "파도지기가 먼저 안전 쪽을 살펴볼게요",
      description:
        "지금은 응답보다 안전이 먼저라서 이 문장을 바로 노출하지 않고 확인할게요. 주변의 믿을 수 있는 사람이나 긴급 지원에 바로 닿는 쪽을 먼저 권할게요."
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
