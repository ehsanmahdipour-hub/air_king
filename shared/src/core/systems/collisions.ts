import { applyArmor, applyDamage, isDefeated } from '../combat';
import { compact } from '../collections';
import type { EnemyState, World } from '../entities';
import { circlesOverlap } from '../math';
import { addScore, scoreForBossDamage, scoreForEnemyDestroyed } from '../scoring';
import { defeatBoss } from './boss';

export function resolveCollisions(world: World): void {
  resolvePlayerProjectileHits(world);
  resolveEnemyProjectileHits(world);
  resolvePlayerContact(world);

  compact(world.projectiles);
  compact(world.enemies);
}

function resolvePlayerProjectileHits(world: World): void {
  for (const projectile of world.projectiles) {
    if (!projectile.alive || projectile.owner !== 'player') {
      continue;
    }

    let hit = false;

    for (const enemy of world.enemies) {
      if (!enemy.alive) {
        continue;
      }

      if (!circlesOverlap(projectile.position, projectile.radius, enemy.position, enemy.radius)) {
        continue;
      }

      projectile.alive = false;
      enemy.health = applyDamage(enemy.health, projectile.damage);

      if (isDefeated(enemy.health)) {
        destroyEnemy(world, enemy);
      } else {
        world.events.push({
          type: 'enemyHit',
          position: { ...projectile.position },
          damage: projectile.damage,
        });
      }

      hit = true;
      break;
    }

    if (hit) {
      continue;
    }

    resolveBossProjectileHit(world, projectile);
  }
}

function resolveBossProjectileHit(
  world: World,
  projectile: { alive: boolean; position: { x: number; y: number }; radius: number; damage: number },
): void {
  const boss = world.boss;
  if (!boss || !boss.alive) {
    return;
  }

  if (!circlesOverlap(projectile.position, projectile.radius, boss.position, boss.radius)) {
    return;
  }

  projectile.alive = false;
  boss.health = applyDamage(boss.health, projectile.damage);
  world.score = addScore(world.score, scoreForBossDamage(projectile.damage, world.scoreConfig));
  world.events.push({
    type: 'bossHit',
    position: { ...projectile.position },
    damage: projectile.damage,
  });

  if (isDefeated(boss.health)) {
    defeatBoss(world);
  }
}

function resolveEnemyProjectileHits(world: World): void {
  const { player } = world;

  for (const projectile of world.projectiles) {
    if (!projectile.alive || projectile.owner !== 'enemy') {
      continue;
    }

    if (!circlesOverlap(projectile.position, projectile.radius, player.position, player.radius)) {
      continue;
    }

    projectile.alive = false;

    if (player.invulnerableFor > 0) {
      continue;
    }

    const damage = applyArmor(projectile.damage, player.armor);
    player.health = applyDamage(player.health, damage);
    player.invulnerableFor = world.loadout.invulnerabilitySeconds;
    world.events.push({
      type: 'playerHit',
      position: { ...player.position },
      damage,
    });
  }
}

function resolvePlayerContact(world: World): void {
  const { player } = world;

  for (const enemy of world.enemies) {
    if (!enemy.alive) {
      continue;
    }

    if (!circlesOverlap(enemy.position, enemy.radius, player.position, player.radius)) {
      continue;
    }

    enemy.alive = false;

    if (player.invulnerableFor > 0) {
      continue;
    }

    const damage = applyArmor(enemy.contactDamage, player.armor);
    player.health = applyDamage(player.health, damage);
    player.invulnerableFor = world.loadout.invulnerabilitySeconds;
    world.events.push({
      type: 'playerHit',
      position: { ...player.position },
      damage,
    });
  }

  resolveBossContact(world);
}

function resolveBossContact(world: World): void {
  const { player } = world;
  const boss = world.boss;
  if (!boss || !boss.alive) {
    return;
  }

  if (!circlesOverlap(boss.position, boss.radius, player.position, player.radius)) {
    return;
  }

  if (player.invulnerableFor > 0) {
    return;
  }

  const damage = applyArmor(boss.config.contactDamage, player.armor);
  player.health = applyDamage(player.health, damage);
  player.invulnerableFor = world.loadout.invulnerabilitySeconds;
  world.events.push({
    type: 'playerHit',
    position: { ...player.position },
    damage,
  });
}

function destroyEnemy(world: World, enemy: EnemyState): void {
  enemy.alive = false;
  const gained = scoreForEnemyDestroyed(enemy, world.scoreConfig);
  world.score = addScore(world.score, gained);
  world.director.enemiesDestroyed += 1;
  world.events.push({ type: 'enemyDestroyed', position: { ...enemy.position }, score: gained });
}
