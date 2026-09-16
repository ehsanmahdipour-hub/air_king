// Economy
export {
  economyConfigSchema,
  DEFAULT_ECONOMY_CONFIG,
  type EconomyConfig,
} from './config/economy';
export { calculateCoins } from './core/rewards';

// Shared primitives
export type { Vec2, GameEvent } from './types';

// Game data (configuration)
export {
  BASIC_CANNON,
  WEAPONS,
  getWeapon,
  type WeaponConfig,
} from './config/weapons';
export {
  BASIC_FIGHTER,
  ENEMIES,
  getEnemy,
  type EnemyConfig,
  type EnemyBehavior,
} from './config/enemies';
export { STARTER_AIRCRAFT, type PlayerConfig } from './config/player';
export {
  TEST_LEVEL_1,
  type LevelConfig,
  type Arena,
} from './config/levels';

// Pure game rules
export { clamp, length, normalize, distance, circlesOverlap, randomRange } from './core/math';
export { applyDamage, isDefeated } from './core/combat';
export { addScore, scoreForKill } from './core/score';
export { createProjectiles, type ProjectileSpawn } from './core/weapons';
export {
  createWorld,
  stepWorld,
  type GameStatus,
  type World,
  type InputState,
  type PlayerState,
  type EnemyState,
  type ProjectileState,
} from './core/world';
