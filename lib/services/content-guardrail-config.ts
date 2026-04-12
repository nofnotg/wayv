import type { ContentGuardrailReason } from "@/lib/domain/types";

export const contentGuardrailExplicitProfanityTerms = [
  "시발",
  "씨발",
  "씨팔",
  "병신",
  "개새끼",
  "지랄",
  "fuck",
  "fucking",
  "bitch"
] as const;

export const contentGuardrailRidiculeTerms = [
  "한심",
  "꼴값",
  "웃기네",
  "비웃",
  "조롱",
  "비꼬"
] as const;

export const contentGuardrailBlameTerms = [
  "네 탓",
  "니 탓",
  "너 때문",
  "당신 때문",
  "네가 잘못",
  "니가 잘못"
] as const;

export const contentGuardrailAdviceTerms = [
  "정신 차려",
  "버텨",
  "참아",
  "잊어",
  "그만해",
  "해라",
  "해야지",
  "해야 돼"
] as const;

export const contentGuardrailCrisisTerms = [
  "죽고 싶",
  "죽고싶",
  "사라지고 싶",
  "사라지고싶",
  "자해",
  "ㅈㅅ",
  "극단적 선택",
  "suicide",
  "self-harm"
] as const;

export const contentGuardrailExternalPullTerms = [
  "카톡",
  "오픈채팅",
  "오픈 채팅",
  "dm",
  "디엠",
  "텔레그램",
  "인스타",
  "번호로",
  "follow me"
] as const;

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
