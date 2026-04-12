import guidanceSeed from "@/lib/wayv_wave_keeper_guidance_seed_v1.json";
import type {
  ContentGuardrailGuidance,
  ContentGuardrailGuidanceFamily,
  ContentGuardrailReason,
  ContentGuardrailTargetType
} from "@/lib/domain/types";

type GuidanceFamilySeed = {
  title_pool: string[];
  message_pool: string[];
};

type GuidanceTemplate = {
  title: string;
  description: string;
};

const familyFlowLead: Record<ContentGuardrailGuidanceFamily, string> = {
  advice_or_preaching: "이 흐름은 해결보다 곁에 머무는 말에 더 오래 남아요.",
  ridicule_or_mockery: "이 파도는 사람을 밀어내는 말보다 다정한 읽힘에 더 가까워져요.",
  blame_or_attack: "이 물결은 단정과 공격보다 마음의 결을 드러내는 말에 더 가까워져요.",
  profanity_or_harsh_tone: "이 흐름은 거친 가장자리보다 마음의 무게가 보이는 말에 더 오래 머물러요.",
  privacy_exposure: "이 해안은 바깥으로 닿는 식별자 없이도 충분히 이어질 수 있어요.",
  crisis_signal: ""
};

const guidanceFamilies = guidanceSeed.families as Record<
  ContentGuardrailGuidanceFamily,
  GuidanceFamilySeed
>;

const negativePhraseReplacementRules = guidanceSeed.negative_phrase_replacement_rules as Array<{
  avoid: string;
  prefer: string;
}>;

function softenGuidanceCopy(input: string) {
  return negativePhraseReplacementRules.reduce((current, rule) => {
    return current.split(rule.avoid).join(rule.prefer);
  }, input);
}

function buildTemplates(family: ContentGuardrailGuidanceFamily): GuidanceTemplate[] {
  const source = guidanceFamilies[family];
  const count = Math.max(source.title_pool.length, source.message_pool.length);
  const lead = familyFlowLead[family];

  return Array.from({ length: count }, (_, index) => ({
    title: softenGuidanceCopy(source.title_pool[index % source.title_pool.length]),
    description: [lead, softenGuidanceCopy(source.message_pool[index % source.message_pool.length])]
      .filter(Boolean)
      .join(" ")
  }));
}

const waveKeeperTemplates: Record<ContentGuardrailGuidanceFamily, GuidanceTemplate[]> = {
  advice_or_preaching: buildTemplates("advice_or_preaching"),
  ridicule_or_mockery: buildTemplates("ridicule_or_mockery"),
  blame_or_attack: buildTemplates("blame_or_attack"),
  profanity_or_harsh_tone: buildTemplates("profanity_or_harsh_tone"),
  privacy_exposure: buildTemplates("privacy_exposure"),
  crisis_signal: buildTemplates("crisis_signal")
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

function pickTemplatePool(
  templates: GuidanceTemplate[],
  targetType: ContentGuardrailTargetType
) {
  if (targetType === "comment_body" && templates.length > 1) {
    const midpoint = Math.ceil(templates.length / 2);
    return templates.slice(0, midpoint);
  }

  return templates;
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

  const templates = pickTemplatePool(waveKeeperTemplates[family], input.targetType);
  const seed = `${input.userId ?? "guest"}:${input.targetType}:${input.text.trim().length}:${family}`;
  const template = templates[hashVariantKey(seed) % templates.length];

  return {
    persona: "wave_keeper",
    family,
    title: template.title,
    description: template.description
  };
}
