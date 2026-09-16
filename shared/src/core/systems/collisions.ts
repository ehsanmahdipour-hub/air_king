import { STARTER_AIRCRAFT } from '../../config/player';
import { applyDamage, isDefeated } from '../combat';
import { compact } from '../collections';
import type { EnemyState, World } from '../entities';
import { circlesOverlap } from '../math';
import { addScore, scoreForKill } from '../score';

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

      break;
    }
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

    player.health = applyDamage(player.health, projectile.damage);
    player.invulnerableFor = STARTER_AIRCRAFT.invulnerabilitySeconds;
    world.events.push({
      type: 'playerHit',
      position: { ...player.position },
      damage: projectile.damage,
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

    player.health = applyDamage(player.health, enemy.contactDamage);
    player.invulnerableFor = STARTER_AIRCRAFT.invulnerabilitySeconds;
    world.events.push({
      type: 'playerHit',
      position: { ...player.position },
      damage: enemy.contactDamage,
    });
  }
}

function destroyEnemy(world: World, enemy: EnemyState): void {
  enemy.alive = false;
  const gained = scoreForKill(enemy);
  world.score = addScore(world.score, gained);
  world.director.enemiesDestroyed += 1;
  world.events.push({ type: 'enemyDestroyed', position: { ...enemy.position }, score: gained });
}
