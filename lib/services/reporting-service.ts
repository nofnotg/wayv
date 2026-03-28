import { revalidatePath } from "next/cache";

import type {
  ModerationReport,
  ModerationReportReason,
  ModerationReportTargetType
} from "@/lib/domain/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { moderationReportSchema } from "@/lib/validation/schemas";

async function ensureReportTargetExists(
  targetType: ModerationReportTargetType,
  targetId: string
) {
  const supabase = await createServerSupabaseClient();

  if (targetType === "post") {
    const { data } = await supabase.from("wave_posts").select("id").eq("id", targetId).single();
    return Boolean(data?.id);
  }

  const { data } = await supabase.from("wave_comments").select("id").eq("id", targetId).single();
  return Boolean(data?.id);
}

export async function createModerationReport(
  input: {
    reasonKey: ModerationReportReason;
    note?: string | null;
  },
  targetType: ModerationReportTargetType,
  targetId: string,
  reporterUserId: string
): Promise<ModerationReport> {
  const parsed = moderationReportSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("invalid-report");
  }

  const exists = await ensureReportTargetExists(targetType, targetId);
  if (!exists) {
    throw new Error("target-not-found");
  }

  const supabase = await createServerSupabaseClient();
  const existing = await supabase
    .from("moderation_reports")
    .select("*")
    .eq("reporter_user_id", reporterUserId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("reason_key", parsed.data.reasonKey)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  if (existing.data) {
    return {
      id: String(existing.data.id),
      reporterUserId: String(existing.data.reporter_user_id),
      targetType: existing.data.target_type,
      targetId: String(existing.data.target_id),
      reasonKey: existing.data.reason_key,
      note: existing.data.note,
      createdAt: String(existing.data.created_at)
    };
  }

  const { data, error } = await supabase
    .from("moderation_reports")
    .insert({
      reporter_user_id: reporterUserId,
      target_type: targetType,
      target_id: targetId,
      reason_key: parsed.data.reasonKey,
      note: parsed.data.note?.trim() ? parsed.data.note.trim() : null
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "report-failed");
  }

  revalidatePath("/");
  return {
    id: String(data.id),
    reporterUserId: String(data.reporter_user_id),
    targetType: data.target_type,
    targetId: String(data.target_id),
    reasonKey: data.reason_key,
    note: data.note,
    createdAt: String(data.created_at)
  };
}
