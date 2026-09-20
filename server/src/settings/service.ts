import { gameSettingsSchema, parseSettings, type GameSettings } from '@game/shared';

import { prisma } from '../db/prisma';
import { ensureProfile } from '../profile/profile';

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export async function getSettings(userId: string): Promise<{ settings: GameSettings }> {
  const profile = await ensureProfile(prisma, userId);
  return { settings: parseSettings(safeJson(profile.settingsJson)) };
}

/** Validates and persists the full settings object. */
export async function updateSettings(
  userId: string,
  input: unknown,
): Promise<{ settings: GameSettings }> {
  const settings = gameSettingsSchema.parse(input);
  await ensureProfile(prisma, userId);
  await prisma.playerProfile.update({
    where: { userId },
    data: { settingsJson: JSON.stringify(settings) },
  });
  return { settings };
}