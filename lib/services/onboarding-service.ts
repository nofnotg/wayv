import { revalidatePath } from "next/cache";

import {
  buildSeedProfile,
  getActiveOnboardingQuestions,
  onboardingQuestions
} from "@/lib/config/onboarding-questions";
import type { OnboardingAnswer, OnboardingSeedProfile } from "@/lib/domain/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { recordProductEventSafe } from "@/lib/services/product-event-service";

export function getQuestionFlow(answers: OnboardingAnswer[] = []) {
  return getActiveOnboardingQuestions(answers);
}

export function getQuestionCatalog() {
  return onboardingQuestions;
}

export function buildOnboardingSeedProfile(answers: OnboardingAnswer[]): OnboardingSeedProfile {
  return buildSeedProfile(answers);
}

export async function persistOnboardingAnswers(answers: OnboardingAnswer[], userId: string) {
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
