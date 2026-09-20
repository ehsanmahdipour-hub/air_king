import { Prisma } from '@prisma/client';
import {
  AIRCRAFT,
  DEFAULT_AIRCRAFT_ID,
  canPurchaseAircraft,
  getAircraft,
  isAircraftId,
  type AircraftResponse,
  type AircraftStateData,
  type PurchaseAircraftResponse,
} from '@game/shared';

import { prisma } from '../db/prisma';
import { AppError } from '../errors';
import { ensureProfile, toProfileData } from '../profile/profile';

type AircraftRow = { aircraftId: string };

function ownedAircraftIds(rows: AircraftRow[]): Set<string> {
  return new Set([DEFAULT_AIRCRAFT_ID, ...rows.map((row) => row.aircraftId)]);
}

function toAircraftState(
  aircraftId: string,
  owned: Set<string>,
  equippedAircraftId: string,
): AircraftStateData {
  return {
    id: aircraftId,
    owned: owned.has(aircraftId),
    equipped: equippedAircraftId === aircraftId,
  };
}

export async function getAircraftState(userId: string): Promise<AircraftResponse> {
  const [profile, rows] = await Promise.all([
    ensureProfile(prisma, userId),
    prisma.playerAircraft.findMany({ where: { userId } }),
  ]);

  const owned = ownedAircraftIds(rows);
  return {
    profile: toProfileData(profile),
    aircraft: AIRCRAFT.map((aircraft) =>
      toAircraftState(aircraft.id, owned, profile.equippedAircraftId),
    ),
  };
}

const PURCHASE_ERRORS: Record<string, AppError> = {
  unavailable: new AppError(400, 'aircraft_unavailable', 'This aircraft is not available yet'),
  not_purchasable: new AppError(400, 'aircraft_not_purchasable', 'This aircraft cannot be purchased'),
  already_owned: new AppError(409, 'aircraft_owned', 'You already own this aircraft'),
  insufficient_coins: new AppError(400, 'insufficient_coins', 'Not enough coins'),
};

/**
 * Purchases an aircraft. The server owns the price and balance: the client sends
 * only the aircraft id. The ownership row (unique constraint) is created before
 * the conditional deduction, so a duplicate or race cannot take coins for an
 * aircraft the player already owns.
 */
export async function purchaseAircraft(
  userId: string,
  aircraftId: string,
): Promise<PurchaseAircraftResponse> {
  if (!isAircraftId(aircraftId)) {
    throw new AppError(404, 'unknown_aircraft', `Unknown aircraft: ${aircraftId}`);
  }

  const config = getAircraft(aircraftId);

  return prisma.$transaction(async (tx) => {
    const profile = await ensureProfile(tx, userId);
    const rows = await tx.playerAircraft.findMany({ where: { userId } });
    const owned = ownedAircraftIds(rows);

    const check = canPurchaseAircraft(config, [...owned], profile.coins);
    if (!check.ok) {
      const error = PURCHASE_ERRORS[check.reason];
      if (error) {
        throw error;
      }
      throw new AppError(400, 'purchase_rejected', 'Purchase rejected');
    }

    try {
      await tx.playerAircraft.create({ data: { userId, aircraftId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw PURCHASE_ERRORS.already_owned;
      }
      throw error;
    }

    const deducted = await tx.playerProfile.updateMany({
      where: { userId, coins: { gte: config.price } },
      data: { coins: { decrement: config.price } },
    });
    if (deducted.count === 0) {
      throw PURCHASE_ERRORS.insufficient_coins;
    }

    const updatedProfile = await tx.playerProfile.findUniqueOrThrow({ where: { userId } });
    return {
      profile: toProfileData(updatedProfile),
      aircraft: toAircraftState(aircraftId, ownedAircraftIds([...rows, { aircraftId }]), updatedProfile.equippedAircraftId),
    };
  });
}

/** Equips an owned aircraft. */
export async function equipAircraft(
  userId: string,
  aircraftId: string,
): Promise<PurchaseAircraftResponse> {
  if (!isAircraftId(aircraftId)) {
    throw new AppError(404, 'unknown_aircraft', `Unknown aircraft: ${aircraftId}`);
  }

  return prisma.$transaction(async (tx) => {
    await ensureProfile(tx, userId);
    const rows = await tx.playerAircraft.findMany({ where: { userId } });
    const owned = ownedAircraftIds(rows);

    if (!owned.has(aircraftId)) {
      throw new AppError(403, 'aircraft_not_owned', 'You do not own this aircraft');
    }

    const updatedProfile = await tx.playerProfile.update({
      where: { userId },
      data: { equippedAircraftId: aircraftId },
    });

    return {
      profile: toProfileData(updatedProfile),
      aircraft: toAircraftState(aircraftId, owned, updatedProfile.equippedAircraftId),
    };
  });
}