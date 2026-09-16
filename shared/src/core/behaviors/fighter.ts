import type { FighterConfig } from '../../config/enemies';
import { clamp } from '../math';
import { advanceTimers, aimAt, isFireReady } from './common';
import type { EnemyBehaviorContext } from './types';

/**
 * Fighter: fast, descends and steers horizontally toward the player, firing
 * aimed single shots. Does not overshoot because horizontal seek is capped.
 */
export function runFighter(context: EnemyBehaviorContext, config: FighterConfig): void {
  const { enemy, player, arena, deltaSeconds } = context;

  advanceTimers(enemy, deltaSeconds);
  enemy.position.y += enemy.speed * deltaSeconds;

  const seekStep = clamp(
    player.position.x - enemy.position.x,
    -config.horizontalSeekSpeed * deltaSeconds,
    config.horizontalSeekSpeed * deltaSeconds,
  );
  enemy.position.x = clamp(
    enemy.position.x + seekStep,
    enemy.radius,
    arena.width - enemy.radius,
  );

  if (enemy.position.y > 0 && isFireReady(enemy, config.fireDelay)) {
    context.fire({ ...enemy.position }, aimAt(enemy.position, player.position), config.projectile);
    enemy.fireCooldown = config.fireInterval;
  }
}
