import { describe, expect, it } from 'vitest';

import { AIRCRAFT_TEXTURE_KEYS, aircraftTextureKey } from './aircraftVisuals';

describe('aircraftTextureKey', () => {
  it('maps every aircraft to a distinct texture key', () => {
    const ids = ['starter', 'interceptor', 'gunship', 'fortress', 'phantom', 'raptor'];
    const keys = ids.map(aircraftTextureKey);

    expect(new Set(keys).size).toBe(ids.length);
    for (const key of keys) {
      expect(key.startsWith('aircraft-')).toBe(true);
    }
  });

  it('falls back to the starter model for an unknown aircraft', () => {
    expect(aircraftTextureKey('unknown-aircraft')).toBe(AIRCRAFT_TEXTURE_KEYS.starter);
  });
});