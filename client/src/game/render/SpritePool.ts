import Phaser from 'phaser';

import { TEXTURES } from '../textures';

/**
 * Reuses Phaser Image objects instead of destroying and recreating them, to
 * avoid per-frame allocation and GC churn when combat is heavy.
 */
export class SpritePool {
  private readonly free: Phaser.GameObjects.Image[] = [];
  private readonly created = new Set<Phaser.GameObjects.Image>();

  constructor(private readonly scene: Phaser.Scene) {}

  acquire(texture: string, depth: number): Phaser.GameObjects.Image {
    const image = this.free.pop() ?? this.create();

    image
      .setTexture(texture)
      .setDepth(depth)
      .setActive(true)
      .setVisible(true)
      .setAlpha(1)
      .setScale(1)
      .setRotation(0);

    return image;
  }

  release(image: Phaser.GameObjects.Image): void {
    image.setActive(false).setVisible(false);
    this.free.push(image);
  }

  destroy(): void {
    for (const image of this.created) {
      image.destroy();
    }
    this.created.clear();
    this.free.length = 0;
  }

  private create(): Phaser.GameObjects.Image {
    const image = this.scene.add.image(0, 0, TEXTURES.spark);
    this.created.add(image);
    return image;
  }
}
