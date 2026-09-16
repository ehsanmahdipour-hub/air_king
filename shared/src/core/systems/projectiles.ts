import type { ProjectileSpec } from '../../config/weapons';
import type { Vec2 } from '../../types';
import { compact } from '../collections';
import { CULL_MARGIN } from '../constants';
import type { ProjectileOwner, World } from '../entities';
import { createProjectiles, type ProjectileSpawn } from '../weapons';

export function spawnProjectile(
  world: World,
  owner: ProjectileOwner,
  spawn: ProjectileSpawn,
): void {
  world.projectiles.push({
    id: world.nextId++,
    owner,
    position: spawn.position,
    velocity: spawn.velocity,
    radius: spawn.radius,
    damage: spawn.damage,
    lifeRemaining: spawn.lifeSeconds,
    alive: true,
  });
}

/** Creates one enemy shot from a behavior's fire request. */
export function spawnEnemyProjectiles(
  world: World,
  origin: Vec2,
  angleRadians: number,
  spec: ProjectileSpec,
): void {
  for (const spawn of createProjectiles(origin, spec, angleRadians)) {
    spawnProjectile(world, 'enemy', spawn);
  }

  world.events.push({ type: 'enemyShot', position: { ...origin } });
}

export function updateProjectiles(world: World, delta: number): void {
  const { arena } = world.level;

  for (const projectile of world.projectiles) {
    projectile.position.x += projectile.velocity.x * delta;
    projectile.position.y += projectile.velocity.y * delta;
    projectile.lifeRemaining -= delta;

    if (
      projectile.lifeRemaining <= 0 ||
      projectile.position.x < -CULL_MARGIN ||
      projectile.position.x > arena.width + CULL_MARGIN ||
      projectile.position.y < -CULL_MARGIN ||
      projectile.position.y > arena.height + CULL_MARGIN
    ) {
      projectile.alive = false;
    }
  }

  compact(world.projectiles);
}
