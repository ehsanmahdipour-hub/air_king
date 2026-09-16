/**
 * Health and damage rules. Pure and framework-free so they can be reused and
 * tested independently of rendering or Phaser.
 */
export function applyDamage(currentHealth: number, damage: number): number {
  if (!Number.isFinite(damage) || damage < 0) {
    throw new RangeError('damage must be a non-negative finite number');
  }
  return Math.max(0, currentHealth - damage);
}

export function isDefeated(health: number): boolean {
  return health <= 0;
}
