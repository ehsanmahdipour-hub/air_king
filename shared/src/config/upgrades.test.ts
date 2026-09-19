import { describe, expect, it } from 'vitest';

import {
  UPGRADES,
  assertUpgradeConfigs,
  clampUpgradeLevel,
  getUpgrade,
  upgradeCost,
  upgradeNextValue,
  upgradeValue,
} from './upgrades';

describe('upgrade catalog', () => {
  it('is structurally valid', () => {
    expect(() => assertUpgradeConfigs()).not.toThrow();
  });

  it('has unique ids', () => {
    const ids = UPGRADES.map((upgrade) => upgrade.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('exposes every required category/stat', () => {
    const ids = new Set(UPGRADES.map((upgrade) => upgrade.id));
    for (const id of [
      'weapon-damage',
      'weapon-fire-rate',
      'weapon-projectile-count',
      'weapon-projectile-speed',
      'aircraft-health',
      'aircraft-armor',
      'aircraft-speed',
      'aircraft-fire-power',
    ]) {
      expect(ids.has(id as never)).toBe(true);
    }
  });

  it('rejects malformed definitions', () => {
    expect(() =>
      assertUpgradeConfigs([
        {
          id: 'weapon-damage',
          category: 'weapon',
          stat: 'weaponDamage',
          displayName: 'Broken',
          description: '',
          mode: 'add',
          maxLevel: 3,
          values: [0, 1],
          costs: [10],
        },
      ]),
    ).toThrow(/one value per level/);

    expect(() =>
      assertUpgradeConfigs([
        {
          id: 'weapon-damage',
          category: 'weapon',
          stat: 'weaponDamage',
          displayName: 'Broken',
          description: '',
          mode: 'add',
          maxLevel: 3,
          values: [0, 1, 2],
          costs: [],
        },
      ]),
    ).toThrow(/one cost per level transition/);
  });
});

describe('upgrade value, next value and cost', () => {
  const damage = getUpgrade('weapon-damage');

  it('returns the value for the current level', () => {
    expect(upgradeValue(damage, 1)).toBe(damage.values[0]);
    expect(upgradeValue(damage, 3)).toBe(damage.values[2]);
  });

  it('clamps levels outside the valid range', () => {
    expect(clampUpgradeLevel(damage, 0)).toBe(1);
    expect(clampUpgradeLevel(damage, 999)).toBe(damage.maxLevel);
    expect(upgradeValue(damage, 999)).toBe(damage.values[damage.maxLevel - 1]);
  });

  it('returns the next value and cost while below max level', () => {
    expect(upgradeNextValue(damage, 1)).toBe(damage.values[1]);
    expect(upgradeCost(damage, 1)).toBe(damage.costs[0]);
  });

  it('returns null at maximum level', () => {
    expect(upgradeNextValue(damage, damage.maxLevel)).toBeNull();
    expect(upgradeCost(damage, damage.maxLevel)).toBeNull();
  });
});