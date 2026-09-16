import { getEnemy, type EnemyConfig } from '../../config/enemies';
import type { Vec2 } from '../../types';
import type { World } from '../entities';
import { formationSpawnPosition } from '../formations';

export function updateSpawning(world: World, delta: number): void {
  const groups = world.level.spawns;
  const group = groups[world.spawnGroupIndex];
  if (!group) {
    return;
  }

  world.spawnTimer -= delta;
  if (world.spawnTimer > 0) {
    return;
  }

  const config = getEnemy(group.enemyTypeId);
  spawnEnemy(
    world,
    config,
    formationSpawnPosition(group.formation, {
      index: world.spawnGroupCount,
      count: group.count,
      radius: config.radius,
      arena: world.level.arena,
    }),
  );

  world.spawnGroupCount += 1;
  world.enemiesSpawned += 1;

  if (world.spawnGroupCount >= group.count) {
    world.spawnGroupIndex += 1;
    world.spawnGroupCount = 0;
    const next = groups[world.spawnGroupIndex];
    world.spawnTimer = next ? next.startDelay : Number.POSITIVE_INFINITY;
  } else {
    world.spawnTimer = group.interval;
  }
}

function spawnEnemy(world: World, config: EnemyConfig, position: Vec2): void {
  world.enemies.push({
    id: world.nextId++,
    typeId: config.id,
    position,
    radius: config.radius,
    health: config.maxHealth,
    maxHealth: config.maxHealth,
    speed: config.speed,
    contactDamage: config.contactDamage,
    scoreValue: config.scoreValue,
    age: 0,
    fireCooldown: 0,
    alive: true,
  });
}
