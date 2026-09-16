import { getEnemy } from '../config/enemies';
import { TEST_LEVEL_1, type LevelConfig } from '../config/levels';
import { STARTER_AIRCRAFT } from '../config/player';
import { getWeapon } from '../config/weapons';
import type { GameEvent, Vec2 } from '../types';
import { applyDamage, isDefeated } from './combat';
import { clamp, circlesOverlap, length, normalize, randomRange } from './math';
import { addScore, scoreForKill } from './score';
import { createProjectiles } from './weapons';

export type GameStatus = 'running' | 'gameover';

export interface PlayerState {
  position: Vec2;
  radius: number;
  health: number;
  maxHealth: number;
  /** Seconds remaining before the weapon can fire again. */
  fireCooldown: number;
  /** Seconds of remaining damage immunity after a hit. */
  invulnerableFor: number;
}

export interface EnemyState {
  id: number;
  typeId: string;
  position: Vec2;
  radius: number;
  health: number;
  maxHealth: number;
  speed: number;
  contactDamage: number;
  scoreValue: number;
  alive: boolean;
}

export interface ProjectileState {
  id: number;
  position: Vec2;
  velocity: Vec2;
  radius: number;
  damage: number;
  alive: boolean;
}

/** Movement intent for a single simulation step. */
export interface InputState {
  /** Keyboard movement vector, each axis in [-1, 1]. */
  move: Vec2;
  firing: boolean;
  /** Pointer target when the mouse is the active movement device. */
  mouse?: { active: boolean; position: Vec2 };
}

export interface World {
  status: GameStatus;
  elapsed: number;
  /** Total forward distance travelled, used to scroll the environment. */
  distance: number;
  score: number;
  level: LevelConfig;
  player: PlayerState;
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  /** Events produced during the last step, consumed by the presentation layer. */
  events: GameEvent[];
  nextId: number;
  spawnTimer: number;
  enemiesSpawned: number;
  enemiesDestroyed: number;
}

/** Upper bound on a single step to keep physics stable after a tab stall. */
const MAX_STEP_SECONDS = 0.05;
/** Distance beyond the arena at which entities are removed. */
const CULL_MARGIN = 100;
/** Mouse dead-zone padding beyond the player radius. */
const MOUSE_DEAD_ZONE = 8;
/** Distance over which the mouse approach eases to full speed. */
const MOUSE_EASE_DISTANCE = 80;

export function createWorld(level: LevelConfig = TEST_LEVEL_1): World {
  return {
    status: 'running',
    elapsed: 0,
    distance: 0,
    score: 0,
    level,
    player: {
      position: { ...level.playerStart },
      radius: STARTER_AIRCRAFT.radius,
      health: STARTER_AIRCRAFT.maxHealth,
      maxHealth: STARTER_AIRCRAFT.maxHealth,
      fireCooldown: 0,
      invulnerableFor: 0,
    },
    enemies: [],
    projectiles: [],
    events: [],
    nextId: 1,
    spawnTimer: 0.6,
    enemiesSpawned: 0,
    enemiesDestroyed: 0,
  };
}

/**
 * Advances the simulation by one step. The world is mutated in place for
 * performance; `events` is cleared and repopulated each step.
 */
export function stepWorld(world: World, input: InputState, deltaSeconds: number): void {
  if (world.status !== 'running') {
    return;
  }

  const delta = clamp(deltaSeconds, 0, MAX_STEP_SECONDS);
  world.events.length = 0;
  world.elapsed += delta;
  world.distance += world.level.scrollSpeed * delta;

  updatePlayer(world, input, delta);
  updateWeapon(world, input, delta);
  updateProjectiles(world, delta);
  updateSpawning(world, delta);
  updateEnemies(world, delta);
  resolveCollisions(world);

  if (isDefeated(world.player.health)) {
    world.player.health = 0;
    world.status = 'gameover';
    world.events.push({ type: 'playerDestroyed', position: { ...world.player.position } });
  }
}

function updatePlayer(world: World, input: InputState, delta: number): void {
  const { player, level } = world;

  if (player.invulnerableFor > 0) {
    player.invulnerableFor = Math.max(0, player.invulnerableFor - delta);
  }

  const move = resolveMovement(player, input);
  player.position.x = clamp(
    player.position.x + move.x * STARTER_AIRCRAFT.speed * delta,
    player.radius,
    level.arena.width - player.radius,
  );
  player.position.y = clamp(
    player.position.y + move.y * STARTER_AIRCRAFT.speed * delta,
    player.radius,
    level.arena.height - player.radius,
  );
}

/** Combines keyboard and mouse input into a single clamped movement vector. */
function resolveMovement(player: PlayerState, input: InputState): Vec2 {
  if (length(input.move) > 0) {
    return normalize(input.move);
  }

  if (!input.mouse?.active) {
    return { x: 0, y: 0 };
  }

  const target = input.mouse.position;
  const toTarget = { x: target.x - player.position.x, y: target.y - player.position.y };
  const targetDistance = length(toTarget);

  if (targetDistance <= player.radius + MOUSE_DEAD_ZONE) {
    return { x: 0, y: 0 };
  }

  const direction = normalize(toTarget);
  const magnitude = clamp((targetDistance - player.radius) / MOUSE_EASE_DISTANCE, 0, 1);
  return { x: direction.x * magnitude, y: direction.y * magnitude };
}

function updateWeapon(world: World, input: InputState, delta: number): void {
  const { player } = world;

  if (player.fireCooldown > 0) {
    player.fireCooldown = Math.max(0, player.fireCooldown - delta);
  }

  if (!input.firing || player.fireCooldown > 0) {
    return;
  }

  const weapon = getWeapon(STARTER_AIRCRAFT.weaponId);
  for (const spawn of createProjectiles(player.position, weapon)) {
    world.projectiles.push({
      id: world.nextId++,
      position: spawn.position,
      velocity: spawn.velocity,
      radius: spawn.radius,
      damage: spawn.damage,
      alive: true,
    });
  }

  world.events.push({ type: 'shotFired', position: { ...player.position } });
  player.fireCooldown = 1 / weapon.fireRate;
}

function updateProjectiles(world: World, delta: number): void {
  const { arena } = world.level;

  for (const projectile of world.projectiles) {
    projectile.position.x += projectile.velocity.x * delta;
    projectile.position.y += projectile.velocity.y * delta;

    if (
      projectile.position.x < -CULL_MARGIN ||
      projectile.position.x > arena.width + CULL_MARGIN ||
      projectile.position.y < -CULL_MARGIN ||
      projectile.position.y > arena.height + CULL_MARGIN
    ) {
      projectile.alive = false;
    }
  }
}

function updateSpawning(world: World, delta: number): void {
  const { level } = world;
  if (world.enemiesSpawned >= level.enemyCount) {
    return;
  }

  world.spawnTimer -= delta;
  if (world.spawnTimer > 0) {
    return;
  }

  const enemyConfig = getEnemy(level.enemyTypeId);
  const { radius } = enemyConfig;

  world.enemies.push({
    id: world.nextId++,
    typeId: enemyConfig.id,
    position: {
      x: randomRange(radius, level.arena.width - radius),
      y: -radius * 2,
    },
    radius,
    health: enemyConfig.maxHealth,
    maxHealth: enemyConfig.maxHealth,
    speed: enemyConfig.speed,
    contactDamage: enemyConfig.contactDamage,
    scoreValue: enemyConfig.scoreValue,
    alive: true,
  });

  world.enemiesSpawned += 1;
  world.spawnTimer += level.spawnInterval + randomRange(0, level.spawnIntervalJitter);
}

function updateEnemies(world: World, delta: number): void {
  const { arena } = world.level;

  for (const enemy of world.enemies) {
    enemy.position.y += enemy.speed * delta;

    if (enemy.position.y - enemy.radius > arena.height + CULL_MARGIN) {
      enemy.alive = false;
    }
  }

  world.enemies = world.enemies.filter((enemy) => enemy.alive);
}

function resolveCollisions(world: World): void {
  resolveProjectileHits(world);
  resolvePlayerCollisions(world);

  world.projectiles = world.projectiles.filter((projectile) => projectile.alive);
  world.enemies = world.enemies.filter((enemy) => enemy.alive);
}

function resolveProjectileHits(world: World): void {
  for (const projectile of world.projectiles) {
    for (const enemy of world.enemies) {
      if (!projectile.alive || !enemy.alive) {
        continue;
      }

      if (!circlesOverlap(projectile.position, projectile.radius, enemy.position, enemy.radius)) {
        continue;
      }

      projectile.alive = false;
      enemy.health = applyDamage(enemy.health, projectile.damage);

      if (isDefeated(enemy.health)) {
        enemy.alive = false;
        const gained = scoreForKill(enemy);
        world.score = addScore(world.score, gained);
        world.enemiesDestroyed += 1;
        world.events.push({ type: 'enemyDestroyed', position: { ...enemy.position }, score: gained });
      }
    }
  }
}

function resolvePlayerCollisions(world: World): void {
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
