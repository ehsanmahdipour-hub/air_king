import { describe, expect, it } from 'vitest';

import {
  BOSSES,
  DREADNOUGHT,
  assertBossConfigs,
  getBoss,
  isBossId,
  type BossConfig,
} from './bosses';

describe('boss catalog', () => {
  it('is structurally valid', () => {
    expect(() => assertBossConfigs()).not.toThrow();
    expect(BOSSES.length).toBeGreaterThanOrEqual(1);
  });

  it('has phases that descend and end at zero', () => {
    const phases = DREADNOUGHT.phases;
    expect(phases.length).toBeGreaterThanOrEqual(2);
    expect(phases[phases.length - 1]?.untilHealthFraction).toBe(0);
    for (let index = 0; index < phases.length - 1; index += 1) {
      expect(phases[index]!.untilHealthFraction).toBeGreaterThan(
        phases[index + 1]!.untilHealthFraction,
      );
    }
  });

  it('resolves by id and rejects unknown ids', () => {
    expect(getBoss('dreadnought')).toBe(DREADNOUGHT);
    expect(isBossId('dreadnought')).toBe(true);
    expect(isBossId('nope')).toBe(false);
    expect(() => getBoss('nope')).toThrow(/Unknown boss/);
  });

  it('rejects malformed definitions', () => {
    expect(() => assertBossConfigs([DREADNOUGHT, DREADNOUGHT])).toThrow(/Duplicate/);

    const noPhases: BossConfig = { ...DREADNOUGHT, phases: [] };
    expect(() => assertBossConfigs([noPhases])).toThrow(/no phases/);

    const lastNotZero: BossConfig = {
      ...DREADNOUGHT,
      phases: [{ ...DREADNOUGHT.phases[0]!, untilHealthFraction: 0.5 }],
    };
    expect(() => assertBossConfigs([lastNotZero])).toThrow(/end at health fraction 0/);
  });
});