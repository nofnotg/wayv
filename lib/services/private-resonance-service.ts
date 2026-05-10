import { revalidatePath } from "next/cache";

import type {
  PrivateResonanceChoice,
  PrivateResonanceTrace,
  PrivateResonanceTraceListItem
} from "@/lib/domain/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { privateResonanceTraceSchema } from "@/lib/validation/schemas";

import { getWavePostAccess } from "@/lib/services/wave-access-service";

type PrivateResonanceTraceRow = Record<string, unknown>;

function mapTraceRow(row: PrivateResonanceTraceRow): PrivateResonanceTrace {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    postId: String(row.post_id),
    resonanceChoice: row.resonance_choice as PrivateResonanceChoice,
    privateNote: (row.private_note as string | null) ?? null,
    sourcePath: (row.source_path as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function buildSnippet(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
}

function mapTraceListRow(row: PrivateResonanceTraceRow): PrivateResonanceTraceListItem {
  const trace = mapTraceRow(row);
  const post = row.wave_posts as
    | {
        title: string | null;
        body: string | null;
        visibility_scope: string | null;
        moderation_status: string | null;
      }
    | null
    | undefined;

  return {
    ...trace,
    postTitle: post?.title ?? null,
    postBodySnippet: buildSnippet(post?.body ?? ""),
    postVisible: post?.visibility_scope === "public" && post?.moderation_status === "active"
  };
}

export async function getPrivateResonanceTrace(postId: string, userId: string) {
  const access = await getWavePostAccess(postId, userId);
  if (!access) {
    throw new Error("not-found");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("private_resonance_traces")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapTraceRow(data as PrivateResonanceTraceRow) : null;
}

export async function upsertPrivateResonanceTrace(
  input: {
    resonanceChoice: PrivateResonanceChoice;
    privateNote?: string | null;
    sourcePath?: string | null;
  },
  postId: string,
  userId: string
) {
  const parsed = privateResonanceTraceSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("invalid-private-resonance");
  }

  const access = await getWavePostAccess(postId, userId);
  if (!access) {
    throw new Error("not-found");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("private_resonance_traces")
    .upsert(
      {
        user_id: userId,
        post_id: postId,
        resonance_choice: parsed.data.resonanceChoice,
        private_note: parsed.data.privateNote?.trim() || null,
        source_path: parsed.data.sourcePath ?? null
      },
      { onConflict: "user_id,post_id" }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "private-resonance-save-failed");
  }

  revalidatePath(`/wave/${postId}`);
  revalidatePath("/traces");
  return mapTraceRow(data as PrivateResonanceTraceRow);
}

export async function clearPrivateResonanceTrace(postId: string, userId: string) {
  const access = await getWavePostAccess(postId, userId);
  if (!access) {
    throw new Error("not-found");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("private_resonance_traces")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/wave/${postId}`);
  revalidatePath("/traces");
  return { ok: true as const };
}

export async function listRecentPrivateResonanceTraces(userId: string, limit = 20) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("private_resonance_traces")
    .select(
      `
      *,
      wave_posts (
        title,
        body,
        visibility_scope,
        moderation_status
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 50)));

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapTraceListRow(row as PrivateResonanceTraceRow));
}

export function buildPrivateResonanceWaveDraftBody(input: {
  privateNote?: string | null;
  postBodySnippet?: string | null;
}) {
  const note = input.privateNote?.trim();
  if (note) {
    return note;
  }

  return input.postBodySnippet?.trim() ?? "";
}

export async function getPrivateResonanceWaveDraftPrefill(traceId: string, userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("private_resonance_traces")
    .select(
      `
      *,
      wave_posts (
        title,
        body,
        visibility_scope,
        moderation_status
      )
    `
    )
    .eq("id", traceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const trace = mapTraceListRow(data as PrivateResonanceTraceRow);

  return {
    traceId: trace.id,
    sourcePostId: trace.postId,
    sourcePostTitle: trace.postTitle,
    body: buildPrivateResonanceWaveDraftBody({
      privateNote: trace.privateNote,
      postBodySnippet: trace.postBodySnippet
    })
  };
}
