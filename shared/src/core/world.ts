import { DEFAULT_ECONOMY_CONFIG, type EconomyConfig } from '../config/economy';
import type { AircraftConfig } from '../config/aircraft';
import { LEVELS, difficultyModifiers, type LevelConfig } from '../config/levels';
import type { UpgradeLevels } from '../config/upgrades';
import { DEFAULT_SCORE_CONFIG, type ScoreConfig } from '../config/scoring';
import { isDefeated } from './combat';
import { MAX_STEP_SECONDS } from './constants';
import type { InputState, World } from './entities';
import { createDirectorState, isLevelCleared, updateSpawns } from './levelDirector';
import { resolveLoadout } from './loadout';
import { clamp } from './math';
import { calculateCoins } from './rewards';
import { addScore } from './scoring';
import { resolveCollisions } from './systems/collisions';
import { updateEnemies } from './systems/enemies';
import { updatePlayer } from './systems/player';
import { updatePlayerWeapon } from './systems/playerWeapon';
import { updateProjectiles } from './systems/projectiles';
import type { LevelResult } from '../types';

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

export interface WorldOptions {
  /** Overrides the central economy config (used by tests and later by users). */
  economy?: EconomyConfig;
  /** Overrides the central score config. */
  scoreConfig?: ScoreConfig;
  /** Equipped aircraft applied to the loadout. */
  aircraft?: AircraftConfig;
  /** Player upgrade levels applied to the loadout. */
  upgrades?: Partial<UpgradeLevels>;
}

export function createWorld(level: LevelConfig = LEVELS[0], options: WorldOptions = {}): World {
  const loadout = resolveLoadout({ aircraft: options.aircraft, upgrades: options.upgrades });

  return {
    status: 'ready',
    elapsed: 0,
    distance: 0,
    score: 0,
    result: null,
    level,
    difficultyModifiers: difficultyModifiers(level.difficulty),
    scoreConfig: options.scoreConfig ?? DEFAULT_SCORE_CONFIG,
    economy: options.economy ?? DEFAULT_ECONOMY_CONFIG,
    loadout,
    player: {
      position: { ...level.playerStart },
      radius: loadout.radius,
      health: loadout.maxHealth,
      maxHealth: loadout.maxHealth,
      armor: loadout.armor,
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
    const completionBonus = world.level.reward.completionBonus;
    const totalScore = addScore(world.score, completionBonus);
    const result: LevelResult = {
      levelId: world.level.id,
      levelNumber: world.level.levelNumber,
      levelName: world.level.name,
      score: world.score,
      completionBonus,
      totalScore,
      coins: calculateCoins(totalScore, world.economy),
    };

    world.result = result;
    world.status = 'levelComplete';
    world.events.push({
      type: 'levelComplete',
      position: { ...world.player.position },
      result,
    });
  }
}