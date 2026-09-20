import type { PlayerDifficulty } from '../config/difficulty';
import {
  DEFAULT_ECONOMY_CONFIG,
  difficultyRewardMultiplier,
  economyConfigSchema,
  type EconomyConfig,
} from '../config/economy';

/**
 * Converts a raw gameplay score into coins using the configured ratio. Pure and
 * deterministic; retained for simple score-only conversions.
 */
export function calculateCoins(score: number, config: EconomyConfig): number {
  economyConfigSchema.parse(config);

  if (!Number.isFinite(score) || score < 0) {
    throw new RangeError('score must be a finite, non-negative number');
  }

  const earned = Math.floor(score / config.scorePerCoin);
  return Math.max(earned, config.minCoinsPerLevel);
}

export interface LevelRewardInput {
  /** Gameplay score plus the level completion bonus. */
  totalScore: number;
  levelNumber: number;
  difficulty: PlayerDifficulty;
  /** Rewards are granted only on the first completion. */
  firstCompletion: boolean;
  config?: EconomyConfig;
}

export interface LevelRewardBreakdown {
  /** Coins from the score conversion. */
  scoreCoins: number;
  /** Progressive bonus for the level number. */
  levelBonus: number;
  /** Extra coins from the difficulty multiplier. */
  difficultyBonus: number;
  /** Total coins granted (0 for a replay). */
  totalCoins: number;
}

/**
 * The authoritative level reward. Combines a score-based conversion with a
 * progressive level bonus and a difficulty multiplier. Replays grant nothing,
 * which is what prevents farming a completed level.
 */
export function calculateLevelReward(input: LevelRewardInput): LevelRewardBreakdown {
  const config = input.config ?? DEFAULT_ECONOMY_CONFIG;
  economyConfigSchema.parse(config);

  if (!Number.isFinite(input.totalScore) || input.totalScore < 0) {
    throw new RangeError('totalScore must be a finite, non-negative number');
  }
  if (!Number.isInteger(input.levelNumber) || input.levelNumber < 1) {
    throw new RangeError('levelNumber must be a positive integer');
  }

  if (!input.firstCompletion) {
    return { scoreCoins: 0, levelBonus: 0, difficultyBonus: 0, totalCoins: 0 };
  }

  const scoreCoins = Math.floor(input.totalScore / config.scorePerCoin);
  const levelBonus = Math.round(
    config.levelBonusBase + config.levelBonusPerLevel * (input.levelNumber - 1),
  );
  const multiplier = difficultyRewardMultiplier(config, input.difficulty);
  const subtotal = scoreCoins + levelBonus;
  const difficultyBonus = Math.round(subtotal * (multiplier - 1));
  const totalCoins = Math.max(config.minCoinsPerLevel, subtotal + difficultyBonus);

  return { scoreCoins, levelBonus, difficultyBonus, totalCoins };
}