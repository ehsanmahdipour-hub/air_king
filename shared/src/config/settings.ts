import { z } from 'zod';

/** Player-configurable settings. Kept intentionally small. */

export const movementControlSchema = z.enum(['wasd', 'arrows', 'mouse']);
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
  movement: 'wasd',
  shooting: 'both',
  musicEnabled: true,
  sfxEnabled: true,
  masterVolume: 0.8,
  musicVolume: 0.5,
  sfxVolume: 0.8,
};

/** Maps legacy stored values onto the current movement options. */
function normalizeMovement(value: unknown): unknown {
  if (value === 'keyboard') {
    return 'wasd';
  }
  return value;
}

/**
 * Parses stored or partial settings, falling back to defaults for anything
 * missing or invalid. Used when reading persisted settings, and migrates the
 * legacy `keyboard` movement value to `wasd`.
 */
export function parseSettings(input: unknown): GameSettings {
  const source =
    input && typeof input === 'object' ? { ...(input as Record<string, unknown>) } : {};

  if ('movement' in source) {
    source.movement = normalizeMovement(source.movement);
  }

  const result = gameSettingsSchema.partial().safeParse(source);
  if (!result.success) {
    return { ...DEFAULT_SETTINGS };
  }

  const merged = { ...DEFAULT_SETTINGS, ...result.data };
  // Guard against explicit `undefined` values overriding defaults.
  for (const key of Object.keys(merged) as (keyof GameSettings)[]) {
    if (merged[key] === undefined) {
      (merged as Record<string, unknown>)[key] = DEFAULT_SETTINGS[key];
    }
  }
  return merged;
}