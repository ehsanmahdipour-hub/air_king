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

/**
 * Applies flat armor to incoming damage. Armor can never fully negate a hit, so
 * any positive damage still deals at least 1.
 */
export function applyArmor(damage: number, armor: number): number {
  if (!Number.isFinite(damage) || damage < 0) {
    throw new RangeError('damage must be a non-negative finite number');
  }
  if (!Number.isFinite(armor) || armor < 0) {
    throw new RangeError('armor must be a non-negative finite number');
  }
  if (damage === 0) {
    return 0;
  }
  return Math.max(1, damage - armor);
}

export function isDefeated(health: number): boolean {
  return health <= 0;
}