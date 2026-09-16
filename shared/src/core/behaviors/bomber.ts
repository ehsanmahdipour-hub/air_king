import type { BomberConfig } from '../../config/enemies';
import { advanceTimers, isFireReady } from './common';
import type { EnemyBehaviorContext } from './types';

const DOWN_ANGLE = Math.PI / 2;

/**
 * Bomber: slow and tough, descends while dropping a spread salvo straight down.
 * The salvo shape comes from the projectile spec (count/spread).
 */
export function runBomber(context: EnemyBehaviorContext, config: BomberConfig): void {
  const { enemy, deltaSeconds } = context;

  advanceTimers(enemy, deltaSeconds);
  enemy.position.y += enemy.speed * deltaSeconds;

  if (enemy.position.y > 0 && isFireReady(enemy, config.fireDelay)) {
    context.fire({ ...enemy.position }, DOWN_ANGLE, config.projectile);
    enemy.fireCooldown = config.fireInterval;
  }
}
