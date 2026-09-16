import { LEVELS, difficultyModifiers, type LevelConfig } from '../config/levels';
import { STARTER_AIRCRAFT } from '../config/player';
import { isDefeated } from './combat';
import { MAX_STEP_SECONDS } from './constants';
import type { InputState, World } from './entities';
import { createDirectorState, isLevelCleared, updateSpawns } from './levelDirector';
import { clamp } from './math';
import { addScore } from './score';
import { resolveCollisions } from './systems/collisions';
import { updateEnemies } from './systems/enemies';
import { updatePlayer } from './systems/player';
import { updatePlayerWeapon } from './systems/playerWeapon';
import { updateProjectiles } from './systems/projectiles';

export type {
  DirectorState,
  EnemyState,
  GameStatus,
  InputState,
  PlayerState,
  ProjectileOwner,
  ProjectileState,
  World,
} from './entities';

export function createWorld(level: LevelConfig = LEVELS[0]): World {
  const playerConfig = STARTER_AIRCRAFT;

  return {
    status: 'ready',
    elapsed: 0,
    distance: 0,
    score: 0,
    level,
    difficultyModifiers: difficultyModifiers(level.difficulty),
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
    director: createDirectorState(level),
  };
}

/**
 * Advances the simulation by one step. The world is mutated in place for
 * performance; `events` is cleared and repopulated each step and dead entities
 * are compacted in place by the systems.
 *
 * Lifecycle: `ready` (start countdown) → `playing` → `levelComplete` or
 * `gameover`. Terminal states stop simulating.
 */
export function stepWorld(world: World, input: InputState, deltaSeconds: number): void {
  if (world.status === 'levelComplete' || world.status === 'gameover') {
    return;
  }

  const delta = clamp(deltaSeconds, 0, MAX_STEP_SECONDS);
  world.events.length = 0;
  world.elapsed += delta;
  world.distance += world.level.scrollSpeed * delta;

  if (world.status === 'ready') {
    updatePlayer(world, input, delta);
    world.director.startTimer -= delta;

    if (world.director.startTimer <= 0) {
      world.director.startTimer = 0;
      world.status = 'playing';
      world.events.push({ type: 'levelStart', position: { ...world.player.position } });
    }
    return;
  }

  updatePlayer(world, input, delta);
  updatePlayerWeapon(world, input, delta);
  updateProjectiles(world, delta);
  updateSpawns(world, delta);
  updateEnemies(world, delta);
  resolveCollisions(world);

  if (isDefeated(world.player.health)) {
    world.player.health = 0;
    world.status = 'gameover';
    world.events.push({ type: 'playerDestroyed', position: { ...world.player.position } });
    return;
  }

  if (isLevelCleared(world)) {
    world.score = addScore(world.score, world.level.reward.completionBonus);
    world.status = 'levelComplete';
    world.events.push({
      type: 'levelComplete',
      position: { ...world.player.position },
      score: world.score,
    });
  }
}