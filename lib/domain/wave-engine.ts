import {
  personalWaveWeights,
  reactionWeights,
  restModeScoreMultiplier,
  waveThresholds
} from "@/lib/config/wave-engine";
import type {
  EmotionTag,
  OnboardingSeedProfile,
  RestModeSetting,
  WaveCategory,
  WaveReactionType,
  WaveState
} from "@/lib/domain/types";

export type ReactionSignalCounts = Partial<Record<WaveReactionType, number>>;

export type PersonalWaveScoreInput = {
  authoredSimilarity: number;
  interactionSimilarity: number;
  emotionSimilarity: number;
  categorySimilarity: number;
  waveStateRelevance: number;
  freshness: number;
  seedBoost?: number;
};

export function calculateRawEnergy(signalCounts: ReactionSignalCounts): number {
  return Object.entries(signalCounts).reduce((total, [key, value]) => {
    const typedKey = key as WaveReactionType;
    return total + (reactionWeights[typedKey] ?? 0) * (value ?? 0);
  }, 0);
}

export function applyDecay(
  rawEnergy: number,
  elapsedHours: number,
  tauHours = waveThresholds.tauHours
): number {
  if (rawEnergy <= 0 || elapsedHours < 0) {
    return Math.max(rawEnergy, 0);
  }

  return rawEnergy * Math.exp(-elapsedHours / tauHours);
}

export function calculateVelocity(
  decayedEnergyNow: number,
  decayedEnergyPast: number,
  lookbackHours = 6
): number {
  if (lookbackHours <= 0) {
    return 0;
  }

  return (decayedEnergyNow - decayedEnergyPast) / lookbackHours;
}

export function determineWaveState(input: {
  decayedEnergy: number;
  velocity: number;
  recentDrop?: boolean;
  silenceGapHours?: number;
}): WaveState {
  const { decayedEnergy, velocity, recentDrop = false, silenceGapHours = 0 } = input;

  if (
    silenceGapHours >= waveThresholds.rekindledSilenceHours &&
    velocity > waveThresholds.spreadingVelocityMin
  ) {
    return "rekindled";
  }

  if (recentDrop || velocity <= waveThresholds.fadingVelocityMax) {
    return "fading";
  }

  if (
    decayedEnergy >= waveThresholds.surgingEnergyMin &&
    velocity >= waveThresholds.surgingVelocityMin
  ) {
    return "surging";
  }

  if (decayedEnergy >= waveThresholds.lingeringEnergyMin) {
    return "lingering";
  }

  if (velocity >= waveThresholds.spreadingVelocityMin) {
    return "spreading";
  }

  return "calm";
}

export function calculatePersonalWaveScore(input: PersonalWaveScoreInput): number {
  const weighted =
    input.authoredSimilarity * personalWaveWeights.authoredSimilarity +
    input.interactionSimilarity * personalWaveWeights.interactionSimilarity +
    input.emotionSimilarity * personalWaveWeights.emotionSimilarity +
    input.categorySimilarity * personalWaveWeights.categorySimilarity +
    input.waveStateRelevance * personalWaveWeights.waveStateRelevance +
    input.freshness * personalWaveWeights.freshness;

  return Math.max(0, weighted + (input.seedBoost ?? 0) * 0.12);
}

export function deriveSeedBoost(
  seedProfile: OnboardingSeedProfile | null,
  categories: WaveCategory[],
  emotionTags: EmotionTag[]
): number {
  if (!seedProfile) {
    return 0;
  }

  const topicBoost = categories.reduce((total, category) => {
    return total + (seedProfile.topicWeights[category] ?? 0);
  }, 0);

  const emotionBoost = emotionTags.reduce((total, emotion) => {
    return total + (seedProfile.emotionWeights[emotion] ?? 0);
  }, 0);

  return topicBoost * 0.08 + emotionBoost * 0.06;
}

export function isRestModeActive(restMode: RestModeSetting | null, now = new Date()): boolean {
  if (!restMode?.enabled) {
    return false;
  }

  if (!restMode.endsAt) {
    return true;
  }

  return new Date(restMode.endsAt).getTime() > now.getTime();
}

export function applyRestMode(score: number, restMode: RestModeSetting | null): number {
  return isRestModeActive(restMode) ? score * restModeScoreMultiplier : score;
}
