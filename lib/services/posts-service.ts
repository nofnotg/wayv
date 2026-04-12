"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { determineWaveState } from "@/lib/domain/wave-engine";
import type { EmotionTag, WaveCategory, WaveDetail, WavePost } from "@/lib/domain/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { wavePostSchema } from "@/lib/validation/schemas";

import { listCommentsForPost } from "@/lib/services/comment-service";
import {
  evaluateContentGuardrail,
  pickHighestPriorityGuardrailResult,
  recordContentGuardrailFlag
} from "@/lib/services/content-guardrail-service";
import { recordProductEventSafe } from "@/lib/services/product-event-service";
import { getReactionState } from "@/lib/services/reaction-service";
import { getWavePostAccess } from "@/lib/services/wave-access-service";

export async function createWavePostEntry(
  input: {
    title?: string | null;
    body: string;
    categories: WaveCategory[];
    emotionTags: EmotionTag[];
    visibility: "public" | "private_archive";
  },
  userId: string
) {
  const parsed = wavePostSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("invalid-post");
  }

  const guardrailResults = [
    parsed.data.title
      ? evaluateContentGuardrail({
          targetType: "post_title",
          text: parsed.data.title,
          userId
        })
      : null,
    evaluateContentGuardrail({
      targetType: "post_body",
      text: parsed.data.body,
      userId
    })
  ].filter((result): result is NonNullable<typeof result> => Boolean(result));

  const guardrail = pickHighestPriorityGuardrailResult(guardrailResults);

  if (guardrail && guardrail.action === "hard_block") {
    await recordContentGuardrailFlag({
      targetType: guardrail.targetType,
      userId,
      action: guardrail.action,
      reasons: guardrail.reasons,
      matchedTerms: guardrail.matchedTerms,
      contentExcerpt: guardrail.contentExcerpt,
      originalText:
        guardrail.targetType === "post_title" ? parsed.data.title ?? null : parsed.data.body,
      severity: guardrail.severity,
      suggestedAction: guardrail.suggestedAction ?? guardrail.action,
      guidanceFamily: guardrail.guidance?.family ?? null
    });
    throw new Error(JSON.stringify({ error: "content-hard-block", moderation: guardrail }));
  }

  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("wave_posts")
    .insert({
      author_user_id: userId,
      title: parsed.data.title,
      body: parsed.data.body,
      visibility_scope: parsed.data.visibility,
      moderation_status:
        guardrail && (guardrail.action === "soft_hold" || guardrail.action === "safety_hold")
          ? "under_review"
          : "active",
      created_at: now,
      updated_at: now
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "create-failed");
  }

  if (parsed.data.categories.length > 0) {
    await supabase.from("wave_post_categories").insert(
      parsed.data.categories.map((category) => ({
        post_id: data.id,
        category_key: category
      }))
    );
  }

  if (parsed.data.emotionTags.length > 0) {
    await supabase.from("wave_post_emotions").insert(
      parsed.data.emotionTags.map((emotion) => ({
        post_id: data.id,
        emotion_key: emotion
      }))
    );
  }

  await supabase.from("wave_state_snapshots").upsert(
    {
      post_id: data.id,
      raw_energy: 0,
      decayed_energy: 0,
      velocity: 0,
      current_state: determineWaveState({ decayedEnergy: 0, velocity: 0 }),
      updated_at: now
    },
    { onConflict: "post_id" }
  );

  for (const result of guardrailResults) {
    if (result.action === "allow") {
      continue;
    }

    await recordContentGuardrailFlag({
      targetType: result.targetType,
      targetId: String(data.id),
      userId,
      action: result.action,
      reasons: result.reasons,
      matchedTerms: result.matchedTerms,
      contentExcerpt: result.contentExcerpt,
      originalText: result.targetType === "post_title" ? parsed.data.title ?? null : parsed.data.body,
      severity: result.severity,
      suggestedAction: result.suggestedAction ?? result.action,
      guidanceFamily: result.guidance?.family ?? null
    });
  }

  await recordProductEventSafe({
    userId,
    eventKey: "post_created",
    targetType: "wave_post",
    targetId: String(data.id),
    metadata: {
      visibility: parsed.data.visibility,
      categoryCount: parsed.data.categories.length,
      emotionTagCount: parsed.data.emotionTags.length
    },
    isSeed: false
  });

  revalidatePath("/");
  return {
    ok: true as const,
    id: String(data.id),
    moderation: guardrail ?? null
  };
}

export async function createWavePostAction(formData: FormData) {
  const { getViewerContext } = await import("@/lib/services/viewer-service");
  const viewer = await getViewerContext();
  if (!viewer) {
    redirect("/auth/sign-in");
  }

  try {
    const result = await createWavePostEntry(
      {
        title: String(formData.get("title") ?? "") || null,
        body: String(formData.get("body") ?? ""),
        categories: formData.getAll("categories") as WaveCategory[],
        emotionTags: formData.getAll("emotionTags") as EmotionTag[],
        visibility: String(formData.get("visibility") ?? "public") as "public" | "private_archive"
      },
      viewer.userId
    );

    if (result.moderation?.action === "allow_with_guidance") {
      redirect(`/wave/${result.id}?guidance=wave-keeper`);
    }

    if (result.moderation?.action === "soft_hold" || result.moderation?.action === "safety_hold") {
      redirect(`/wave/${result.id}?held=${result.moderation.action}`);
    }

    redirect(`/wave/${result.id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid-post";

    try {
      const parsed = JSON.parse(message) as { error?: string };
      if (parsed.error === "content-hard-block") {
        redirect("/write?error=content-hard-block");
      }
    } catch {
      // ignore malformed non-JSON errors
    }

    redirect("/write?error=invalid-post");
  }
}

export async function getWavePostById(
  postId: string,
  viewerId?: string | null
): Promise<WavePost | null> {
  const access = await getWavePostAccess(postId, viewerId);
  return access?.post ?? null;
}

export async function getWaveDetailById(
  postId: string,
  viewerId?: string | null
): Promise<WaveDetail | null> {
  const access = await getWavePostAccess(postId, viewerId);
  if (!access) {
    return null;
  }

  const { post, moderation } = access;
  const [reactionState, comments] = await Promise.all([
    moderation.interactionsEnabled
      ? getReactionState(postId, viewerId)
      : Promise.resolve({ summary: [], viewerReactionTypes: [], catalog: [] }),
    listCommentsForPost(postId, viewerId)
  ]);

  return {
    ...post,
    title: moderation.contentVisible ? post.title : null,
    body: moderation.contentVisible ? post.body : "",
    reactionSummary: reactionState.summary,
    viewerReactionTypes: reactionState.viewerReactionTypes,
    comments,
    moderation
  };
}
