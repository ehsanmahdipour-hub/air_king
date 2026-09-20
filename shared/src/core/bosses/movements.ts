import type { BossMovementId } from '../../config/bosses';
import { clamp } from '../math';
import type { BossMovementFn } from './types';

/** Phase speed, falling back to a sensible default. */
function phaseSpeed(boss: { config: { phases: { speed: number }[] }; phaseIndex: number }): number {
  return boss.config.phases[boss.phaseIndex]?.speed ?? 120;
}

function bounceHorizontal(
  boss: { position: { x: number }; radius: number; direction: number },
  arenaWidth: number,
): void {
  if (boss.position.x <= boss.radius) {
    boss.position.x = boss.radius;
    boss.direction = 1;
  } else if (boss.position.x >= arenaWidth - boss.radius) {
    boss.position.x = arenaWidth - boss.radius;
    boss.direction = -1;
  }
}

/**
 * Movement behaviors. Each is small and independent; a phase selects one by id
 * so new movement styles are additions rather than edits.
 */
export const BOSS_MOVEMENTS: Record<BossMovementId, BossMovementFn> = {
  /** Slide horizontally across the arena, bouncing off the edges. */
  sweep: ({ boss, arena, deltaSeconds }) => {
    boss.position.x += boss.direction * phaseSpeed(boss) * deltaSeconds;
    bounceHorizontal(boss, arena.width);
  },

  /** Drift horizontally while bobbing vertically. */
  hover: ({ boss, arena, deltaSeconds }) => {
    boss.position.x += boss.direction * phaseSpeed(boss) * 0.5 * deltaSeconds;
    bounceHorizontal(boss, arena.width);
    boss.position.y = boss.config.entryY + Math.sin(boss.age * 1.6) * 28;
  },

  /** Slowly follow the player horizontally. */
  track: ({ boss, arena, player, deltaSeconds }) => {
    const speed = phaseSpeed(boss);
    const step = clamp(player.position.x - boss.position.x, -speed * deltaSeconds, speed * deltaSeconds);
    boss.position.x = clamp(boss.position.x + step, boss.radius, arena.width - boss.radius);
    boss.position.y = boss.config.entryY;
  },
};