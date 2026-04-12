import type {
  ContentGuardrailAction,
  ContentGuardrailFlag,
  ContentGuardrailGuidanceFamily,
  ContentGuardrailReason,
  ContentGuardrailResult,
  ContentGuardrailSeverity,
  ContentGuardrailTargetType
} from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  contentGuardrailAdviceTerms,
  contentGuardrailBlameTerms,
  contentGuardrailCrisisTerms,
  contentGuardrailDefaultAllowlist,
  contentGuardrailExplicitProfanityTerms,
  contentGuardrailExternalPullTerms,
  contentGuardrailRidiculeTerms
} from "@/lib/services/content-guardrail-config";
import { buildWaveKeeperGuidance } from "@/lib/services/moderation-guidance-service";

type GuardrailAllowlist = Partial<Record<ContentGuardrailReason, string[]>>;

type DetectedReason = {
  reason: ContentGuardrailReason;
  matchedTerm: string;
};

function unique(values: string[]) {
  return [...new Set(values)];
}

function clipExcerpt(input: string) {
  return input.trim().slice(0, 140) || null;
}

function compactText(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s\-_.,!?/\\()[\]{}<>|"'`~@#$%^&*+=:;]+/g, "");
}

function isAllowlisted(reason: ContentGuardrailReason, term: string, allowlist?: GuardrailAllowlist) {
  const configured = allowlist?.[reason] ?? contentGuardrailDefaultAllowlist[reason] ?? [];
  return configured.some((item) => item.trim().toLowerCase() === term.trim().toLowerCase());
}

function detectTerms(
  lowered: string,
  reason: ContentGuardrailReason,
  terms: readonly string[],
  allowlist?: GuardrailAllowlist
) {
  return terms
    .filter(
      (term) =>
        lowered.includes(term.toLowerCase()) && !isAllowlisted(reason, term, allowlist)
    )
    .map((term) => ({ reason, matchedTerm: term }));
}

function detectPrivacyExposure(
  body: string,
  allowlist?: GuardrailAllowlist
): DetectedReason[] {
  const hits: DetectedReason[] = [];

  if (/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(body)) {
    const matched = "email-pattern";
    if (!isAllowlisted("privacy_exposure", matched, allowlist)) {
      hits.push({ reason: "privacy_exposure", matchedTerm: matched });
    }
  }

  if (/01\d[- ]?\d{3,4}[- ]?\d{4}/.test(body)) {
    const matched = "phone-pattern";
    if (!isAllowlisted("privacy_exposure", matched, allowlist)) {
      hits.push({ reason: "privacy_exposure", matchedTerm: matched });
    }
  }

  return hits;
}

function detectExternalPull(
  body: string,
  lowered: string,
  allowlist?: GuardrailAllowlist
) {
  const hits = detectTerms(lowered, "spam_or_external_pull", contentGuardrailExternalPullTerms, allowlist);

  if (/https?:\/\/\S+/i.test(body) || /www\.\S+/i.test(body)) {
    const matched = "link-pattern";
    if (!isAllowlisted("spam_or_external_pull", matched, allowlist)) {
      hits.push({ reason: "spam_or_external_pull", matchedTerm: matched });
    }
  }

  return hits;
}

function detectHarshTone(body: string, allowlist?: GuardrailAllowlist) {
  const hits: DetectedReason[] = [];

  if (/(.)\1{5,}/u.test(body)) {
    const matched = "repeated-character-intensity";
    if (!isAllowlisted("harsh_tone", matched, allowlist)) {
      hits.push({ reason: "harsh_tone", matchedTerm: matched });
    }
  }

  if (/[!?]{4,}/.test(body)) {
    const matched = "punctuation-intensity";
    if (!isAllowlisted("harsh_tone", matched, allowlist)) {
      hits.push({ reason: "harsh_tone", matchedTerm: matched });
    }
  }

  return hits;
}

function detectEvasionPattern(body: string, compacted: string, allowlist?: GuardrailAllowlist) {
  const hits: DetectedReason[] = [];
  const evasiveCompactTerms = ["ㅅㅂ", "ㅄ", "tlqkf", "qudtls"];

  for (const term of evasiveCompactTerms) {
    if (compacted.includes(term) && !isAllowlisted("evasion_pattern", term, allowlist)) {
      hits.push({ reason: "evasion_pattern", matchedTerm: term });
    }
  }

  if (/([ㄱ-ㅎㅏ-ㅣa-z0-9])[\s._-]*([ㄱ-ㅎㅏ-ㅣa-z0-9])[\s._-]*([ㄱ-ㅎㅏ-ㅣa-z0-9]){1,}/i.test(body)) {
    const matched = "spaced-obfuscation";
    if (!isAllowlisted("evasion_pattern", matched, allowlist)) {
      hits.push({ reason: "evasion_pattern", matchedTerm: matched });
    }
  }

  return hits;
}

function getReasonSeverity(reason: ContentGuardrailReason): ContentGuardrailSeverity {
  switch (reason) {
    case "crisis_signal":
      return "critical";
    case "privacy_exposure":
    case "spam_or_external_pull":
    case "evasion_pattern":
      return "high";
    case "explicit_profanity":
    case "ridicule_or_mockery":
    case "blame_or_attack":
      return "medium";
    case "unsolicited_advice":
    case "harsh_tone":
      return "low";
  }
}

function getActionRank(action: ContentGuardrailAction) {
  switch (action) {
    case "hard_block":
      return 4;
    case "safety_hold":
      return 3;
    case "soft_hold":
      return 2;
    case "allow_with_guidance":
      return 1;
    case "allow":
      return 0;
  }
}

function resolveAction(
  reasons: ContentGuardrailReason[],
  targetType: ContentGuardrailTargetType
): Exclude<ContentGuardrailAction, "allow"> | null {
  if (reasons.includes("crisis_signal")) {
    return targetType === "comment_body" || targetType === "post_body"
      ? "safety_hold"
      : "safety_hold";
  }

  if (
    reasons.includes("privacy_exposure") ||
    reasons.includes("spam_or_external_pull") ||
    reasons.includes("evasion_pattern")
  ) {
    return "hard_block";
  }

  if (
    targetType === "comment_body" &&
    (reasons.includes("explicit_profanity") ||
      reasons.includes("ridicule_or_mockery") ||
      reasons.includes("blame_or_attack"))
  ) {
    return "soft_hold";
  }

  if (
    targetType === "post_body" &&
    reasons.includes("explicit_profanity") &&
    reasons.includes("blame_or_attack")
  ) {
    return "soft_hold";
  }

  if (
    reasons.includes("unsolicited_advice") ||
    reasons.includes("ridicule_or_mockery") ||
    reasons.includes("blame_or_attack") ||
    reasons.includes("explicit_profanity") ||
    reasons.includes("harsh_tone")
  ) {
    return "allow_with_guidance";
  }

  return null;
}

function getHighestSeverity(reasons: ContentGuardrailReason[]): ContentGuardrailSeverity {
  return reasons.reduce<ContentGuardrailSeverity>((current, reason) => {
    const next = getReasonSeverity(reason);
    const order: ContentGuardrailSeverity[] = ["low", "medium", "high", "critical"];
    return order.indexOf(next) > order.indexOf(current) ? next : current;
  }, "low");
}

export function evaluateContentGuardrail(input: {
  targetType: ContentGuardrailTargetType;
  text: string;
  userId?: string | null;
  allowlist?: GuardrailAllowlist;
}): ContentGuardrailResult {
  const text = input.text.trim();
  const lowered = text.toLowerCase();
  const compacted = compactText(text);

  const hits: DetectedReason[] = [
    ...detectTerms(
      lowered,
      "explicit_profanity",
      contentGuardrailExplicitProfanityTerms,
      input.allowlist
    ),
    ...detectTerms(lowered, "ridicule_or_mockery", contentGuardrailRidiculeTerms, input.allowlist),
    ...detectTerms(lowered, "blame_or_attack", contentGuardrailBlameTerms, input.allowlist),
    ...detectTerms(lowered, "unsolicited_advice", contentGuardrailAdviceTerms, input.allowlist),
    ...detectTerms(lowered, "crisis_signal", contentGuardrailCrisisTerms, input.allowlist),
    ...detectPrivacyExposure(text, input.allowlist),
    ...detectExternalPull(text, lowered, input.allowlist),
    ...detectHarshTone(text, input.allowlist),
    ...detectEvasionPattern(text, compacted, input.allowlist)
  ];

  const reasons = unique(hits.map((hit) => hit.reason)) as ContentGuardrailReason[];
  const matchedTerms = unique(hits.map((hit) => hit.matchedTerm));
  const suggestedAction = resolveAction(reasons, input.targetType);
  const action = suggestedAction ?? "allow";
  const severity = getHighestSeverity(reasons);

  return {
    targetType: input.targetType,
    action,
    severity,
    reasons,
    matchedTerms,
    contentExcerpt: clipExcerpt(text),
    suggestedAction,
    guidance:
      action === "allow"
        ? null
        : buildWaveKeeperGuidance({
            reasons,
            userId: input.userId ?? null,
            text,
            targetType: input.targetType
          })
  };
}

export function pickHighestPriorityGuardrailResult(results: ContentGuardrailResult[]) {
  return results.reduce<ContentGuardrailResult | null>((current, result) => {
    if (!current) {
      return result;
    }

    return getActionRank(result.action) > getActionRank(current.action) ? result : current;
  }, null);
}

type ContentGuardrailFlagRow = Record<string, unknown>;

function mapContentGuardrailFlagRow(row: ContentGuardrailFlagRow): ContentGuardrailFlag {
  return {
    id: String(row.id),
    targetType: row.target_type as ContentGuardrailTargetType,
    targetId: (row.target_id as string | null) ?? null,
    userId: (row.user_id as string | null) ?? null,
    action: row.action as Exclude<ContentGuardrailAction, "allow">,
    reasons: ((row.reasons as string[] | null) ?? []) as ContentGuardrailReason[],
    matchedTerms: (row.matched_terms as string[] | null) ?? [],
    contentExcerpt: (row.content_excerpt as string | null) ?? null,
    originalText: (row.original_text as string | null) ?? null,
    severity: row.severity as ContentGuardrailSeverity,
    suggestedAction: row.suggested_action as Exclude<ContentGuardrailAction, "allow">,
    guidanceFamily: (row.guidance_family as ContentGuardrailGuidanceFamily | null) ?? null,
    createdAt: String(row.created_at)
  };
}

export async function recordContentGuardrailFlag(input: {
  targetType: ContentGuardrailTargetType;
  targetId?: string | null;
  userId?: string | null;
  action: Exclude<ContentGuardrailAction, "allow">;
  reasons: ContentGuardrailReason[];
  matchedTerms: string[];
  contentExcerpt?: string | null;
  originalText?: string | null;
  severity: ContentGuardrailSeverity;
  suggestedAction: Exclude<ContentGuardrailAction, "allow">;
  guidanceFamily?: ContentGuardrailGuidanceFamily | null;
}) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("content_guardrail_flags")
    .insert({
      target_type: input.targetType,
      target_id: input.targetId ?? null,
      user_id: input.userId ?? null,
      action: input.action,
      reasons: input.reasons,
      matched_terms: input.matchedTerms,
      content_excerpt: input.contentExcerpt ?? null,
      original_text: input.originalText ?? null,
      severity: input.severity,
      suggested_action: input.suggestedAction,
      guidance_family: input.guidanceFamily ?? null
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "content-guardrail-flag-write-failed");
  }

  return mapContentGuardrailFlagRow(data);
}

export async function listRecentContentGuardrailFlags(limit = 20) {
  return listContentGuardrailFlags({
    limit
  });
}

export async function listContentGuardrailFlags(filters?: {
  limit?: number;
  dateFrom?: string | null;
  dateTo?: string | null;
  action?: Exclude<ContentGuardrailAction, "allow"> | null;
  targetType?: ContentGuardrailTargetType | null;
  reason?: ContentGuardrailReason | null;
}) {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("content_guardrail_flags")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(filters?.limit ?? 20, 200)));

  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }

  if (filters?.targetType) {
    query = query.eq("target_type", filters.targetType);
  }

  if (filters?.reason) {
    query = query.contains("reasons", [filters.reason]);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapContentGuardrailFlagRow(row));
}

export function summarizeContentGuardrailFlags(flags: ContentGuardrailFlag[]) {
  const byAction = new Map<string, number>();
  const byReason = new Map<ContentGuardrailReason, number>();

  for (const flag of flags) {
    byAction.set(flag.action, (byAction.get(flag.action) ?? 0) + 1);
    for (const reason of flag.reasons) {
      byReason.set(reason, (byReason.get(reason) ?? 0) + 1);
    }
  }

  return {
    byAction: [...byAction.entries()].map(([action, count]) => ({ action, count })),
    byReason: [...byReason.entries()].map(([reason, count]) => ({ reason, count }))
  };
}
