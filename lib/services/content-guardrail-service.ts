import type {
  ContentGuardrailAction,
  ContentGuardrailFlag,
  ContentGuardrailReason,
  ContentGuardrailResult
} from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  contentGuardrailDefaultAllowlist,
  contentGuardrailHighRiskTerms,
  contentGuardrailProfanityTerms
} from "@/lib/services/content-guardrail-config";

function unique(values: string[]) {
  return [...new Set(values)];
}

function clipExcerpt(input: string) {
  return input.trim().slice(0, 140) || null;
}

function isAllowlisted(
  reason: ContentGuardrailReason,
  term: string,
  allowlist?: Partial<Record<ContentGuardrailReason, string[]>>
) {
  const configured = allowlist?.[reason] ?? contentGuardrailDefaultAllowlist[reason] ?? [];
  return configured.some((item) => item.trim().toLowerCase() === term.trim().toLowerCase());
}

export function evaluateContentGuardrail(input: {
  body: string;
  allowlist?: Partial<Record<ContentGuardrailReason, string[]>>;
}): ContentGuardrailResult {
  const body = input.body.trim();
  const lowered = body.toLowerCase();
  const reasons: ContentGuardrailReason[] = [];
  const matchedTerms: string[] = [];

  for (const term of contentGuardrailProfanityTerms) {
    if (lowered.includes(term.toLowerCase()) && !isAllowlisted("profanity", term, input.allowlist)) {
      reasons.push("profanity");
      matchedTerms.push(term);
    }
  }

  for (const term of contentGuardrailHighRiskTerms) {
    if (
      lowered.includes(term.toLowerCase()) &&
      !isAllowlisted("high_risk_keyword", term, input.allowlist)
    ) {
      reasons.push("high_risk_keyword");
      matchedTerms.push(term);
    }
  }

  if (/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(body) || /01\d[- ]?\d{3,4}[- ]?\d{4}/.test(body)) {
    reasons.push("contact_info");
    matchedTerms.push("contact-pattern");
  }

  if (/https?:\/\/\S+/i.test(body) || /www\.\S+/i.test(body)) {
    reasons.push("spam_link");
    matchedTerms.push("link-pattern");
  }

  if (/(.)\1{7,}/u.test(body)) {
    reasons.push("repeated_characters");
    matchedTerms.push("repeated-char");
  }

  const tokens = body
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const tokenCounts = new Map<string, number>();
  for (const token of tokens) {
    tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);
  }

  if ([...tokenCounts.values()].some((count) => count >= 5)) {
    reasons.push("repeated_tokens");
    matchedTerms.push("repeated-token");
  }

  const dedupedReasons = unique(reasons) as ContentGuardrailReason[];
  const dedupedTerms = unique(matchedTerms);

  let action: ContentGuardrailAction = "allow";
  if (
    dedupedReasons.includes("contact_info") ||
    dedupedReasons.includes("spam_link") ||
    dedupedReasons.includes("repeated_characters") ||
    dedupedReasons.includes("repeated_tokens")
  ) {
    action = "block";
  } else if (dedupedReasons.length > 0) {
    action = "allow_but_flag";
  }

  return {
    action,
    reasons: dedupedReasons,
    matchedTerms: dedupedTerms,
    contentExcerpt: clipExcerpt(body)
  };
}

type ContentGuardrailFlagRow = Record<string, unknown>;

function mapContentGuardrailFlagRow(row: ContentGuardrailFlagRow): ContentGuardrailFlag {
  return {
    id: String(row.id),
    targetType: row.target_type as ContentGuardrailFlag["targetType"],
    targetId: (row.target_id as string | null) ?? null,
    userId: (row.user_id as string | null) ?? null,
    action: row.action as Extract<ContentGuardrailAction, "block" | "allow_but_flag">,
    reasons: ((row.reasons as string[] | null) ?? []) as ContentGuardrailReason[],
    matchedTerms: (row.matched_terms as string[] | null) ?? [],
    contentExcerpt: (row.content_excerpt as string | null) ?? null,
    createdAt: String(row.created_at)
  };
}

export async function recordContentGuardrailFlag(input: {
  targetType: "post" | "comment";
  targetId?: string | null;
  userId?: string | null;
  action: Extract<ContentGuardrailAction, "block" | "allow_but_flag">;
  reasons: ContentGuardrailReason[];
  matchedTerms: string[];
  contentExcerpt?: string | null;
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
      content_excerpt: input.contentExcerpt ?? null
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
  action?: Extract<ContentGuardrailAction, "block" | "allow_but_flag"> | null;
  targetType?: ContentGuardrailFlag["targetType"] | null;
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
  const byAction = new Map<Extract<ContentGuardrailAction, "block" | "allow_but_flag">, number>();
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
