import { STARTER_AIRCRAFT } from '../../config/player';
import { getWeapon } from '../../config/weapons';
import type { InputState, World } from '../entities';
import { createProjectiles } from '../weapons';
import { spawnProjectile } from './projectiles';

export function updatePlayerWeapon(world: World, input: InputState, delta: number): void {
  const { player } = world;

  if (player.fireCooldown > 0) {
    player.fireCooldown = Math.max(0, player.fireCooldown - delta);
  }

  if (!input.firing || player.fireCooldown > 0) {
    return;
  }

  const weapon = getWeapon(STARTER_AIRCRAFT.weaponId);
  for (const spawn of createProjectiles(player.position, weapon.projectile)) {
    spawnProjectile(world, 'player', spawn);
  }

  world.events.push({ type: 'shotFired', position: { ...player.position } });
  player.fireCooldown = 1 / weapon.fireRate;
}
