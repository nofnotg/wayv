import { revalidatePath } from "next/cache";

import type { WaveComment } from "@/lib/domain/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { commentSchema } from "@/lib/validation/schemas";

import { refreshWaveSnapshot } from "@/lib/services/wave-state-service";

function getAuthorLabel(userId: string, viewerId?: string | null) {
  if (viewerId && userId === viewerId) {
    return "내가 남긴 말";
  }

  return "익명의 파도";
}

export async function listCommentsForPost(postId: string, viewerId?: string | null) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("wave_comments")
    .select("*")
    .eq("post_id", postId)
    .eq("moderation_status", "active")
    .order("created_at", { ascending: true });

  return (data ?? []).map((row): WaveComment => ({
    id: String(row.id),
    postId: String(row.post_id),
    userId: String(row.user_id),
    body: String(row.body),
    moderationStatus: row.moderation_status,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    authorLabel: getAuthorLabel(String(row.user_id), viewerId),
    isMine: viewerId === String(row.user_id)
  }));
}

export async function createComment(
  input: { body: string },
  postId: string,
  userId: string
) {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("invalid-comment");
  }

  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("wave_comments").insert({
    post_id: postId,
    user_id: userId,
    body: parsed.data.body,
    moderation_status: "active",
    created_at: now,
    updated_at: now
  });

  if (error) {
    throw new Error(error.message);
  }

  await refreshWaveSnapshot(postId);
  revalidatePath("/");
  revalidatePath(`/wave/${postId}`);
  return listCommentsForPost(postId, userId);
}
