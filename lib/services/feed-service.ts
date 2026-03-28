import {
  applyRestMode,
  calculatePersonalWaveScore,
  deriveSeedBoost
} from "@/lib/domain/wave-engine";
import { systemCopy } from "@/lib/copy/system-copy";
import type {
  EmotionTag,
  OnboardingSeedProfile,
  RestModeSetting,
  WaveCategory,
  WavePost,
  WaveReactionType,
  WaveState
} from "@/lib/domain/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type HomeLaneKey = "for_you" | "quiet" | "rekindled";

type PostRow = Record<string, unknown>;

type ViewerSignalProfile = {
  categoryAffinity: Partial<Record<WaveCategory, number>>;
  emotionAffinity: Partial<Record<EmotionTag, number>>;
  authoredPostIds: Set<string>;
  reactedPostIds: Set<string>;
  commentedPostIds: Set<string>;
};

type ViewerReactionSignal = {
  reactionType: WaveReactionType;
  post: WavePost;
};

export type HomeFeed = {
  weather: {
    topic: string;
    state: WaveState;
    copy: string;
  }[];
  lanes: Record<HomeLaneKey, WavePost[]>;
  meta: {
    isResting: boolean;
    forYouSuppressed: boolean;
    notificationMode: "normal" | "reduced";
  };
};

const categoryLabels: Record<WaveCategory, string> = {
  work: "일과 커리어",
  money: "돈과 생활",
  relationships: "관계",
  family: "가족",
  study: "공부와 진로",
  health: "건강",
  daily_life: "일상"
};

const stateWeatherWeights: Record<WaveState, number> = {
  calm: 0.8,
  spreading: 1.2,
  surging: 1.6,
  lingering: 1.3,
  rekindled: 1.5,
  fading: 0.6
};

const interactionWeights: Record<WaveReactionType, number> = {
  touched_me: 1,
  stay_quietly: 0.8,
  add_my_wave: 1.8,
  me_too: 2.2,
  meaningful_comment: 3,
  save: 0.9,
  qualified_dwell: 0.4
};

function mapPostRow(post: PostRow): WavePost {
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
      ((post.wave_state_snapshots as { current_state: WaveState }[] | null)?.[0]
        ?.current_state as WaveState | undefined) ?? "calm"
  };
}

function buildWeatherCopy(topic: string, state: WaveState) {
  if (state === "rekindled") {
    return `${topic} 이야기가 다시 천천히 일렁이고 있어요.`;
  }

  if (state === "lingering") {
    return `오늘은 ${topic} 흐름이 길게 머물고 있어요.`;
  }

  if (state === "surging") {
    return `${topic} 이야기가 조금 더 크게 번지고 있어요.`;
  }

  if (state === "spreading") {
    return `${topic} 이야기가 천천히 서로에게 닿고 있어요.`;
  }

  if (state === "fading") {
    return `${topic} 흐름이 조용히 잦아들고 있어요.`;
  }

  return `${topic} 이야기가 잔잔하게 이어지고 있어요.`;
}

function addCategoryAffinity(
  target: Partial<Record<WaveCategory, number>>,
  categories: WaveCategory[],
  weight: number
) {
  for (const category of categories) {
    target[category] = (target[category] ?? 0) + weight;
  }
}

function addEmotionAffinity(
  target: Partial<Record<EmotionTag, number>>,
  emotions: EmotionTag[],
  weight: number
) {
  for (const emotion of emotions) {
    target[emotion] = (target[emotion] ?? 0) + weight;
  }
}

export function buildViewerSignalProfile(input: {
  authoredPosts: WavePost[];
  reactedPosts: ViewerReactionSignal[];
  commentedPosts: WavePost[];
  seedProfile: OnboardingSeedProfile | null;
}): ViewerSignalProfile {
  const categoryAffinity: Partial<Record<WaveCategory, number>> = {
    ...(input.seedProfile?.topicWeights ?? {})
  };
  const emotionAffinity: Partial<Record<EmotionTag, number>> = {
    ...(input.seedProfile?.emotionWeights ?? {})
  };

  const authoredPostIds = new Set<string>();
  const reactedPostIds = new Set<string>();
  const commentedPostIds = new Set<string>();

  for (const post of input.authoredPosts) {
    authoredPostIds.add(post.id);
    addCategoryAffinity(categoryAffinity, post.categories, 5);
    addEmotionAffinity(emotionAffinity, post.emotionTags, 4);
  }

  const strongestReactionPerPost = new Map<string, ViewerReactionSignal>();
  for (const signal of input.reactedPosts) {
    const existing = strongestReactionPerPost.get(signal.post.id);
    if (!existing || interactionWeights[signal.reactionType] > interactionWeights[existing.reactionType]) {
      strongestReactionPerPost.set(signal.post.id, signal);
    }
  }

  for (const signal of strongestReactionPerPost.values()) {
    reactedPostIds.add(signal.post.id);
    const weight = interactionWeights[signal.reactionType] ?? 1;
    addCategoryAffinity(categoryAffinity, signal.post.categories, weight);
    addEmotionAffinity(emotionAffinity, signal.post.emotionTags, Math.max(0.6, weight - 0.4));
  }

  const uniqueCommentedPosts = new Map<string, WavePost>();
  for (const post of input.commentedPosts) {
    uniqueCommentedPosts.set(post.id, post);
  }

  for (const post of uniqueCommentedPosts.values()) {
    commentedPostIds.add(post.id);
    addCategoryAffinity(categoryAffinity, post.categories, 3);
    addEmotionAffinity(emotionAffinity, post.emotionTags, 2.5);
  }

  return {
    categoryAffinity,
    emotionAffinity,
    authoredPostIds,
    reactedPostIds,
    commentedPostIds
  };
}

function computeAffinityScore<T extends string>(
  items: T[],
  affinityMap: Partial<Record<T, number>>
) {
  if (!items.length) {
    return 0;
  }

  const total = items.reduce((sum, item) => sum + (affinityMap[item] ?? 0), 0);
  return Math.min(total / (items.length * 4), 1);
}

function computeFreshness(createdAt: string) {
  const hours = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
  if (hours <= 6) {
    return 1;
  }
  if (hours <= 24) {
    return 0.8;
  }
  if (hours <= 72) {
    return 0.55;
  }
  return 0.3;
}

function computeWaveStateRelevance(
  post: WavePost,
  seedProfile: OnboardingSeedProfile | null
) {
  if (seedProfile?.preferredWaveTone === "quiet") {
    if (post.state === "lingering" || post.state === "calm") {
      return 0.9;
    }
    if (post.state === "surging") {
      return 0.25;
    }
  }

  if (seedProfile?.preferredWaveTone === "resonant") {
    if (post.state === "spreading" || post.state === "rekindled") {
      return 0.85;
    }
  }

  if (post.state === "rekindled") {
    return 0.75;
  }

  if (post.state === "lingering") {
    return 0.7;
  }

  return 0.45;
}

export function scorePostForViewer(params: {
  post: WavePost;
  signalProfile: ViewerSignalProfile;
  seedProfile: OnboardingSeedProfile | null;
  restMode: RestModeSetting | null;
}) {
  const categorySimilarity = computeAffinityScore(
    params.post.categories,
    params.signalProfile.categoryAffinity
  );
  const emotionSimilarity = computeAffinityScore(
    params.post.emotionTags,
    params.signalProfile.emotionAffinity
  );
  const authoredSimilarity = params.post.categories.some((category) =>
    Object.prototype.hasOwnProperty.call(params.signalProfile.categoryAffinity, category)
  )
    ? categorySimilarity
    : 0;
  const interactionSimilarity =
    params.signalProfile.reactedPostIds.has(params.post.id) ||
    params.signalProfile.commentedPostIds.has(params.post.id)
      ? 1
      : (categorySimilarity + emotionSimilarity) / 2;

  const seedBoost = deriveSeedBoost(
    params.seedProfile,
    params.post.categories,
    params.post.emotionTags
  );

  const score = calculatePersonalWaveScore({
    authoredSimilarity,
    interactionSimilarity,
    emotionSimilarity,
    categorySimilarity,
    waveStateRelevance: computeWaveStateRelevance(params.post, params.seedProfile),
    freshness: computeFreshness(params.post.createdAt),
    seedBoost
  });

  return applyRestMode(score, params.restMode);
}

export function buildHomeLanes(input: {
  posts: WavePost[];
  signalProfile: ViewerSignalProfile;
  seedProfile: OnboardingSeedProfile | null;
  restMode: RestModeSetting | null;
}) {
  const scored = input.posts
    .map((post) => ({
      post,
      score: scorePostForViewer({
        post,
        signalProfile: input.signalProfile,
        seedProfile: input.seedProfile,
        restMode: input.restMode
      })
    }))
    .sort((left, right) => right.score - left.score);

  const isResting = Boolean(input.restMode?.enabled);

  const forYou = isResting ? [] : scored.slice(0, 4).map((item) => item.post);
  const usedIds = new Set(forYou.map((post) => post.id));

  const quiet = scored
    .filter(
      (item) =>
        !usedIds.has(item.post.id) &&
        (item.post.state === "lingering" || item.post.state === "calm")
    )
    .slice(0, 4)
    .map((item) => item.post);

  for (const post of quiet) {
    usedIds.add(post.id);
  }

  const rekindled = scored
    .filter(
      (item) =>
        !usedIds.has(item.post.id) &&
        (item.post.state === "rekindled" || item.post.state === "spreading")
    )
    .slice(0, 4)
    .map((item) => item.post);

  return {
    for_you: forYou,
    quiet,
    rekindled
  };
}

function buildWeather(input: { posts: WavePost[] }) {
  const topicMap = new Map<WaveCategory, number>();

  for (const post of input.posts) {
    for (const category of post.categories) {
      topicMap.set(category, (topicMap.get(category) ?? 0) + stateWeatherWeights[post.state]);
    }
  }

  const [topCategory = "daily_life"] =
    [...topicMap.entries()].sort((left, right) => right[1] - left[1])[0] ?? [];

  const stateMap = new Map<WaveState, number>();
  for (const post of input.posts.filter((post) => post.categories.includes(topCategory))) {
    stateMap.set(post.state, (stateMap.get(post.state) ?? 0) + stateWeatherWeights[post.state]);
  }

  const [topState = "calm"] =
    [...stateMap.entries()].sort((left, right) => right[1] - left[1])[0] ?? [];

  const topicLabel = categoryLabels[topCategory];

  return [
    {
      topic: topicLabel,
      state: topState,
      copy: buildWeatherCopy(topicLabel, topState)
    }
  ];
}

async function fetchViewerSignals(viewerId: string) {
  const supabase = await createServerSupabaseClient();

  const [authoredRows, reactedRows, commentedRows] = await Promise.all([
    supabase
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
      .eq("author_user_id", viewerId)
      .neq("moderation_status", "removed")
      .limit(24),
    supabase
      .from("wave_reactions")
      .select(
        `
        reaction_type,
        wave_posts!inner (
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
        )
      `
      )
      .eq("user_id", viewerId)
      .limit(50),
    supabase
      .from("wave_comments")
      .select(
        `
        wave_posts!inner (
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
        )
      `
      )
      .eq("user_id", viewerId)
      .limit(50)
  ]);

  return {
    authoredPosts: (authoredRows.data ?? []).map((row) => mapPostRow(row as PostRow)),
    reactedPosts: (reactedRows.data ?? [])
      .map((row) => {
        const post = row.wave_posts;
        if (!post || Array.isArray(post)) {
          return null;
        }

        return {
          reactionType: row.reaction_type as WaveReactionType,
          post: mapPostRow(post as PostRow)
        };
      })
      .filter((row): row is ViewerReactionSignal => Boolean(row)),
    commentedPosts: (commentedRows.data ?? []).flatMap((row) => {
      const post = row.wave_posts;
      if (!post || Array.isArray(post)) {
        return [];
      }

      return [mapPostRow(post as PostRow)];
    })
  };
}

export async function buildHomeFeed(options: {
  viewerId?: string;
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
    .limit(40);

  const posts = (data ?? []).map((post) => mapPostRow(post as PostRow));
  const viewerSignals = options.viewerId
    ? await fetchViewerSignals(options.viewerId)
    : { authoredPosts: [], reactedPosts: [], commentedPosts: [] };

  const signalProfile = buildViewerSignalProfile({
    authoredPosts: viewerSignals.authoredPosts,
    reactedPosts: viewerSignals.reactedPosts,
    commentedPosts: viewerSignals.commentedPosts,
    seedProfile: options.seedProfile
  });

  return {
    weather: buildWeather({ posts }),
    lanes: buildHomeLanes({
      posts,
      signalProfile,
      seedProfile: options.seedProfile,
      restMode: options.restMode
    }),
    meta: {
      isResting: Boolean(options.restMode?.enabled),
      forYouSuppressed: Boolean(options.restMode?.enabled),
      notificationMode: options.restMode?.enabled ? "reduced" : "normal"
    }
  };
}

export function getLoggedOutHomeCopy() {
  return {
    title: systemCopy.home.loggedOutTitle,
    description: systemCopy.home.loggedOutDescription
  };
}
