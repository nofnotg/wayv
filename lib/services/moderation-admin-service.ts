import { revalidatePath } from "next/cache";

import type {
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

export async function updatePostModerationStatus(postId: string, status: ModerationStatus) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("wave_posts")
    .update({ moderation_status: status })
    .eq("id", postId)
    .select("id, moderation_status")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "post-not-found");
  }

  revalidatePath("/");
  revalidatePath(`/wave/${postId}`);

  return {
    id: String(data.id),
    status: data.moderation_status as ModerationStatus
  };
}

export async function updateCommentModerationStatus(commentId: string, status: ModerationStatus) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("wave_comments")
    .update({ moderation_status: status })
    .eq("id", commentId)
    .select("id, post_id, moderation_status")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "comment-not-found");
  }

  await refreshWaveSnapshot(String(data.post_id));
  revalidatePath("/");
  revalidatePath(`/wave/${String(data.post_id)}`);

  return {
    id: String(data.id),
    postId: String(data.post_id),
    status: data.moderation_status as ModerationStatus
  };
}
