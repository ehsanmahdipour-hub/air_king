import { MOUSE_DEAD_ZONE, MOUSE_EASE_DISTANCE } from '../constants';
import type { InputState, PlayerState, World } from '../entities';
import { clamp, length, normalize } from '../math';
import type { Vec2 } from '../../types';

export function updatePlayer(world: World, input: InputState, delta: number): void {
  const { player, level } = world;

  if (player.invulnerableFor > 0) {
    player.invulnerableFor = Math.max(0, player.invulnerableFor - delta);
  }

  const move = resolveMovement(player, input);
  player.position.x = clamp(
    player.position.x + move.x * world.loadout.speed * delta,
    player.radius,
    level.arena.width - player.radius,
  );
  player.position.y = clamp(
    player.position.y + move.y * world.loadout.speed * delta,
    player.radius,
    level.arena.height - player.radius,
  );
}

/** Combines keyboard and mouse input into a single clamped movement vector. */
function resolveMovement(player: PlayerState, input: InputState): Vec2 {
  if (length(input.move) > 0) {
    return normalize(input.move);
  }

  if (!input.mouse?.active) {
    return { x: 0, y: 0 };
  }

  const target = input.mouse.position;
  const toTarget = { x: target.x - player.position.x, y: target.y - player.position.y };
  const targetDistance = length(toTarget);

  if (targetDistance <= player.radius + MOUSE_DEAD_ZONE) {
    return { x: 0, y: 0 };
  }

  const direction = normalize(toTarget);
  const magnitude = clamp((targetDistance - player.radius) / MOUSE_EASE_DISTANCE, 0, 1);
  return { x: direction.x * magnitude, y: direction.y * magnitude };
}
