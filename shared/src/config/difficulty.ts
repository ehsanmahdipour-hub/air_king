/**
 * Player-selectable difficulty. This is deliberately separate from a level's
 * design tier: the level tier describes content, this describes how forgiving
 * the player wants the run to be. Both combine in `resolveDifficulty`.
 */

export type PlayerDifficulty = 'easy' | 'normal' | 'hard';

export const PLAYER_DIFFICULTY_IDS = ['easy', 'normal', 'hard'] as const;

export interface PlayerDifficultyConfig {
  id: PlayerDifficulty;
  displayName: string;
  description: string;
  /** Scales enemy maximum health. */
  enemyHealthMultiplier: number;
  /** Scales enemy contact and projectile damage. */
  enemyDamageMultiplier: number;
  /** Scales enemy movement speed. */
  enemySpeedMultiplier: number;
  /** Above 1 spawns more frequently (spawn intervals are divided by it). */
  spawnRateMultiplier: number;
  /** Above 1 fires more frequently (fire intervals are divided by it). */
  projectileDensityMultiplier: number;
  /** Scales the player's weapon damage. */
  playerDamageMultiplier: number;
}

export const PLAYER_DIFFICULTIES: Record<PlayerDifficulty, PlayerDifficultyConfig> = {
  easy: {
    id: 'easy',
    displayName: 'Easy',
    description: 'Gentler enemies and a more forgiving run.',
    enemyHealthMultiplier: 0.85,
    enemyDamageMultiplier: 0.55,
    enemySpeedMultiplier: 0.85,
    spawnRateMultiplier: 0.8,
    projectileDensityMultiplier: 0.7,
    playerDamageMultiplier: 1.3,
  },
  normal: {
    id: 'normal',
    displayName: 'Normal',
    description: 'The intended AIR KINGS experience.',
    enemyHealthMultiplier: 1,
    enemyDamageMultiplier: 1,
    enemySpeedMultiplier: 1,
    spawnRateMultiplier: 1,
    projectileDensityMultiplier: 1,
    playerDamageMultiplier: 1,
  },
  hard: {
    id: 'hard',
    displayName: 'Hard',
    description: 'Faster, tougher and far more aggressive enemies.',
    enemyHealthMultiplier: 1.15,
    enemyDamageMultiplier: 1.4,
    enemySpeedMultiplier: 1.15,
    spawnRateMultiplier: 1.3,
    projectileDensityMultiplier: 1.35,
    playerDamageMultiplier: 0.85,
  },
};

export const DEFAULT_PLAYER_DIFFICULTY: PlayerDifficulty = 'normal';

export function getPlayerDifficulty(id: PlayerDifficulty): PlayerDifficultyConfig {
  return PLAYER_DIFFICULTIES[id];
}