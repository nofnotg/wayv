import { revalidatePath } from "next/cache";

import type {
  ModerationAuditLog,
  ModerationReportListItem,
  ModerationStatus
} from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

import { refreshWaveSnapshot } from "@/lib/services/wave-state-service";

function mapReportRow(row: Record<string, unknown>): ModerationReportListItem {
  return {
    id: String(row.id),
    reporterUserId: String(row.reporter_user_id),
    targetType: row.target_type as ModerationReportListItem["targetType"],
    targetId: String(row.target_id),
    reasonKey: row.reason_key as ModerationReportListItem["reasonKey"],
    note: (row.note as string | null) ?? null,
    createdAt: String(row.created_at),
    targetStatus: (row.target_status as ModerationStatus | null) ?? null
  };
}

function mapAuditRow(row: Record<string, unknown>): ModerationAuditLog {
  return {
    id: String(row.id),
    targetType: row.target_type as ModerationAuditLog["targetType"],
    targetId: String(row.target_id),
    previousStatus: row.previous_status as ModerationStatus,
    nextStatus: row.next_status as ModerationStatus,
    actorLabel: String(row.actor_label),
    createdAt: String(row.created_at)
  };
}

async function insertModerationAuditLog(input: {
  targetType: ModerationAuditLog["targetType"];
  targetId: string;
  previousStatus: ModerationStatus;
  nextStatus: ModerationStatus;
  actorLabel: string;
}) {
  if (input.previousStatus === input.nextStatus) {
    return null;
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("moderation_audit_logs")
    .insert({
      target_type: input.targetType,
      target_id: input.targetId,
      previous_status: input.previousStatus,
      next_status: input.nextStatus,
      actor_label: input.actorLabel
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "moderation-audit-failed");
  }

  return mapAuditRow(data as Record<string, unknown>);
}

export async function listModerationReports(limit = 50): Promise<ModerationReportListItem[]> {
  const supabase = createAdminSupabaseClient();
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const { data, error } = await supabase
    .from("moderation_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  if (!rows.length) {
    return [];
  }

  const postIds = rows.filter((row) => row.target_type === "post").map((row) => String(row.target_id));
  const commentIds = rows
    .filter((row) => row.target_type === "comment")
    .map((row) => String(row.target_id));

  const [postStatuses, commentStatuses] = await Promise.all([
    postIds.length
      ? supabase.from("wave_posts").select("id, moderation_status").in("id", postIds)
      : Promise.resolve({ data: [] as { id: string; moderation_status: ModerationStatus }[], error: null }),
    commentIds.length
      ? supabase.from("wave_comments").select("id, moderation_status").in("id", commentIds)
      : Promise.resolve({ data: [] as { id: string; moderation_status: ModerationStatus }[], error: null })
  ]);

  if (postStatuses.error) {
    throw new Error(postStatuses.error.message);
  }
  if (commentStatuses.error) {
    throw new Error(commentStatuses.error.message);
  }

  const statusMap = new Map<string, ModerationStatus>();
  for (const row of postStatuses.data ?? []) {
    statusMap.set(`post:${row.id}`, row.moderation_status);
  }
  for (const row of commentStatuses.data ?? []) {
    statusMap.set(`comment:${row.id}`, row.moderation_status);
  }

  return rows.map((row) =>
    mapReportRow({
      ...row,
      target_status: statusMap.get(`${row.target_type}:${String(row.target_id)}`) ?? null
    })
  );
}

export async function listModerationAuditLogs(limit = 50): Promise<ModerationAuditLog[]> {
  const supabase = createAdminSupabaseClient();
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const { data, error } = await supabase
    .from("moderation_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapAuditRow(row as Record<string, unknown>));
}

export async function updatePostModerationStatus(
  postId: string,
  status: ModerationStatus,
  actorLabel = "internal-token"
) {
  const supabase = createAdminSupabaseClient();
  const { data: current, error: currentError } = await supabase
    .from("wave_posts")
    .select("id, moderation_status")
    .eq("id", postId)
    .single();

  if (currentError || !current) {
    throw new Error(currentError?.message ?? "post-not-found");
  }

  const previousStatus = current.moderation_status as ModerationStatus;
  if (previousStatus !== status) {
    const { error } = await supabase
      .from("wave_posts")
      .update({ moderation_status: status })
      .eq("id", postId);

    if (error) {
      throw new Error(error.message);
    }

    await insertModerationAuditLog({
      targetType: "post",
      targetId: postId,
      previousStatus,
      nextStatus: status,
      actorLabel
    });
  }

  revalidatePath("/");
  revalidatePath(`/wave/${postId}`);

  return {
    id: postId,
    status,
    previousStatus
  };
}

export async function updateCommentModerationStatus(
  commentId: string,
  status: ModerationStatus,
  actorLabel = "internal-token"
) {
  const supabase = createAdminSupabaseClient();
  const { data: current, error: currentError } = await supabase
    .from("wave_comments")
    .select("id, post_id, moderation_status")
    .eq("id", commentId)
    .single();

  if (currentError || !current) {
    throw new Error(currentError?.message ?? "comment-not-found");
  }

  const postId = String(current.post_id);
  const previousStatus = current.moderation_status as ModerationStatus;
  if (previousStatus !== status) {
    const { error } = await supabase
      .from("wave_comments")
      .update({ moderation_status: status })
      .eq("id", commentId);

    if (error) {
      throw new Error(error.message);
    }

    await insertModerationAuditLog({
      targetType: "comment",
      targetId: commentId,
      previousStatus,
      nextStatus: status,
      actorLabel
    });
  }

  await refreshWaveSnapshot(postId);
  revalidatePath("/");
  revalidatePath(`/wave/${postId}`);

  return {
    id: commentId,
    postId,
    status,
    previousStatus
  };
}
