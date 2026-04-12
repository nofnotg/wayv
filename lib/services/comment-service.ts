import { revalidatePath } from "next/cache";

import type { WaveComment } from "@/lib/domain/types";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { commentSchema } from "@/lib/validation/schemas";

import { presentCommentForViewer } from "@/lib/services/moderation-service";
import {
  evaluateContentGuardrail,
  recordContentGuardrailFlag
} from "@/lib/services/content-guardrail-service";
import { recordProductEventSafe } from "@/lib/services/product-event-service";
import { getWavePostAccess } from "@/lib/services/wave-access-service";
import { refreshWaveSnapshot } from "@/lib/services/wave-state-service";

export async function listCommentsForPost(postId: string, viewerId?: string | null) {
  const access = await getWavePostAccess(postId, viewerId);
  if (!access || (!access.moderation.contentVisible && !access.isOwner)) {
    return [];
  }

  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("wave_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  return (data ?? [])
    .map((row) =>
      presentCommentForViewer(
        {
          id: String(row.id),
          post_id: String(row.post_id),
          user_id: String(row.user_id),
          body: String(row.body),
          moderation_status: row.moderation_status,
          created_at: String(row.created_at),
          updated_at: String(row.updated_at)
        },
        viewerId
      )
    )
    .filter((row): row is WaveComment => Boolean(row));
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

  const access = await getWavePostAccess(postId, userId);
  if (!access) {
    throw new Error("not-found");
  }
  if (!access.moderation.interactionsEnabled) {
    throw new Error("interactions-paused");
  }

  const guardrail = evaluateContentGuardrail({
    targetType: "comment_body",
    text: parsed.data.body,
    userId
  });
  if (guardrail.action === "hard_block") {
    await recordContentGuardrailFlag({
      targetType: guardrail.targetType,
      userId,
      action: guardrail.action,
      reasons: guardrail.reasons,
      matchedTerms: guardrail.matchedTerms,
      contentExcerpt: guardrail.contentExcerpt,
      originalText: parsed.data.body,
      severity: guardrail.severity,
      suggestedAction: guardrail.suggestedAction ?? guardrail.action,
      guidanceFamily: guardrail.guidance?.family ?? null
    });
    throw new Error(JSON.stringify({ error: "content-hard-block", moderation: guardrail }));
  }

  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("wave_comments")
    .insert({
      post_id: postId,
      user_id: userId,
      body: parsed.data.body,
      moderation_status:
        guardrail.action === "soft_hold" || guardrail.action === "safety_hold"
          ? "under_review"
          : "active",
      created_at: now,
      updated_at: now
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "comment-create-failed");
  }

  if (guardrail.action !== "allow") {
    await recordContentGuardrailFlag({
      targetType: guardrail.targetType,
      targetId: String(data.id),
      userId,
      action: guardrail.action,
      reasons: guardrail.reasons,
      matchedTerms: guardrail.matchedTerms,
      contentExcerpt: guardrail.contentExcerpt,
      originalText: parsed.data.body,
      severity: guardrail.severity,
      suggestedAction: guardrail.suggestedAction ?? guardrail.action,
      guidanceFamily: guardrail.guidance?.family ?? null
    });
  }

  await recordProductEventSafe({
    userId,
    eventKey: "comment_created",
    targetType: "wave_comment",
    targetId: String(data.id),
    metadata: {
      postId
    },
    isSeed: false
  });

  await refreshWaveSnapshot(postId);
  revalidatePath("/");
  revalidatePath(`/wave/${postId}`);
  const comments = await listCommentsForPost(postId, userId);
  return {
    commentId: String(data.id),
    comments,
    moderation: guardrail
  };
}
