import type { Vec2 } from '../types';

export interface Arena {
  width: number;
  height: number;
}

/**
 * Level definition. The prototype ships a single test level; later phases add
 * levels, waves/formations and bosses purely as data plus spawn strategies.
 */
export interface LevelConfig {
  id: string;
  name: string;
  arena: Arena;
  /** Background scroll speed (forward motion sensation) in units per second. */
  scrollSpeed: number;
  /** Seconds between enemy spawns. */
  spawnInterval: number;
  /** Random additional delay added to each spawn interval. */
  spawnIntervalJitter: number;
  enemyTypeId: string;
  /** Total enemies spawned for this level. */
  enemyCount: number;
  playerStart: Vec2;
}

export const TEST_LEVEL_1: LevelConfig = {
  id: 'test-level-1',
  name: 'Test Flight',
  arena: { width: 960, height: 600 },
  scrollSpeed: 260,
  spawnInterval: 1.1,
  spawnIntervalJitter: 0.4,
  enemyTypeId: 'basic-fighter',
  enemyCount: 20,
  playerStart: { x: 480, y: 500 },
};
