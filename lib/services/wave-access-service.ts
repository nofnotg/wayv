import type { EmotionTag, WaveCategory, WavePost } from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

import {
  canViewerAccessPostDetail,
  getPostModerationPresentation
} from "@/lib/services/moderation-service";

type PostRow = Record<string, unknown>;

function mapWavePostRow(post: PostRow): WavePost {
  return {
    id: String(post.id),
    authorId: String(post.author_user_id),
    title: (post.title as string | null) ?? null,
    body: String(post.body),
    categories: (post.wave_post_categories as { category_key: WaveCategory }[] | null)?.map(
      (item) => item.category_key
    ) ?? ["daily_life"],
    emotionTags: (post.wave_post_emotions as { emotion_key: EmotionTag }[] | null)?.map(
      (item) => item.emotion_key
    ) ?? [],
    visibility: post.visibility_scope as WavePost["visibility"],
    moderationStatus: post.moderation_status as WavePost["moderationStatus"],
    createdAt: String(post.created_at),
    updatedAt: String(post.updated_at),
    archivedAt: (post.archived_at as string | null) ?? null,
    state:
      ((post.wave_state_snapshots as { current_state: WavePost["state"] }[] | null)?.[0]
        ?.current_state as WavePost["state"] | undefined) ?? "calm"
  };
}

export async function getWavePostAccess(postId: string, viewerId?: string | null) {
  const supabase = createAdminSupabaseClient();
  const { data: row } = await supabase
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

  if (!row) {
    return null;
  }

  const post = mapWavePostRow(row as PostRow);
  if (!canViewerAccessPostDetail(post, viewerId)) {
    return null;
  }

  const isOwner = viewerId === post.authorId;
  const moderation = getPostModerationPresentation(post.moderationStatus, isOwner);

  return {
    post,
    moderation,
    isOwner
  };
}
