/**
 * Weapon definitions. The shape is intentionally general (damage, fire rate,
 * projectile speed/count/spread) so future weapons are new data entries rather
 * than engine changes. Only the basic cannon is used in the prototype.
 */
export interface WeaponConfig {
  id: string;
  displayName: string;
  damage: number;
  /** Shots per second. */
  fireRate: number;
  /** Projectile travel speed in units per second. */
  projectileSpeed: number;
  projectileRadius: number;
  /** Number of projectiles fired per shot. */
  projectileCount: number;
  /** Total spread angle in degrees across all projectiles. */
  spreadDegrees: number;
}

export const BASIC_CANNON: WeaponConfig = {
  id: 'basic-cannon',
  displayName: 'Basic Cannon',
  damage: 10,
  fireRate: 6,
  projectileSpeed: 720,
  projectileRadius: 4,
  projectileCount: 1,
  spreadDegrees: 0,
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
