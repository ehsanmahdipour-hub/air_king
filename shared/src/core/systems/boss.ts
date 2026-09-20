import { getBoss, type BossConfig, type BossPhaseConfig } from '../../config/bosses';
import type { ProjectileSpec } from '../../config/weapons';
import { runBossAttack, runBossMovement } from '../bosses';
import type { BossState, World } from '../entities';
import { addScore } from '../scoring';
import { createProjectiles } from '../weapons';
import { spawnProjectile } from './projectiles';

/** Creates the level boss, descending from above the arena. */
export function spawnBoss(world: World, bossId: string): void {
  const config: BossConfig = getBoss(bossId);
  const firstPhase = config.phases[0];
  const maxHealth = Math.max(1, Math.round(config.maxHealth * world.difficulty.enemyHealth));

  world.boss = {
    id: world.nextId++,
    bossId: config.id,
    config,
    position: { x: world.level.arena.width / 2, y: -config.radius },
    radius: config.radius,
    health: maxHealth,
    maxHealth,
    phaseIndex: 0,
    attackIndex: 0,
    age: 0,
    attackCooldown: firstPhase ? firstPhase.attackInterval : 1.5,
    entering: true,
    direction: 1,
    alive: true,
  };

  world.director.bossSpawned = true;
  world.events.push({ type: 'bossSpawned', position: { ...world.boss.position } });
}

/** Advances the boss: entry, phase transitions, movement and attacks. */
export function updateBoss(world: World, deltaSeconds: number): void {
  const boss = world.boss;
  if (!boss) {
    return;
  }

  boss.age += deltaSeconds;

  if (boss.entering) {
    boss.position.y += boss.config.entrySpeed * deltaSeconds;
    if (boss.position.y >= boss.config.entryY) {
      boss.position.y = boss.config.entryY;
      boss.entering = false;
    }
    return;
  }

  const fraction = boss.maxHealth > 0 ? boss.health / boss.maxHealth : 0;
  const phaseIndex = resolvePhaseIndex(boss.config.phases, fraction);
  if (phaseIndex !== boss.phaseIndex) {
    boss.phaseIndex = phaseIndex;
    boss.attackIndex = 0;
    boss.attackCooldown = boss.config.phases[phaseIndex]?.attackInterval ?? 1;
    world.events.push({
      type: 'bossPhase',
      position: { ...boss.position },
      phase: phaseIndex + 1,
    });
  }

  runBossMovement(boss, world, deltaSeconds);

  boss.attackCooldown -= deltaSeconds;
  if (boss.attackCooldown <= 0) {
    runBossAttack(boss, world, (spec, angle) => fireBossProjectiles(world, boss, spec, angle));
    boss.attackCooldown = boss.config.phases[boss.phaseIndex]?.attackInterval ?? 1.5;
  }
}

/** Defeats the boss, awarding its score and clearing the boss slot. */
export function defeatBoss(world: World): void {
  const boss = world.boss;
  if (!boss || !boss.alive) {
    return;
  }

  boss.alive = false;
  const reward = Math.max(0, Math.round(boss.config.scoreValue));
  world.score = addScore(world.score, reward);
  world.director.bossDefeated = true;
  world.events.push({ type: 'bossDefeated', position: { ...boss.position }, score: reward });
  world.boss = null;
}

function resolvePhaseIndex(phases: BossPhaseConfig[], fraction: number): number {
  for (let index = 0; index < phases.length; index += 1) {
    const phase = phases[index];
    if (phase && fraction > phase.untilHealthFraction) {
      return index;
    }
  }
  return Math.max(0, phases.length - 1);
}

function fireBossProjectiles(
  world: World,
  boss: BossState,
  spec: ProjectileSpec,
  angleRadians: number,
): void {
  const scaled: ProjectileSpec = {
    ...spec,
    damage: Math.max(0, spec.damage * world.difficulty.enemyDamage),
  };
  for (const spawn of createProjectiles(boss.position, scaled, angleRadians)) {
    spawnProjectile(world, 'enemy', spawn);
  }
  world.events.push({ type: 'bossShot', position: { ...boss.position } });
}