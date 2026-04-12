import type {
  ContentGuardrailAction,
  ContentGuardrailGuidanceFamily,
  ContentGuardrailReason,
  ContentGuardrailTargetType,
  ModerationFeedback,
  ModerationFeedbackChoice
} from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  moderationFeedbackReviewQuerySchema,
  moderationFeedbackSubmissionSchema
} from "@/lib/validation/schemas";

type ModerationFeedbackRow = Record<string, unknown>;

function mapModerationFeedbackRow(row: ModerationFeedbackRow): ModerationFeedback {
  return {
    id: String(row.id),
    userId: (row.user_id as string | null) ?? null,
    targetType: row.target_type as ContentGuardrailTargetType,
    targetId: (row.target_id as string | null) ?? null,
    action: row.action as Exclude<ContentGuardrailAction, "allow">,
    reasons: ((row.reasons as string[] | null) ?? []) as ContentGuardrailReason[],
    guidanceFamily: (row.guidance_family as ContentGuardrailGuidanceFamily | null) ?? null,
    choice: row.choice as ModerationFeedbackChoice,
    freeText: (row.free_text as string | null) ?? null,
    path: (row.path as string | null) ?? null,
    retryAttempted: Boolean(row.retry_attempted),
    retrySucceeded:
      typeof row.retry_succeeded === "boolean" ? (row.retry_succeeded as boolean) : null,
    userLabel: (row.user_id as string | null) ?? null,
    createdAt: String(row.created_at)
  };
}

export async function submitModerationFeedback(
  input: {
    targetType: ContentGuardrailTargetType;
    targetId?: string | null;
    action: Exclude<ContentGuardrailAction, "allow">;
    reasons: ContentGuardrailReason[];
    guidanceFamily?: ContentGuardrailGuidanceFamily | null;
    choice: ModerationFeedbackChoice;
    freeText?: string | null;
    path?: string | null;
    retryAttempted?: boolean;
    retrySucceeded?: boolean | null;
  },
  userId?: string | null
) {
  const parsed = moderationFeedbackSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("invalid-moderation-feedback");
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("moderation_feedback")
    .insert({
      user_id: userId ?? null,
      target_type: parsed.data.targetType,
      target_id: parsed.data.targetId ?? null,
      action: parsed.data.action,
      reasons: parsed.data.reasons,
      guidance_family: parsed.data.guidanceFamily ?? null,
      choice: parsed.data.choice,
      free_text: parsed.data.freeText ?? null,
      path: parsed.data.path ?? null,
      retry_attempted: parsed.data.retryAttempted ?? false,
      retry_succeeded: parsed.data.retrySucceeded ?? null
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "moderation-feedback-submit-failed");
  }

  return mapModerationFeedbackRow(data);
}

type ModerationFeedbackListFilters = Omit<
  import("zod").infer<typeof moderationFeedbackReviewQuerySchema>,
  "format"
>;

export async function listModerationFeedback(filters?: ModerationFeedbackListFilters) {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("moderation_feedback")
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

  if (filters?.userId) {
    query = query.eq("user_id", filters.userId);
  }

  if (typeof filters?.hasFreeText === "boolean") {
    query = filters.hasFreeText ? query.not("free_text", "is", null) : query.is("free_text", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapModerationFeedbackRow(row));
}

export async function listRecentModerationFeedback(limit = 20) {
  return listModerationFeedback({ limit });
}
