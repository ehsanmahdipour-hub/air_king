import type { Vec2 } from '../../types';
import { angleBetween } from '../math';
import type { EnemyState } from '../entities';

/** Advances an enemy's age and firing cooldown by one step. */
export function advanceTimers(enemy: EnemyState, deltaSeconds: number): void {
  enemy.age += deltaSeconds;
  if (enemy.fireCooldown > 0) {
    enemy.fireCooldown = Math.max(0, enemy.fireCooldown - deltaSeconds);
  }
}

export function isFireReady(enemy: EnemyState, fireDelay: number): boolean {
  return enemy.age >= fireDelay && enemy.fireCooldown <= 0;
}

export function aimAt(origin: Vec2, target: Vec2): number {
  return angleBetween(origin, target);
}
