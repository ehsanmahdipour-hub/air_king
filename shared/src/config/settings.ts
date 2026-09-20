import { z } from 'zod';

/** Player-configurable settings. Kept intentionally small. */

export const movementControlSchema = z.enum(['keyboard', 'mouse']);
export const shootingControlSchema = z.enum(['space', 'mouse', 'both']);

export const gameSettingsSchema = z.object({
  movement: movementControlSchema,
  shooting: shootingControlSchema,
  musicEnabled: z.boolean(),
  sfxEnabled: z.boolean(),
  masterVolume: z.number().min(0).max(1),
  musicVolume: z.number().min(0).max(1),
  sfxVolume: z.number().min(0).max(1),
});

export type GameSettings = z.infer<typeof gameSettingsSchema>;
export type MovementControl = z.infer<typeof movementControlSchema>;
export type ShootingControl = z.infer<typeof shootingControlSchema>;

export const DEFAULT_SETTINGS: GameSettings = {
  movement: 'keyboard',
  shooting: 'both',
  musicEnabled: true,
  sfxEnabled: true,
  masterVolume: 0.8,
  musicVolume: 0.5,
  sfxVolume: 0.8,
};

/**
 * Parses stored or partial settings, falling back to defaults for anything
 * missing or invalid. Used when reading persisted settings.
 */
export function parseSettings(input: unknown): GameSettings {
  const result = gameSettingsSchema.partial().safeParse(input ?? {});
  if (!result.success) {
    return { ...DEFAULT_SETTINGS };
  }
  return { ...DEFAULT_SETTINGS, ...result.data };
}

export function settingsResponse(settings: GameSettings): { settings: GameSettings } {
  return { settings };
}