import { revalidatePath } from "next/cache";

import {
  buildSeedProfile,
  getActiveOnboardingQuestions,
  onboardingQuestions,
  personalizeOnboardingQuestions
} from "@/lib/config/onboarding-questions";
import type {
  OnboardingAnswer,
  OnboardingQuestion,
  OnboardingSeedProfile
} from "@/lib/domain/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listOnboardingSourceBundles } from "@/lib/services/onboarding-admin-service";
import { recordProductEventSafe } from "@/lib/services/product-event-service";

export function getQuestionFlow(answers: OnboardingAnswer[] = []) {
  return getActiveOnboardingQuestions(answers);
}

export function getQuestionCatalog() {
  return onboardingQuestions;
}

function mapQuestionRow(row: Record<string, unknown>): OnboardingQuestion {
  const config = (row.config ?? {}) as Partial<OnboardingQuestion>;

  return {
    key: String(row.key),
    type: row.type as OnboardingQuestion["type"],
    title: String(row.title),
    subtitle: (row.subtitle as string | null) ?? undefined,
    titleVariants: config.titleVariants,
    options: config.options,
    min: config.min,
    max: config.max,
    step: config.step,
    placeholder: config.placeholder,
    allowSkip: config.allowSkip,
    branchRules: config.branchRules,
    order: config.order,
    clarifyOnly: config.clarifyOnly
  };
}

function mapSourceBundleToQuestion(
  bundle: Awaited<ReturnType<typeof listOnboardingSourceBundles>>[number]
): OnboardingQuestion | null {
  const primaryPhrasing =
    bundle.phrasings.find((phrasing) => phrasing.isActive && phrasing.isPrimary) ??
    bundle.phrasings.find((phrasing) => phrasing.isActive);

  if (!primaryPhrasing) {
    return null;
  }

  const activePhrasings = bundle.phrasings.filter((phrasing) => phrasing.isActive);
  const activeOptions = bundle.options
    .filter((option) => option.isActive)
    .sort((left, right) => left.orderIndex - right.orderIndex);
  const activeBranches = bundle.branches
    .filter((branch) => branch.isActive)
    .sort((left, right) => left.orderIndex - right.orderIndex);

  return {
    key: bundle.source.key,
    type: bundle.source.type,
    title: primaryPhrasing.text,
    subtitle: primaryPhrasing.subtitle ?? undefined,
    titleVariants: activePhrasings
      .filter((phrasing) => phrasing.id !== primaryPhrasing.id)
      .map((phrasing) => phrasing.text),
    options: activeOptions.map((option) => ({
      key: option.optionKey,
      label: option.label,
      description: option.description ?? undefined,
      seedPatch: option.seedPatch
    })),
    min: bundle.source.type === "scale" ? 1 : undefined,
    max: bundle.source.type === "scale" ? 5 : undefined,
    step: bundle.source.type === "scale" ? 1 : undefined,
    allowSkip: !bundle.source.isRequired,
    branchRules: activeBranches.map((branch) => ({
      questionKey: branch.dependsOnSourceKey,
      anyOf: branch.anyOf
    })),
    order: bundle.source.orderIndex,
    clarifyOnly: bundle.source.isClarifier
  };
}

async function getActiveCatalogFromDatabase() {
  try {
    const bundles = await listOnboardingSourceBundles();
    const questions = bundles
      .map((bundle) => mapSourceBundleToQuestion(bundle))
      .filter((question): question is OnboardingQuestion => Boolean(question));

    if (questions.length) {
      return questions;
    }
  } catch {
    // If v3 tables are not migrated yet, keep the v2/static flow alive.
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("onboarding_questions")
    .select("key, type, title, subtitle, config")
    .eq("is_active", true)
    .eq("version", 2);

  return error || !data?.length
    ? onboardingQuestions
    : data.map((row) => mapQuestionRow(row as Record<string, unknown>));
}

export async function getQuestionCatalogForViewer(stableKey: string) {
  const catalog = await getActiveCatalogFromDatabase();
  return personalizeOnboardingQuestions(catalog, stableKey);
}

export function buildOnboardingSeedProfile(answers: OnboardingAnswer[]): OnboardingSeedProfile {
  return buildSeedProfile(answers);
}

export function validateOnboardingAnswers(
  answers: OnboardingAnswer[],
  catalog: OnboardingQuestion[] = onboardingQuestions
) {
  const activeQuestions = getActiveOnboardingQuestions(answers, catalog);
  const activeKeys = new Set(activeQuestions.map((question) => question.key));

  if (activeQuestions.length > 5 || answers.length > 5) {
    return { ok: false as const, error: "too-many-answers" };
  }

  for (const answer of answers) {
    if (!activeKeys.has(answer.questionKey)) {
      return { ok: false as const, error: "inactive-question" };
    }
  }

  for (const question of activeQuestions) {
    const answer = answers.find((item) => item.questionKey === question.key);

    if (!answer) {
      if (question.allowSkip) {
        continue;
      }

      return { ok: false as const, error: "missing-required-answer" };
    }

    if (answer.skipped || answer.value === null) {
      if (question.allowSkip) {
        continue;
      }

      return { ok: false as const, error: "missing-required-answer" };
    }

    if (question.type === "single_choice") {
      const allowed = new Set(question.options?.map((option) => option.key) ?? []);
      if (typeof answer.value !== "string" || !allowed.has(answer.value)) {
        return { ok: false as const, error: "invalid-choice" };
      }
    }

    if (question.type === "multi_choice") {
      const allowed = new Set(question.options?.map((option) => option.key) ?? []);
      const values = Array.isArray(answer.value) ? answer.value : [];
      if (!values.length || values.some((value) => !allowed.has(value))) {
        return { ok: false as const, error: "invalid-choice" };
      }
    }

    if (question.type === "scale") {
      const min = question.min ?? 1;
      const max = question.max ?? 5;
      if (typeof answer.value !== "number" || answer.value < min || answer.value > max) {
        return { ok: false as const, error: "invalid-scale" };
      }
    }

    if (question.type === "short_text") {
      if (typeof answer.value !== "string" || answer.value.length > 160) {
        return { ok: false as const, error: "invalid-text" };
      }
    }
  }

  return { ok: true as const };
}

export async function persistOnboardingAnswers(answers: OnboardingAnswer[], userId: string) {
  const catalog = await getActiveCatalogFromDatabase();
  const validation = validateOnboardingAnswers(answers, catalog);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const supabase = await createServerSupabaseClient();
  const seedProfile = buildOnboardingSeedProfile(answers);
  const now = new Date().toISOString();

  const answerRows = answers.map((answer) => ({
    user_id: userId,
    question_key: answer.questionKey,
    answer_value: answer.value,
    skipped: Boolean(answer.skipped),
    updated_at: now
  }));

  if (answerRows.length > 0) {
    await supabase.from("onboarding_answers").upsert(answerRows, {
      onConflict: "user_id,question_key"
    });
  }

  await supabase.from("onboarding_seed_profiles").upsert(
    {
      user_id: userId,
      topic_weights: seedProfile.topicWeights,
      emotion_weights: seedProfile.emotionWeights,
      preferred_wave_tone: seedProfile.preferredWaveTone,
      exposure_tolerance: seedProfile.exposureTolerance,
      privacy_preference: seedProfile.privacyPreference,
      rest_mode_affinity: seedProfile.restModeAffinity,
      notification_tone: seedProfile.notificationTone,
      reading_preference: seedProfile.readingPreference,
      empathy_preference: seedProfile.empathyPreference,
      updated_at: now
    },
    { onConflict: "user_id" }
  );

  await supabase
    .from("user_profiles")
    .update({
      onboarding_completed_at: now,
      profile_visibility: seedProfile.privacyPreference,
      notification_opt_in: seedProfile.notificationTone !== "off",
      updated_at: now
    })
    .eq("id", userId);

  await supabase.from("notification_preferences").upsert(
    {
      user_id: userId,
      enabled: seedProfile.notificationTone !== "off",
      updated_at: now
    },
    { onConflict: "user_id" }
  );

  await recordProductEventSafe({
    userId,
    eventKey: "onboarding_completed",
    targetType: "user_profile",
    targetId: userId,
    metadata: {
      privacyPreference: seedProfile.privacyPreference,
      notificationTone: seedProfile.notificationTone
    }
  });

  revalidatePath("/");
  revalidatePath("/onboarding");
  return seedProfile;
}

export async function getStoredSeedProfile(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("onboarding_seed_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!data) {
    return null;
  }

  return {
    topicWeights: data.topic_weights ?? {},
    emotionWeights: data.emotion_weights ?? {},
    preferredWaveTone: data.preferred_wave_tone,
    exposureTolerance: data.exposure_tolerance,
    privacyPreference: data.privacy_preference,
    restModeAffinity: data.rest_mode_affinity,
    notificationTone: data.notification_tone,
    readingPreference: data.reading_preference,
    empathyPreference: data.empathy_preference
  } satisfies OnboardingSeedProfile;
}
