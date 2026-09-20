import { Prisma } from '@prisma/client';
import type { PlayerProfileData } from '@game/shared';

/** Prisma client or an interactive-transaction client. */
export type DbClient = Prisma.TransactionClient;

/** Creates the profile lazily so accounts predating progression keep working. */
export function ensureProfile(db: DbClient, userId: string) {
  return db.playerProfile.upsert({ where: { userId }, update: {}, create: { userId } });
}

export function toProfileData(profile: {
  coins: number;
  totalScore: number;
  highestScore: number;
  currentLevelId: string;
  equippedAircraftId: string;
}): PlayerProfileData {
  return {
    coins: profile.coins,
    totalScore: profile.totalScore,
    highestScore: profile.highestScore,
    currentLevelId: profile.currentLevelId,
    equippedAircraftId: profile.equippedAircraftId,
  };
}