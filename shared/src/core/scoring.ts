import { getEnemy } from '../config/enemies';
import type { LevelConfig } from '../config/levels';
import type { ScoreConfig } from '../config/scoring';

/**
 * Score calculation rules. Pure, framework-free and fully driven by
 * `ScoreConfig`, so the simulation never hard-codes score values. Each score
 * source has its own function; boss and special sources are prepared for later
 * phases without being wired into gameplay yet.
 */

export function addScore(currentScore: number, delta: number): number {
  if (!Number.isFinite(delta) || delta < 0) {
    throw new RangeError('score delta must be a non-negative finite number');
  }
  return currentScore + delta;
}

/** Score for destroying a regular enemy: configured value × kill multiplier. */
export function scoreForEnemyDestroyed(
  enemy: { scoreValue: number },
  config: ScoreConfig,
): number {
  return Math.max(0, Math.round(Math.max(0, enemy.scoreValue) * config.killMultiplier));
}

/** Score for damaging a boss (prepared for the boss phase). */
export function scoreForBossDamage(damage: number, config: ScoreConfig): number {
  if (!Number.isFinite(damage) || damage < 0) {
    throw new RangeError('damage must be a non-negative finite number');
  }
  return Math.round(damage * config.bossDamageScore);
}

/** Flat score for defeating a boss (prepared for the boss phase). */
export function scoreForBossDefeat(config: ScoreConfig): number {
  return Math.max(0, Math.round(config.bossDefeatScore));
}

/** Score for a special or elite bonus (prepared for later phases). */
export function scoreForSpecial(baseValue: number, config: ScoreConfig): number {
  if (!Number.isFinite(baseValue) || baseValue < 0) {
    throw new RangeError('base value must be a non-negative finite number');
  }
  return Math.round(baseValue * config.specialMultiplier);
}

/**
 * Upper bound on the score a player can earn from a level: every spawnable
 * enemy destroyed plus the completion bonus. Returns `null` for looping
 * survival levels whose enemy supply is unbounded. Used by the server to reject
 * implausible submitted scores.
 */
export function maxAchievableScore(level: LevelConfig, config: ScoreConfig): number | null {
  if (level.loopWaves === true && level.completionMode === 'reach-distance') {
    return null;
  }

  let total = level.reward.completionBonus;

  for (const wave of level.waves) {
    for (const group of wave.groups) {
      total += scoreForEnemyDestroyed(getEnemy(group.enemyTypeId), config) * group.count;
    }
  }

  for (const section of level.obstacleSections) {
    total += scoreForEnemyDestroyed(getEnemy(section.enemyTypeId), config) * section.count;
  }

  return total;
}
