import type { WaveReactionType } from "@/lib/domain/types";

export const reactionWeights: Record<WaveReactionType, number> = {
  touched: 1,
  stay_quiet: 0.8,
  add_wave: 1.2,
  ive_been_there: 1.6,
  meaningful_comment: 2,
  save: 0.9,
  qualified_dwell: 0.4
};

export const authoredSignalWeights = {
  authoredPost: 5,
  authoredComment: 3,
  iveBeenThere: 2.2,
  addWave: 1.8,
  touched: 1,
  longRead: 0.8
} as const;

export const waveThresholds = {
  tauHours: 48,
  spreadingVelocityMin: 0.12,
  surgingEnergyMin: 4.5,
  surgingVelocityMin: 0.35,
  lingeringEnergyMin: 6,
  fadingVelocityMax: -0.08,
  rekindledSilenceHours: 24
} as const;

export const personalWaveWeights = {
  authoredSimilarity: 0.35,
  interactionSimilarity: 0.2,
  emotionSimilarity: 0.15,
  categorySimilarity: 0.1,
  waveStateRelevance: 0.1,
  freshness: 0.1
} as const;

export const restModeScoreMultiplier = 0.4;
