import { describe, expect, it } from 'vitest';

import type { ProjectileSpec } from '../config/weapons';
import { createProjectiles } from './weapons';

const origin = { x: 100, y: 200 };

function spec(overrides: Partial<ProjectileSpec> = {}): ProjectileSpec {
  return {
    damage: 10,
    speed: 100,
    radius: 4,
    lifeSeconds: 2,
    count: 1,
    spreadDegrees: 0,
    ...overrides,
  };
}

describe('createProjectiles', () => {
  it('fires a single projectile straight up by default', () => {
    const [projectile] = createProjectiles(origin, spec());

    expect(projectile?.position).toEqual(origin);
    expect(projectile?.velocity.x).toBeCloseTo(0, 6);
    expect(projectile?.velocity.y).toBeCloseTo(-100, 6);
  });

  it('propagates damage, radius and lifetime', () => {
    const [projectile] = createProjectiles(origin, spec({ damage: 25, radius: 7, lifeSeconds: 3 }));

    expect(projectile?.damage).toBe(25);
    expect(projectile?.radius).toBe(7);
    expect(projectile?.lifeSeconds).toBe(3);
  });

  it('spreads multiple projectiles symmetrically around the aim angle', () => {
    const projectiles = createProjectiles(origin, spec({ count: 3, spreadDegrees: 90 }));

    expect(projectiles).toHaveLength(3);
    for (const projectile of projectiles) {
      expect(Math.hypot(projectile.velocity.x, projectile.velocity.y)).toBeCloseTo(100, 6);
    }
    expect(projectiles[0].velocity.x).toBeLessThan(0);
    expect(projectiles[1].velocity.x).toBeCloseTo(0, 6);
    expect(projectiles[2].velocity.x).toBeGreaterThan(0);
  });

  it('supports a custom base angle for enemy fire', () => {
    const [projectile] = createProjectiles(origin, spec(), 0);

    expect(projectile?.velocity.x).toBeCloseTo(100, 6);
    expect(projectile?.velocity.y).toBeCloseTo(0, 6);
  });

  it('treats a count below one as a single projectile', () => {
    expect(createProjectiles(origin, spec({ count: 0 }))).toHaveLength(1);
  });
});
