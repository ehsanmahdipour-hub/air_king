import { describe, expect, it } from 'vitest';

import { FORTRESS, GUNSHIP, INTERCEPTOR, PHANTOM, RAPTOR, STARTER_AIRCRAFT } from '../config/aircraft';
import { DEFAULT_UPGRADE_LEVELS, type UpgradeLevels } from '../config/upgrades';
import { BASIC_CANNON } from '../config/weapons';
import { getUpgrade } from '../config/upgrades';
import { resolveLoadout, upgradeEffectiveValue } from './loadout';

function levels(overrides: Partial<UpgradeLevels> = {}): Partial<UpgradeLevels> {
  return { ...DEFAULT_UPGRADE_LEVELS, ...overrides };
}

describe('resolveLoadout', () => {
  it('matches the starter aircraft and base weapon at level 1', () => {
    const loadout = resolveLoadout({ upgrades: DEFAULT_UPGRADE_LEVELS });

    expect(loadout.maxHealth).toBe(STARTER_AIRCRAFT.maxHealth);
    expect(loadout.speed).toBe(STARTER_AIRCRAFT.speed);
    expect(loadout.armor).toBe(0);
    expect(loadout.radius).toBe(STARTER_AIRCRAFT.radius);
    expect(loadout.weapon.fireRate).toBe(BASIC_CANNON.fireRate);
    expect(loadout.weapon.projectile).toMatchObject({
      damage: BASIC_CANNON.projectile.damage,
      speed: BASIC_CANNON.projectile.speed,
      count: BASIC_CANNON.projectile.count,
    });
  });

  it('defaults to the starter aircraft and level 1 upgrades', () => {
    expect(resolveLoadout()).toEqual(resolveLoadout({ upgrades: DEFAULT_UPGRADE_LEVELS }));
  });

  it('applies additive weapon upgrades', () => {
    const loadout = resolveLoadout({
      upgrades: levels({
        'weapon-damage': 3,
        'weapon-fire-rate': 3,
        'weapon-projectile-count': 3,
        'weapon-projectile-speed': 2,
      }),
    });

    // weapon-damage level 3 = +6, so 10 + 6 = 16.
    expect(loadout.weapon.projectile.damage).toBe(16);
    expect(loadout.weapon.fireRate).toBe(BASIC_CANNON.fireRate + 2);
    expect(loadout.weapon.projectile.count).toBe(BASIC_CANNON.projectile.count + 2);
    expect(loadout.weapon.projectile.speed).toBe(BASIC_CANNON.projectile.speed + 80);
  });

  it('applies fire power as a multiplier on weapon damage', () => {
    const loadout = resolveLoadout({
      upgrades: levels({ 'weapon-damage': 3, 'aircraft-fire-power': 3 }),
    });

    // (10 + 6) * 1.3 = 20.8 -> 21
    expect(loadout.weapon.projectile.damage).toBe(21);
  });

  it('applies aircraft upgrades', () => {
    const loadout = resolveLoadout({
      upgrades: levels({ 'aircraft-health': 2, 'aircraft-armor': 3, 'aircraft-speed': 2 }),
    });

    expect(loadout.maxHealth).toBe(STARTER_AIRCRAFT.maxHealth + 25);
    expect(loadout.armor).toBe(4);
    expect(loadout.speed).toBe(STARTER_AIRCRAFT.speed + 25);
  });

  it('applies the equipped aircraft stats', () => {
    const interceptor = resolveLoadout({ aircraft: INTERCEPTOR });
    expect(interceptor.maxHealth).toBe(INTERCEPTOR.maxHealth);
    expect(interceptor.speed).toBe(INTERCEPTOR.speed);
    expect(interceptor.weapon.fireRate).toBeCloseTo(BASIC_CANNON.fireRate * INTERCEPTOR.fireRate, 6);
    expect(interceptor.weapon.projectile.damage).toBe(
      Math.round(BASIC_CANNON.projectile.damage * INTERCEPTOR.firePower),
    );

    const fortress = resolveLoadout({ aircraft: FORTRESS });
    expect(fortress.maxHealth).toBe(FORTRESS.maxHealth);
    expect(fortress.armor).toBe(FORTRESS.armor);
    expect(fortress.speed).toBe(FORTRESS.speed);
  });

  it('combines aircraft and upgrade effects', () => {
    const loadout = resolveLoadout({
      aircraft: INTERCEPTOR,
      upgrades: levels({ 'weapon-damage': 3 }),
    });

    // (10 + 6) * interceptor firePower 1.15 = 18.4 -> 18
    expect(loadout.weapon.projectile.damage).toBe(18);
  });

  it('resolves the weapons of the expanded aircraft roster', () => {
    expect(resolveLoadout({ aircraft: GUNSHIP }).weapon.projectile.count).toBe(3);
    expect(resolveLoadout({ aircraft: PHANTOM }).weapon.projectile.count).toBe(2);
    expect(resolveLoadout({ aircraft: RAPTOR }).weapon.projectile.damage).toBe(
      Math.round(20 * RAPTOR.firePower),
    );
  });

  it('clamps out-of-range upgrade levels', () => {
    const loadout = resolveLoadout({
      upgrades: levels({ 'aircraft-health': 999, 'weapon-projectile-count': -5 }),
    });

    expect(loadout.maxHealth).toBeGreaterThan(STARTER_AIRCRAFT.maxHealth);
    expect(loadout.weapon.projectile.count).toBeGreaterThanOrEqual(1);
  });
});

describe('upgradeEffectiveValue', () => {
  it('reports effective gameplay values for upgrades', () => {
    expect(upgradeEffectiveValue(getUpgrade('weapon-damage'), 1)).toBe(BASIC_CANNON.projectile.damage);
    expect(upgradeEffectiveValue(getUpgrade('weapon-damage'), 3)).toBe(16);
    expect(upgradeEffectiveValue(getUpgrade('aircraft-health'), 2)).toBe(125);
    expect(upgradeEffectiveValue(getUpgrade('aircraft-fire-power'), 3)).toBe(1.3);
    expect(upgradeEffectiveValue(getUpgrade('weapon-projectile-count'), 3)).toBe(3);
  });
});