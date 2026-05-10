import {
  applyDecay,
  calculateRawEnergy,
  calculateVelocity,
  determineWaveState,
  type ReactionSignalCounts
} from "@/lib/domain/wave-engine";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

function hoursBetween(from: string, to: Date) {
  return Math.max(0, (to.getTime() - new Date(from).getTime()) / (1000 * 60 * 60));
}

export async function refreshWaveSnapshot(postId: string) {
  const supabase = createAdminSupabaseClient();
  const now = new Date();
  const lookbackCutoff = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();

  const [{ data: post }, { data: reactionRows }, { data: commentRows }] = await Promise.all([
    supabase.from("wave_posts").select("created_at").eq("id", postId).single(),
    supabase
      .from("wave_reactions")
      .select("reaction_type, created_at")
      .eq("post_id", postId),
    supabase
      .from("wave_comments")
      .select("created_at")
      .eq("post_id", postId)
      .eq("moderation_status", "active")
  ]);

  if (!post?.created_at) {
    return null;
  }

  const signalCounts: ReactionSignalCounts = {};

  for (const row of reactionRows ?? []) {
    const reactionType = row.reaction_type as keyof ReactionSignalCounts;
    signalCounts[reactionType] = (signalCounts[reactionType] ?? 0) + 1;
  }

  if ((commentRows?.length ?? 0) > 0) {
    signalCounts.meaningful_comment = commentRows?.length ?? 0;
  }

  const rawEnergy = calculateRawEnergy(signalCounts);
  const elapsedHours = hoursBetween(post.created_at, now);
  const decayedEnergy = applyDecay(rawEnergy, elapsedHours);

  const recentSignalCounts: ReactionSignalCounts = {};

  for (const row of reactionRows ?? []) {
    if (row.created_at >= lookbackCutoff) {
      const reactionType = row.reaction_type as keyof ReactionSignalCounts;
      recentSignalCounts[reactionType] = (recentSignalCounts[reactionType] ?? 0) + 1;
    }
  }

  const recentCommentCount = (commentRows ?? []).filter((row) => row.created_at >= lookbackCutoff).length;
  if (recentCommentCount > 0) {
    recentSignalCounts.meaningful_comment = recentCommentCount;
  }

  const recentEnergy = calculateRawEnergy(recentSignalCounts);
  const velocity = calculateVelocity(decayedEnergy, Math.max(decayedEnergy - recentEnergy, 0));

  const lastActivityAt = [
    ...(reactionRows ?? []).map((row) => row.created_at),
    ...(commentRows ?? []).map((row) => row.created_at)
  ]
    .sort()
    .at(-1);

  const silenceGapHours = lastActivityAt
    ? Math.max(0, (now.getTime() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60))
    : elapsedHours;

  const currentState = determineWaveState({
    decayedEnergy,
    velocity,
    silenceGapHours
  });

  await supabase.from("wave_state_snapshots").upsert(
    {
      post_id: postId,
      raw_energy: rawEnergy,
      decayed_energy: decayedEnergy,
      velocity,
      current_state: currentState,
      updated_at: now.toISOString()
    },
    { onConflict: "post_id" }
  );

  return {
    rawEnergy,
    decayedEnergy,
    velocity,
    currentState
  };
}
