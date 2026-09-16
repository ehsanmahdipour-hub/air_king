import type { ProjectileSpec } from '../config/weapons';
import type { Vec2 } from '../types';

export interface ProjectileSpawn {
  position: Vec2;
  velocity: Vec2;
  damage: number;
  radius: number;
  lifeSeconds: number;
}

const FORWARD_ANGLE = -Math.PI / 2;

/**
 * Builds the projectiles for a single shot. Projectiles are spread
 * symmetrically around `baseAngleRadians` (defaults to straight up). The same
 * function serves player weapons and enemy weapons.
 */
export function createProjectiles(
  origin: Vec2,
  spec: ProjectileSpec,
  baseAngleRadians: number = FORWARD_ANGLE,
): ProjectileSpawn[] {
  const spread = (spec.spreadDegrees * Math.PI) / 180;
  const count = Math.max(1, spec.count);

  const spawns: ProjectileSpawn[] = [];
  for (let index = 0; index < count; index += 1) {
    const fraction = count === 1 ? 0.5 : index / (count - 1);
    const angle = baseAngleRadians + (fraction - 0.5) * spread;
    spawns.push({
      position: { x: origin.x, y: origin.y },
      velocity: {
        x: Math.cos(angle) * spec.speed,
        y: Math.sin(angle) * spec.speed,
      },
      damage: spec.damage,
      radius: spec.radius,
      lifeSeconds: spec.lifeSeconds,
    });
  }

  return spawns;
}
