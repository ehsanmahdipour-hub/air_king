import { beforeEach, describe, expect, it } from 'vitest';

import { TEST_LEVEL_1 } from '../config/levels';
import { BASIC_FIGHTER } from '../config/enemies';
import { STARTER_AIRCRAFT } from '../config/player';
import { createWorld, stepWorld, type EnemyState, type InputState, type World } from './world';

const IDLE: InputState = { move: { x: 0, y: 0 }, firing: false };

function stopSpawning(world: World): void {
  world.enemiesSpawned = world.level.enemyCount;
}

function makeEnemy(overrides: Partial<EnemyState> = {}): EnemyState {
  return {
    id: 900,
    typeId: BASIC_FIGHTER.id,
    position: { x: 480, y: 200 },
    radius: BASIC_FIGHTER.radius,
    health: BASIC_FIGHTER.maxHealth,
    maxHealth: BASIC_FIGHTER.maxHealth,
    speed: BASIC_FIGHTER.speed,
    contactDamage: BASIC_FIGHTER.contactDamage,
    scoreValue: BASIC_FIGHTER.scoreValue,
    alive: true,
    ...overrides,
  };
}

describe('createWorld', () => {
  it('starts a fresh running world', () => {
    const world = createWorld();

    expect(world.status).toBe('running');
    expect(world.score).toBe(0);
    expect(world.distance).toBe(0);
    expect(world.enemies).toHaveLength(0);
    expect(world.projectiles).toHaveLength(0);
    expect(world.player.health).toBe(STARTER_AIRCRAFT.maxHealth);
    expect(world.player.position).toEqual(TEST_LEVEL_1.playerStart);
  });
});

describe('player movement', () => {
  let world: World;

  beforeEach(() => {
    world = createWorld();
    stopSpawning(world);
  });

  it('moves with keyboard input and clamps to the arena', () => {
    const input: InputState = { move: { x: 1, y: 0 }, firing: false };
    for (let step = 0; step < 100; step += 1) {
      stepWorld(world, input, 0.05);
    }

    expect(world.player.position.x).toBe(TEST_LEVEL_1.arena.width - STARTER_AIRCRAFT.radius);
  });

  it('normalizes keyboard input so diagonal movement is not faster', () => {
    const diagonal: InputState = { move: { x: 1, y: 1 }, firing: false };
    const start = { ...world.player.position };
    stepWorld(world, diagonal, 0.05);

    const moved = Math.hypot(
      world.player.position.x - start.x,
      world.player.position.y - start.y,
    );
    expect(moved).toBeCloseTo(STARTER_AIRCRAFT.speed * 0.05, 5);
  });

  it('seeks the mouse pointer without requiring a click', () => {
    const input: InputState = {
      move: { x: 0, y: 0 },
      firing: false,
      mouse: { active: true, position: { x: world.player.position.x + 200, y: world.player.position.y } },
    };
    const startX = world.player.position.x;
    stepWorld(world, input, 0.05);

    expect(world.player.position.x).toBeGreaterThan(startX);
  });

  it('does not move when the pointer is within the dead-zone', () => {
    const input: InputState = {
      move: { x: 0, y: 0 },
      firing: false,
      mouse: {
        active: true,
        position: { x: world.player.position.x + 5, y: world.player.position.y },
      },
    };
    const start = { ...world.player.position };
    stepWorld(world, input, 0.05);

    expect(world.player.position).toEqual(start);
  });

  it('ignores the mouse while keyboard input is held', () => {
    const input: InputState = {
      move: { x: -1, y: 0 },
      firing: false,
      mouse: { active: true, position: { x: 1000, y: 0 } },
    };
    const startX = world.player.position.x;
    stepWorld(world, input, 0.05);

    expect(world.player.position.x).toBeLessThan(startX);
  });
});

describe('weapon firing', () => {
  it('fires a projectile respecting the fire rate', () => {
    const world = createWorld();
    stopSpawning(world);
    const input: InputState = { move: { x: 0, y: 0 }, firing: true };

    stepWorld(world, input, 1 / 60);
    expect(world.projectiles).toHaveLength(1);
    expect(world.events.some((event) => event.type === 'shotFired')).toBe(true);

    // Cooldown blocks immediate re-fire.
    stepWorld(world, input, 1 / 60);
    expect(world.projectiles).toHaveLength(1);

    for (let step = 0; step < 12; step += 1) {
      stepWorld(world, input, 1 / 60);
    }
    expect(world.projectiles.length).toBeGreaterThanOrEqual(2);
  });

  it('does not fire when the trigger is released', () => {
    const world = createWorld();
    stopSpawning(world);
    stepWorld(world, IDLE, 1 / 60);

    expect(world.projectiles).toHaveLength(0);
  });
});

describe('collisions', () => {
  let world: World;

  beforeEach(() => {
    world = createWorld();
    stopSpawning(world);
  });

  it('destroys an enemy, awards score and emits an event', () => {
    world.enemies.push(makeEnemy({ position: { x: 480, y: 300 }, health: 5, speed: 0 }));
    world.projectiles.push({
      id: 800,
      position: { x: 480, y: 330 },
      velocity: { x: 0, y: -720 },
      radius: 4,
      damage: 10,
      alive: true,
    });

    stepWorld(world, IDLE, 0.016);

    expect(world.enemies).toHaveLength(0);
    expect(world.projectiles).toHaveLength(0);
    expect(world.score).toBe(BASIC_FIGHTER.scoreValue);
    expect(world.enemiesDestroyed).toBe(1);
    expect(world.events.some((event) => event.type === 'enemyDestroyed')).toBe(true);
  });

  it('damages the player on contact and grants brief invulnerability', () => {
    world.enemies.push(makeEnemy({ position: { ...world.player.position }, speed: 0 }));

    stepWorld(world, IDLE, 0.016);
    expect(world.player.health).toBe(STARTER_AIRCRAFT.maxHealth - BASIC_FIGHTER.contactDamage);
    expect(world.enemies).toHaveLength(0);
    expect(world.events.some((event) => event.type === 'playerHit')).toBe(true);

    // A second contact during invulnerability does not deal more damage.
    world.enemies.push(makeEnemy({ position: { ...world.player.position }, speed: 0 }));
    stepWorld(world, IDLE, 0.016);
    expect(world.player.health).toBe(STARTER_AIRCRAFT.maxHealth - BASIC_FIGHTER.contactDamage);
  });

  it('does not award score for enemies destroyed by collision', () => {
    world.enemies.push(makeEnemy({ position: { ...world.player.position }, speed: 0 }));

    stepWorld(world, IDLE, 0.016);

    expect(world.score).toBe(0);
  });
});

describe('player death', () => {
  it('enters the game over state and stops simulating', () => {
    const world = createWorld();
    stopSpawning(world);
    world.player.health = 10;
    world.enemies.push(
      makeEnemy({ position: { ...world.player.position }, speed: 0, contactDamage: 20 }),
    );

    stepWorld(world, IDLE, 0.016);

    expect(world.player.health).toBe(0);
    expect(world.status).toBe('gameover');
    expect(world.events.some((event) => event.type === 'playerDestroyed')).toBe(true);

    const elapsed = world.elapsed;
    stepWorld(world, IDLE, 0.05);
    expect(world.elapsed).toBe(elapsed);
  });
});

describe('enemy spawning', () => {
  it('spawns up to the configured enemy count', () => {
    const world = createWorld();
    world.level = { ...TEST_LEVEL_1, enemyCount: 3, spawnInterval: 0.1, spawnIntervalJitter: 0 };

    for (let step = 0; step < 40; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }
    expect(world.enemiesSpawned).toBe(3);

    for (let step = 0; step < 40; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }
    expect(world.enemiesSpawned).toBe(3);
  });

  it('culls enemies that escape past the bottom', () => {
    const world = createWorld();
    stopSpawning(world);
    world.enemies.push(
      makeEnemy({
        position: { x: 480, y: TEST_LEVEL_1.arena.height + 200 },
        speed: 0,
      }),
    );

    stepWorld(world, IDLE, 0.016);

    expect(world.enemies).toHaveLength(0);
  });
});
