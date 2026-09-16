import { economyConfigSchema, type EconomyConfig } from '../config/economy';

/**
 * Converts a raw gameplay score into a coin reward using the central economy
 * configuration. Pure and deterministic so it can be reused by both the client
 * (for previews) and the server (for authoritative rewards).
 */
export function calculateCoins(score: number, config: EconomyConfig): number {
  economyConfigSchema.parse(config);

  if (!Number.isFinite(score) || score < 0) {
    throw new RangeError('score must be a finite, non-negative number');
  }

  const earned = Math.floor(score / config.scorePerCoin);
  return Math.max(earned, config.minCoinsPerLevel);
}
