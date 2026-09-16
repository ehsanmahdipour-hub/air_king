import type { LevelConfig } from '../config/levels';
import type { GameEvent, Vec2 } from '../types';

export type GameStatus = 'running' | 'gameover';

export type ProjectileOwner = 'player' | 'enemy';

export interface PlayerState {
  position: Vec2;
  radius: number;
  health: number;
  maxHealth: number;
  /** Seconds remaining before the weapon can fire again. */
  fireCooldown: number;
  /** Seconds of remaining damage immunity after a hit. */
  invulnerableFor: number;
}

export interface EnemyState {
  id: number;
  typeId: string;
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

/** Movement intent for a single simulation step. */
export interface InputState {
  /** Keyboard movement vector, each axis in [-1, 1]. */
  move: Vec2;
  firing: boolean;
  /** Pointer target when the mouse is the active movement device. */
  mouse?: { active: boolean; position: Vec2 };
}

export interface World {
  status: GameStatus;
  elapsed: number;
  /** Total forward distance travelled, used to scroll the environment. */
  distance: number;
  score: number;
  level: LevelConfig;
  player: PlayerState;
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  /** Events produced during the last step, consumed by the presentation layer. */
  events: GameEvent[];
  nextId: number;
  /** Index of the spawn group currently being emitted. */
  spawnGroupIndex: number;
  /** Enemies already spawned within the current group. */
  spawnGroupCount: number;
  spawnTimer: number;
  enemiesSpawned: number;
  enemiesDestroyed: number;
}
