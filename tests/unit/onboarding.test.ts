import { describe, expect, it } from "vitest";

import {
  buildSeedProfile,
  getActiveOnboardingQuestions
} from "../../lib/config/onboarding-questions";
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
});
