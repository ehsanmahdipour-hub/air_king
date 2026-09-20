import type { BossAttackId } from '../../config/bosses';
import { angleBetween } from '../math';
import type { BossAttackFn } from './types';

/**
 * Attack patterns. Each uses the boss's projectile spec with count/spread
 * overrides, so patterns are independent of the boss's base damage.
 */
export const BOSS_ATTACKS: Record<BossAttackId, BossAttackFn> = {
  /** Fan of projectiles aimed at the player. */
  spread: ({ boss, player, fire }) => {
    fire(
      { ...boss.config.projectile, count: 5, spreadDegrees: 60 },
      angleBetween(boss.position, player.position),
    );
  },

  /** Tight burst of projectiles aimed at the player. */
  'aimed-burst': ({ boss, player, fire }) => {
    fire(
      { ...boss.config.projectile, count: 3, spreadDegrees: 14 },
      angleBetween(boss.position, player.position),
    );
  },

  /** Ring of projectiles in every direction. */
  radial: ({ boss, fire }) => {
    fire({ ...boss.config.projectile, count: 12, spreadDegrees: 360 }, 0);
  },
};