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
  AircraftStateData,
  AircraftResponse,
  PurchaseAircraftResponse,
} from './types';

// Game data (configuration)
export {
  BASIC_CANNON,
  DOUBLE_SHOT,
  SPREAD_SHOT,
  RAILGUN,
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
  DIVER,
  ENEMIES,
  getEnemy,
  type EnemyConfig,
  type EnemyBehavior,
  type EnemyBaseConfig,
  type FighterConfig,
  type BomberConfig,
  type MineConfig,
  type TurretConfig,
  type DiverConfig,
} from './config/enemies';
export {
  DREADNOUGHT,
  HYDRA,
  LEVIATHAN,
  BOSSES,
  getBoss,
  isBossId,
  assertBossConfigs,
  type BossConfig,
  type BossPhaseConfig,
  type BossMovementId,
  type BossAttackId,
} from './config/bosses';
export { STARTER_AIRCRAFT, INTERCEPTOR, FORTRESS, GUNSHIP, PHANTOM, RAPTOR, AIRCRAFT, DEFAULT_AIRCRAFT_ID, getAircraft, isAircraftId, canPurchaseAircraft, assertAircraftConfigs, type AircraftConfig, type AircraftAvailability, type AircraftUnlock, type AircraftAbility, type AircraftPurchaseReason, type AircraftPurchaseCheck } from './config/aircraft';
export {
  gameSettingsSchema,
  movementControlSchema,
  shootingControlSchema,
  DEFAULT_SETTINGS,
  parseSettings,
  type GameSettings,
  type MovementControl,
  type ShootingControl,
} from './config/settings';
export {
  PLAYER_DIFFICULTIES,
  PLAYER_DIFFICULTY_IDS,
  DEFAULT_PLAYER_DIFFICULTY,
  getPlayerDifficulty,
  type PlayerDifficulty,
  type PlayerDifficultyConfig,
} from './config/difficulty';
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
  buildCampaignLevel,
  buildCampaignLevels,
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
export { resolveLoadout, upgradeEffectiveValue, type ResolvedLoadout, type LoadoutInput } from './core/loadout';
export {
  runBossMovement,
  runBossAttack,
  type BossMovementContext,
  type BossMovementFn,
  type BossAttackContext,
  type BossAttackFn,
} from './core/bosses';
export { spawnBoss, updateBoss, defeatBoss } from './core/systems/boss';
export { addScore, scoreForEnemyDestroyed, scoreForBossDamage, scoreForBossDefeat, scoreForSpecial, maxAchievableScore } from './core/scoring';
export { createProjectiles, type ProjectileSpawn } from './core/weapons';
export { formationSpawnPosition, type FormationParams } from './core/formations';
export { applyDifficulty, resolveDifficulty, type ResolvedDifficulty } from './core/difficulty';
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
  type BossState,
} from './core/world';
