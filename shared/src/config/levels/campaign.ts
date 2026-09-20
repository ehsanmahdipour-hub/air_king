import { ENVIRONMENTS } from './environments';
import type {
  DifficultyTier,
  EnvironmentConfig,
  FormationType,
  LevelConfig,
  ObstacleSection,
  SpawnGroup,
  WaveConfig,
} from './types';

/**
 * Generates campaign levels from a difficulty curve plus milestone overrides,
 * so 50 levels require no per-level gameplay code. Levels 1-5 remain
 * hand-authored; this builds 6-50.
 */

const ENVIRONMENT_CYCLE: EnvironmentConfig[] = [
  ENVIRONMENTS.deepSpace,
  ENVIRONMENTS.nebula,
  ENVIRONMENTS.aurora,
  ENVIRONMENTS.dusk,
  ENVIRONMENTS.crimson,
];

const FORMATIONS: FormationType[] = ['line', 'v', 'random', 'column'];

/** Boss milestones: only selected levels contain a boss. */
const BOSS_BY_LEVEL: Record<number, string> = {
  10: 'dreadnought',
  20: 'hydra',
  30: 'dreadnought',
  40: 'leviathan',
  50: 'leviathan',
};

/** Levels that are survival runs (reach a distance) instead of clear-waves. */
const SURVIVAL_LEVELS = new Set([7, 17, 27, 37, 47]);

/** Deterministic PRNG so generated content is stable across runs. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function difficultyFor(levelNumber: number): DifficultyTier {
  if (levelNumber <= 9) {
    return 'normal';
  }
  if (levelNumber <= 24) {
    return 'hard';
  }
  return 'expert';
}

/** Enemy roster expands as the campaign progresses. */
function enemyPoolFor(levelNumber: number): string[] {
  const pool = ['fighter'];
  if (levelNumber >= 7) pool.push('mine');
  if (levelNumber >= 11) pool.push('bomber');
  if (levelNumber >= 15) pool.push('turret');
  if (levelNumber >= 18) pool.push('diver');
  return pool;
}

function pick<T>(items: T[], rng: () => number, fallback: T): T {
  return items[Math.floor(rng() * items.length)] ?? fallback;
}

export function buildCampaignLevel(levelNumber: number): LevelConfig {
  const rng = seeded(levelNumber * 2654435761);
  const environment =
    ENVIRONMENT_CYCLE[Math.floor((levelNumber - 1) / 10) % ENVIRONMENT_CYCLE.length] ??
    ENVIRONMENTS.deepSpace;

  const scrollSpeed = 240 + Math.min(80, levelNumber);
  const waveCount = Math.min(6, 3 + Math.floor(levelNumber / 10));
  const baseCount = Math.min(14, 4 + Math.floor(levelNumber / 5));
  const pool = enemyPoolFor(levelNumber);

  const waves: WaveConfig[] = [];
  for (let waveIndex = 0; waveIndex < waveCount; waveIndex += 1) {
    const groupCount = levelNumber >= 15 && rng() > 0.5 ? 2 : 1;
    const groups: SpawnGroup[] = [];

    for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
      const enemyTypeId = pick(pool, rng, 'fighter');
      const formation = pick(FORMATIONS, rng, 'line');
      const count = Math.max(2, baseCount + Math.floor(rng() * 4) - 2 + waveIndex);
      groups.push({
        enemyTypeId,
        count,
        formation,
        interval: 0.22 + rng() * 0.25,
        startDelay: groupIndex === 0 ? 0 : 0.4 + rng() * 0.5,
      });
    }

    waves.push({
      startDelay: waveIndex === 0 ? 0.6 : 0.9 + rng() * 0.7,
      groups,
    });
  }

  const obstacleSections: ObstacleSection[] = [];
  if (levelNumber % 3 === 0) {
    obstacleSections.push({
      enemyTypeId: 'mine',
      count: 3 + Math.floor(levelNumber / 10),
      formation: pick(FORMATIONS, rng, 'random'),
      interval: 0.7,
      startDelay: 2 + rng() * 2,
    });
  }

  const bossId = BOSS_BY_LEVEL[levelNumber];
  const survival = SURVIVAL_LEVELS.has(levelNumber);

  return {
    id: `level-${String(levelNumber).padStart(2, '0')}`,
    levelNumber,
    name: `${environment.displayName} Sector ${levelNumber}`,
    difficulty: difficultyFor(levelNumber),
    environment,
    arena: { width: 960, height: 600 },
    scrollSpeed,
    startDelaySeconds: 1.2,
    completionMode: survival ? 'reach-distance' : 'clear-waves',
    ...(survival ? { lengthUnits: scrollSpeed * 25, loopWaves: true } : {}),
    waves,
    obstacleSections,
    ...(bossId ? { boss: { bossId, spawnDelaySeconds: 1.5 } } : {}),
    reward: { completionBonus: 400 + levelNumber * 50 },
    playerStart: { x: 480, y: 500 },
  };
}

export function buildCampaignLevels(from: number, to: number): LevelConfig[] {
  const levels: LevelConfig[] = [];
  for (let levelNumber = from; levelNumber <= to; levelNumber += 1) {
    levels.push(buildCampaignLevel(levelNumber));
  }
  return levels;
}