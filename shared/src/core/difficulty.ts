import type { EnemyConfig } from '../config/enemies';
import type { DifficultyTier } from '../config/levels';
import { difficultyModifiers } from '../config/levels';
import { getPlayerDifficulty, type PlayerDifficulty } from '../config/difficulty';
import type { ProjectileSpec } from '../config/weapons';

/**
 * One difficulty descriptor combining the level's design tier with the player's
 * chosen difficulty. Every gameplay system reads from this single object, so
 * difficulty is not scattered across levels or enemies.
 */
export interface ResolvedDifficulty {
  /** Enemy maximum-health multiplier. */
  enemyHealth: number;
  /** Enemy contact/projectile damage multiplier. */
  enemyDamage: number;
  /** Enemy movement-speed multiplier. */
  enemySpeed: number;
  /** Enemy projectile-speed multiplier. */
  projectileSpeed: number;
  /** Enemy fire-interval multiplier (below 1 fires more often). */
  fireInterval: number;
  /** Spawn-rate multiplier (above 1 spawns more often). */
  spawnRate: number;
  /** Player weapon damage multiplier. */
  playerDamage: number;
}

export function resolveDifficulty(
  levelTier: DifficultyTier,
  playerDifficulty: PlayerDifficulty,
): ResolvedDifficulty {
  const level = difficultyModifiers(levelTier);
  const profile = getPlayerDifficulty(playerDifficulty);

  return {
    enemyHealth: profile.enemyHealthMultiplier,
    enemyDamage: profile.enemyDamageMultiplier,
    enemySpeed: level.enemySpeedMultiplier * profile.enemySpeedMultiplier,
    projectileSpeed: level.projectileSpeedMultiplier,
    fireInterval: level.fireIntervalMultiplier / profile.projectileDensityMultiplier,
    spawnRate: profile.spawnRateMultiplier,
    playerDamage: profile.playerDamageMultiplier,
  };
}

/**
 * Applies resolved difficulty to an enemy config: speed, health, damage, fire
 * cadence and projectile speed/damage. The base config is never mutated.
 */
export function applyDifficulty(
  config: EnemyConfig,
  difficulty: ResolvedDifficulty,
): EnemyConfig {
  const common = {
    speed: config.speed * difficulty.enemySpeed,
    maxHealth: Math.max(1, Math.round(config.maxHealth * difficulty.enemyHealth)),
    contactDamage: Math.max(0, config.contactDamage * difficulty.enemyDamage),
  };

  switch (config.behavior) {
    case 'fighter':
      return {
        ...config,
        ...common,
        fireInterval: config.fireInterval * difficulty.fireInterval,
        projectile: scaleProjectile(config.projectile, difficulty.projectileSpeed, difficulty.enemyDamage),
      };
    case 'bomber':
      return {
        ...config,
        ...common,
        fireInterval: config.fireInterval * difficulty.fireInterval,
        projectile: scaleProjectile(config.projectile, difficulty.projectileSpeed, difficulty.enemyDamage),
      };
    case 'turret':
      return {
        ...config,
        ...common,
        fireInterval: config.fireInterval * difficulty.fireInterval,
        projectile: scaleProjectile(config.projectile, difficulty.projectileSpeed, difficulty.enemyDamage),
      };
    case 'mine':
      return { ...config, ...common };
    case 'diver':
      return { ...config, ...common };
  }
}

function scaleProjectile(
  spec: ProjectileSpec,
  speedMultiplier: number,
  damageMultiplier: number,
): ProjectileSpec {
  return {
    ...spec,
    speed: spec.speed * speedMultiplier,
    damage: Math.max(0, spec.damage * damageMultiplier),
  };
}