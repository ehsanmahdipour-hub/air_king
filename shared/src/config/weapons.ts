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

export const WEAPONS: Record<string, WeaponConfig> = {
  [BASIC_CANNON.id]: BASIC_CANNON,
};

export function getWeapon(id: string): WeaponConfig {
  const weapon = WEAPONS[id];
  if (!weapon) {
    throw new Error(`Unknown weapon id: ${id}`);
  }
  return weapon;
}
