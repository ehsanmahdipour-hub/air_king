import type { TurretConfig } from '../../config/enemies';
import { advanceTimers, aimAt, isFireReady } from './common';
import type { EnemyBehaviorContext } from './types';

/**
 * Turret: descends to its anchor position, then stops and fires aimed shots at
 * the player. It does not move once anchored.
 */
export function runTurret(context: EnemyBehaviorContext, config: TurretConfig): void {
  const { enemy, player, deltaSeconds } = context;

  advanceTimers(enemy, deltaSeconds);

  if (enemy.position.y < config.anchorY) {
    enemy.position.y = Math.min(config.anchorY, enemy.position.y + enemy.speed * deltaSeconds);
  }

  const anchored = enemy.position.y >= config.anchorY;

  if (anchored && isFireReady(enemy, config.fireDelay)) {
    context.fire({ ...enemy.position }, aimAt(enemy.position, player.position), config.projectile);
    enemy.fireCooldown = config.fireInterval;
  }
}
