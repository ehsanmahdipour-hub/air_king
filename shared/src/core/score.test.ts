import { describe, expect, it } from 'vitest';

import { addScore, scoreForKill } from './score';

describe('addScore', () => {
  it('accumulates score', () => {
    expect(addScore(100, 250)).toBe(350);
  });

  it('rejects negative or non-finite deltas', () => {
    expect(() => addScore(100, -1)).toThrow(RangeError);
    expect(() => addScore(100, Number.NaN)).toThrow(RangeError);
  });
});

describe('scoreForKill', () => {
  it('returns the configured enemy score', () => {
    expect(scoreForKill({ scoreValue: 100 })).toBe(100);
  });

  it('floors fractional values and clamps negatives', () => {
    expect(scoreForKill({ scoreValue: 10.9 })).toBe(10);
    expect(scoreForKill({ scoreValue: -5 })).toBe(0);
  });
});
