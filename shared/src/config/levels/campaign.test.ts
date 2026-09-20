import { describe, expect, it } from 'vitest';

import { buildCampaignLevel, levelCount, LEVELS } from './index';

describe('50-level campaign', () => {
  it('contains 50 sequential, unique levels', () => {
    expect(levelCount).toBe(50);

    const ids = LEVELS.map((level) => level.id);
    expect(new Set(ids).size).toBe(50);

    LEVELS.forEach((level, index) => {
      expect(level.levelNumber).toBe(index + 1);
    });
  });

  it('varies environments across the campaign', () => {
    const environments = new Set(LEVELS.map((level) => level.environment.id));
    expect(environments.size).toBeGreaterThanOrEqual(4);
  });

  it('places bosses only on selected milestone levels', () => {
    const bossLevels = LEVELS.filter((level) => level.boss).map((level) => level.levelNumber);

    expect(bossLevels.length).toBeGreaterThanOrEqual(4);
    expect(bossLevels.length).toBeLessThanOrEqual(10);
    for (const milestone of [3, 10, 20, 30, 40, 50]) {
      expect(bossLevels).toContain(milestone);
    }
  });

  it('includes survival levels with a different completion mode', () => {
    const survival = LEVELS.filter((level) => level.completionMode === 'reach-distance');
    expect(survival.length).toBeGreaterThanOrEqual(3);
    expect(survival.every((level) => (level.lengthUnits ?? 0) > 0)).toBe(true);
  });

  it('expands the enemy roster in later levels', () => {
    const enemyIds = new Set(
      LEVELS.flatMap((level) =>
        level.waves.flatMap((wave) => wave.groups.map((group) => group.enemyTypeId)),
      ),
    );
    for (const id of ['fighter', 'mine', 'bomber', 'turret', 'diver']) {
      expect(enemyIds.has(id)).toBe(true);
    }
  });

  it('generates later levels deterministically and with more waves', () => {
    const generated = buildCampaignLevel(25);
    expect(generated).toEqual(LEVELS[24]);
    expect(generated.waves.length).toBeGreaterThanOrEqual(4);
  });
});