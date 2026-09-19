import { describe, expect, it } from 'vitest';

import { STARTER_AIRCRAFT } from '../config/player';
import { DEFAULT_UPGRADE_LEVELS, type UpgradeLevels } from '../config/upgrades';
import { BASIC_CANNON } from '../config/weapons';
import { resolveLoadout } from './loadout';

function levels(overrides: Partial<UpgradeLevels> = {}): Partial<UpgradeLevels> {
  return { ...DEFAULT_UPGRADE_LEVELS, ...overrides };
}

describe('resolveLoadout', () => {
  it('matches the base aircraft and weapon at level 1', () => {
    const loadout = resolveLoadout(DEFAULT_UPGRADE_LEVELS);

    expect(loadout.maxHealth).toBe(STARTER_AIRCRAFT.maxHealth);
    expect(loadout.speed).toBe(STARTER_AIRCRAFT.speed);
    expect(loadout.armor).toBe(0);
    expect(loadout.weapon.fireRate).toBe(BASIC_CANNON.fireRate);
    expect(loadout.weapon.projectile).toMatchObject({
      damage: BASIC_CANNON.projectile.damage,
      speed: BASIC_CANNON.projectile.speed,
      count: BASIC_CANNON.projectile.count,
    });
  });

  it('defaults to level 1 for missing upgrades', () => {
    expect(resolveLoadout()).toEqual(resolveLoadout(DEFAULT_UPGRADE_LEVELS));
  });

  it('applies additive weapon upgrades', () => {
    const loadout = resolveLoadout(
      levels({ 'weapon-damage': 3, 'weapon-fire-rate': 3, 'weapon-projectile-count': 3, 'weapon-projectile-speed': 2 }),
    );

    // weapon-damage level 3 = +6, so 10 + 6 = 16.
    expect(loadout.weapon.projectile.damage).toBe(16);
    expect(loadout.weapon.fireRate).toBe(BASIC_CANNON.fireRate + 2);
    expect(loadout.weapon.projectile.count).toBe(BASIC_CANNON.projectile.count + 2);
    expect(loadout.weapon.projectile.speed).toBe(BASIC_CANNON.projectile.speed + 80);
  });

  it('applies fire power as a multiplier on weapon damage', () => {
    const loadout = resolveLoadout(levels({ 'weapon-damage': 3, 'aircraft-fire-power': 3 }));

    // (10 + 6) * 1.3 = 20.8 -> 21
    expect(loadout.weapon.projectile.damage).toBe(21);
  });

  it('applies aircraft upgrades', () => {
    const loadout = resolveLoadout(
      levels({ 'aircraft-health': 2, 'aircraft-armor': 3, 'aircraft-speed': 2 }),
    );

    expect(loadout.maxHealth).toBe(STARTER_AIRCRAFT.maxHealth + 25);
    expect(loadout.armor).toBe(4);
    expect(loadout.speed).toBe(STARTER_AIRCRAFT.speed + 25);
  });

  it('clamps out-of-range upgrade levels', () => {
    const loadout = resolveLoadout(
      levels({ 'aircraft-health': 999, 'weapon-projectile-count': -5 }),
    );

    expect(loadout.maxHealth).toBeGreaterThan(STARTER_AIRCRAFT.maxHealth);
    expect(loadout.weapon.projectile.count).toBeGreaterThanOrEqual(1);
  });
});