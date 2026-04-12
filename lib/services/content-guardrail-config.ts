import normalizationSeed from "@/lib/wayv_normalization_seed_v1.json";
import type { ContentGuardrailReason } from "@/lib/domain/types";

type NormalizationSeedStage = "beta_minimum" | "expansion";

export type ContentGuardrailNormalizationSeedEntry = {
  canonical: string;
  reason: ContentGuardrailReason;
  family: string;
  variants: string[];
  regex: string | null;
  confidence: "low" | "medium" | "high";
  stage: NormalizationSeedStage;
  notes: string;
};

function uniqueTerms(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

const normalizationEntries =
  normalizationSeed.entries as ContentGuardrailNormalizationSeedEntry[];

function collectSeedTerms(
  reason: ContentGuardrailReason,
  stages: NormalizationSeedStage[]
) {
  return uniqueTerms(
    normalizationEntries
      .filter((entry) => entry.reason === reason && stages.includes(entry.stage))
      .flatMap((entry) => [entry.canonical, ...entry.variants])
  );
}

export const contentGuardrailNormalizationSeedVersion = normalizationSeed.version;
export const contentGuardrailNormalizationPipelineOrder =
  normalizationSeed.pipeline_order as string[];

export const contentGuardrailNormalizationBetaMinimumEntries = normalizationEntries.filter(
  (entry) => entry.stage === "beta_minimum"
);

export const contentGuardrailKeyboardLayoutPresets =
  normalizationSeed.keyboard_layout_presets;

export const contentGuardrailCrisisFastPathPatterns = uniqueTerms(
  normalizationSeed.crisis_fast_path.patterns as string[]
);

export const contentGuardrailExplicitProfanityTerms = uniqueTerms([
  ...collectSeedTerms("explicit_profanity", ["beta_minimum"]),
  "fuck",
  "fucking",
  "bitch",
  "shit",
  "지랄"
]);

export const contentGuardrailRidiculeTerms = uniqueTerms([
  "비웃다",
  "비웃네",
  "비웃음",
  "웃기네",
  "웃겨 죽겠네",
  "어이없어",
  "어이없네",
  "황당하네",
  "기가 차네"
]);

export const contentGuardrailBlameTerms = uniqueTerms([
  ...collectSeedTerms("blame_or_attack", ["beta_minimum"]),
  "네 탓",
  "니 탓",
  "너 때문",
  "당신 때문",
  "네 잘못",
  "니 잘못",
  "본인 탓"
]);

export const contentGuardrailAdviceTerms = uniqueTerms([
  "정신 차려",
  "정신 좀 차려",
  "버텨",
  "버텨야 해",
  "참아",
  "참아야지",
  "그냥 해",
  "그만해",
  "해라",
  "해야지",
  "해야 돼",
  "잊어"
]);

export const contentGuardrailCrisisTerms = uniqueTerms([
  ...collectSeedTerms("crisis_signal", ["beta_minimum"]),
  ...contentGuardrailCrisisFastPathPatterns
]);

export const contentGuardrailPrivacyTerms = uniqueTerms([
  ...collectSeedTerms("privacy_exposure", ["beta_minimum"]),
  "카톡",
  "카카오",
  "카카오id",
  "오픈채팅",
  "오카"
]);

export const contentGuardrailExternalPullTerms = uniqueTerms([
  ...collectSeedTerms("spam_or_external_pull", ["beta_minimum"]),
  "dm",
  "디엠",
  "인스타 dm",
  "ig dm",
  "telegram",
  "t.me/",
  "follow me"
]);

export const contentGuardrailDefaultAllowlist: Partial<
  Record<ContentGuardrailReason, string[]>
> = {
  privacy_exposure: [],
  spam_or_external_pull: [],
  explicit_profanity: [],
  ridicule_or_mockery: [],
  blame_or_attack: [],
  unsolicited_advice: [],
  harsh_tone: [],
  crisis_signal: [],
  evasion_pattern: []
};
