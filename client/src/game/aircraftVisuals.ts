/**
 * Maps an aircraft id to its Phaser texture key. Kept free of Phaser imports so
 * it can be unit tested and reused by both the renderer and the texture module.
 */
export const AIRCRAFT_TEXTURE_KEYS: Record<string, string> = {
  starter: 'aircraft-starter',
  interceptor: 'aircraft-interceptor',
  gunship: 'aircraft-gunship',
  fortress: 'aircraft-fortress',
  phantom: 'aircraft-phantom',
  raptor: 'aircraft-raptor',
};

/** Texture key for an aircraft, falling back to the starter model. */
export function aircraftTextureKey(aircraftId: string): string {
  return AIRCRAFT_TEXTURE_KEYS[aircraftId] ?? AIRCRAFT_TEXTURE_KEYS.starter!;
}