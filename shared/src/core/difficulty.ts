import type { EnemyConfig } from '../config/enemies';
import type { DifficultyModifiers } from '../config/levels';
import type { ProjectileSpec } from '../config/weapons';

/**
 * Applies difficulty modifiers to an enemy config. Difficulty changes speed,
 * fire cadence and projectile speed — health is never inflated.
 */
export function applyDifficulty(
  config: EnemyConfig,
  modifiers: DifficultyModifiers,
): EnemyConfig {
  const speed = config.speed * modifiers.enemySpeedMultiplier;

  switch (config.behavior) {
    case 'fighter':
    case 'bomber':
    case 'turret':
      return {
        ...config,
        speed,
        fireInterval: config.fireInterval * modifiers.fireIntervalMultiplier,
        projectile: scaleProjectile(config.projectile, modifiers.projectileSpeedMultiplier),
      };
    case 'mine':
      return { ...config, speed };
  }
}

function scaleProjectile(spec: ProjectileSpec, speedMultiplier: number): ProjectileSpec {
  return { ...spec, speed: spec.speed * speedMultiplier };
}