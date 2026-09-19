/**
 * Upgrade definitions. Costs and per-level values are pure data so balance is a
 * config change, and the client and server derive the same numbers from here.
 *
 * `values[level - 1]` is the value at that level. `costs[level - 1]` is the cost
 * to go from `level` to `level + 1`, so `costs` has `maxLevel - 1` entries.
 */

export type UpgradeCategory = 'weapon' | 'aircraft';

export type UpgradeId =
  | 'weapon-damage'
  | 'weapon-fire-rate'
  | 'weapon-projectile-count'
  | 'weapon-projectile-speed'
  | 'aircraft-health'
  | 'aircraft-armor'
  | 'aircraft-speed'
  | 'aircraft-fire-power';

/** Which base stat an upgrade changes. */
export type UpgradeStat =
  | 'weaponDamage'
  | 'weaponFireRate'
  | 'weaponProjectileCount'
  | 'weaponProjectileSpeed'
  | 'aircraftHealth'
  | 'aircraftArmor'
  | 'aircraftSpeed'
  | 'aircraftFirePower';

export interface UpgradeConfig {
  id: UpgradeId;
  category: UpgradeCategory;
  stat: UpgradeStat;
  displayName: string;
  description: string;
  /** How the per-level value combines with the base stat. */
  mode: 'add' | 'multiply';
  maxLevel: number;
  values: number[];
  costs: number[];
}

export const UPGRADES: UpgradeConfig[] = [
  {
    id: 'weapon-damage',
    category: 'weapon',
    stat: 'weaponDamage',
    displayName: 'Damage',
    description: 'Increases the damage of each projectile.',
    mode: 'add',
    maxLevel: 6,
    values: [0, 3, 6, 10, 15, 21],
    costs: [10, 25, 50, 90, 150],
  },
  {
    id: 'weapon-fire-rate',
    category: 'weapon',
    stat: 'weaponFireRate',
    displayName: 'Fire Rate',
    description: 'Shots fired per second.',
    mode: 'add',
    maxLevel: 5,
    values: [0, 1, 2, 3, 4],
    costs: [15, 35, 70, 120],
  },
  {
    id: 'weapon-projectile-count',
    category: 'weapon',
    stat: 'weaponProjectileCount',
    displayName: 'Projectile Count',
    description: 'Projectiles fired per shot.',
    mode: 'add',
    maxLevel: 3,
    values: [0, 1, 2],
    costs: [40, 120],
  },
  {
    id: 'weapon-projectile-speed',
    category: 'weapon',
    stat: 'weaponProjectileSpeed',
    displayName: 'Projectile Speed',
    description: 'How fast projectiles travel.',
    mode: 'add',
    maxLevel: 5,
    values: [0, 80, 160, 260, 380],
    costs: [12, 30, 60, 110],
  },
  {
    id: 'aircraft-health',
    category: 'aircraft',
    stat: 'aircraftHealth',
    displayName: 'Health',
    description: 'Increases the aircraft maximum health.',
    mode: 'add',
    maxLevel: 6,
    values: [0, 25, 55, 90, 130, 180],
    costs: [10, 22, 45, 80, 130],
  },
  {
    id: 'aircraft-armor',
    category: 'aircraft',
    stat: 'aircraftArmor',
    displayName: 'Armor',
    description: 'Reduces incoming damage by a flat amount.',
    mode: 'add',
    maxLevel: 5,
    values: [0, 2, 4, 6, 8],
    costs: [20, 45, 85, 140],
  },
  {
    id: 'aircraft-speed',
    category: 'aircraft',
    stat: 'aircraftSpeed',
    displayName: 'Movement Speed',
    description: 'Increases how fast the aircraft moves.',
    mode: 'add',
    maxLevel: 5,
    values: [0, 25, 50, 80, 110],
    costs: [12, 28, 55, 95],
  },
  {
    id: 'aircraft-fire-power',
    category: 'aircraft',
    stat: 'aircraftFirePower',
    displayName: 'Fire Power',
    description: 'Multiplies all weapon damage.',
    mode: 'multiply',
    maxLevel: 5,
    values: [1, 1.15, 1.3, 1.5, 1.7],
    costs: [25, 60, 110, 180],
  },
];

const UPGRADE_BY_ID: Record<string, UpgradeConfig> = Object.fromEntries(
  UPGRADES.map((upgrade) => [upgrade.id, upgrade]),
);

/** All-upgrades-at-level-1 loadout, i.e. the base game state. */
export type UpgradeLevels = Record<UpgradeId, number>;

export const DEFAULT_UPGRADE_LEVELS: UpgradeLevels = Object.fromEntries(
  UPGRADES.map((upgrade) => [upgrade.id, 1]),
) as UpgradeLevels;

export function getUpgrade(id: string): UpgradeConfig {
  const upgrade = UPGRADE_BY_ID[id];
  if (!upgrade) {
    throw new Error(`Unknown upgrade id: ${id}`);
  }
  return upgrade;
}

export function isUpgradeId(id: string): id is UpgradeId {
  return id in UPGRADE_BY_ID;
}

export function clampUpgradeLevel(upgrade: UpgradeConfig, level: number): number {
  return Math.min(Math.max(Math.trunc(level), 1), upgrade.maxLevel);
}

/** Value of an upgrade at a level (clamped to the valid range). */
export function upgradeValue(upgrade: UpgradeConfig, level: number): number {
  return upgrade.values[clampUpgradeLevel(upgrade, level) - 1] ?? upgrade.values[0] ?? 0;
}

/** Value the upgrade would have at the next level, or null when maxed. */
export function upgradeNextValue(upgrade: UpgradeConfig, level: number): number | null {
  const current = clampUpgradeLevel(upgrade, level);
  if (current >= upgrade.maxLevel) {
    return null;
  }
  return upgradeValue(upgrade, current + 1);
}

/** Cost to buy the next level, or null when the upgrade is maxed. */
export function upgradeCost(upgrade: UpgradeConfig, currentLevel: number): number | null {
  const current = clampUpgradeLevel(upgrade, currentLevel);
  if (current >= upgrade.maxLevel) {
    return null;
  }
  return upgrade.costs[current - 1] ?? null;
}

/**
 * Validates the shape of every upgrade definition. Called at module load so
 * malformed data fails fast rather than producing impossible purchases.
 */
export function assertUpgradeConfigs(upgrades: UpgradeConfig[] = UPGRADES): void {
  const ids = new Set<string>();

  for (const upgrade of upgrades) {
    if (ids.has(upgrade.id)) {
      throw new Error(`Duplicate upgrade id: ${upgrade.id}`);
    }
    ids.add(upgrade.id);

    if (upgrade.maxLevel < 2) {
      throw new Error(`Upgrade "${upgrade.id}" must have maxLevel >= 2`);
    }
    if (upgrade.values.length !== upgrade.maxLevel) {
      throw new Error(`Upgrade "${upgrade.id}" must define one value per level`);
    }
    if (upgrade.costs.length !== upgrade.maxLevel - 1) {
      throw new Error(`Upgrade "${upgrade.id}" must define one cost per level transition`);
    }
    if (upgrade.costs.some((cost) => cost <= 0)) {
      throw new Error(`Upgrade "${upgrade.id}" costs must be positive`);
    }
  }
}

assertUpgradeConfigs();