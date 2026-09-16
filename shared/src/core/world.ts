import { TEST_LEVEL_1, type LevelConfig } from '../config/levels';
import { STARTER_AIRCRAFT } from '../config/player';
import { isDefeated } from './combat';
import { MAX_STEP_SECONDS } from './constants';
import type { InputState, World } from './entities';
import { clamp } from './math';
import { resolveCollisions } from './systems/collisions';
import { updateEnemies } from './systems/enemies';
import { updatePlayer } from './systems/player';
import { updatePlayerWeapon } from './systems/playerWeapon';
import { updateProjectiles } from './systems/projectiles';
import { updateSpawning } from './systems/spawning';

export type {
  EnemyState,
  GameStatus,
  InputState,
  PlayerState,
  ProjectileOwner,
  ProjectileState,
  World,
} from './entities';

export function createWorld(level: LevelConfig = TEST_LEVEL_1): World {
  const firstGroup = level.spawns[0];
  const playerConfig = STARTER_AIRCRAFT;

  return {
    status: 'running',
    elapsed: 0,
    distance: 0,
    score: 0,
    level,
    player: {
      position: { ...level.playerStart },
      radius: playerConfig.radius,
      health: playerConfig.maxHealth,
      maxHealth: playerConfig.maxHealth,
      fireCooldown: 0,
      invulnerableFor: 0,
    },
    enemies: [],
    projectiles: [],
    events: [],
    nextId: 1,
    spawnGroupIndex: 0,
    spawnGroupCount: 0,
    spawnTimer: firstGroup ? firstGroup.startDelay : Number.POSITIVE_INFINITY,
    enemiesSpawned: 0,
    enemiesDestroyed: 0,
  };
}

/**
 * Advances the simulation by one step. The world is mutated in place for
 * performance; `events` is cleared and repopulated each step and dead entities
 * are compacted in place by the systems.
 */
export function stepWorld(world: World, input: InputState, deltaSeconds: number): void {
  if (world.status !== 'running') {
    return;
  }

  const delta = clamp(deltaSeconds, 0, MAX_STEP_SECONDS);
  world.events.length = 0;
  world.elapsed += delta;
  world.distance += world.level.scrollSpeed * delta;

  updatePlayer(world, input, delta);
  updatePlayerWeapon(world, input, delta);
  updateProjectiles(world, delta);
  updateSpawning(world, delta);
  updateEnemies(world, delta);
  resolveCollisions(world);

  if (isDefeated(world.player.health)) {
    world.player.health = 0;
    world.status = 'gameover';
    world.events.push({ type: 'playerDestroyed', position: { ...world.player.position } });
  }
}
