/** Shared primitive types used across game data and simulation. */

export interface Vec2 {
  x: number;
  y: number;
}

/** Events emitted by the simulation for the presentation layer to react to. */
export type GameEvent =
  | { type: 'levelStart'; position: Vec2 }
  | { type: 'levelComplete'; position: Vec2; score: number }
  | { type: 'shotFired'; position: Vec2 }
  | { type: 'enemyShot'; position: Vec2 }
  | { type: 'enemyHit'; position: Vec2; damage: number }
  | { type: 'enemyDestroyed'; position: Vec2; score: number }
  | { type: 'playerHit'; position: Vec2; damage: number }
  | { type: 'playerDestroyed'; position: Vec2 };