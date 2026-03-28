import {
  applyRestMode,
  calculatePersonalWaveScore,
  deriveSeedBoost
} from "@/lib/domain/wave-engine";
import { systemCopy } from "@/lib/copy/system-copy";
import type {
  OnboardingSeedProfile,
  RestModeSetting,
  WavePost,
  WaveState
} from "@/lib/domain/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type HomeLaneKey = "for_you" | "quiet" | "rekindled";

export type HomeFeed = {
  weather: {
    topic: string;
    state: WaveState;
    copy: string;
  }[];
  lanes: Record<HomeLaneKey, WavePost[]>;
};

const categoryLabels: Record<string, string> = {
  work: "일과 커리어",
  money: "돈과 생활",
  relationships: "관계",
  family: "가족",
  study: "학업과 진로",
  health: "건강",
  daily_life: "일상"
};

function buildWeatherCopy(topic: string, state: WaveState) {
  if (state === "rekindled") {
    return `${topic} 이야기가 다시 일렁이고 있어요.`;
  }

  if (state === "lingering") {
    return `오늘은 ${topic} 흐름의 파도가 길게 이어지고 있어요.`;
  }

  if (state === "surging") {
    return `${topic} 이야기가 조금 더 크게 번지고 있어요.`;
  }

  if (state === "spreading") {
    return `${topic} 이야기가 천천히 서로에게 닿고 있어요.`;
  }

  return `${topic} 이야기가 잔잔하게 이어지고 있어요.`;
}

function scorePostForViewer(params: {
  post: WavePost;
  seedProfile: OnboardingSeedProfile | null;
  restMode: RestModeSetting | null;
}) {
  const seedBoost = deriveSeedBoost(
    params.seedProfile,
    params.post.categories,
    params.post.emotionTags
  );

  const score = calculatePersonalWaveScore({
    authoredSimilarity: seedBoost * 0.8,
    interactionSimilarity: seedBoost * 0.5,
    emotionSimilarity: params.post.emotionTags.length ? 0.4 : 0.2,
    categorySimilarity: params.post.categories.length ? 0.4 : 0.2,
    waveStateRelevance: params.post.state === "rekindled" ? 0.7 : 0.4,
    freshness: 0.5,
    seedBoost
  });

  return applyRestMode(score, params.restMode);
}

export async function buildHomeFeed(options: {
  seedProfile: OnboardingSeedProfile | null;
  restMode: RestModeSetting | null;
}): Promise<HomeFeed> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
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
    .eq("visibility_scope", "public")
    .eq("moderation_status", "active")
    .order("created_at", { ascending: false })
    .limit(24);

  const posts: WavePost[] = (data ?? []).map((post: Record<string, unknown>) => ({
    id: String(post.id),
    authorId: String(post.author_user_id),
    title: (post.title as string | null) ?? null,
    body: String(post.body),
    categories: (post.wave_post_categories as { category_key: string }[] | null)?.map(
      (item) => item.category_key as WavePost["categories"][number]
    ) ?? ["daily_life"],
    emotionTags: (post.wave_post_emotions as { emotion_key: string }[] | null)?.map(
      (item) => item.emotion_key as WavePost["emotionTags"][number]
    ) ?? [],
    visibility: post.visibility_scope as WavePost["visibility"],
    moderationStatus: post.moderation_status as WavePost["moderationStatus"],
    createdAt: String(post.created_at),
    updatedAt: String(post.updated_at),
    archivedAt: (post.archived_at as string | null) ?? null,
    state:
      ((post.wave_state_snapshots as { current_state: WaveState }[] | null)?.[0]
        ?.current_state as WaveState | undefined) ?? "calm"
  }));

  const scored = posts
    .map((post) => ({
      post,
      score: scorePostForViewer({
        post,
        seedProfile: options.seedProfile,
        restMode: options.restMode
      })
    }))
    .sort((left, right) => right.score - left.score);

  const topTopicKey =
    Object.entries(options.seedProfile?.topicWeights ?? {}).sort(
      (left, right) => (right[1] ?? 0) - (left[1] ?? 0)
    )[0]?.[0] ?? scored[0]?.post.categories[0] ?? "daily_life";

  const topTopic = categoryLabels[topTopicKey] ?? topTopicKey;
  const topState = scored[0]?.post.state ?? "calm";

  return {
    weather: [
      {
        topic: topTopic,
        state: topState,
        copy: buildWeatherCopy(topTopic, topState)
      }
    ],
    lanes: {
      for_you: scored.slice(0, 4).map((item) => item.post),
      quiet: scored
        .filter((item) => item.post.state === "lingering" || item.post.state === "calm")
        .slice(0, 4)
        .map((item) => item.post),
      rekindled: scored
        .filter((item) => item.post.state === "rekindled")
        .slice(0, 4)
        .map((item) => item.post)
    }
  };
}

export function getLoggedOutHomeCopy() {
  return {
    title: systemCopy.home.loggedOutTitle,
    description: systemCopy.home.loggedOutDescription
  };
}
