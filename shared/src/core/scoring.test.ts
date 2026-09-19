import { describe, expect, it } from 'vitest';

import { LEVELS } from '../config/levels';
import { DEFAULT_SCORE_CONFIG } from '../config/scoring';
import {
  addScore,
  maxAchievableScore,
  scoreForBossDamage,
  scoreForBossDefeat,
  scoreForEnemyDestroyed,
  scoreForSpecial,
} from './scoring';

describe('addScore', () => {
  it('accumulates score', () => {
    expect(addScore(100, 250)).toBe(350);
  });

  it('rejects negative or non-finite deltas', () => {
    expect(() => addScore(100, -1)).toThrow(RangeError);
    expect(() => addScore(100, Number.NaN)).toThrow(RangeError);
  });
});

describe('scoreForEnemyDestroyed', () => {
  it('uses the enemy value with the default multiplier', () => {
    expect(scoreForEnemyDestroyed({ scoreValue: 100 }, DEFAULT_SCORE_CONFIG)).toBe(100);
  });

  it('applies the configured kill multiplier', () => {
    expect(
      scoreForEnemyDestroyed({ scoreValue: 100 }, { ...DEFAULT_SCORE_CONFIG, killMultiplier: 2.5 }),
    ).toBe(250);
  });

  it('rounds to whole points', () => {
    expect(
      scoreForEnemyDestroyed({ scoreValue: 25 }, { ...DEFAULT_SCORE_CONFIG, killMultiplier: 1.5 }),
    ).toBe(38);
  });

  it('clamps negative enemy values to zero', () => {
    expect(scoreForEnemyDestroyed({ scoreValue: -50 }, DEFAULT_SCORE_CONFIG)).toBe(0);
  });
});

describe('boss and special score sources (prepared)', () => {
  it('scales boss damage per point', () => {
    expect(scoreForBossDamage(200, { ...DEFAULT_SCORE_CONFIG, bossDamageScore: 2 })).toBe(400);
  });

  it('rejects negative boss damage', () => {
    expect(() => scoreForBossDamage(-1, DEFAULT_SCORE_CONFIG)).toThrow(RangeError);
  });

  it('returns a flat boss defeat score', () => {
    expect(scoreForBossDefeat({ ...DEFAULT_SCORE_CONFIG, bossDefeatScore: 5000 })).toBe(5000);
  });

  it('applies the special bonus multiplier', () => {
    expect(scoreForSpecial(100, { ...DEFAULT_SCORE_CONFIG, specialMultiplier: 1.5 })).toBe(150);
  });

  it('rejects a negative special base value', () => {
    expect(() => scoreForSpecial(-1, DEFAULT_SCORE_CONFIG)).toThrow(RangeError);
  });
});

describe('maxAchievableScore', () => {
  it('sums every spawnable enemy and the completion bonus', () => {
    // Level 1: 15 fighters (100 each) + 3 mines (50 each) + 500 bonus.
    expect(maxAchievableScore(LEVELS[0], DEFAULT_SCORE_CONFIG)).toBe(2150);
  });

  it('returns null for looping survival levels with unbounded enemies', () => {
    const survival = LEVELS.find((level) => level.loopWaves === true);
    expect(survival).toBeDefined();
    expect(maxAchievableScore(survival!, DEFAULT_SCORE_CONFIG)).toBeNull();
  });
});