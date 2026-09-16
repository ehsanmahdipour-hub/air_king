import type { Vec2 } from '../types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function length(vector: Vec2): number {
  return Math.hypot(vector.x, vector.y);
}

/** Returns a unit vector, or the zero vector when the input has no length. */
export function normalize(vector: Vec2): Vec2 {
  const magnitude = length(vector);
  if (magnitude === 0) {
    return { x: 0, y: 0 };
  }
  return { x: vector.x / magnitude, y: vector.y / magnitude };
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function circlesOverlap(a: Vec2, aRadius: number, b: Vec2, bRadius: number): boolean {
  const radii = aRadius + bRadius;
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= radii * radii;
}

/** Angle in radians from `from` to `to`. */
export function angleBetween(from: Vec2, to: Vec2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
