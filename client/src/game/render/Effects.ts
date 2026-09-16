import type { Vec2 } from '@game/shared';
import Phaser from 'phaser';

import { DEPTH } from '../config';
import { TEXTURES } from '../textures';

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;

/**
 * Reusable combat effects. A small number of shared emitters are created once
 * and triggered with `explode`, so effects add no per-hit allocation.
 */
export class Effects {
  private readonly explosion: Emitter;
  private readonly impact: Emitter;
  private readonly hit: Emitter;
  private readonly muzzle: Emitter;

  constructor(scene: Phaser.Scene) {
    this.explosion = createEmitter(scene, {
      lifespan: 480,
      speed: { min: 80, max: 240 },
      scale: { start: 1.3, end: 0 },
      quantity: 16,
      tint: 0xffb347,
    });
    this.impact = createEmitter(scene, {
      lifespan: 220,
      speed: { min: 40, max: 120 },
      scale: { start: 0.7, end: 0 },
      quantity: 5,
      tint: 0xffffff,
    });
    this.hit = createEmitter(scene, {
      lifespan: 340,
      speed: { min: 60, max: 180 },
      scale: { start: 1, end: 0 },
      quantity: 10,
      tint: 0xff6b6b,
    });
    this.muzzle = createEmitter(scene, {
      lifespan: 140,
      speed: { min: 20, max: 70 },
      scale: { start: 0.6, end: 0 },
      quantity: 3,
      tint: 0x9be7ff,
    });
  }

  explosionAt(position: Vec2, count = 16): void {
    this.explosion.explode(count, position.x, position.y);
  }

  impactAt(position: Vec2): void {
    this.impact.explode(5, position.x, position.y);
  }

  hitAt(position: Vec2): void {
    this.hit.explode(10, position.x, position.y);
  }

  muzzleAt(position: Vec2): void {
    this.muzzle.explode(3, position.x, position.y);
  }

  destroy(): void {
    this.explosion.destroy();
    this.impact.destroy();
    this.hit.destroy();
    this.muzzle.destroy();
  }
}

function createEmitter(
  scene: Phaser.Scene,
  config: Partial<Phaser.Types.GameObjects.Particles.ParticleEmitterConfig>,
): Emitter {
  return scene.add
    .particles(0, 0, TEXTURES.spark, {
      lifespan: 400,
      speed: { min: 60, max: 200 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
      ...config,
    })
    .setDepth(DEPTH.effects);
}
