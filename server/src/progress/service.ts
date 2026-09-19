import {
  DEFAULT_ECONOMY_CONFIG,
  DEFAULT_SCORE_CONFIG,
  calculateCoins,
  getLevel,
  getLevelIndex,
  getNextLevelId,
  isLevelUnlocked,
  maxAchievableScore,
  type CompleteLevelResponse,
  type ProgressResponse,
} from '@game/shared';

import { prisma } from '../db/prisma';
import { AppError } from '../errors';
import { ensureProfile, toProfileData } from '../profile/profile';

/**
 * Absolute score ceiling for levels whose enemy supply is unbounded (looping
 * survival levels), where a theoretical maximum cannot be computed.
 */
const UNBOUNDED_SCORE_CEILING = 5_000_000;

export async function getProgress(userId: string): Promise<ProgressResponse> {
  const profile = await ensureProfile(prisma, userId);
  const levelRows = await prisma.levelProgress.findMany({
    where: { userId },
    orderBy: { levelId: 'asc' },
  });

  return {
    profile: toProfileData(profile),
    levels: levelRows.map((row) => ({
      levelId: row.levelId,
      completed: row.completed,
      bestScore: row.bestScore,
    })),
  };
}

/**
 * Validates and persists a level completion. The server owns all reward and
 * progression decisions:
 * - the level must exist and be unlocked,
 * - the submitted score must be a plausible whole number for the level,
 * - the completion bonus is read from the level, coins from the economy config,
 * - coins are awarded only on the level's first completion,
 * - replays only improve best/total/highest scores.
 */
export async function completeLevel(
  userId: string,
  levelId: string,
  score: number,
): Promise<CompleteLevelResponse> {
  let level;
  try {
    level = getLevel(levelId);
  } catch {
    throw new AppError(404, 'unknown_level', `Unknown level: ${levelId}`);
  }

  const completedRows = await prisma.levelProgress.findMany({
    where: { userId, completed: true },
    select: { levelId: true },
  });
  const completedLevelIds = completedRows.map((row) => row.levelId);

  if (!isLevelUnlocked(levelId, completedLevelIds)) {
    throw new AppError(403, 'level_locked', 'This level is not unlocked yet');
  }

  const theoreticalMax = maxAchievableScore(level, DEFAULT_SCORE_CONFIG);
  const maxScore = theoreticalMax ?? UNBOUNDED_SCORE_CEILING;
  if (!Number.isInteger(score) || score < 0 || score > maxScore) {
    throw new AppError(
      400,
      'invalid_score',
      `Score must be a whole number between 0 and ${maxScore}`,
    );
  }

  const completionBonus = level.reward.completionBonus;
  const totalScore = score + completionBonus;
  const coinsForRun = calculateCoins(totalScore, DEFAULT_ECONOMY_CONFIG);

  return prisma.$transaction(async (tx) => {
    const profile = await ensureProfile(tx, userId);
    const existing = await tx.levelProgress.findUnique({
      where: { userId_levelId: { userId, levelId } },
    });

    const firstCompletion = !existing?.completed;
    const previousBest = existing?.bestScore ?? 0;
    const bestScore = Math.max(previousBest, score);
    const awardedCoins = firstCompletion ? coinsForRun : 0;
    const totalScoreDelta = firstCompletion ? score : Math.max(0, score - previousBest);
    const nextTotalScore = profile.totalScore + totalScoreDelta;
    const nextHighestScore = Math.max(profile.highestScore, totalScore);

    const levelProgress = await tx.levelProgress.upsert({
      where: { userId_levelId: { userId, levelId } },
      create: {
        userId,
        levelId,
        completed: true,
        bestScore: score,
        attempts: 1,
        completedAt: new Date(),
      },
      update: {
        completed: true,
        bestScore,
        attempts: { increment: 1 },
        completedAt: existing?.completedAt ?? new Date(),
      },
    });

    const completedAfter = [...completedLevelIds.filter((id) => id !== levelId), levelId];
    const nextLevelId = getNextLevelId(levelId);
    const isFrontier = getLevelIndex(levelId) >= getLevelIndex(profile.currentLevelId);
    const currentLevelId =
      nextLevelId && isFrontier && isLevelUnlocked(nextLevelId, completedAfter)
        ? nextLevelId
        : profile.currentLevelId;

    const updatedProfile = await tx.playerProfile.update({
      where: { userId },
      data: {
        coins: profile.coins + awardedCoins,
        totalScore: nextTotalScore,
        highestScore: nextHighestScore,
        currentLevelId,
      },
    });

    return {
      profile: toProfileData(updatedProfile),
      level: {
        levelId: levelProgress.levelId,
        completed: levelProgress.completed,
        bestScore: levelProgress.bestScore,
      },
      result: { score, completionBonus, totalScore, coins: awardedCoins },
      firstCompletion,
    };
  });
}
