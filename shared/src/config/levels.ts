import type { Vec2 } from '../types';

export interface Arena {
  width: number;
  height: number;
}

/** Spawn formations. Each maps an index within a group to a spawn position. */
export type FormationType = 'random' | 'line' | 'v' | 'column';

/**
 * A group of enemies spawned together in a formation. Levels are an ordered
 * list of groups; later phases extend this with phases, scaling and bosses.
 */
export interface SpawnGroup {
  enemyTypeId: string;
  count: number;
  formation: FormationType;
  /** Seconds between individual spawns within the group. */
  interval: number;
  /** Seconds to wait before the group begins spawning. */
  startDelay: number;
}

export interface LevelConfig {
  id: string;
  name: string;
  arena: Arena;
  /** Background scroll speed (forward motion sensation) in units per second. */
  scrollSpeed: number;
  spawns: SpawnGroup[];
  playerStart: Vec2;
}

export const TEST_LEVEL_1: LevelConfig = {
  id: 'test-level-1',
  name: 'Test Flight',
  arena: { width: 960, height: 600 },
  scrollSpeed: 260,
  playerStart: { x: 480, y: 500 },
  spawns: [
    { enemyTypeId: 'fighter', count: 6, formation: 'v', interval: 0.35, startDelay: 0.8 },
    { enemyTypeId: 'mine', count: 4, formation: 'random', interval: 0.9, startDelay: 0.6 },
    { enemyTypeId: 'bomber', count: 2, formation: 'line', interval: 1.2, startDelay: 0.8 },
    { enemyTypeId: 'fighter', count: 5, formation: 'line', interval: 0.3, startDelay: 1 },
    { enemyTypeId: 'turret', count: 2, formation: 'column', interval: 1.5, startDelay: 1 },
  ],
};
