import { z } from 'zod';

import type { PlayerDifficulty } from './difficulty';

/**
 * Central economy configuration. The single source of truth for how a completed
 * level turns into coins. Rewards are a hybrid: a score-based conversion plus a
 * progressive level bonus, scaled by difficulty. Everything is data-driven so
 * the server can recompute rewards without trusting the client.
 */
export const economyConfigSchema = z.object({
  /** Score points required to earn a single coin. */
  scorePerCoin: z.number().positive(),
  /** Minimum coins granted for a first completion, regardless of score. */
  minCoinsPerLevel: z.number().int().nonnegative(),
  /** Base coins for a first completion. */
  levelBonusBase: z.number().nonnegative(),
  /** Additional coins per level beyond the first. */
  levelBonusPerLevel: z.number().nonnegative(),
  /** Multiplier applied to the completion reward per difficulty. */
  difficultyBonus: z.object({
    easy: z.number().positive(),
    normal: z.number().positive(),
    hard: z.number().positive(),
  }),
});

export type EconomyConfig = z.infer<typeof economyConfigSchema>;

export const DEFAULT_ECONOMY_CONFIG: EconomyConfig = economyConfigSchema.parse({
  scorePerCoin: 100,
  minCoinsPerLevel: 1,
  levelBonusBase: 15,
  levelBonusPerLevel: 6,
  difficultyBonus: { easy: 0.8, normal: 1, hard: 1.25 },
});

export function difficultyRewardMultiplier(
  config: EconomyConfig,
  difficulty: PlayerDifficulty,
): number {
  return config.difficultyBonus[difficulty];
}