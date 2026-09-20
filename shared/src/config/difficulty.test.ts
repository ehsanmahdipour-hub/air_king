import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PLAYER_DIFFICULTY,
  PLAYER_DIFFICULTIES,
  getPlayerDifficulty,
} from './difficulty';

describe('player difficulty', () => {
  it('defaults to normal', () => {
    expect(DEFAULT_PLAYER_DIFFICULTY).toBe('normal');
  });

  it('is ordered easy < normal < hard in enemy pressure', () => {
    expect(PLAYER_DIFFICULTIES.easy.enemyDamageMultiplier).toBeLessThan(
      PLAYER_DIFFICULTIES.normal.enemyDamageMultiplier,
    );
    expect(PLAYER_DIFFICULTIES.hard.enemyDamageMultiplier).toBeGreaterThan(
      PLAYER_DIFFICULTIES.normal.enemyDamageMultiplier,
    );
    expect(PLAYER_DIFFICULTIES.easy.spawnRateMultiplier).toBeLessThan(
      PLAYER_DIFFICULTIES.hard.spawnRateMultiplier,
    );
    expect(PLAYER_DIFFICULTIES.easy.playerDamageMultiplier).toBeGreaterThan(
      PLAYER_DIFFICULTIES.hard.playerDamageMultiplier,
    );
  });

  it('resolves a profile by id', () => {
    expect(getPlayerDifficulty('hard')).toBe(PLAYER_DIFFICULTIES.hard);
  });
});