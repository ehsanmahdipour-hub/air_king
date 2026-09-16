import type { MineConfig } from '../../config/enemies';
import { advanceTimers } from './common';
import type { EnemyBehaviorContext } from './types';

/**
 * Mine: a passive drifting obstacle. It descends with the terrain and damages
 * the player on contact; it never fires. Defined explicitly so the roster and
 * registry stay uniform.
 */
export function runMine(context: EnemyBehaviorContext, _config: MineConfig): void {
  const { enemy, deltaSeconds } = context;

  advanceTimers(enemy, deltaSeconds);
  enemy.position.y += enemy.speed * deltaSeconds;
}
