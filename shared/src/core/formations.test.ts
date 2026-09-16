import { describe, expect, it } from 'vitest';

import { formationSpawnPosition } from './formations';

const arena = { width: 960, height: 600 };
const radius = 16;

describe('formationSpawnPosition', () => {
  it('spawns a line spanning the arena width', () => {
    const first = formationSpawnPosition('line', { index: 0, count: 3, radius, arena });
    const middle = formationSpawnPosition('line', { index: 1, count: 3, radius, arena });
    const last = formationSpawnPosition('line', { index: 2, count: 3, radius, arena });

    expect(first.x).toBe(radius * 2);
    expect(last.x).toBe(arena.width - radius * 2);
    expect(middle.x).toBeCloseTo(arena.width / 2, 6);
    expect(first.y).toBe(last.y);
  });

  it('spawns a v formation with staggered depth', () => {
    const edge = formationSpawnPosition('v', { index: 0, count: 3, radius, arena });
    const center = formationSpawnPosition('v', { index: 1, count: 3, radius, arena });

    expect(edge.y).toBeLessThan(center.y);
  });

  it('spawns a column stacked in the centre', () => {
    const first = formationSpawnPosition('column', { index: 0, count: 3, radius, arena });
    const last = formationSpawnPosition('column', { index: 2, count: 3, radius, arena });

    expect(first.x).toBe(arena.width / 2);
    expect(last.x).toBe(arena.width / 2);
    expect(last.y).toBeLessThan(first.y);
  });

  it('keeps random spawns within the arena horizontally', () => {
    for (let index = 0; index < 20; index += 1) {
      const position = formationSpawnPosition('random', { index, count: 20, radius, arena });
      expect(position.x).toBeGreaterThanOrEqual(radius);
      expect(position.x).toBeLessThanOrEqual(arena.width - radius);
    }
  });
});
