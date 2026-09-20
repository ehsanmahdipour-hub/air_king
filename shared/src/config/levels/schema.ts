import { z } from 'zod';

import { getBoss } from '../bosses';
import { getEnemy } from '../enemies';
import type { LevelConfig } from './types';

const formationSchema = z.enum(['random', 'line', 'v', 'column']);
const difficultySchema = z.enum(['easy', 'normal', 'hard', 'expert']);

const environmentSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  backgroundColor: z.number().int().nonnegative(),
  starTint: z.number().int().nonnegative(),
});

const spawnGroupSchema = z.object({
  enemyTypeId: z.string().min(1),
  count: z.number().int().positive(),
  formation: formationSchema,
  interval: z.number().nonnegative(),
  startDelay: z.number().nonnegative(),
});

const waveSchema = z.object({
  id: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  startDelay: z.number().nonnegative(),
  groups: z.array(spawnGroupSchema).min(1),
});

const obstacleSectionSchema = spawnGroupSchema;

/**
 * Structural schema for a level. `parseLevelConfig` additionally runs semantic
 * checks (known enemy ids, reach-distance requirements) so malformed levels
 * fail fast instead of producing broken gameplay.
 */
export const levelConfigSchema = z.object({
  id: z.string().min(1),
  levelNumber: z.number().int().positive(),
  name: z.string().min(1),
  difficulty: difficultySchema,
  environment: environmentSchema,
  arena: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  scrollSpeed: z.number().positive(),
  startDelaySeconds: z.number().nonnegative(),
  completionMode: z.enum(['clear-waves', 'reach-distance']),
  lengthUnits: z.number().positive().optional(),
  loopWaves: z.boolean().optional(),
  waves: z.array(waveSchema).min(1),
  obstacleSections: z.array(obstacleSectionSchema),
  boss: z
    .object({
      bossId: z.string().min(1),
      spawnDelaySeconds: z.number().nonnegative().optional(),
    })
    .optional(),
  reward: z.object({
    completionBonus: z.number().int().nonnegative(),
  }),
  playerStart: z.object({ x: z.number(), y: z.number() }),
});

/**
 * Validates a level's structure and semantics, returning the typed config.
 * Throws a descriptive error for invalid configuration.
 */
export function parseLevelConfig(input: unknown): LevelConfig {
  const config = levelConfigSchema.parse(input) as LevelConfig;
  assertLevelSemantics(config);
  return config;
}

export function assertLevelSemantics(config: LevelConfig): void {
  if (config.completionMode === 'reach-distance') {
    if (config.lengthUnits === undefined) {
      throw new Error(`Level "${config.id}" is reach-distance but has no lengthUnits`);
    }
  } else if (config.loopWaves) {
    throw new Error(`Level "${config.id}" sets loopWaves but does not use reach-distance`);
  }

  const validateEnemyId = (enemyTypeId: string, where: string): void => {
    try {
      getEnemy(enemyTypeId);
    } catch {
      throw new Error(`Level "${config.id}" ${where} references unknown enemy "${enemyTypeId}"`);
    }
  };

  config.waves.forEach((wave, waveIndex) => {
    wave.groups.forEach((group, groupIndex) => {
      validateEnemyId(group.enemyTypeId, `wave ${waveIndex + 1} group ${groupIndex + 1}`);
    });
  });

  config.obstacleSections.forEach((section, index) => {
    validateEnemyId(section.enemyTypeId, `obstacle section ${index + 1}`);
  });

  if (config.boss) {
    try {
      getBoss(config.boss.bossId);
    } catch {
      throw new Error(`Level "${config.id}" references unknown boss "${config.boss.bossId}"`);
    }
  }
}