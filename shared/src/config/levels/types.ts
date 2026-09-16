import type { Vec2 } from '../../types';

export interface Arena {
  width: number;
  height: number;
}

/** Spawn formations. Each maps an index within a group to a spawn position. */
export type FormationType = 'random' | 'line' | 'v' | 'column';

export type DifficultyTier = 'easy' | 'normal' | 'hard' | 'expert';

/**
 * Numeric difficulty scaling. Difficulty evolves through speed, fire cadence
 * and projectile speed (plus enemy counts/combinations/formations authored in
 * the waves) — never by simply inflating health.
 */
export interface DifficultyModifiers {
  enemySpeedMultiplier: number;
  /** Multiplier on enemy time-between-shots; below 1 fires more often. */
  fireIntervalMultiplier: number;
  projectileSpeedMultiplier: number;
}

export interface EnvironmentConfig {
  id: string;
  displayName: string;
  /** Background colour as 0xRRGGBB. */
  backgroundColor: number;
  /** Tint applied to background stars as 0xRRGGBB. */
  starTint: number;
}

/** A set of enemies spawned together in one formation. */
export interface SpawnGroup {
  enemyTypeId: string;
  count: number;
  formation: FormationType;
  /** Seconds between individual spawns within the group. */
  interval: number;
  /** Seconds before the group starts, after the previous group finishes. */
  startDelay: number;
}

/** A sequential wave made of one or more spawn groups. */
export interface WaveConfig {
  id?: string;
  label?: string;
  /** Seconds before the wave starts (level start or previous wave end). */
  startDelay: number;
  groups: SpawnGroup[];
}

/** An environmental hazard section that runs on its own parallel timeline. */
export interface ObstacleSection {
  enemyTypeId: string;
  count: number;
  formation: FormationType;
  interval: number;
  /** Seconds before this section starts, after level start or the previous section. */
  startDelay: number;
}

/** Boss slot for a level. Consumed by the boss system in a later phase. */
export interface BossReference {
  bossId: string;
  /** Distance mark at which the boss appears once the boss system exists. */
  atDistance?: number;
}

export interface LevelRewardConfig {
  /** Score added when the level is completed. */
  completionBonus: number;
}

export type CompletionMode = 'clear-waves' | 'reach-distance';

/**
 * The full level definition. Levels are pure data: adding a level never
 * requires gameplay code, and the loader validates the shape before use.
 */
export interface LevelConfig {
  id: string;
  levelNumber: number;
  name: string;
  difficulty: DifficultyTier;
  environment: EnvironmentConfig;
  arena: Arena;
  /** Background scroll speed (forward motion) in units per second. */
  scrollSpeed: number;
  /** Seconds of "get ready" before gameplay starts. */
  startDelaySeconds: number;
  completionMode: CompletionMode;
  /** Required for `reach-distance` levels: distance to travel to complete. */
  lengthUnits?: number;
  /** Repeats waves until the distance goal is reached (`reach-distance` only). */
  loopWaves?: boolean;
  waves: WaveConfig[];
  obstacleSections: ObstacleSection[];
  boss?: BossReference;
  reward: LevelRewardConfig;
  playerStart: Vec2;
}