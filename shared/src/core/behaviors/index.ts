import { getEnemy } from '../../config/enemies';
import { runBomber } from './bomber';
import { runFighter } from './fighter';
import { runMine } from './mine';
import { runTurret } from './turret';
import type { EnemyBehaviorContext } from './types';

export type { EnemyBehaviorContext } from './types';

/**
 * Behavior registry. The switch narrows the config union, so each behavior
 * receives its exact config type and adding a behavior is a compile-checked
 * addition here rather than an engine change.
 */
export function runEnemyBehavior(context: EnemyBehaviorContext): void {
  const config = getEnemy(context.enemy.typeId);

  switch (config.behavior) {
    case 'fighter':
      runFighter(context, config);
      break;
    case 'bomber':
      runBomber(context, config);
      break;
    case 'mine':
      runMine(context, config);
      break;
    case 'turret':
      runTurret(context, config);
      break;
  }
}
