import type { WeaponConfig } from '../config/weapons';
import type { Vec2 } from '../types';

export interface ProjectileSpawn {
  position: Vec2;
  velocity: Vec2;
  damage: number;
  radius: number;
}

/**
 * Builds the projectiles for a single shot. Fires forward (upwards, negative Y)
 * with the configured count spread symmetrically around the forward direction.
 * Keeping this separate from the simulation makes it easy to test and to add
 * new firing patterns later.
 */
export function createProjectiles(origin: Vec2, weapon: WeaponConfig): ProjectileSpawn[] {
  const forwardAngle = -Math.PI / 2;
  const spread = (weapon.spreadDegrees * Math.PI) / 180;
  const count = Math.max(1, weapon.projectileCount);

  const spawns: ProjectileSpawn[] = [];
  for (let index = 0; index < count; index += 1) {
    const fraction = count === 1 ? 0.5 : index / (count - 1);
    const angle = forwardAngle + (fraction - 0.5) * spread;
    spawns.push({
      position: { x: origin.x, y: origin.y },
      velocity: {
        x: Math.cos(angle) * weapon.projectileSpeed,
        y: Math.sin(angle) * weapon.projectileSpeed,
      },
      damage: weapon.damage,
      radius: weapon.projectileRadius,
    });
  }

  return spawns;
}
