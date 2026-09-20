import type { EconomyConfig } from '../config/economy';
import type { BossConfig } from '../config/bosses';
import type { EnemyConfig } from '../config/enemies';
import type { DifficultyModifiers, LevelConfig } from '../config/levels';
import type { ScoreConfig } from '../config/scoring';
import type { GameEvent, LevelResult, Vec2 } from '../types';
import type { ResolvedLoadout } from './loadout';

/**
 * Level lifecycle. `ready` is the level-start countdown, `playing` the active
 * level, and `levelComplete` / `gameover` the terminal states.
 */
export type GameStatus = 'ready' | 'playing' | 'levelComplete' | 'gameover';

export type ProjectileOwner = 'player' | 'enemy';

export interface PlayerState {
  position: Vec2;
  radius: number;
  health: number;
  maxHealth: number;
  /** Flat damage reduction from aircraft upgrades. */
  armor: number;
  /** Seconds remaining before the weapon can fire again. */
  fireCooldown: number;
  /** Seconds of remaining damage immunity after a hit. */
  invulnerableFor: number;
}

export interface EnemyState {
  id: number;
  typeId: string;
  /** Effective config, including any difficulty scaling applied at spawn. */
  config: EnemyConfig;
  position: Vec2;
  radius: number;
  health: number;
  maxHealth: number;
  speed: number;
  contactDamage: number;
  scoreValue: number;
  /** Seconds the enemy has existed, used for firing delays. */
  age: number;
  /** Seconds remaining before the enemy can fire again. */
  fireCooldown: number;
  alive: boolean;
}

export interface ProjectileState {
  id: number;
  owner: ProjectileOwner;
  position: Vec2;
  velocity: Vec2;
  radius: number;
  damage: number;
  /** Seconds remaining before the projectile expires. */
  lifeRemaining: number;
  alive: boolean;
}

export interface BossState {
  id: number;
  bossId: string;
  config: BossConfig;
  position: Vec2;
  radius: number;
  health: number;
  maxHealth: number;
  phaseIndex: number;
  /** Index of the next attack pattern to use within the phase. */
  attackIndex: number;
  /** Seconds the boss has been active, used by movement behaviors. */
  age: number;
  attackCooldown: number;
  /** True while the boss descends into the arena and cannot attack. */
  entering: boolean;
  /** Movement direction (+1 / -1) for sweep and hover behaviors. */
  direction: number;
  alive: boolean;
}

/** Movement intent for a single simulation step. */
export interface InputState {
  /** Keyboard movement vector, each axis in [-1, 1]. */
  move: Vec2;
  firing: boolean;
  /** Pointer target when the mouse is the active movement device. */
  mouse?: { active: boolean; position: Vec2 };
}

/** Spawn and completion bookkeeping owned by the level director. */
export interface DirectorState {
  /** Seconds remaining in the `ready` countdown. */
  startTimer: number;
  waveIndex: number;
  groupIndex: number;
  groupSpawnCount: number;
  spawnTimer: number;
  obstacleIndex: number;
  obstacleSpawnCount: number;
  obstacleTimer: number;
  /** Total enemies authored across all waves (per cycle for looping levels). */
  totalEnemies: number;
  enemiesSpawned: number;
  enemiesDestroyed: number;
  /** True once the level's boss has been spawned. */
  bossSpawned: boolean;
  /** True once the level's boss has been defeated. */
  bossDefeated: boolean;
  /** Seconds until the boss spawns; -1 until the trigger conditions are met. */
  bossSpawnTimer: number;
}

export interface World {
  status: GameStatus;
  elapsed: number;
  /** Total forward distance travelled, used to scroll and to complete levels. */
  distance: number;
  /** Score earned during gameplay (enemies, and later bosses/specials). */
  score: number;
  /** Set when the level is completed; drives the level-complete UI. */
  result: LevelResult | null;
  level: LevelConfig;
  /** Difficulty scaling resolved from the level tier, applied at spawn. */
  difficultyModifiers: DifficultyModifiers;
  /** Central score rules (kill multiplier, boss/special values). */
  scoreConfig: ScoreConfig;
  /** Central economy rules used to convert score into coins. */
  economy: EconomyConfig;
  /** Effective player/weapon stats after applying upgrade levels. */
  loadout: ResolvedLoadout;
  player: PlayerState;
  enemies: EnemyState[];
  /** Active boss, or null when the level has none or it is defeated. */
  boss: BossState | null;
  projectiles: ProjectileState[];
  /** Events produced during the last step, consumed by the presentation layer. */
  events: GameEvent[];
  nextId: number;
  director: DirectorState;
}