import { describe, expect, it } from 'vitest';

import { calculateCoins, DEFAULT_ECONOMY_CONFIG } from '../index';

describe('calculateCoins', () => {
  it('converts score to coins using the configured ratio', () => {
    expect(calculateCoins(12_500, DEFAULT_ECONOMY_CONFIG)).toBe(125);
  });

  it('rounds down partial coins', () => {
    expect(calculateCoins(12_599, DEFAULT_ECONOMY_CONFIG)).toBe(125);
  });

  it('never grants fewer than the configured minimum', () => {
    expect(calculateCoins(0, DEFAULT_ECONOMY_CONFIG)).toBe(1);
  });

  it('rejects invalid scores', () => {
    expect(() => calculateCoins(-1, DEFAULT_ECONOMY_CONFIG)).toThrow(RangeError);
    expect(() => calculateCoins(Number.NaN, DEFAULT_ECONOMY_CONFIG)).toThrow(RangeError);
  });
});
