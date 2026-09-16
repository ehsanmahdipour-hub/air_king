import { TEST_LEVEL_1 } from '@game/shared';

/** The level used by the prototype. Kept in one place for the client. */
export const LEVEL = TEST_LEVEL_1;

export const GAME_WIDTH = LEVEL.arena.width;
export const GAME_HEIGHT = LEVEL.arena.height;

/** Render ordering. Gameplay never depends on these values. */
export const DEPTH = {
  background: 0,
  enemy: 10,
  projectile: 20,
  player: 30,
  effects: 40,
  hud: 100,
} as const;
