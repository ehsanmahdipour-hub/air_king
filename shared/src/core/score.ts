/** Score rules. Pure and framework-free. */

export function addScore(currentScore: number, delta: number): number {
  if (!Number.isFinite(delta) || delta < 0) {
    throw new RangeError('score delta must be a non-negative finite number');
  }
  return currentScore + delta;
}

/** Score awarded for destroying an enemy, based on its configured value. */
export function scoreForKill(enemy: { scoreValue: number }): number {
  return Math.max(0, Math.floor(enemy.scoreValue));
}
