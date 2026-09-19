import {
  DEFAULT_UPGRADE_LEVELS,
  clampUpgradeLevel,
  getUpgrade,
  isUpgradeId,
  upgradeCost,
  type PurchaseUpgradeResponse,
  type UpgradeLevels,
  type UpgradesResponse,
} from '@game/shared';

import { prisma } from '../db/prisma';
import { AppError } from '../errors';
import { ensureProfile, toProfileData } from '../profile/profile';

type UpgradeRow = { upgradeId: string; level: number };

function toUpgradeLevels(rows: UpgradeRow[]): UpgradeLevels {
  const levels: UpgradeLevels = { ...DEFAULT_UPGRADE_LEVELS };
  for (const row of rows) {
    if (isUpgradeId(row.upgradeId)) {
      levels[row.upgradeId] = clampUpgradeLevel(getUpgrade(row.upgradeId), row.level);
    }
  }
  return levels;
}

export async function getUpgrades(userId: string): Promise<UpgradesResponse> {
  const [profile, rows] = await Promise.all([
    ensureProfile(prisma, userId),
    prisma.playerUpgrade.findMany({ where: { userId } }),
  ]);

  return { profile: toProfileData(profile), upgrades: toUpgradeLevels(rows) };
}

/**
 * Purchases the next level of an upgrade. The server owns the level, the price
 * and the balance: the client sends only the upgrade id. The coin deduction is
 * a conditional update so a stale balance or a race cannot overspend.
 */
export async function purchaseUpgrade(
  userId: string,
  upgradeId: string,
): Promise<PurchaseUpgradeResponse> {
  if (!isUpgradeId(upgradeId)) {
    throw new AppError(404, 'unknown_upgrade', `Unknown upgrade: ${upgradeId}`);
  }

  const config = getUpgrade(upgradeId);

  return prisma.$transaction(async (tx) => {
    const profile = await ensureProfile(tx, userId);
    const row = await tx.playerUpgrade.findUnique({
      where: { userId_upgradeId: { userId, upgradeId } },
    });

    const currentLevel = clampUpgradeLevel(config, row?.level ?? 1);
    const cost = upgradeCost(config, currentLevel);

    if (cost === null) {
      throw new AppError(400, 'max_level', 'This upgrade is already at maximum level');
    }
    if (profile.coins < cost) {
      throw new AppError(400, 'insufficient_coins', `Not enough coins: ${cost} required`);
    }

    const deducted = await tx.playerProfile.updateMany({
      where: { userId, coins: { gte: cost } },
      data: { coins: { decrement: cost } },
    });
    if (deducted.count === 0) {
      throw new AppError(400, 'insufficient_coins', `Not enough coins: ${cost} required`);
    }

    const nextLevel = currentLevel + 1;
    const updated = await tx.playerUpgrade.upsert({
      where: { userId_upgradeId: { userId, upgradeId } },
      create: { userId, upgradeId, level: nextLevel },
      update: { level: nextLevel },
    });

    const updatedProfile = await tx.playerProfile.findUniqueOrThrow({ where: { userId } });
    return {
      profile: toProfileData(updatedProfile),
      upgrade: { id: config.id, level: updated.level },
    };
  });
}