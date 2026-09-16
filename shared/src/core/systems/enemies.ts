import { runEnemyBehavior, type EnemyBehaviorContext } from '../behaviors';
import { compact } from '../collections';
import { CULL_MARGIN } from '../constants';
import type { World } from '../entities';
import { spawnEnemyProjectiles } from './projectiles';

export function updateEnemies(world: World, delta: number): void {
  const { arena } = world.level;
  const first = world.enemies[0];
  if (!first) {
    return;
  }

  // One reusable context per step keeps the enemy update allocation-free.
  const context: EnemyBehaviorContext = {
    enemy: first,
    player: world.player,
    arena,
    deltaSeconds: delta,
    fire: (origin, angle, spec) => spawnEnemyProjectiles(world, origin, angle, spec),
  };

  for (const enemy of world.enemies) {
    if (!enemy.alive) {
      continue;
    }

    context.enemy = enemy;
    runEnemyBehavior(context);

    if (enemy.position.y - enemy.radius > arena.height + CULL_MARGIN) {
      enemy.alive = false;
    }
  }

  compact(world.enemies);
}
