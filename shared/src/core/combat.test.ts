import { describe, expect, it } from 'vitest';

import { applyDamage, isDefeated } from './combat';

describe('applyDamage', () => {
  it('subtracts damage from health', () => {
    expect(applyDamage(100, 30)).toBe(70);
  });

  it('never drops health below zero', () => {
    expect(applyDamage(10, 25)).toBe(0);
  });

  it('allows zero damage', () => {
    expect(applyDamage(50, 0)).toBe(50);
  });

  it('rejects negative or non-finite damage', () => {
    expect(() => applyDamage(50, -1)).toThrow(RangeError);
    expect(() => applyDamage(50, Number.NaN)).toThrow(RangeError);
    expect(() => applyDamage(50, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('isDefeated', () => {
  it('is true at or below zero health', () => {
    expect(isDefeated(0)).toBe(true);
    expect(isDefeated(-10)).toBe(true);
  });

  it('is false while health remains', () => {
    expect(isDefeated(1)).toBe(false);
  });
});
