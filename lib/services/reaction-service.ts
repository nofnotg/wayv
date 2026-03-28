import { revalidatePath } from "next/cache";

import { publicReactionTypes } from "@/lib/config/wave-engine";
import { systemCopy } from "@/lib/copy/system-copy";
import type { WaveReactionSummary, WaveReactionType } from "@/lib/domain/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { reactionMutationSchema } from "@/lib/validation/schemas";

import { refreshWaveSnapshot } from "@/lib/services/wave-state-service";

export function getReactionCatalog() {
  return publicReactionTypes.map((reactionType) => ({
    reactionType,
    label: systemCopy.reactions[reactionType]
  }));
}

export async function getReactionState(postId: string, viewerId?: string | null) {
  const supabase = await createServerSupabaseClient();
  const [{ data: reactions }, { data: viewerReactions }] = await Promise.all([
    supabase.from("wave_reactions").select("reaction_type").eq("post_id", postId),
    viewerId
      ? supabase
          .from("wave_reactions")
          .select("reaction_type")
          .eq("post_id", postId)
          .eq("user_id", viewerId)
      : Promise.resolve({ data: [] as { reaction_type: WaveReactionType }[] })
  ]);

  const summaryMap = new Map<WaveReactionType, number>();
  for (const row of reactions ?? []) {
    const reactionType = row.reaction_type as WaveReactionType;
    summaryMap.set(reactionType, (summaryMap.get(reactionType) ?? 0) + 1);
  }

  const summary: WaveReactionSummary[] = getReactionCatalog().map(({ reactionType }) => ({
    reactionType,
    hasActivity: (summaryMap.get(reactionType) ?? 0) > 0
  }));

  return {
    summary,
    viewerReactionTypes: (viewerReactions ?? []).map((row) => row.reaction_type as WaveReactionType),
    catalog: getReactionCatalog()
  };
}

export async function addReaction(
  input: { reactionType: WaveReactionType },
  postId: string,
  userId: string
) {
  const parsed = reactionMutationSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("invalid-reaction");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("wave_reactions").upsert(
    {
      post_id: postId,
      user_id: userId,
      reaction_type: parsed.data.reactionType
    },
    { onConflict: "user_id,post_id,reaction_type" }
  );

  if (error) {
    throw new Error(error.message);
  }

  await refreshWaveSnapshot(postId);
  revalidatePath("/");
  revalidatePath(`/wave/${postId}`);
  return getReactionState(postId, userId);
}

export async function removeReaction(
  input: { reactionType: WaveReactionType },
  postId: string,
  userId: string
) {
  const parsed = reactionMutationSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("invalid-reaction");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("wave_reactions")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId)
    .eq("reaction_type", parsed.data.reactionType);

  if (error) {
    throw new Error(error.message);
  }

  await refreshWaveSnapshot(postId);
  revalidatePath("/");
  revalidatePath(`/wave/${postId}`);
  return getReactionState(postId, userId);
}
