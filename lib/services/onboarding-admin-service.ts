import type {
  OnboardingQuestionBranch,
  OnboardingQuestionOptionRecord,
  OnboardingQuestionPhrasing,
  OnboardingQuestionSource,
  OnboardingQuestionSourceBundle,
  OnboardingQuestionType,
  OnboardingQuestionSeedPatch
} from "@/lib/domain/types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  onboardingBranchMutationSchema,
  onboardingOptionMutationSchema,
  onboardingPhrasingMutationSchema,
  onboardingSourceMutationSchema
} from "@/lib/validation/schemas";

function mapSourceRow(row: Record<string, unknown>): OnboardingQuestionSource {
  return {
    key: String(row.key),
    version: Number(row.version ?? 3),
    label: String(row.label),
    intent: String(row.intent),
    psychologicalBasis: String(row.psychological_basis),
    type: row.type as OnboardingQuestionType,
    profileTargets: ((row.profile_targets as string[] | null) ?? []).map(String),
    maxSelect: (row.max_select as number | null) ?? null,
    orderIndex: Number(row.order_index ?? 100),
    isRequired: Boolean(row.is_required),
    isClarifier: Boolean(row.is_clarifier),
    isActive: Boolean(row.is_active),
    operatorNote: (row.operator_note as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapPhrasingRow(row: Record<string, unknown>): OnboardingQuestionPhrasing {
  return {
    id: String(row.id),
    sourceKey: String(row.source_key),
    locale: String(row.locale ?? "ko"),
    text: String(row.text),
    subtitle: (row.subtitle as string | null) ?? null,
    isPrimary: Boolean(row.is_primary),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapOptionRow(row: Record<string, unknown>): OnboardingQuestionOptionRecord {
  return {
    id: String(row.id),
    sourceKey: String(row.source_key),
    optionKey: String(row.option_key),
    label: String(row.label),
    description: (row.description as string | null) ?? null,
    seedPatch: (row.seed_patch ?? {}) as OnboardingQuestionSeedPatch,
    orderIndex: Number(row.order_index ?? 100),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  } as OnboardingQuestionOptionRecord;
}

function mapBranchRow(row: Record<string, unknown>): OnboardingQuestionBranch {
  return {
    id: String(row.id),
    sourceKey: String(row.source_key),
    dependsOnSourceKey: String(row.depends_on_source_key),
    anyOf: ((row.any_of as string[] | null) ?? []).map(String),
    orderIndex: Number(row.order_index ?? 100),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

async function recordAudit(input: {
  sourceKey?: string | null;
  actorUserId?: string | null;
  actorLabel: string;
  action: string;
  beforeState?: unknown;
  afterState?: unknown;
}) {
  const supabase = createAdminSupabaseClient();
  await supabase.from("onboarding_question_audit_logs").insert({
    source_key: input.sourceKey ?? null,
    actor_user_id: input.actorUserId ?? null,
    actor_label: input.actorLabel,
    action: input.action,
    before_state: input.beforeState ?? null,
    after_state: input.afterState ?? null
  });
}

export async function listOnboardingSourceBundles(input?: { includeInactive?: boolean }) {
  const supabase = createAdminSupabaseClient();
  let sourcesQuery = supabase
    .from("onboarding_question_sources")
    .select("*")
    .order("order_index", { ascending: true });

  if (!input?.includeInactive) {
    sourcesQuery = sourcesQuery.eq("is_active", true);
  }

  const [
    { data: sourceRows, error: sourceError },
    { data: phrasingRows, error: phrasingError },
    { data: optionRows, error: optionError },
    { data: branchRows, error: branchError }
  ] = await Promise.all([
    sourcesQuery,
    supabase.from("onboarding_question_phrasings").select("*").order("created_at"),
    supabase.from("onboarding_question_options").select("*").order("order_index"),
    supabase.from("onboarding_question_branches").select("*").order("order_index")
  ]);

  const error = sourceError ?? phrasingError ?? optionError ?? branchError;
  if (error) {
    throw new Error(error.message);
  }

  const phrasings = (phrasingRows ?? []).map((row) => mapPhrasingRow(row as Record<string, unknown>));
  const options = (optionRows ?? []).map((row) => mapOptionRow(row as Record<string, unknown>));
  const branches = (branchRows ?? []).map((row) => mapBranchRow(row as Record<string, unknown>));

  return (sourceRows ?? []).map((row) => {
    const source = mapSourceRow(row as Record<string, unknown>);
    return {
      source,
      phrasings: phrasings.filter((item) => item.sourceKey === source.key),
      options: options.filter((item) => item.sourceKey === source.key),
      branches: branches.filter((item) => item.sourceKey === source.key)
    } satisfies OnboardingQuestionSourceBundle;
  });
}

export async function upsertOnboardingSource(input: {
  source: unknown;
  actorUserId?: string | null;
  actorLabel: string;
}) {
  const parsed = onboardingSourceMutationSchema.parse(input.source);
  const supabase = createAdminSupabaseClient();
  const { data: before } = await supabase
    .from("onboarding_question_sources")
    .select("*")
    .eq("key", parsed.key)
    .maybeSingle();

  const { data, error } = await supabase
    .from("onboarding_question_sources")
    .upsert(
      {
        key: parsed.key,
        label: parsed.label,
        intent: parsed.intent,
        psychological_basis: parsed.psychologicalBasis,
        type: parsed.type,
        profile_targets: parsed.profileTargets,
        max_select: parsed.maxSelect ?? null,
        order_index: parsed.orderIndex,
        is_required: parsed.isRequired,
        is_clarifier: parsed.isClarifier,
        is_active: parsed.isActive,
        operator_note: parsed.operatorNote ?? null
      },
      { onConflict: "key" }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "onboarding-source-upsert-failed");
  }

  await recordAudit({
    sourceKey: parsed.key,
    actorUserId: input.actorUserId,
    actorLabel: input.actorLabel,
    action: before ? "source.update" : "source.create",
    beforeState: before ?? null,
    afterState: data
  });

  return mapSourceRow(data as Record<string, unknown>);
}

export async function upsertOnboardingPhrasing(input: {
  phrasing: unknown;
  actorUserId?: string | null;
  actorLabel: string;
}) {
  const parsed = onboardingPhrasingMutationSchema.parse(input.phrasing);
  const supabase = createAdminSupabaseClient();
  const payload = {
    source_key: parsed.sourceKey,
    locale: parsed.locale,
    text: parsed.text,
    subtitle: parsed.subtitle ?? null,
    is_primary: parsed.isPrimary,
    is_active: parsed.isActive,
    created_by_user_id: input.actorUserId ?? null
  };
  const query = parsed.id
    ? supabase.from("onboarding_question_phrasings").update(payload).eq("id", parsed.id)
    : supabase.from("onboarding_question_phrasings").insert(payload);
  const { data, error } = await query.select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "onboarding-phrasing-upsert-failed");
  }

  await recordAudit({
    sourceKey: parsed.sourceKey,
    actorUserId: input.actorUserId,
    actorLabel: input.actorLabel,
    action: parsed.id ? "phrasing.update" : "phrasing.create",
    afterState: data
  });

  return mapPhrasingRow(data as Record<string, unknown>);
}

export async function upsertOnboardingOption(input: {
  option: unknown;
  actorUserId?: string | null;
  actorLabel: string;
}) {
  const parsed = onboardingOptionMutationSchema.parse(input.option);
  const supabase = createAdminSupabaseClient();
  const payload = {
    source_key: parsed.sourceKey,
    option_key: parsed.optionKey,
    label: parsed.label,
    description: parsed.description ?? null,
    seed_patch: parsed.seedPatch,
    order_index: parsed.orderIndex,
    is_active: parsed.isActive
  };
  const query = parsed.id
    ? supabase.from("onboarding_question_options").update(payload).eq("id", parsed.id)
    : supabase.from("onboarding_question_options").upsert(payload, {
        onConflict: "source_key,option_key"
      });
  const { data, error } = await query.select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "onboarding-option-upsert-failed");
  }

  await recordAudit({
    sourceKey: parsed.sourceKey,
    actorUserId: input.actorUserId,
    actorLabel: input.actorLabel,
    action: parsed.id ? "option.update" : "option.upsert",
    afterState: data
  });

  return mapOptionRow(data as Record<string, unknown>);
}

export async function upsertOnboardingBranch(input: {
  branch: unknown;
  actorUserId?: string | null;
  actorLabel: string;
}) {
  const parsed = onboardingBranchMutationSchema.parse(input.branch);
  const supabase = createAdminSupabaseClient();
  const payload = {
    source_key: parsed.sourceKey,
    depends_on_source_key: parsed.dependsOnSourceKey,
    any_of: parsed.anyOf,
    order_index: parsed.orderIndex,
    is_active: parsed.isActive
  };
  const query = parsed.id
    ? supabase.from("onboarding_question_branches").update(payload).eq("id", parsed.id)
    : supabase.from("onboarding_question_branches").insert(payload);
  const { data, error } = await query.select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "onboarding-branch-upsert-failed");
  }

  await recordAudit({
    sourceKey: parsed.sourceKey,
    actorUserId: input.actorUserId,
    actorLabel: input.actorLabel,
    action: parsed.id ? "branch.update" : "branch.create",
    afterState: data
  });

  return mapBranchRow(data as Record<string, unknown>);
}
