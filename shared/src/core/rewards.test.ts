import { describe, expect, it } from 'vitest';

import { calculateCoins, calculateLevelReward, DEFAULT_ECONOMY_CONFIG } from '../index';

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

describe('calculateLevelReward', () => {
  it('combines score coins, a progressive level bonus and difficulty', () => {
    const reward = calculateLevelReward({
      totalScore: 1_500,
      levelNumber: 1,
      difficulty: 'normal',
      firstCompletion: true,
    });

    expect(reward).toEqual({ scoreCoins: 15, levelBonus: 15, difficultyBonus: 0, totalCoins: 30 });
  });

  it('increases with the level number', () => {
    const early = calculateLevelReward({
      totalScore: 1_500,
      levelNumber: 1,
      difficulty: 'normal',
      firstCompletion: true,
    });
    const late = calculateLevelReward({
      totalScore: 1_500,
      levelNumber: 20,
      difficulty: 'normal',
      firstCompletion: true,
    });

    expect(late.totalCoins).toBeGreaterThan(early.totalCoins);
  });

  it('scales with difficulty', () => {
    const easy = calculateLevelReward({
      totalScore: 1_500,
      levelNumber: 10,
      difficulty: 'easy',
      firstCompletion: true,
    });
    const hard = calculateLevelReward({
      totalScore: 1_500,
      levelNumber: 10,
      difficulty: 'hard',
      firstCompletion: true,
    });

    expect(hard.totalCoins).toBeGreaterThan(easy.totalCoins);
  });

  it('grants nothing on a replay', () => {
    const replay = calculateLevelReward({
      totalScore: 5_000,
      levelNumber: 1,
      difficulty: 'normal',
      firstCompletion: false,
    });

    expect(replay.totalCoins).toBe(0);
  });

  it('rejects invalid input', () => {
    expect(() =>
      calculateLevelReward({
        totalScore: -1,
        levelNumber: 1,
        difficulty: 'normal',
        firstCompletion: true,
      }),
    ).toThrow(RangeError);
    expect(() =>
      calculateLevelReward({
        totalScore: 10,
        levelNumber: 0,
        difficulty: 'normal',
        firstCompletion: true,
      }),
    ).toThrow(RangeError);
  });
});