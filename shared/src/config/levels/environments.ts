import type { EnvironmentConfig } from './types';

/**
 * Environment presets. They only carry presentation data so new environments
 * are added without touching gameplay or the renderer.
 */
export const ENVIRONMENTS = {
  deepSpace: {
    id: 'deep-space',
    displayName: 'Deep Space',
    backgroundColor: 0x05070f,
    starTint: 0xffffff,
  },
  nebula: {
    id: 'nebula',
    displayName: 'Nebula',
    backgroundColor: 0x140a24,
    starTint: 0xc9a6ff,
  },
  dusk: {
    id: 'dusk',
    displayName: 'Dusk Horizon',
    backgroundColor: 0x1a0f14,
    starTint: 0xffb37a,
  },
  aurora: {
    id: 'aurora',
    displayName: 'Aurora Belt',
    backgroundColor: 0x06141a,
    starTint: 0x7fffe0,
  },
  crimson: {
    id: 'crimson',
    displayName: 'Crimson Expanse',
    backgroundColor: 0x1a0808,
    starTint: 0xff8f6b,
  },
} satisfies Record<string, EnvironmentConfig>;

export type EnvironmentId = keyof typeof ENVIRONMENTS;