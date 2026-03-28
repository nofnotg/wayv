"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { determineWaveState } from "@/lib/domain/wave-engine";
import type { EmotionTag, WaveCategory, WaveDetail, WavePost } from "@/lib/domain/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { wavePostSchema } from "@/lib/validation/schemas";

import { listCommentsForPost } from "@/lib/services/comment-service";
import { getReactionState } from "@/lib/services/reaction-service";

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

  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("wave_posts")
    .insert({
      author_user_id: userId,
      title: parsed.data.title,
      body: parsed.data.body,
      visibility_scope: parsed.data.visibility,
      moderation_status: "active",
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

  revalidatePath("/");
  return { ok: true as const, id: String(data.id) };
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

    redirect(`/wave/${result.id}`);
  } catch {
    redirect("/write?error=invalid-post");
  }
}

export async function getWavePostById(postId: string): Promise<WavePost | null> {
  const supabase = await createServerSupabaseClient();
  const { data: post } = await supabase
    .from("wave_posts")
    .select(
      `
      id,
      author_user_id,
      title,
      body,
      visibility_scope,
      moderation_status,
      created_at,
      updated_at,
      archived_at,
      wave_post_categories ( category_key ),
      wave_post_emotions ( emotion_key ),
      wave_state_snapshots ( current_state )
    `
    )
    .eq("id", postId)
    .single();

  if (!post) {
    return null;
  }

  return {
    id: String(post.id),
    authorId: String(post.author_user_id),
    title: (post.title as string | null) ?? null,
    body: String(post.body),
    categories: (post.wave_post_categories ?? []).map(
      (item: { category_key: WaveCategory }) => item.category_key
    ),
    emotionTags: (post.wave_post_emotions ?? []).map(
      (item: { emotion_key: EmotionTag }) => item.emotion_key
    ),
    visibility: post.visibility_scope,
    moderationStatus: post.moderation_status,
    createdAt: String(post.created_at),
    updatedAt: String(post.updated_at),
    archivedAt: (post.archived_at as string | null) ?? null,
    state: post.wave_state_snapshots?.[0]?.current_state ?? "calm"
  };
}

export async function getWaveDetailById(
  postId: string,
  viewerId?: string | null
): Promise<WaveDetail | null> {
  const post = await getWavePostById(postId);
  if (!post) {
    return null;
  }

  const [reactionState, comments] = await Promise.all([
    getReactionState(postId, viewerId),
    listCommentsForPost(postId, viewerId)
  ]);

  return {
    ...post,
    reactionSummary: reactionState.summary,
    viewerReactionTypes: reactionState.viewerReactionTypes,
    comments
  };
}
