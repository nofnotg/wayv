import type { BetaFeedback, BetaFeedbackCategory } from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { feedbackSubmissionSchema } from "@/lib/validation/schemas";

import { recordProductEventSafe } from "@/lib/services/product-event-service";

type BetaFeedbackRow = Record<string, unknown>;

function mapBetaFeedbackRow(row: BetaFeedbackRow): BetaFeedback {
  return {
    id: String(row.id),
    userId: (row.user_id as string | null) ?? null,
    category: row.category as BetaFeedbackCategory,
    message: String(row.message),
    pagePath: (row.page_path as string | null) ?? null,
    contactEmail: (row.contact_email as string | null) ?? null,
    createdAt: String(row.created_at)
  };
}

export async function submitBetaFeedback(
  input: {
    category: BetaFeedbackCategory;
    message: string;
    pagePath?: string | null;
    contactEmail?: string | null;
  },
  userId?: string | null
) {
  const parsed = feedbackSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("invalid-feedback");
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("beta_feedback")
    .insert({
      user_id: userId ?? null,
      category: parsed.data.category,
      message: parsed.data.message,
      page_path: parsed.data.pagePath ?? null,
      contact_email: parsed.data.contactEmail ?? null
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "feedback-submit-failed");
  }

  await recordProductEventSafe({
    userId: userId ?? null,
    eventKey: "feedback_submitted",
    targetType: "beta_feedback",
    targetId: String(data.id),
    metadata: {
      category: parsed.data.category,
      pagePath: parsed.data.pagePath ?? null
    }
  });

  return mapBetaFeedbackRow(data);
}

export async function listRecentBetaFeedback(limit = 20) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("beta_feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapBetaFeedbackRow(row));
}

export function summarizeBetaFeedback(feedback: BetaFeedback[]) {
  const byCategory = new Map<BetaFeedbackCategory, number>();

  for (const item of feedback) {
    byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1);
  }

  return [...byCategory.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category));
}
