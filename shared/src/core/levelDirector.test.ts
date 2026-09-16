import { describe, expect, it } from 'vitest';

import { LEVELS, type LevelConfig, type ObstacleSection, type WaveConfig } from '../config/levels';
import { isLevelCleared } from './levelDirector';
import { createWorld, stepWorld, type InputState, type World } from './world';

const IDLE: InputState = { move: { x: 0, y: 0 }, firing: false };

function makeLevel(waves: WaveConfig[], obstacleSections: ObstacleSection[] = []): LevelConfig {
  return {
    ...LEVELS[0],
    startDelaySeconds: 0,
    waves,
    obstacleSections,
    reward: { completionBonus: 0 },
  };
}

function startPlaying(world: World): void {
  let guard = 0;
  while (world.status === 'ready' && guard < 200) {
    stepWorld(world, IDLE, 0.05);
    guard += 1;
  }
}

describe('wave progression', () => {
  it('spawns groups sequentially in authored order', () => {
    const level = makeLevel([
      {
        startDelay: 0,
        groups: [
          { enemyTypeId: 'fighter', count: 2, formation: 'line', interval: 0.1, startDelay: 0 },
          { enemyTypeId: 'mine', count: 1, formation: 'line', interval: 0, startDelay: 0.1 },
        ],
      },
    ]);
    const world = createWorld(level);
    startPlaying(world);

    stepWorld(world, IDLE, 0.05);
    expect(world.director.enemiesSpawned).toBe(1);
    expect(world.enemies[0]?.typeId).toBe('fighter');

    for (let step = 0; step < 20 && world.director.enemiesSpawned < 3; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }

    expect(world.director.enemiesSpawned).toBe(3);
    expect(world.enemies.some((enemy) => enemy.typeId === 'mine')).toBe(true);
  });

  it('waits for the next wave startDelay before spawning', () => {
    const level = makeLevel([
      {
        startDelay: 0,
        groups: [
          { enemyTypeId: 'fighter', count: 1, formation: 'line', interval: 0, startDelay: 0 },
        ],
      },
      {
        startDelay: 0.5,
        groups: [
          { enemyTypeId: 'fighter', count: 1, formation: 'line', interval: 0, startDelay: 0 },
        ],
      },
    ]);
    const world = createWorld(level);
    startPlaying(world);

    // First enemy spawns immediately.
    stepWorld(world, IDLE, 0.05);
    expect(world.director.enemiesSpawned).toBe(1);

    // The second wave's first enemy must not spawn immediately.
    stepWorld(world, IDLE, 0.05);
    stepWorld(world, IDLE, 0.05);
    expect(world.director.enemiesSpawned).toBe(1);

    for (let step = 0; step < 20 && world.director.enemiesSpawned < 2; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }
    expect(world.director.enemiesSpawned).toBe(2);
  });

  it('runs obstacle sections on a parallel timeline', () => {
    const level = makeLevel(
      [
        {
          startDelay: 0,
          groups: [
            { enemyTypeId: 'fighter', count: 3, formation: 'line', interval: 0.2, startDelay: 0 },
          ],
        },
      ],
      [{ enemyTypeId: 'mine', count: 2, formation: 'line', interval: 0.1, startDelay: 0 }],
    );
    const world = createWorld(level);
    startPlaying(world);

    for (let step = 0; step < 30; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }

    expect(world.director.enemiesSpawned).toBe(5);
  });

  it('loops waves for a reach-distance survival level', () => {
    const level = makeLevel([
      {
        startDelay: 0,
        groups: [
          { enemyTypeId: 'fighter', count: 1, formation: 'line', interval: 0, startDelay: 0 },
        ],
      },
    ]);
    level.completionMode = 'reach-distance';
    level.lengthUnits = 1_000_000;
    level.loopWaves = true;

    const world = createWorld(level);
    startPlaying(world);

    for (let step = 0; step < 60; step += 1) {
      stepWorld(world, IDLE, 0.05);
    }

    expect(world.director.enemiesSpawned).toBeGreaterThan(3);
    expect(world.status).toBe('playing');
  });
});

describe('isLevelCleared', () => {
  it('is false until all waves and obstacles are spawned and enemies are gone', () => {
    const world = createWorld(makeLevel([
      {
        startDelay: 0,
        groups: [
          { enemyTypeId: 'fighter', count: 1, formation: 'line', interval: 0, startDelay: 0 },
        ],
      },
    ]));

    expect(isLevelCleared(world)).toBe(false);

    world.director.waveIndex = world.level.waves.length;
    world.director.obstacleIndex = world.level.obstacleSections.length;
    expect(isLevelCleared(world)).toBe(true);
  });

  it('uses distance for reach-distance levels', () => {
    const level = makeLevel([
      {
        startDelay: 0,
        groups: [
          { enemyTypeId: 'fighter', count: 1, formation: 'line', interval: 0, startDelay: 0 },
        ],
      },
    ]);
    level.completionMode = 'reach-distance';
    level.lengthUnits = 100;

    const world = createWorld(level);
    expect(isLevelCleared(world)).toBe(false);
    world.distance = 100;
    expect(isLevelCleared(world)).toBe(true);
  });
});