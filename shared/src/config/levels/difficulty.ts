import type { DifficultyModifiers, DifficultyTier } from './types';

/**
 * Difficulty presets. A level references a tier, and these modifiers are
 * applied when enemies spawn (speed, fire cadence, projectile speed).
 */
export const DIFFICULTY_PRESETS: Record<DifficultyTier, DifficultyModifiers> = {
  easy: {
    enemySpeedMultiplier: 1,
    fireIntervalMultiplier: 1.15,
    projectileSpeedMultiplier: 0.95,
  },
  normal: {
    enemySpeedMultiplier: 1,
    fireIntervalMultiplier: 1,
    projectileSpeedMultiplier: 1,
  },
  hard: {
    enemySpeedMultiplier: 1.15,
    fireIntervalMultiplier: 0.85,
    projectileSpeedMultiplier: 1.1,
  },
  expert: {
    enemySpeedMultiplier: 1.3,
    fireIntervalMultiplier: 0.72,
    projectileSpeedMultiplier: 1.2,
  },
};

export function difficultyModifiers(tier: DifficultyTier): DifficultyModifiers {
  return DIFFICULTY_PRESETS[tier];
}