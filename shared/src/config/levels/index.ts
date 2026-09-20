import { buildCampaignLevels } from './campaign';
import { LEVEL_01 } from './level-01';
import { LEVEL_02 } from './level-02';
import { LEVEL_03 } from './level-03';
import { LEVEL_04 } from './level-04';
import { LEVEL_05 } from './level-05';
import { parseLevelConfig } from './schema';
import type { LevelConfig } from './types';

export { ENVIRONMENTS, type EnvironmentId } from './environments';
export { DIFFICULTY_PRESETS, difficultyModifiers } from './difficulty';
export { buildCampaignLevel, buildCampaignLevels } from './campaign';
export { levelConfigSchema, parseLevelConfig, assertLevelSemantics } from './schema';
export type {
  Arena,
  BossReference,
  CompletionMode,
  DifficultyModifiers,
  DifficultyTier,
  EnvironmentConfig,
  FormationType,
  LevelConfig,
  LevelRewardConfig,
  ObstacleSection,
  SpawnGroup,
  WaveConfig,
} from './types';

/**
 * Authored levels 1-5 plus generated levels 6-50. Every level is validated on
 * load, so malformed content fails fast. Adding or tuning levels is a data
 * change (authored files or the campaign generator), never engine code.
 */
const AUTHORED_LEVELS: LevelConfig[] = [
  LEVEL_01,
  LEVEL_02,
  LEVEL_03,
  LEVEL_04,
  LEVEL_05,
  ...buildCampaignLevels(6, 50),
];

export const LEVELS: LevelConfig[] = AUTHORED_LEVELS.map((level) => parseLevelConfig(level));

export const levelCount: number = LEVELS.length;

export function getLevel(id: string): LevelConfig {
  const level = LEVELS.find((candidate) => candidate.id === id);
  if (!level) {
    throw new Error(`Unknown level id: ${id}`);
  }
  return level;
}

export function getLevelByNumber(levelNumber: number): LevelConfig | undefined {
  return LEVELS.find((level) => level.levelNumber === levelNumber);
}

export function getLevelIndex(id: string): number {
  const index = LEVELS.findIndex((level) => level.id === id);
  if (index < 0) {
    throw new Error(`Unknown level id: ${id}`);
  }
  return index;
}

export function getNextLevelId(id: string): string | null {
  const index = getLevelIndex(id);
  return LEVELS[index + 1]?.id ?? null;
}