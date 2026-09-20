import type { Arena } from '../../config/levels';
import type { ProjectileSpec } from '../../config/weapons';
import type { BossState, PlayerState } from '../entities';

/** Context for a boss movement behavior. */
export interface BossMovementContext {
  boss: BossState;
  arena: Arena;
  player: PlayerState;
  deltaSeconds: number;
}

export type BossMovementFn = (context: BossMovementContext) => void;

/** Context for a boss attack pattern. */
export interface BossAttackContext {
  boss: BossState;
  arena: Arena;
  player: PlayerState;
  fire: (spec: ProjectileSpec, baseAngleRadians: number) => void;
}

export type BossAttackFn = (context: BossAttackContext) => void;
