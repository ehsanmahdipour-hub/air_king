// Economy
export {
  economyConfigSchema,
  DEFAULT_ECONOMY_CONFIG,
  type EconomyConfig,
} from './config/economy';
export { calculateCoins } from './core/rewards';

// Scoring
export {
  scoreConfigSchema,
  DEFAULT_SCORE_CONFIG,
  type ScoreConfig,
} from './config/scoring';

// Shared primitives
export type {
  Vec2,
  GameEvent,
  LevelResult,
  PlayerProfileData,
  LevelProgressData,
  ProgressResponse,
  CompleteLevelReward,
  CompleteLevelResponse,
  UpgradesResponse,
  PurchaseUpgradeResponse,
} from './types';

// Game data (configuration)
export {
  BASIC_CANNON,
  WEAPONS,
  getWeapon,
  type WeaponConfig,
  type ProjectileSpec,
} from './config/weapons';
export {
  FIGHTER,
  BOMBER,
  MINE,
  TURRET,
  ENEMIES,
  getEnemy,
  type EnemyConfig,
  type EnemyBehavior,
  type EnemyBaseConfig,
  type FighterConfig,
  type BomberConfig,
  type MineConfig,
  type TurretConfig,
} from './config/enemies';
export { STARTER_AIRCRAFT, type PlayerConfig } from './config/player';
export {
  UPGRADES,
  DEFAULT_UPGRADE_LEVELS,
  getUpgrade,
  isUpgradeId,
  clampUpgradeLevel,
  upgradeValue,
  upgradeNextValue,
  upgradeCost,
  assertUpgradeConfigs,
  type UpgradeConfig,
  type UpgradeCategory,
  type UpgradeId,
  type UpgradeStat,
  type UpgradeLevels,
} from './config/upgrades';

// Level data (configuration + validation)
export {
  LEVELS,
  levelCount,
  getLevel,
  getLevelByNumber,
  getLevelIndex,
  getNextLevelId,
  ENVIRONMENTS,
  DIFFICULTY_PRESETS,
  difficultyModifiers,
  levelConfigSchema,
  parseLevelConfig,
  assertLevelSemantics,
  type LevelConfig,
  type LevelRewardConfig,
  type WaveConfig,
  type SpawnGroup,
  type ObstacleSection,
  type EnvironmentConfig,
  type EnvironmentId,
  type Arena,
  type FormationType,
  type DifficultyTier,
  type DifficultyModifiers,
  type CompletionMode,
  type BossReference,
} from './config/levels';

// Pure game rules
export { clamp, length, normalize, distance, circlesOverlap, angleBetween, randomRange } from './core/math';
export { applyDamage, applyArmor, isDefeated } from './core/combat';
export { resolveLoadout, type ResolvedLoadout } from './core/loadout';
export { addScore, scoreForEnemyDestroyed, scoreForBossDamage, scoreForBossDefeat, scoreForSpecial, maxAchievableScore } from './core/scoring';
export { createProjectiles, type ProjectileSpawn } from './core/weapons';
export { formationSpawnPosition, type FormationParams } from './core/formations';
export { applyDifficulty } from './core/difficulty';
export { runEnemyBehavior, type EnemyBehaviorContext } from './core/behaviors';
export {
  createDirectorState,
  updateSpawns,
  isLevelCleared,
} from './core/levelDirector';
export { isLevelUnlocked } from './core/progression';
export {
  createWorld,
  stepWorld,
  type GameStatus,
  type World,
  type DirectorState,
  type InputState,
  type PlayerState,
  type EnemyState,
  type ProjectileState,
  type ProjectileOwner,
} from './core/world';
