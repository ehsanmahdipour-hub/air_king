import {
  DEFAULT_AIRCRAFT_ID,
  getAircraft,
  type AircraftConfig,
} from '../config/aircraft';
import {
  UPGRADES,
  clampUpgradeLevel,
  upgradeValue,
  type UpgradeLevels,
} from '../config/upgrades';
import { getWeapon, type ProjectileSpec } from '../config/weapons';

/** Effective player/weapon stats after applying an aircraft and upgrades. */
export interface ResolvedLoadout {
  maxHealth: number;
  speed: number;
  /** Flat damage reduction. */
  armor: number;
  radius: number;
  invulnerabilitySeconds: number;
  weapon: {
    fireRate: number;
    projectile: ProjectileSpec;
  };
}

export interface LoadoutInput {
  /** Equipped aircraft; defaults to the starter aircraft. */
  aircraft?: AircraftConfig;
  /** Upgrade levels; defaults to level 1 for every upgrade. */
  upgrades?: Partial<UpgradeLevels>;
}

/**
 * Resolves effective combat stats from the equipped aircraft, its base weapon
 * and upgrade levels. Pure and data-driven: the simulation never branches on a
 * specific aircraft.
 */
export function resolveLoadout(input: LoadoutInput = {}): ResolvedLoadout {
  const aircraft = input.aircraft ?? getAircraft(DEFAULT_AIRCRAFT_ID);
  const levels = input.upgrades ?? {};
  const weapon = getWeapon(aircraft.weaponId);

  const stats: Record<string, number> = {
    weaponDamage: weapon.projectile.damage,
    weaponFireRate: weapon.fireRate,
    weaponProjectileCount: weapon.projectile.count,
    weaponProjectileSpeed: weapon.projectile.speed,
    aircraftHealth: aircraft.maxHealth,
    aircraftArmor: aircraft.armor,
    aircraftSpeed: aircraft.speed,
    aircraftFirePower: 1,
  };

  for (const upgrade of UPGRADES) {
    const level = clampUpgradeLevel(upgrade, levels[upgrade.id] ?? 1);
    const value = upgradeValue(upgrade, level);
    const current = stats[upgrade.stat] ?? 0;
    stats[upgrade.stat] = upgrade.mode === 'multiply' ? current * value : current + value;
  }

  const weaponDamage = (stats.weaponDamage ?? 0) * aircraft.firePower * (stats.aircraftFirePower ?? 1);

  return {
    maxHealth: Math.round(stats.aircraftHealth ?? aircraft.maxHealth),
    speed: stats.aircraftSpeed ?? aircraft.speed,
    armor: Math.max(0, stats.aircraftArmor ?? aircraft.armor),
    radius: aircraft.radius,
    invulnerabilitySeconds: aircraft.invulnerabilitySeconds,
    weapon: {
      fireRate: (stats.weaponFireRate ?? weapon.fireRate) * aircraft.fireRate,
      projectile: {
        ...weapon.projectile,
        damage: Math.max(0, Math.round(weaponDamage)),
        speed: stats.weaponProjectileSpeed ?? weapon.projectile.speed,
        count: Math.max(1, Math.round(stats.weaponProjectileCount ?? weapon.projectile.count)),
      },
    },
  };
}