import { z } from 'zod';

/**
 * Central score configuration. It is the single source of truth for how score
 * is earned from each gameplay source, so balance changes are data changes.
 *
 * The boss/special fields are prepared for later phases and are currently
 * unused by the simulation.
 */
export const scoreConfigSchema = z.object({
  /** Multiplier applied to an enemy's configured score value. */
  killMultiplier: z.number().nonnegative(),
  /** Score per point of damage dealt to a boss (prepared for the boss phase). */
  bossDamageScore: z.number().nonnegative(),
  /** Flat score for defeating a boss (prepared for the boss phase). */
  bossDefeatScore: z.number().nonnegative(),
  /** Multiplier applied to special/elite bonus values (prepared). */
  specialMultiplier: z.number().nonnegative(),
});

export type ScoreConfig = z.infer<typeof scoreConfigSchema>;

export const DEFAULT_SCORE_CONFIG: ScoreConfig = scoreConfigSchema.parse({
  killMultiplier: 1,
  bossDamageScore: 1,
  bossDefeatScore: 0,
  specialMultiplier: 1,
});
