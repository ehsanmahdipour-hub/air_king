import { LEVELS, getLevelIndex, getNextLevelId } from '../config/levels';

/**
 * Progressive unlocking. Levels unlock in campaign order: the first level is
 * always available and each later level requires the previous one to be
 * completed. Pure and persistence-agnostic so it can be reused by the backend
 * when progression is stored.
 */
export function isLevelUnlocked(levelId: string, completedLevelIds: readonly string[]): boolean {
  const index = getLevelIndex(levelId);
  if (index === 0) {
    return true;
  }

  const previous = LEVELS[index - 1];
  return completedLevelIds.includes(previous.id);
}

export { getNextLevelId };
