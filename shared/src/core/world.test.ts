import { beforeEach, describe, expect, it } from 'vitest';

import { BOMBER, DIVER, FIGHTER, MINE, TURRET, getEnemy } from '../config/enemies';
import { DEFAULT_ECONOMY_CONFIG } from '../config/economy';
import { LEVELS, type LevelConfig } from '../config/levels';
import { STARTER_AIRCRAFT } from '../config/aircraft';
import { DEFAULT_SCORE_CONFIG } from '../config/scoring';
import { calculateCoins } from './rewards';
import {
  createWorld,
  stepWorld,
  type EnemyState,
  type InputState,
  type ProjectileState,
  type World,
  type WorldOptions,
} from './world';

const IDLE: InputState = { move: { x: 0, y: 0 }, firing: false };
const TEST_LEVEL = LEVELS[0];

/** Advances past the level-start countdown into active play. */
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

/**
 * A level that never completes, so isolated behavior tests are not interrupted
 * by level-completion logic when spawning is stopped.
 */
const ISOLATION_LEVEL: LevelConfig = {
  ...TEST_LEVEL,
  startDelaySeconds: 0,
  completionMode: 'reach-distance',
  lengthUnits: Number.MAX_SAFE_INTEGER,
  waves: [
    {
      startDelay: 0,
      groups: [
        { enemyTypeId: 'fighter', count: 1, formation: 'line', interval: 0, startDelay: 0 },
      ],
    },
  ],
  obstacleSections: [],
  reward: { completionBonus: 0 },
};

function createIsolationWorld(): World {
  const world = createWorld(ISOLATION_LEVEL);
  startPlaying(world);
  stopSpawning(world);
  return world;
}

function makeEnemy(overrides: Partial<EnemyState> = {}): EnemyState {
  const typeId = overrides.typeId ?? FIGHTER.id;
  const config = getEnemy(typeId);
  return {
    id: 900,
    typeId,
    config,
    position: { x: 480, y: 200 },
    radius: config.radius,
    health: config.maxHealth,
    maxHealth: config.maxHealth,
    speed: config.speed,
    contactDamage: config.contactDamage,
    scoreValue: config.scoreValue,
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
  it('starts in the ready state with a full player and no entities', () => {
    const world = createWorld();

    expect(world.status).toBe('ready');
    expect(world.score).toBe(0);
    expect(world.distance).toBe(0);
    expect(world.enemies).toHaveLength(0);
    expect(world.projectiles).toHaveLength(0);
    expect(world.player.health).toBe(STARTER_AIRCRAFT.maxHealth);
    expect(world.player.position).toEqual(TEST_LEVEL.playerStart);
    expect(world.director.totalEnemies).toBeGreaterThan(0);
  });

  it('enters the playing state after the start countdown and emits levelStart', () => {
    const world = createWorld();
    let sawLevelStart = false;

    for (let step = 0; step < 200 && world.status === 'ready'; step += 1) {
      stepWorld(world, IDLE, 0.05);
      if (world.events.some((event) => event.type === 'levelStart')) {
        sawLevelStart = true;
      }
    }

    expect(world.status).toBe('playing');
    expect(sawLevelStart).toBe(true);
  });
});

describe('player movement', () => {
  let world: World;

  beforeEach(() => {
    world = createIsolationWorld();
  });

  it('moves with keyboard input and clamps to the arena', () => {
    const input: InputState = { move: { x: 1, y: 0 }, firing: false };
    for (let step = 0; step < 100; step += 1) {
      stepWorld(world, input, 0.05);
    }

    expect(world.player.position.x).toBe(TEST_LEVEL.arena.width - STARTER_AIRCRAFT.radius);
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
    const world = createIsolationWorld();
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
    const world = createIsolationWorld();
    stepWorld(world, IDLE, 1 / 60);

    expect(world.projectiles).toHaveLength(0);
  });
});

describe('projectile lifecycle', () => {
  let world: World;

  beforeEach(() => {
    world = createIsolationWorld();
  });

  it('expires a projectile when its lifetime runs out', () => {
    world.projectiles.push(
      makeProjectile({
        position: { x: 480, y: 300 },
        velocity: { x: 0, y: 0 },
        lifeRemaining: 0.02,
      }),
    );

    stepWorld(world, IDLE, 0.05);

    expect(world.projectiles).toHaveLength(0);
  });

  it('culls a projectile that leaves the arena', () => {
    world.projectiles.push(
      makeProjectile({
        position: { x: 480, y: 700 },
        velocity: { x: 0, y: 900 },
        lifeRemaining: 5,
      }),
    );

    stepWorld(world, IDLE, 0.05);

    expect(world.projectiles).toHaveLength(0);
  });
});

describe('collisions', () => {
  let world: World;

  beforeEach(() => {
    world = createIsolationWorld();
  });

  it('destroys an enemy, awards score and emits an event', () => {
    world.enemies.push(makeEnemy({ position: { x: 480, y: 300 }, health: 5, speed: 0 }));
    world.projectiles.push(makeProjectile());

    stepWorld(world, IDLE, 0.016);

    expect(world.enemies).toHaveLength(0);
    expect(world.projectiles).toHaveLength(0);
    expect(world.score).toBe(FIGHTER.scoreValue);
    expect(world.director.enemiesDestroyed).toBe(1);
    expect(world.events.some((event) => event.type === 'enemyDestroyed')).toBe(true);
  });

  it('emits an enemyHit event for non-lethal damage', () => {
    world.enemies.push(
      makeEnemy({ position: { x: 480, y: 300 }, health: FIGHTER.maxHealth, speed: 0 }),
    );
    world.projectiles.push(makeProjectile({ damage: 5 }));

    stepWorld(world, IDLE, 0.016);

    expect(world.enemies).toHaveLength(1);
    expect(world.enemies[0]?.health).toBe(FIGHTER.maxHealth - 5);
    expect(world.events.some((event) => event.type === 'enemyHit')).toBe(true);
  });

  it('damages the player on contact and grants brief invulnerability', () => {
    world.enemies.push(makeEnemy({ position: { ...world.player.position }, speed: 0 }));

    stepWorld(world, IDLE, 0.016);
    expect(world.player.health).toBe(STARTER_AIRCRAFT.maxHealth - FIGHTER.contactDamage);
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

    expect(world.player.health).toBe(STARTER_AIRCRAFT.maxHealth - 12);
    expect(world.events.some((event) => event.type === 'playerHit')).toBe(true);
  });
});

describe('enemy behaviors', () => {
  let world: World;

  beforeEach(() => {
    world = createIsolationWorld();
  });

  it('fighter seeks the player horizontally', () => {
    world.player.position = { x: 600, y: 500 };
    world.enemies.push(makeEnemy({ typeId: FIGHTER.id, position: { x: 300, y: 200 }, speed: 0 }));

    stepWorld(world, IDLE, 0.05);
    const firstX = world.enemies[0]?.position.x ?? 0;
    stepWorld(world, IDLE, 0.05);
    const secondX = world.enemies[0]?.position.x ?? 0;

    expect(firstX).toBeGreaterThan(300);
    expect(secondX).toBeGreaterThan(firstX);
  });

  it('bomber drops a spread salvo', () => {
    world.enemies.push(
      makeEnemy({
        typeId: BOMBER.id,
        position: { x: 480, y: 200 },
        speed: 0,
        age: BOMBER.fireDelay,
      }),
    );

    stepWorld(world, IDLE, 0.05);

    const enemyShots = world.projectiles.filter((projectile) => projectile.owner === 'enemy');
    expect(enemyShots).toHaveLength(BOMBER.projectile.count);
  });

  it('turret anchors and then fires at the player', () => {
    world.enemies.push(
      makeEnemy({
        typeId: TURRET.id,
        position: { x: 300, y: 0 },
        speed: TURRET.speed,
        age: TURRET.fireDelay,
      }),
    );

    stepWorld(world, IDLE, 0.05);
    expect(world.enemies[0]?.position.y).toBeLessThan(TURRET.anchorY);
    expect(world.projectiles.filter((p) => p.owner === 'enemy')).toHaveLength(0);

    for (let step = 0; step < 60; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }

    expect(world.enemies[0]?.position.y).toBe(TURRET.anchorY);
    expect(world.projectiles.some((p) => p.owner === 'enemy')).toBe(true);
  });

  it('mine never fires', () => {
    world.enemies.push(
      makeEnemy({ typeId: MINE.id, position: { x: 300, y: 200 }, speed: 0, age: 100 }),
    );

    for (let step = 0; step < 20; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }

    expect(world.projectiles.filter((p) => p.owner === 'enemy')).toHaveLength(0);
  });
});

describe('player death', () => {
  it('enters the game over state and stops simulating', () => {
    const world = createIsolationWorld();
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

describe('level completion', () => {
  function singleEnemyLevel(overrides: Partial<LevelConfig> = {}): LevelConfig {
    return {
      ...TEST_LEVEL,
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
      reward: { completionBonus: 500 },
      ...overrides,
    };
  }

  function completeSingleEnemyLevel(options?: WorldOptions): World {
    const world = createWorld(singleEnemyLevel(), options);
    startPlaying(world);

    for (let step = 0; step < 20 && world.enemies.length === 0; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }

    const enemy = world.enemies[0];
    if (!enemy) {
      throw new Error('expected an enemy');
    }
    enemy.health = 1;
    world.projectiles.push(
      makeProjectile({ position: { ...enemy.position }, velocity: { x: 0, y: 0 }, damage: 5 }),
    );

    stepWorld(world, IDLE, 0.05);
    return world;
  }

  it('completes a clear-waves level with a centralized score and reward result', () => {
    const world = completeSingleEnemyLevel();

    expect(world.status).toBe('levelComplete');
    expect(world.events.some((event) => event.type === 'levelComplete')).toBe(true);
    expect(world.result).toEqual({
      levelId: world.level.id,
      levelNumber: world.level.levelNumber,
      levelName: world.level.name,
      score: FIGHTER.scoreValue,
      completionBonus: 500,
      totalScore: FIGHTER.scoreValue + 500,
      coins: calculateCoins(FIGHTER.scoreValue + 500, DEFAULT_ECONOMY_CONFIG),
    });
  });

  it('keeps gameplay score separate from the completion bonus', () => {
    const world = completeSingleEnemyLevel();
    expect(world.score).toBe(FIGHTER.scoreValue);
    expect(world.result?.completionBonus).toBe(500);
  });

  it('converts total score to coins using the world economy config', () => {
    const world = completeSingleEnemyLevel({
      economy: { scorePerCoin: 10, minCoinsPerLevel: 0 },
    });

    expect(world.result?.coins).toBe(Math.floor((world.result?.totalScore ?? 0) / 10));
  });

  it('applies the score kill multiplier', () => {
    const world = completeSingleEnemyLevel({
      scoreConfig: { ...DEFAULT_SCORE_CONFIG, killMultiplier: 3 },
    });

    expect(world.result?.score).toBe(FIGHTER.scoreValue * 3);
  });

  it('completes a reach-distance level when the distance goal is reached', () => {
    const level = singleEnemyLevel({
      completionMode: 'reach-distance',
      lengthUnits: 30,
    });
    const world = createWorld(level);
    startPlaying(world);

    for (let step = 0; step < 40 && world.status === 'playing'; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }

    expect(world.status).toBe('levelComplete');
    expect(world.distance).toBeGreaterThanOrEqual(30);
    expect(world.result).not.toBeNull();
  });
});

describe('upgrades', () => {
  it('applies the resolved loadout to the player and weapon', () => {
    const world = createWorld(ISOLATION_LEVEL, {
      upgrades: {
        'aircraft-health': 2,
        'aircraft-armor': 3,
        'weapon-damage': 3,
        'aircraft-fire-power': 3,
      },
    });

    expect(world.player.maxHealth).toBe(125);
    expect(world.player.health).toBe(125);
    expect(world.player.armor).toBe(4);
    expect(world.loadout.weapon.projectile.damage).toBe(21);
  });

  it('reduces incoming contact damage with armor', () => {
    const world = createWorld(ISOLATION_LEVEL, { upgrades: { 'aircraft-armor': 3 } });
    startPlaying(world);
    stopSpawning(world);
    world.player.invulnerableFor = 0;
    world.enemies.push(makeEnemy({ position: { ...world.player.position }, speed: 0 }));

    stepWorld(world, IDLE, 0.016);

    expect(world.player.health).toBe(world.player.maxHealth - (FIGHTER.contactDamage - 4));
  });
});

describe('difficulty scaling', () => {
  function oneFighterLevel(): LevelConfig {
    return {
      ...TEST_LEVEL,
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
      reward: { completionBonus: 0 },
    };
  }

  function spawnOne(difficulty: 'easy' | 'normal' | 'hard'): number {
    const world = createWorld(oneFighterLevel(), { difficulty });
    startPlaying(world);
    for (let step = 0; step < 20 && world.enemies.length === 0; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }
    return world.enemies[0]?.maxHealth ?? 0;
  }

  it('scales spawned enemy health by the selected difficulty', () => {
    const easy = spawnOne('easy');
    const normal = spawnOne('normal');
    const hard = spawnOne('hard');

    expect(easy).toBeLessThan(normal);
    expect(hard).toBeGreaterThan(normal);
  });

  it('applies the player damage multiplier to the loadout', () => {
    const easy = createWorld(ISOLATION_LEVEL, { difficulty: 'easy' });
    const hard = createWorld(ISOLATION_LEVEL, { difficulty: 'hard' });

    expect(easy.difficulty.playerDamage).toBeGreaterThan(1);
    expect(hard.difficulty.playerDamage).toBeLessThan(1);
    expect(easy.loadout.weapon.projectile.damage).toBeGreaterThan(
      hard.loadout.weapon.projectile.damage,
    );
  });
});

describe('diver behavior', () => {
  it('dives toward the player once within range', () => {
    const world = createIsolationWorld();
    world.player.position = { x: 600, y: 500 };
    world.enemies.push(makeEnemy({ typeId: DIVER.id, position: { x: 500, y: 120 }, speed: 0 }));

    const diver = world.enemies[0];
    if (!diver) throw new Error('expected a diver');
    const startX = diver.position.x;
    const startY = diver.position.y;

    stepWorld(world, IDLE, 0.05);
    stepWorld(world, IDLE, 0.05);
    stepWorld(world, IDLE, 0.05);

    // diveSpeed 420 over ~0.15s moves it well past its zero base speed.
    expect(diver.position.y).toBeGreaterThan(startY + 40);
    expect(diver.position.x).toBeGreaterThan(startX);
  });
});