import type { ContentGuardrailReason } from "@/lib/domain/types";

export const contentGuardrailProfanityTerms = [
  "시발",
  "씨발",
  "병신",
  "개새끼",
  "좆",
  "fuck",
  "bitch"
] as const;

export const contentGuardrailHighRiskTerms = [
  "죽고싶",
  "죽고 싶",
  "자해",
  "suicide",
  "self-harm"
] as const;

export const contentGuardrailDefaultAllowlist: Partial<Record<ContentGuardrailReason, string[]>> = {
  profanity: [],
  high_risk_keyword: []
};
