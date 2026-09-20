import { getEnemy } from '../config/enemies';
import type { FormationType, LevelConfig } from '../config/levels';
import { applyDifficulty } from './difficulty';
import type { DirectorState, World } from './entities';
import { formationSpawnPosition } from './formations';
import { spawnBoss } from './systems/boss';

export function createDirectorState(level: LevelConfig): DirectorState {
  const totalEnemies =
    level.waves.reduce(
      (waveTotal, wave) =>
        waveTotal + wave.groups.reduce((groupTotal, group) => groupTotal + group.count, 0),
      0,
    ) + level.obstacleSections.reduce((total, section) => total + section.count, 0);
  const firstWave = level.waves[0];
  const firstObstacle = level.obstacleSections[0];

  return {
    startTimer: level.startDelaySeconds,
    waveIndex: 0,
    groupIndex: 0,
    groupSpawnCount: 0,
    spawnTimer: firstWave ? firstWave.startDelay : Number.POSITIVE_INFINITY,
    obstacleIndex: 0,
    obstacleSpawnCount: 0,
    obstacleTimer: firstObstacle ? firstObstacle.startDelay : Number.POSITIVE_INFINITY,
    totalEnemies,
    enemiesSpawned: 0,
    enemiesDestroyed: 0,
    bossSpawned: false,
    bossDefeated: false,
    bossSpawnTimer: -1,
  };
}

/**
 * Advances wave and obstacle spawning. Waves run sequentially; obstacle
 * sections run on an independent parallel timeline. When a looping
 * reach-distance level exhausts its content it restarts from the first entry.
 */
export function updateSpawns(world: World, deltaSeconds: number): void {
  updateWaveSpawning(world, deltaSeconds);
  updateObstacleSpawning(world, deltaSeconds);
  updateBossSpawning(world, deltaSeconds);
}

export function isLevelCleared(world: World): boolean {
  const { level, director } = world;

  if (level.completionMode === 'reach-distance') {
    return world.distance >= (level.lengthUnits ?? Number.POSITIVE_INFINITY);
  }

  return (
    director.waveIndex >= level.waves.length &&
    director.obstacleIndex >= level.obstacleSections.length &&
    world.enemies.length === 0 &&
    (!level.boss || director.bossDefeated)
  );
}

function shouldLoop(level: LevelConfig): boolean {
  return level.loopWaves === true && level.completionMode === 'reach-distance';
}

/** Scales a spawn delay by the difficulty spawn rate (higher rate = shorter). */
function scaleSpawnDelay(world: World, seconds: number): number {
  return seconds / world.difficulty.spawnRate;
}

function updateWaveSpawning(world: World, deltaSeconds: number): void {
  const { level, director } = world;
  if (director.waveIndex >= level.waves.length) {
    return;
  }

  director.spawnTimer -= deltaSeconds;
  if (director.spawnTimer > 0) {
    return;
  }

  const wave = level.waves[director.waveIndex];
  const group = wave.groups[director.groupIndex];

  if (!group) {
    advanceWave(world);
    return;
  }

  spawnEnemy(world, group.enemyTypeId, group.formation, director.groupSpawnCount, group.count);
  director.groupSpawnCount += 1;
  director.enemiesSpawned += 1;

  if (director.groupSpawnCount < group.count) {
    director.spawnTimer = scaleSpawnDelay(world, group.interval);
    return;
  }

  director.groupSpawnCount = 0;
  director.groupIndex += 1;

  if (director.groupIndex < wave.groups.length) {
    director.spawnTimer = scaleSpawnDelay(world, wave.groups[director.groupIndex].startDelay);
    return;
  }

  director.groupIndex = 0;
  director.waveIndex += 1;
  startNextWaveOrLoop(world);
}

function advanceWave(world: World): void {
  const { director } = world;
  director.groupIndex = 0;
  director.groupSpawnCount = 0;
  director.waveIndex += 1;
  startNextWaveOrLoop(world);
}

function startNextWaveOrLoop(world: World): void {
  const { level, director } = world;

  if (director.waveIndex < level.waves.length) {
    director.spawnTimer = scaleSpawnDelay(world, level.waves[director.waveIndex].startDelay);
    return;
  }

  if (shouldLoop(level)) {
    director.waveIndex = 0;
    director.spawnTimer = scaleSpawnDelay(world, level.waves[0].startDelay);
    return;
  }

  director.spawnTimer = Number.POSITIVE_INFINITY;
}

function updateObstacleSpawning(world: World, deltaSeconds: number): void {
  const { level, director } = world;
  if (director.obstacleIndex >= level.obstacleSections.length) {
    return;
  }

  director.obstacleTimer -= deltaSeconds;
  if (director.obstacleTimer > 0) {
    return;
  }

  const section = level.obstacleSections[director.obstacleIndex];
  spawnEnemy(world, section.enemyTypeId, section.formation, director.obstacleSpawnCount, section.count);
  director.obstacleSpawnCount += 1;
  director.enemiesSpawned += 1;

  if (director.obstacleSpawnCount < section.count) {
    director.obstacleTimer = scaleSpawnDelay(world, section.interval);
    return;
  }

  director.obstacleSpawnCount = 0;
  director.obstacleIndex += 1;

  if (director.obstacleIndex < level.obstacleSections.length) {
    director.obstacleTimer = scaleSpawnDelay(
      world,
      level.obstacleSections[director.obstacleIndex].startDelay,
    );
    return;
  }

  if (shouldLoop(level)) {
    director.obstacleIndex = 0;
    director.obstacleTimer = scaleSpawnDelay(world, level.obstacleSections[0].startDelay);
    return;
  }

  director.obstacleTimer = Number.POSITIVE_INFINITY;
}

/**
 * Spawns the level boss once all waves and obstacle sections are emitted, after
 * the configured delay. The boss id comes from the level reference.
 */
function updateBossSpawning(world: World, deltaSeconds: number): void {
  const reference = world.level.boss;
  if (!reference || world.director.bossSpawned) {
    return;
  }

  const wavesDone = world.director.waveIndex >= world.level.waves.length;
  const obstaclesDone = world.director.obstacleIndex >= world.level.obstacleSections.length;
  if (!wavesDone || !obstaclesDone) {
    return;
  }

  if (world.director.bossSpawnTimer < 0) {
    world.director.bossSpawnTimer = reference.spawnDelaySeconds ?? 1.5;
    return;
  }

  world.director.bossSpawnTimer -= deltaSeconds;
  if (world.director.bossSpawnTimer > 0) {
    return;
  }

  spawnBoss(world, reference.bossId);
}

function spawnEnemy(
  world: World,
  enemyTypeId: string,
  formation: FormationType,
  index: number,
  count: number,
): void {
  const config = applyDifficulty(getEnemy(enemyTypeId), world.difficulty);
  const position = formationSpawnPosition(formation, {
    index,
    count,
    radius: config.radius,
    arena: world.level.arena,
  });

  world.enemies.push({
    id: world.nextId++,
    typeId: config.id,
    config,
    position,
    radius: config.radius,
    health: config.maxHealth,
    maxHealth: config.maxHealth,
    speed: config.speed,
    contactDamage: config.contactDamage,
    scoreValue: config.scoreValue,
    age: 0,
    fireCooldown: 0,
    alive: true,
  });
}