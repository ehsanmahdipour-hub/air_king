import type { ProjectileSpec } from './weapons';

/**
 * Boss definitions. A boss is data: phases, per-phase movement and attack
 * patterns, health and rewards. The framework in `core/bosses` interprets this
 * data, so new bosses are content rather than engine changes.
 */

export type BossMovementId = 'sweep' | 'hover' | 'track';

export type BossAttackId = 'spread' | 'aimed-burst' | 'radial';

export interface BossPhaseConfig {
  /** The phase is active while health fraction is above this value. */
  untilHealthFraction: number;
  movement: BossMovementId;
  /** Attack patterns used in this phase, cycled in order. */
  attacks: BossAttackId[];
  /** Seconds between attacks in this phase. */
  attackInterval: number;
  /** Movement speed used by the phase's movement behavior. */
  speed: number;
}

export interface BossConfig {
  id: string;
  displayName: string;
  maxHealth: number;
  radius: number;
  contactDamage: number;
  /** Score awarded when the boss is defeated. */
  scoreValue: number;
  projectile: ProjectileSpec;
  /** Vertical position where the boss stops descending and starts fighting. */
  entryY: number;
  entrySpeed: number;
  phases: BossPhaseConfig[];
}

export const DREADNOUGHT: BossConfig = {
  id: 'dreadnought',
  displayName: 'Dreadnought',
  maxHealth: 1_200,
  radius: 46,
  contactDamage: 40,
  scoreValue: 3_000,
  projectile: { damage: 12, speed: 260, radius: 7, lifeSeconds: 4, count: 1, spreadDegrees: 0 },
  entryY: 150,
  entrySpeed: 130,
  phases: [
    {
      untilHealthFraction: 0.6,
      movement: 'sweep',
      attacks: ['spread'],
      attackInterval: 1.6,
      speed: 150,
    },
    {
      untilHealthFraction: 0.25,
      movement: 'hover',
      attacks: ['aimed-burst', 'spread'],
      attackInterval: 1.1,
      speed: 110,
    },
    {
      untilHealthFraction: 0,
      movement: 'track',
      attacks: ['radial', 'aimed-burst'],
      attackInterval: 0.9,
      speed: 90,
    },
  ],
};

export const BOSSES: BossConfig[] = [DREADNOUGHT];

const BOSS_BY_ID: Record<string, BossConfig> = Object.fromEntries(
  BOSSES.map((boss) => [boss.id, boss]),
);

export function getBoss(id: string): BossConfig {
  const boss = BOSS_BY_ID[id];
  if (!boss) {
    throw new Error(`Unknown boss id: ${id}`);
  }
  return boss;
}

export function isBossId(id: string): boolean {
  return id in BOSS_BY_ID;
}

/** Validates boss definitions at load so malformed content fails fast. */
export function assertBossConfigs(bosses: BossConfig[] = BOSSES): void {
  const ids = new Set<string>();

  for (const boss of bosses) {
    if (ids.has(boss.id)) {
      throw new Error(`Duplicate boss id: ${boss.id}`);
    }
    ids.add(boss.id);

    if (boss.maxHealth <= 0 || boss.radius <= 0) {
      throw new Error(`Boss "${boss.id}" has non-positive stats`);
    }
    if (boss.phases.length === 0) {
      throw new Error(`Boss "${boss.id}" has no phases`);
    }

    boss.phases.forEach((phase, index) => {
      const isLast = index === boss.phases.length - 1;
      if (isLast && phase.untilHealthFraction !== 0) {
        throw new Error(`Boss "${boss.id}" last phase must end at health fraction 0`);
      }
      if (!isLast && boss.phases[index + 1] && phase.untilHealthFraction <= boss.phases[index + 1].untilHealthFraction) {
        throw new Error(`Boss "${boss.id}" phases must descend by health fraction`);
      }
      if (phase.attacks.length === 0 || phase.attackInterval <= 0) {
        throw new Error(`Boss "${boss.id}" phase ${index + 1} has no attacks or invalid interval`);
      }
    });
  }
}

assertBossConfigs();