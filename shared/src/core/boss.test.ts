import { describe, expect, it } from 'vitest';

import { DREADNOUGHT } from '../config/bosses';
import { LEVELS, type LevelConfig } from '../config/levels';
import { isLevelCleared } from './levelDirector';
import { spawnBoss } from './systems/boss';
import { createWorld, stepWorld, type InputState, type World } from './world';

const IDLE: InputState = { move: { x: 0, y: 0 }, firing: false };

function startPlaying(world: World): void {
  let guard = 0;
  while (world.status === 'ready' && guard < 200) {
    stepWorld(world, IDLE, 0.05);
    guard += 1;
  }
}

function stopSpawning(world: World): void {
  world.director.waveIndex = world.level.waves.length;
  world.director.obstacleIndex = world.level.obstacleSections.length;
  world.director.spawnTimer = Number.POSITIVE_INFINITY;
  world.director.obstacleTimer = Number.POSITIVE_INFINITY;
}

function bossLevel(overrides: Partial<LevelConfig> = {}): LevelConfig {
  return {
    ...LEVELS[0],
    startDelaySeconds: 0,
    waves: [
      {
        startDelay: 0,
        groups: [
          { enemyTypeId: 'fighter', count: 1, formation: 'line', interval: 0, startDelay: 0 },
        ],
      },
    ],
    obstacleSections: [],
    boss: { bossId: 'dreadnought', spawnDelaySeconds: 0 },
    reward: { completionBonus: 0 },
    ...overrides,
  };
}

function noBossLevel(): LevelConfig {
  return { ...bossLevel(), boss: undefined };
}

function makeBossWorld(): World {
  // Uses a boss level so the level cannot complete while the boss is alive;
  // the boss is spawned manually to isolate boss behavior from the director.
  const world = createWorld(bossLevel());
  startPlaying(world);
  stopSpawning(world);
  spawnBoss(world, DREADNOUGHT.id);
  return world;
}

function finishEntry(world: World): void {
  for (let index = 0; index < 300 && world.boss?.entering; index += 1) {
    stepWorld(world, IDLE, 0.05);
  }
}

function playerProjectile(world: World, damage: number, x: number, y: number) {
  return {
    id: world.nextId++,
    owner: 'player' as const,
    position: { x, y },
    velocity: { x: 0, y: 0 },
    radius: 4,
    damage,
    lifeRemaining: 1,
    alive: true,
  };
}

describe('boss spawn', () => {
  it('creates a full-health boss descending into the arena', () => {
    const world = createWorld(noBossLevel());
    startPlaying(world);
    stopSpawning(world);
    spawnBoss(world, DREADNOUGHT.id);

    expect(world.boss).not.toBeNull();
    expect(world.boss?.maxHealth).toBe(DREADNOUGHT.maxHealth);
    expect(world.boss?.health).toBe(DREADNOUGHT.maxHealth);
    expect(world.boss?.entering).toBe(true);
    expect(world.director.bossSpawned).toBe(true);
    expect(world.events.some((event) => event.type === 'bossSpawned')).toBe(true);
  });
});

describe('boss entry and attacks', () => {
  it('descends, then attacks after its cooldown', () => {
    const world = makeBossWorld();

    stepWorld(world, IDLE, 0.05);
    expect(world.boss?.entering).toBe(true);
    expect(world.projectiles.filter((projectile) => projectile.owner === 'enemy')).toHaveLength(0);

    finishEntry(world);
    expect(world.boss?.entering).toBe(false);
    expect(world.boss?.position.y).toBe(DREADNOUGHT.entryY);

    let fired = false;
    for (let index = 0; index < 80; index += 1) {
      stepWorld(world, IDLE, 0.05);
      if (world.events.some((event) => event.type === 'bossShot')) {
        fired = true;
        break;
      }
    }

    expect(fired).toBe(true);
    expect(world.projectiles.filter((projectile) => projectile.owner === 'enemy').length).toBeGreaterThan(0);
  });
});

describe('boss phases', () => {
  it('transitions phases as health drops', () => {
    const world = makeBossWorld();
    finishEntry(world);
    const boss = world.boss;
    if (!boss) throw new Error('expected a boss');

    boss.health = boss.maxHealth * 0.5;
    stepWorld(world, IDLE, 0.05);
    expect(boss.phaseIndex).toBe(1);
    expect(world.events.some((event) => event.type === 'bossPhase')).toBe(true);

    boss.health = boss.maxHealth * 0.1;
    stepWorld(world, IDLE, 0.05);
    expect(boss.phaseIndex).toBe(2);
  });
});

describe('boss damage and death', () => {
  it('takes damage, awards score and emits a hit event', () => {
    const world = makeBossWorld();
    finishEntry(world);
    const boss = world.boss;
    if (!boss) throw new Error('expected a boss');

    const before = boss.health;
    world.projectiles.push(playerProjectile(world, 25, boss.position.x, boss.position.y));

    stepWorld(world, IDLE, 0.05);

    expect(boss.health).toBe(before - 25);
    expect(world.score).toBeGreaterThan(0);
    expect(world.events.some((event) => event.type === 'bossHit')).toBe(true);
  });

  it('dies, grants its reward and clears the boss slot', () => {
    const world = makeBossWorld();
    finishEntry(world);
    const boss = world.boss;
    if (!boss) throw new Error('expected a boss');

    boss.health = 5;
    world.projectiles.push(playerProjectile(world, 50, boss.position.x, boss.position.y));

    stepWorld(world, IDLE, 0.05);

    expect(world.boss).toBeNull();
    expect(world.director.bossDefeated).toBe(true);
    // 50 damage score + the boss defeat reward.
    expect(world.score).toBe(50 + DREADNOUGHT.scoreValue);
    expect(world.events.some((event) => event.type === 'bossDefeated')).toBe(true);
  });
});

describe('boss contact', () => {
  it('damages the player on contact', () => {
    const world = makeBossWorld();
    finishEntry(world);
    const boss = world.boss;
    if (!boss) throw new Error('expected a boss');

    world.player.position = { ...boss.position };
    world.player.invulnerableFor = 0;
    const before = world.player.health;

    stepWorld(world, IDLE, 0.016);

    expect(world.player.health).toBeLessThan(before);
  });
});

describe('boss level integration', () => {
  it('spawns the boss from the level reference after the waves', () => {
    const world = createWorld(bossLevel());
    startPlaying(world);
    stopSpawning(world);

    for (let index = 0; index < 10 && !world.director.bossSpawned; index += 1) {
      stepWorld(world, IDLE, 0.05);
    }

    expect(world.director.bossSpawned).toBe(true);
    expect(world.boss?.bossId).toBe(DREADNOUGHT.id);
  });

  it('requires the boss to be defeated before the level completes', () => {
    const world = createWorld(bossLevel());
    startPlaying(world);
    stopSpawning(world);

    for (let index = 0; index < 10 && !world.director.bossSpawned; index += 1) {
      stepWorld(world, IDLE, 0.05);
    }
    expect(world.boss).not.toBeNull();
    expect(isLevelCleared(world)).toBe(false);

    const boss = world.boss;
    if (!boss) throw new Error('expected a boss');
    boss.health = 1;
    world.projectiles.push(playerProjectile(world, 10, boss.position.x, boss.position.y));

    stepWorld(world, IDLE, 0.05);

    expect(world.director.bossDefeated).toBe(true);
    expect(isLevelCleared(world)).toBe(true);
    expect(world.status).toBe('levelComplete');
  });
});