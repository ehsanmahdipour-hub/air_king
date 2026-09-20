import { runBomber } from './bomber';
import { runDiver } from './diver';
import { runFighter } from './fighter';
import { runMine } from './mine';
import { runTurret } from './turret';
import type { EnemyBehaviorContext } from './types';

export type { EnemyBehaviorContext } from './types';

/**
 * Behavior registry. Each enemy carries its effective config (difficulty
 * applied at spawn), so no registry lookup is needed per frame. The switch
 * narrows the config union, so each behavior receives its exact config type and
 * adding a behavior is a compile-checked addition here rather than an engine
 * change.
 */
export function runEnemyBehavior(context: EnemyBehaviorContext): void {
  const config = context.enemy.config;

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
    case 'diver':
      runDiver(context, config);
      break;
  }
}