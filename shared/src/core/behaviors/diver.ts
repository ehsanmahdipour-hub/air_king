import type { DiverConfig } from '../../config/enemies';
import { normalize } from '../math';
import { advanceTimers } from './common';
import type { EnemyBehaviorContext } from './types';

/**
 * Diver: descends normally, but once the player is within its horizontal range
 * it commits to a fast dive straight at the player. A distinct threat from the
 * fighter (which strafes and shoots) and the mine (which drifts passively).
 */
export function runDiver(context: EnemyBehaviorContext, config: DiverConfig): void {
  const { enemy, player, deltaSeconds } = context;

  advanceTimers(enemy, deltaSeconds);

  const dx = player.position.x - enemy.position.x;
  const diving = Math.abs(dx) <= config.diveRange && enemy.position.y < player.position.y;

  if (diving) {
    const direction = normalize({
      x: dx,
      y: player.position.y - enemy.position.y,
    });
    enemy.position.x += direction.x * config.diveSpeed * deltaSeconds;
    enemy.position.y += direction.y * config.diveSpeed * deltaSeconds;
  } else {
    enemy.position.y += enemy.speed * deltaSeconds;
  }
}