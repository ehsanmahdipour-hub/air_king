/** Shared primitive types used across game data and simulation. */

import type { UpgradeId, UpgradeLevels } from './config/upgrades';

export interface Vec2 {
  x: number;
  y: number;
}

/** Outcome of a completed level, produced by centralized score/reward rules. */
export interface LevelResult {
  levelId: string;
  levelNumber: number;
  levelName: string;
  /** Score earned during gameplay (enemies, and later bosses/specials). */
  score: number;
  /** Bonus awarded for completing the level. */
  completionBonus: number;
  /** score + completionBonus. */
  totalScore: number;
  /** totalScore converted to coins via the central economy config. */
  coins: number;
}

/** Player progression as persisted and returned by the API. */
export interface PlayerProfileData {
  coins: number;
  totalScore: number;
  highestScore: number;
  /** Furthest unlocked level id. */
  currentLevelId: string;
  /** Id of the currently equipped aircraft. */
  equippedAircraftId: string;
}

export interface LevelProgressData {
  levelId: string;
  completed: boolean;
  bestScore: number;
}

export interface ProgressResponse {
  profile: PlayerProfileData;
  levels: LevelProgressData[];
}

/** Server-computed reward for a completed level. */
export interface CompleteLevelReward {
  score: number;
  completionBonus: number;
  totalScore: number;
  coins: number;
}

export interface CompleteLevelResponse {
  profile: PlayerProfileData;
  level: LevelProgressData;
  result: CompleteLevelReward;
  /** True when this was the level's first completion (coins were awarded). */
  firstCompletion: boolean;
}

/** Player upgrade levels keyed by upgrade id. */
export interface UpgradesResponse {
  profile: PlayerProfileData;
  upgrades: UpgradeLevels;
}

export interface PurchaseUpgradeResponse {
  profile: PlayerProfileData;
  upgrade: { id: UpgradeId; level: number };
}

/** Ownership state of one aircraft for the current player. */
export interface AircraftStateData {
  id: string;
  owned: boolean;
  equipped: boolean;
}

export interface AircraftResponse {
  profile: PlayerProfileData;
  aircraft: AircraftStateData[];
}

export interface PurchaseAircraftResponse {
  profile: PlayerProfileData;
  aircraft: AircraftStateData;
}

/** Events emitted by the simulation for the presentation layer to react to. */
export type GameEvent =
  | { type: 'levelStart'; position: Vec2 }
  | { type: 'levelComplete'; position: Vec2; result: LevelResult }
  | { type: 'shotFired'; position: Vec2 }
  | { type: 'enemyShot'; position: Vec2 }
  | { type: 'enemyHit'; position: Vec2; damage: number }
  | { type: 'enemyDestroyed'; position: Vec2; score: number }
  | { type: 'playerHit'; position: Vec2; damage: number }
  | { type: 'playerDestroyed'; position: Vec2 };