import type { ProjectileSpec } from '../../config/weapons';
import type { BossState, World } from '../entities';
import { BOSS_ATTACKS } from './attacks';
import { BOSS_MOVEMENTS } from './movements';

export type { BossMovementContext, BossMovementFn, BossAttackContext, BossAttackFn } from './types';

/** Runs the current phase's movement behavior. */
export function runBossMovement(boss: BossState, world: World, deltaSeconds: number): void {
  const phase = boss.config.phases[boss.phaseIndex];
  if (!phase) {
    return;
  }
  BOSS_MOVEMENTS[phase.movement]({
    boss,
    arena: world.level.arena,
    player: world.player,
    deltaSeconds,
  });
}

/** Runs the next attack pattern of the current phase and advances the cycle. */
export function runBossAttack(
  boss: BossState,
  world: World,
  fire: (spec: ProjectileSpec, baseAngleRadians: number) => void,
): void {
  const phase = boss.config.phases[boss.phaseIndex];
  if (!phase || phase.attacks.length === 0) {
    return;
  }

  const attackId = phase.attacks[boss.attackIndex % phase.attacks.length];
  if (attackId) {
    BOSS_ATTACKS[attackId]({
      boss,
      arena: world.level.arena,
      player: world.player,
      fire,
    });
  }
  boss.attackIndex += 1;
}