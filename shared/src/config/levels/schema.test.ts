import { describe, expect, it } from 'vitest';

import { LEVELS } from './index';
import { parseLevelConfig } from './schema';
import type { LevelConfig } from './types';

const base: LevelConfig = LEVELS[0];

describe('parseLevelConfig', () => {
  it('accepts an authored level', () => {
    expect(parseLevelConfig(base)).toEqual(base);
  });

  it('rejects a level with an unknown enemy type', () => {
    const invalid: LevelConfig = {
      ...base,
      waves: [
        {
          startDelay: 0,
          groups: [
            { enemyTypeId: 'not-an-enemy', count: 1, formation: 'line', interval: 0, startDelay: 0 },
          ],
        },
      ],
      obstacleSections: [],
    };

    expect(() => parseLevelConfig(invalid)).toThrow(/unknown enemy/i);
  });

  it('rejects a reach-distance level without a distance goal', () => {
    const invalid = { ...base, completionMode: 'reach-distance' as const, lengthUnits: undefined };

    expect(() => parseLevelConfig(invalid)).toThrow(/lengthUnits/i);
  });

  it('rejects loopWaves outside reach-distance levels', () => {
    const invalid = { ...base, completionMode: 'clear-waves' as const, loopWaves: true };

    expect(() => parseLevelConfig(invalid)).toThrow(/loopWaves/i);
  });

  it('rejects structurally invalid levels', () => {
    expect(() => parseLevelConfig({ ...base, waves: [] })).toThrow();
    expect(() => parseLevelConfig({ ...base, levelNumber: -1 })).toThrow();
    expect(() =>
      parseLevelConfig({
        ...base,
        waves: [
          {
            startDelay: 0,
            groups: [
              {
                enemyTypeId: 'fighter',
                count: 0,
                formation: 'line',
                interval: 0,
                startDelay: 0,
              },
            ],
          },
        ],
      }),
    ).toThrow();
  });
});

describe('level catalog', () => {
  it('has unique ids and sequential level numbers', () => {
    const ids = LEVELS.map((level) => level.id);
    expect(new Set(ids).size).toBe(ids.length);

    LEVELS.forEach((level, index) => {
      expect(level.levelNumber).toBe(index + 1);
    });
  });
});