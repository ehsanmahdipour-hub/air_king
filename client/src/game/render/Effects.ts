import type { Vec2 } from '@game/shared';
import Phaser from 'phaser';

import { DEPTH } from '../config';
import { TEXTURES } from '../textures';

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;

/**
 * Reusable combat effects. A small number of shared emitters are created once
 * and triggered with `explode`, so effects add no per-hit allocation. Particle
 * counts are kept modest to protect readability and performance.
 */
export class Effects {
  private readonly explosion: Emitter;
  private readonly flash: Emitter;
  private readonly impact: Emitter;
  private readonly hit: Emitter;
  private readonly muzzle: Emitter;

  constructor(scene: Phaser.Scene) {
    this.explosion = createEmitter(scene, TEXTURES.spark, {
      lifespan: 520,
      speed: { min: 90, max: 260 },
      scale: { start: 1.4, end: 0 },
      quantity: 18,
      tint: [0xffd166, 0xff9a3c, 0xff6b6b],
    });
    this.flash = createEmitter(scene, TEXTURES.glow, {
      lifespan: 220,
      speed: { min: 0, max: 20 },
      scale: { start: 1.6, end: 0 },
      quantity: 1,
      tint: [0xfff3c4, 0xffffff],
    });
    this.impact = createEmitter(scene, TEXTURES.spark, {
      lifespan: 220,
      speed: { min: 40, max: 120 },
      scale: { start: 0.7, end: 0 },
      quantity: 5,
      tint: 0xffffff,
    });
    this.hit = createEmitter(scene, TEXTURES.spark, {
      lifespan: 360,
      speed: { min: 60, max: 190 },
      scale: { start: 1, end: 0 },
      quantity: 12,
      tint: [0xff6b6b, 0xffb347],
    });
    this.muzzle = createEmitter(scene, TEXTURES.spark, {
      lifespan: 140,
      speed: { min: 20, max: 70 },
      scale: { start: 0.6, end: 0 },
      quantity: 3,
      tint: 0x9be7ff,
    });
  }

  explosionAt(position: Vec2, count = 18): void {
    this.explosion.explode(count, position.x, position.y);
    this.flash.explode(1, position.x, position.y);
  }

  impactAt(position: Vec2): void {
    this.impact.explode(5, position.x, position.y);
  }

  hitAt(position: Vec2): void {
    this.hit.explode(12, position.x, position.y);
    this.flash.explode(1, position.x, position.y);
  }

  muzzleAt(position: Vec2): void {
    this.muzzle.explode(3, position.x, position.y);
  }

  destroy(): void {
    this.explosion.destroy();
    this.flash.destroy();
    this.impact.destroy();
    this.hit.destroy();
    this.muzzle.destroy();
  }
}

function createEmitter(
  scene: Phaser.Scene,
  texture: string,
  config: Partial<Phaser.Types.GameObjects.Particles.ParticleEmitterConfig>,
): Emitter {
  return scene.add
    .particles(0, 0, texture, {
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