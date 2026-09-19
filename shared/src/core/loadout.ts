import { STARTER_AIRCRAFT } from '../config/player';
import {
  UPGRADES,
  clampUpgradeLevel,
  upgradeValue,
  type UpgradeLevels,
} from '../config/upgrades';
import { BASIC_CANNON, type ProjectileSpec } from '../config/weapons';

/** Effective player/weapon stats after applying upgrade levels. */
export interface ResolvedLoadout {
  maxHealth: number;
  speed: number;
  /** Flat damage reduction. */
  armor: number;
  weapon: {
    fireRate: number;
    projectile: ProjectileSpec;
  };
}

/**
 * Resolves the effective combat stats from base config plus upgrade levels.
 * Data-driven and shared by the client (gameplay + previews) and the server
 * (nothing to resolve yet, but the same source of truth).
 */
export function resolveLoadout(levels: Partial<UpgradeLevels> = {}): ResolvedLoadout {
  const stats: Record<string, number> = {
    weaponDamage: BASIC_CANNON.projectile.damage,
    weaponFireRate: BASIC_CANNON.fireRate,
    weaponProjectileCount: BASIC_CANNON.projectile.count,
    weaponProjectileSpeed: BASIC_CANNON.projectile.speed,
    aircraftHealth: STARTER_AIRCRAFT.maxHealth,
    aircraftArmor: 0,
    aircraftSpeed: STARTER_AIRCRAFT.speed,
    aircraftFirePower: 1,
  };

  for (const upgrade of UPGRADES) {
    const level = clampUpgradeLevel(upgrade, levels[upgrade.id] ?? 1);
    const value = upgradeValue(upgrade, level);
    const current = stats[upgrade.stat] ?? 0;
    stats[upgrade.stat] = upgrade.mode === 'multiply' ? current * value : current + value;
  }

  return {
    maxHealth: Math.round(stats.aircraftHealth ?? STARTER_AIRCRAFT.maxHealth),
    speed: stats.aircraftSpeed ?? STARTER_AIRCRAFT.speed,
    armor: Math.max(0, stats.aircraftArmor ?? 0),
    weapon: {
      fireRate: stats.weaponFireRate ?? BASIC_CANNON.fireRate,
      projectile: {
        ...BASIC_CANNON.projectile,
        damage: Math.max(
          0,
          Math.round((stats.weaponDamage ?? 0) * (stats.aircraftFirePower ?? 1)),
        ),
        speed: stats.weaponProjectileSpeed ?? BASIC_CANNON.projectile.speed,
        count: Math.max(1, Math.round(stats.weaponProjectileCount ?? 1)),
      },
    },
  };
}