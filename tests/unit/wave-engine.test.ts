import { describe, expect, it } from "vitest";

import {
  applyDecay,
  applyRestMode,
  calculatePersonalWaveScore,
  calculateRawEnergy,
  calculateVelocity,
  determineWaveState,
  isRestModeActive
} from "../../lib/domain/wave-engine";

describe("wave engine", () => {
  it("calculates raw energy from weighted signals", () => {
    const value = calculateRawEnergy({
      touched: 2,
      ive_been_there: 1,
      meaningful_comment: 1
    });

    expect(value).toBeCloseTo(5.6);
  });

  it("applies decay over elapsed hours", () => {
    expect(applyDecay(10, 24, 48)).toBeCloseTo(6.065, 2);
  });

  it("calculates velocity from current and past energy", () => {
    expect(calculateVelocity(6, 3, 6)).toBe(0.5);
  });

  it("maps state based on energy and velocity", () => {
    expect(determineWaveState({ decayedEnergy: 7, velocity: 0.4 })).toBe("surging");
    expect(determineWaveState({ decayedEnergy: 6.5, velocity: 0.1 })).toBe("lingering");
    expect(determineWaveState({ decayedEnergy: 2, velocity: -0.1 })).toBe("fading");
    expect(
      determineWaveState({ decayedEnergy: 1, velocity: 0.2, silenceGapHours: 30 })
    ).toBe("rekindled");
  });

  it("lowers personalized score during rest mode", () => {
    const score = calculatePersonalWaveScore({
      authoredSimilarity: 0.8,
      interactionSimilarity: 0.7,
      emotionSimilarity: 0.5,
      categorySimilarity: 0.6,
      waveStateRelevance: 0.5,
      freshness: 0.7,
      seedBoost: 0.4
    });

    expect(isRestModeActive({ userId: "u1", enabled: true, startedAt: null, endsAt: null, allowOperationalNotifications: true })).toBe(true);
    expect(
      applyRestMode(score, {
        userId: "u1",
        enabled: true,
        startedAt: null,
        endsAt: null,
        allowOperationalNotifications: true
      })
    ).toBeLessThan(score);
  });
});
