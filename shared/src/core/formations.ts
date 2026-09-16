import type { Arena, FormationType } from '../config/levels';
import { randomRange } from './math';
import type { Vec2 } from '../types';

export interface FormationParams {
  index: number;
  count: number;
  radius: number;
  arena: Arena;
}

/**
 * Computes the spawn position (above the top edge) for the `index`-th enemy of
 * a formation group. Pure and deterministic except for the `random` formation.
 */
export function formationSpawnPosition(
  formation: FormationType,
  params: FormationParams,
): Vec2 {
  const { index, count, radius, arena } = params;
  const top = -radius * 2;
  const margin = radius * 2;
  const usableWidth = arena.width - margin * 2;
  const fraction = count <= 1 ? 0.5 : index / (count - 1);

  switch (formation) {
    case 'random':
      return { x: randomRange(radius, arena.width - radius), y: top };
    case 'line':
      return { x: margin + usableWidth * fraction, y: top };
    case 'v': {
      const center = (count - 1) / 2;
      return { x: margin + usableWidth * fraction, y: top - Math.abs(index - center) * radius * 1.8 };
    }
    case 'column':
      return { x: arena.width / 2, y: top - index * radius * 2.4 };
  }
}
