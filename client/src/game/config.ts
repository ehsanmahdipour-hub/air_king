import { LEVELS, type LevelConfig } from '@game/shared';

/** Campaign levels in order. */
export const CAMPAIGN: LevelConfig[] = LEVELS;

/** All test levels share the same arena, so one size drives the Phaser canvas. */
export const GAME_WIDTH = LEVELS[0].arena.width;
export const GAME_HEIGHT = LEVELS[0].arena.height;

/** Render ordering. Gameplay never depends on these values. */
export const DEPTH = {
  background: 0,
  enemy: 10,
  projectile: 20,
  player: 30,
  effects: 40,
  hud: 100,
} as const;
