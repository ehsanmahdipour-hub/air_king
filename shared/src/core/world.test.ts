import { beforeEach, describe, expect, it } from 'vitest';

import { BOMBER, FIGHTER, MINE, TURRET } from '../config/enemies';
import { TEST_LEVEL_1 } from '../config/levels';
import { STARTER_AIRCRAFT } from '../config/player';
import {
  createWorld,
  stepWorld,
  type EnemyState,
  type InputState,
  type ProjectileState,
  type World,
} from './world';

const IDLE: InputState = { move: { x: 0, y: 0 }, firing: false };

function stopSpawning(world: World): void {
  world.spawnGroupIndex = world.level.spawns.length;
  world.spawnTimer = Number.POSITIVE_INFINITY;
}

function makeEnemy(overrides: Partial<EnemyState> = {}): EnemyState {
  return {
    id: 900,
    typeId: FIGHTER.id,
    position: { x: 480, y: 200 },
    radius: FIGHTER.radius,
    health: FIGHTER.maxHealth,
    maxHealth: FIGHTER.maxHealth,
    speed: FIGHTER.speed,
    contactDamage: FIGHTER.contactDamage,
    scoreValue: FIGHTER.scoreValue,
    age: 0,
    fireCooldown: 0,
    alive: true,
    ...overrides,
  };
}

function makeProjectile(overrides: Partial<ProjectileState> = {}): ProjectileState {
  return {
    id: 800,
    owner: 'player',
    position: { x: 480, y: 330 },
    velocity: { x: 0, y: -720 },
    radius: 4,
    damage: 10,
    lifeRemaining: 1,
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
      mouse: {
        active: true,
        position: { x: world.player.position.x + 200, y: world.player.position.y },
      },
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
  it('fires player projectiles respecting the fire rate', () => {
    const world = createWorld();
    stopSpawning(world);
    const input: InputState = { move: { x: 0, y: 0 }, firing: true };

    stepWorld(world, input, 1 / 60);
    expect(world.projectiles).toHaveLength(1);
    expect(world.projectiles[0]?.owner).toBe('player');
    expect(world.events.some((event) => event.type === 'shotFired')).toBe(true);

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

describe('projectile lifecycle', () => {
  it('expires a projectile when its lifetime runs out', () => {
    const world = createWorld();
    stopSpawning(world);
    world.projectiles.push(
      makeProjectile({ position: { x: 480, y: 300 }, velocity: { x: 0, y: 0 }, lifeRemaining: 0.02 }),
    );

    stepWorld(world, IDLE, 0.05);

    expect(world.projectiles).toHaveLength(0);
  });

  it('culls a projectile that leaves the arena', () => {
    const world = createWorld();
    stopSpawning(world);
    world.projectiles.push(
      makeProjectile({ position: { x: 480, y: 700 }, velocity: { x: 0, y: 900 }, lifeRemaining: 5 }),
    );

    stepWorld(world, IDLE, 0.05);

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
    world.projectiles.push(makeProjectile({ lifeRemaining: 1 }));

    stepWorld(world, IDLE, 0.016);

    expect(world.enemies).toHaveLength(0);
    expect(world.projectiles).toHaveLength(0);
    expect(world.score).toBe(FIGHTER.scoreValue);
    expect(world.enemiesDestroyed).toBe(1);
    expect(world.events.some((event) => event.type === 'enemyDestroyed')).toBe(true);
  });

  it('emits an enemyHit event for non-lethal damage', () => {
    world.enemies.push(
      makeEnemy({ position: { x: 480, y: 300 }, health: FIGHTER.maxHealth, speed: 0 }),
    );
    world.projectiles.push(makeProjectile({ damage: 5, lifeRemaining: 1 }));

    stepWorld(world, IDLE, 0.016);

    expect(world.enemies).toHaveLength(1);
    expect(world.enemies[0]?.health).toBe(FIGHTER.maxHealth - 5);
    expect(world.events.some((event) => event.type === 'enemyHit')).toBe(true);
  });

  it('damages the player on contact and grants brief invulnerability', () => {
    world.enemies.push(makeEnemy({ position: { ...world.player.position }, speed: 0 }));

    stepWorld(world, IDLE, 0.016);
    expect(world.player.health).toBe(STARTER_AIRCRAFT.maxHealth - FIGHTER.contactDamage);
    expect(world.enemies).toHaveLength(0);
    expect(world.events.some((event) => event.type === 'playerHit')).toBe(true);

    world.enemies.push(makeEnemy({ position: { ...world.player.position }, speed: 0 }));
    stepWorld(world, IDLE, 0.016);
    expect(world.player.health).toBe(STARTER_AIRCRAFT.maxHealth - FIGHTER.contactDamage);
  });

  it('lets enemy projectiles damage the player', () => {
    world.projectiles.push(
      makeProjectile({
        owner: 'enemy',
        position: { ...world.player.position },
        velocity: { x: 0, y: 0 },
        damage: 12,
        radius: 6,
        lifeRemaining: 2,
      }),
    );

    stepWorld(world, IDLE, 0.016);

    expect(world.projectiles).toHaveLength(0);
    expect(world.player.health).toBe(STARTER_AIRCRAFT.maxHealth - 12);
    expect(world.events.some((event) => event.type === 'playerHit')).toBe(true);
  });

  it('does not award score for enemies destroyed by collision', () => {
    world.enemies.push(makeEnemy({ position: { ...world.player.position }, speed: 0 }));

    stepWorld(world, IDLE, 0.016);

    expect(world.score).toBe(0);
  });
});

describe('enemy behaviors', () => {
  let world: World;

  beforeEach(() => {
    world = createWorld();
    stopSpawning(world);
  });

  it('fighter seeks the player horizontally', () => {
    world.player.position = { x: 600, y: 500 };
    world.enemies.push(
      makeEnemy({ typeId: FIGHTER.id, position: { x: 300, y: 200 }, speed: 0 }),
    );

    stepWorld(world, IDLE, 0.05);
    const firstX = world.enemies[0].position.x;

    stepWorld(world, IDLE, 0.05);
    const secondX = world.enemies[0].position.x;

    expect(firstX).toBeGreaterThan(300);
    expect(secondX).toBeGreaterThan(firstX);
  });

  it('bomber drops a spread salvo', () => {
    world.enemies.push(
      makeEnemy({
        typeId: BOMBER.id,
        position: { x: 480, y: 200 },
        health: BOMBER.maxHealth,
        speed: 0,
        age: BOMBER.fireDelay,
      }),
    );

    stepWorld(world, IDLE, 0.05);

    const enemyShots = world.projectiles.filter((projectile) => projectile.owner === 'enemy');
    expect(enemyShots).toHaveLength(BOMBER.projectile.count);
    expect(world.events.some((event) => event.type === 'enemyShot')).toBe(true);
  });

  it('turret descends to its anchor and then fires at the player', () => {
    world.enemies.push(
      makeEnemy({
        typeId: TURRET.id,
        position: { x: 300, y: 0 },
        health: TURRET.maxHealth,
        speed: TURRET.speed,
        age: TURRET.fireDelay,
      }),
    );

    stepWorld(world, IDLE, 0.05);
    expect(world.enemies[0].position.y).toBeLessThan(TURRET.anchorY);
    expect(world.projectiles.filter((p) => p.owner === 'enemy')).toHaveLength(0);

    for (let step = 0; step < 60; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }

    const turretEnemy = world.enemies[0];
    expect(turretEnemy?.position.y).toBe(TURRET.anchorY);
    expect(world.projectiles.some((p) => p.owner === 'enemy')).toBe(true);
  });

  it('mine never fires', () => {
    world.enemies.push(
      makeEnemy({
        typeId: MINE.id,
        position: { x: 300, y: 200 },
        health: MINE.maxHealth,
        speed: 0,
        age: 100,
      }),
    );

    for (let step = 0; step < 20; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }

    expect(world.projectiles.filter((p) => p.owner === 'enemy')).toHaveLength(0);
  });

  it('handles several enemies of different types at once', () => {
    world.enemies.push(
      makeEnemy({ id: 1, typeId: FIGHTER.id, position: { x: 200, y: 100 }, speed: 0 }),
      makeEnemy({ id: 2, typeId: FIGHTER.id, position: { x: 700, y: 100 }, speed: 0 }),
      makeEnemy({
        id: 3,
        typeId: BOMBER.id,
        position: { x: 480, y: 100 },
        health: BOMBER.maxHealth,
        speed: 0,
        age: BOMBER.fireDelay,
      }),
      makeEnemy({ id: 4, typeId: MINE.id, position: { x: 600, y: 100 }, health: MINE.maxHealth, speed: 0 }),
    );

    stepWorld(world, IDLE, 0.05);

    expect(world.enemies).toHaveLength(4);
    expect(world.projectiles.filter((p) => p.owner === 'enemy')).toHaveLength(
      BOMBER.projectile.count,
    );
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
  it('spawns the configured number for a group and then stops', () => {
    const world = createWorld();
    world.level = {
      ...TEST_LEVEL_1,
      spawns: [{ enemyTypeId: 'fighter', count: 3, formation: 'line', interval: 0.1, startDelay: 0 }],
    };

    for (let step = 0; step < 40; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }
    expect(world.enemiesSpawned).toBe(3);

    for (let step = 0; step < 40; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }
    expect(world.enemiesSpawned).toBe(3);
  });

  it('moves through multiple spawn groups in order', () => {
    const world = createWorld();
    world.level = {
      ...TEST_LEVEL_1,
      spawns: [
        { enemyTypeId: 'fighter', count: 2, formation: 'line', interval: 0.05, startDelay: 0 },
        { enemyTypeId: 'mine', count: 2, formation: 'line', interval: 0.05, startDelay: 0 },
      ],
    };

    for (let step = 0; step < 30; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }

    expect(world.enemiesSpawned).toBe(4);
    const typeIds = world.enemies.map((enemy) => enemy.typeId);
    expect(typeIds).toContain('mine');
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
