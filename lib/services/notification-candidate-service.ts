import { systemCopy } from "@/lib/copy/system-copy";
import type {
  EmotionTag,
  NotificationCandidate,
  NotificationPreference,
  OnboardingSeedProfile,
  RestModeSetting,
  WaveCategory,
  WavePost,
  WaveReactionType,
  WaveState
} from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

import { buildViewerSignalProfile, scorePostForViewer } from "@/lib/services/feed-service";
import { canSurfacePostInPublicLanes } from "@/lib/services/moderation-service";

type PostRow = Record<string, unknown>;

type CandidateContext = {
  preference: NotificationPreference | null;
  restMode: RestModeSetting | null;
  seedProfile: OnboardingSeedProfile | null;
};

type CandidateViewerSignals = {
  authoredPosts: WavePost[];
  reactedPosts: { reactionType: WaveReactionType; post: WavePost }[];
  commentedPosts: WavePost[];
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

function getDigestLimit(preference: NotificationPreference | null) {
  if (!preference?.enabled || preference.digestMode === "off") {
    return 0;
  }

  if (preference.digestMode === "light") {
    return 1;
  }

  return Math.max(1, Math.min(preference.maxDailyNotifications, 3));
}

function dedupeByPost(posts: WavePost[]) {
  const unique = new Map<string, WavePost>();
  for (const post of posts) {
    unique.set(post.id, post);
  }
  return [...unique.values()];
}

export function selectNotificationCandidates(input: {
  userId: string;
  posts: WavePost[];
  preference: NotificationPreference | null;
  restMode: RestModeSetting | null;
  seedProfile: OnboardingSeedProfile | null;
  viewerSignals: CandidateViewerSignals;
}): NotificationCandidate[] {
  const limit = getDigestLimit(input.preference);
  if (!limit) {
    return [];
  }

  if (input.restMode?.enabled) {
    return [];
  }

  const signalProfile = buildViewerSignalProfile({
    authoredPosts: dedupeByPost(input.viewerSignals.authoredPosts),
    reactedPosts: input.viewerSignals.reactedPosts,
    commentedPosts: dedupeByPost(input.viewerSignals.commentedPosts),
    seedProfile: input.seedProfile
  });

  const candidates = input.posts
    .filter((post) => canSurfacePostInPublicLanes(post.moderationStatus))
    .map((post) => ({
      post,
      score: scorePostForViewer({
        post,
        signalProfile,
        seedProfile: input.seedProfile,
        restMode: input.restMode
      })
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ post }): NotificationCandidate => ({
      userId: input.userId,
      type: post.state === "rekindled" || post.state === "spreading" ? "rekindled_wave" : "for_you_wave",
      lane: post.state === "rekindled" || post.state === "spreading" ? "rekindled" : "for_you",
      title:
        post.state === "rekindled" || post.state === "spreading"
          ? systemCopy.notifications.candidateRekindledTitle
          : systemCopy.notifications.candidateForYouTitle,
      body: post.title ?? post.body.slice(0, 80),
      postId: post.id,
      waveState: post.state,
      createdAt: new Date().toISOString()
    }));

  if (candidates.length > 0) {
    return candidates;
  }

  return [
    {
      userId: input.userId,
      type: "quiet_digest",
      lane: "quiet_digest",
      title: systemCopy.notifications.quietDigest,
      body: systemCopy.notifications.quietDigest,
      postId: null,
      waveState: null,
      createdAt: new Date().toISOString()
    }
  ];
}

async function getCandidateContext(userId: string): Promise<CandidateContext> {
  const supabase = createAdminSupabaseClient();
  const [{ data: preference }, { data: restMode }, { data: seedProfile }] = await Promise.all([
    supabase.from("notification_preferences").select("*").eq("user_id", userId).single(),
    supabase.from("rest_mode_settings").select("*").eq("user_id", userId).single(),
    supabase.from("onboarding_seed_profiles").select("*").eq("user_id", userId).single()
  ]);

  return {
    preference: preference
      ? {
          userId: String(preference.user_id),
          enabled: Boolean(preference.enabled),
          digestMode: preference.digest_mode,
          quietHoursStart: preference.quiet_hours_start,
          quietHoursEnd: preference.quiet_hours_end,
          maxDailyNotifications: Number(preference.max_daily_notifications)
        }
      : null,
    restMode: restMode
      ? {
          userId: String(restMode.user_id),
          enabled: Boolean(restMode.enabled),
          startedAt: restMode.started_at,
          endsAt: restMode.ends_at,
          allowOperationalNotifications: Boolean(restMode.allow_operational_notifications)
        }
      : null,
    seedProfile: seedProfile
      ? {
          topicWeights: seedProfile.topic_weights ?? {},
          emotionWeights: seedProfile.emotion_weights ?? {},
          preferredWaveTone: seedProfile.preferred_wave_tone,
          exposureTolerance: seedProfile.exposure_tolerance,
          privacyPreference: seedProfile.privacy_preference,
          restModeAffinity: seedProfile.rest_mode_affinity,
          notificationTone: seedProfile.notification_tone,
          readingPreference: seedProfile.reading_preference,
          empathyPreference: seedProfile.empathy_preference
        }
      : null
  };
}

async function fetchViewerSignals(userId: string): Promise<CandidateViewerSignals> {
  const supabase = createAdminSupabaseClient();
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
      .eq("author_user_id", userId)
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
      .eq("user_id", userId)
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
      .eq("user_id", userId)
      .limit(50)
  ]);

  const strongestReactionPerPost = new Map<string, { reactionType: WaveReactionType; post: WavePost }>();
  for (const row of reactedRows.data ?? []) {
    const post = row.wave_posts;
    if (!post || Array.isArray(post)) {
      continue;
    }

    const mapped = mapPostRow(post as PostRow);
    const current = strongestReactionPerPost.get(mapped.id);
    if (!current) {
      strongestReactionPerPost.set(mapped.id, {
        reactionType: row.reaction_type as WaveReactionType,
        post: mapped
      });
    }
  }

  return {
    authoredPosts: (authoredRows.data ?? []).map((row) => mapPostRow(row as PostRow)),
    reactedPosts: [...strongestReactionPerPost.values()],
    commentedPosts: dedupeByPost(
      (commentedRows.data ?? []).flatMap((row) => {
        const post = row.wave_posts;
        if (!post || Array.isArray(post)) {
          return [];
        }

        return [mapPostRow(post as PostRow)];
      })
    )
  };
}

async function fetchCandidatePosts() {
  const supabase = createAdminSupabaseClient();
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
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((row) => mapPostRow(row as PostRow));
}

export async function buildNotificationCandidatesForUser(userId: string) {
  const [context, viewerSignals, posts] = await Promise.all([
    getCandidateContext(userId),
    fetchViewerSignals(userId),
    fetchCandidatePosts()
  ]);

  return selectNotificationCandidates({
    userId,
    posts,
    preference: context.preference,
    restMode: context.restMode,
    seedProfile: context.seedProfile,
    viewerSignals
  });
}

export async function buildNotificationDigestPreview(limit = 20) {
  const supabase = createAdminSupabaseClient();
  const { data: rows } = await supabase
    .from("notification_preferences")
    .select("user_id, enabled, digest_mode")
    .eq("enabled", true)
    .neq("digest_mode", "off")
    .limit(limit);

  const users = (rows ?? []).map((row) => String(row.user_id));
  const previews = await Promise.all(
    users.map(async (userId) => ({
      userId,
      candidates: await buildNotificationCandidatesForUser(userId)
    }))
  );

  return previews.map((item) => ({
    userId: item.userId,
    candidateCount: item.candidates.length,
    candidates: item.candidates.map((candidate) => ({
      type: candidate.type,
      lane: candidate.lane,
      postId: candidate.postId
    }))
  }));
}
