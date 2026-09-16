import Phaser from 'phaser';

interface Star {
  sprite: Phaser.GameObjects.Image;
  speed: number;
}

/**
 * Placeholder scene that proves the Phaser render loop is running. Stars scroll
 * toward the viewer at varying speeds and scales to hint at forward motion and
 * depth. No gameplay lives here yet — this is a foundation smoke test.
 */
export class StarfieldScene extends Phaser.Scene {
  private readonly stars: Star[] = [];
  private readonly starCount = 180;

  constructor() {
    super('Starfield');
  }

  create(): void {
    if (!this.textures.exists('star')) {
      const texture = this.add.graphics();
      texture.fillStyle(0xffffff, 1);
      texture.fillCircle(2, 2, 2);
      texture.generateTexture('star', 4, 4);
      texture.destroy();
    }

    for (let i = 0; i < this.starCount; i += 1) {
      this.stars.push(this.createStar(true));
    }

    this.add
      .text(20, 18, 'AIR COMBAT', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#7fd1ff',
      })
      .setDepth(1000);
  }

  override update(_time: number, delta: number): void {
    const { width, height } = this.scale;

    for (const star of this.stars) {
      star.sprite.y += (star.speed * delta) / 1000;

      if (star.sprite.y - star.sprite.displayHeight > height) {
        star.sprite.y = -star.sprite.displayHeight;
        star.sprite.x = Phaser.Math.Between(0, width);
      }
    }
  }

  private createStar(randomizeY: boolean): Star {
    const depthScale = Phaser.Math.FloatBetween(0.35, 1.6);
    const sprite = this.add.image(
      Phaser.Math.Between(0, this.scale.width),
      randomizeY ? Phaser.Math.Between(0, this.scale.height) : -4,
      'star',
    );

    sprite.setScale(depthScale);
    sprite.setAlpha(0.25 + depthScale * 0.45);
    sprite.setDepth(depthScale);

    return { sprite, speed: 40 + depthScale * 160 };
  }
}
