import { z } from 'zod';

/**
 * Central economy configuration. This is the single source of truth for how a
 * completed level's score is converted into currency. It is intentionally
 * data-driven so balance changes never require code changes and so the server
 * can validate rewards without trusting the client.
 */
export const economyConfigSchema = z.object({
  /** Score points required to earn a single coin. */
  scorePerCoin: z.number().positive(),
  /** Minimum coins granted for completing a level, regardless of score. */
  minCoinsPerLevel: z.number().int().nonnegative(),
});

export type EconomyConfig = z.infer<typeof economyConfigSchema>;

export const DEFAULT_ECONOMY_CONFIG: EconomyConfig = economyConfigSchema.parse({
  scorePerCoin: 100,
  minCoinsPerLevel: 1,
});
