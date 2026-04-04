import { determineWaveState } from "@/lib/domain/wave-engine";
import type { EmotionTag, SeedAuthorType, WaveCategory, WavePostVisibility } from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { seedWavePostImportSchema } from "@/lib/validation/schemas";

type SeedWavePostImport = {
  authorUserId: string;
  title?: string | null;
  body: string;
  categories: WaveCategory[];
  emotionTags?: EmotionTag[];
  visibility?: WavePostVisibility;
  seedBatch: string;
  seedAuthorType: SeedAuthorType;
};

export async function importSeedWavePosts(entries: SeedWavePostImport[]) {
  const parsed = seedWavePostImportSchema.safeParse({ entries });
  if (!parsed.success) {
    throw new Error("invalid-seed-import");
  }

  const supabase = createAdminSupabaseClient();
  const createdIds: string[] = [];

  for (const entry of parsed.data.entries) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("wave_posts")
      .insert({
        author_user_id: entry.authorUserId,
        title: entry.title ?? null,
        body: entry.body,
        visibility_scope: entry.visibility,
        moderation_status: "active",
        is_seed: true,
        seed_batch: entry.seedBatch,
        seed_author_type: entry.seedAuthorType,
        created_at: now,
        updated_at: now
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      throw new Error(error?.message ?? "seed-import-failed");
    }

    createdIds.push(String(data.id));

    if (entry.categories.length > 0) {
      await supabase.from("wave_post_categories").insert(
        entry.categories.map((category) => ({
          post_id: data.id,
          category_key: category
        }))
      );
    }

    if (entry.emotionTags.length > 0) {
      await supabase.from("wave_post_emotions").insert(
        entry.emotionTags.map((emotion) => ({
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
  }

  return {
    importedCount: createdIds.length,
    ids: createdIds
  };
}

export async function getSeedContentStatus() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("wave_posts")
    .select("id, visibility_scope, seed_batch, seed_author_type, created_at")
    .eq("is_seed", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const batches = [...new Set(rows.map((row) => row.seed_batch).filter(Boolean))];
  const authorTypes = [...new Set(rows.map((row) => row.seed_author_type).filter(Boolean))];

  return {
    total: rows.length,
    publicCount: rows.filter((row) => row.visibility_scope === "public").length,
    latestSeedAt: rows[0]?.created_at ?? null,
    batches,
    authorTypes
  };
}
