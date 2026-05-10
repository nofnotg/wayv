import { describe, expect, it } from "vitest";

import {
  buildSeedProfile,
  getActiveOnboardingQuestions,
  personalizeOnboardingQuestions
} from "../../lib/config/onboarding-questions";
import { validateOnboardingAnswers } from "../../lib/services/onboarding-service";
import type { OnboardingAnswer } from "../../lib/domain/types";

describe("onboarding config", () => {
  it("adds branch questions when relationship topic is selected", () => {
    const answers: OnboardingAnswer[] = [
      {
        questionKey: "primary_topic",
        value: "relationships"
      },
      {
        questionKey: "exposure_tolerance",
        value: "low"
      }
    ];

    const questions = getActiveOnboardingQuestions(answers).map((question) => question.key);

    expect(questions).toContain("relationship_detail");
    expect(questions).toContain("stimulation_sensitivity");
    expect(questions.length).toBeLessThanOrEqual(5);
  });

  it("builds seed profile from selected answers", () => {
    const profile = buildSeedProfile([
      { questionKey: "primary_topic", value: "work" },
      { questionKey: "emotion_relief", value: ["anxiety", "isolation"] },
      { questionKey: "preferred_tone", value: "quiet" },
      { questionKey: "privacy_preference", value: "semi_anonymous" },
      { questionKey: "notification_tone", value: "quiet" },
      { questionKey: "stimulation_sensitivity", value: 5 }
    ]);

    expect(profile.topicWeights.work).toBeGreaterThan(0);
    expect(profile.emotionWeights.anxiety).toBeGreaterThan(0);
    expect(profile.preferredWaveTone).toBe("quiet");
    expect(profile.privacyPreference).toBe("semi_anonymous");
    expect(profile.notificationTone).toBe("quiet");
    expect(profile.restModeAffinity).toBe("high");
  });

  it("keeps personalized wording deterministic for the same user key", () => {
    const first = personalizeOnboardingQuestions(getActiveOnboardingQuestions([]), "viewer-1");
    const second = personalizeOnboardingQuestions(getActiveOnboardingQuestions([]), "viewer-1");

    expect(first.map((question) => question.title)).toEqual(
      second.map((question) => question.title)
    );
  });

  it("rejects invalid onboarding choices", () => {
    const result = validateOnboardingAnswers([
      { questionKey: "primary_topic", value: "diagnosis" },
      { questionKey: "emotion_relief", value: "anxiety" },
      { questionKey: "preferred_tone", value: "quiet" }
    ]);

    expect(result.ok).toBe(false);
  });
});
