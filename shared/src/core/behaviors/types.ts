import type { Arena } from '../../config/levels';
import type { ProjectileSpec } from '../../config/weapons';
import type { Vec2 } from '../../types';
import type { EnemyState, PlayerState } from '../entities';

/**
 * Everything a behavior is allowed to read or do. Behaviors have no direct
 * access to the world; they announce shots through `fire`, which keeps them
 * decoupled from the simulation internals and easy to test.
 */
export interface EnemyBehaviorContext {
  enemy: EnemyState;
  player: PlayerState;
  arena: Arena;
  deltaSeconds: number;
  fire: (origin: Vec2, angleRadians: number, spec: ProjectileSpec) => void;
}
