/**
 * Projectile and weapon definitions. Projectile behaviour is fully described by
 * data (damage, speed, radius, lifetime, count, spread) so new player weapons
 * are new entries and new enemy weapons reuse the same structure.
 */
export interface ProjectileSpec {
  damage: number;
  /** Travel speed in units per second. */
  speed: number;
  radius: number;
  /** Maximum lifetime in seconds before the projectile expires. */
  lifeSeconds: number;
  /** Number of projectiles per shot, spread symmetrically around the aim angle. */
  count: number;
  /** Total spread angle in degrees across all projectiles. */
  spreadDegrees: number;
}

export interface WeaponConfig {
  id: string;
  displayName: string;
  /** Shots per second. */
  fireRate: number;
  projectile: ProjectileSpec;
}

export const BASIC_CANNON: WeaponConfig = {
  id: 'basic-cannon',
  displayName: 'Basic Cannon',
  fireRate: 6,
  projectile: {
    damage: 10,
    speed: 720,
    radius: 4,
    lifeSeconds: 1.4,
    count: 1,
    spreadDegrees: 0,
  },
};

export const DOUBLE_SHOT: WeaponConfig = {
  id: 'double-shot',
  displayName: 'Double Shot',
  fireRate: 5.5,
  projectile: {
    damage: 9,
    speed: 760,
    radius: 4,
    lifeSeconds: 1.4,
    count: 2,
    spreadDegrees: 10,
  },
};

export const SPREAD_SHOT: WeaponConfig = {
  id: 'spread-shot',
  displayName: 'Spread Shot',
  fireRate: 4.5,
  projectile: {
    damage: 8,
    speed: 700,
    radius: 4,
    lifeSeconds: 1.3,
    count: 3,
    spreadDegrees: 34,
  },
};

export const RAILGUN: WeaponConfig = {
  id: 'railgun',
  displayName: 'Railgun',
  fireRate: 3,
  projectile: {
    damage: 20,
    speed: 1150,
    radius: 3,
    lifeSeconds: 1.6,
    count: 1,
    spreadDegrees: 0,
  },
};

export const WEAPONS: Record<string, WeaponConfig> = {
  [BASIC_CANNON.id]: BASIC_CANNON,
  [DOUBLE_SHOT.id]: DOUBLE_SHOT,
  [SPREAD_SHOT.id]: SPREAD_SHOT,
  [RAILGUN.id]: RAILGUN,
};

export function getWeapon(id: string): WeaponConfig {
  const weapon = WEAPONS[id];
  if (!weapon) {
    throw new Error(`Unknown weapon id: ${id}`);
  }
  return weapon;
}
