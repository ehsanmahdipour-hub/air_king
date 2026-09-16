import type { GameEvent, LevelConfig, World } from '@game/shared';
import Phaser from 'phaser';

import { DEPTH } from '../config';
import { TEXTURES } from '../textures';

interface Star {
  sprite: Phaser.GameObjects.Image;
  baseY: number;
  parallax: number;
}

const STAR_COUNT = 140;

/**
 * Projects the pure simulation state onto Phaser game objects. It only reads
 * the world and manages sprites; it never applies gameplay rules.
 */
export class WorldRenderer {
  private readonly playerSprite: Phaser.GameObjects.Image;
  private readonly enemySprites = new Map<number, Phaser.GameObjects.Image>();
  private readonly projectileSprites = new Map<number, Phaser.GameObjects.Image>();
  private readonly stars: Star[] = [];
  private readonly explosion: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly level: LevelConfig,
  ) {
    this.createStars();

    this.playerSprite = scene.add
      .image(level.playerStart.x, level.playerStart.y, TEXTURES.player)
      .setDepth(DEPTH.player);

    this.explosion = scene.add
      .particles(0, 0, TEXTURES.spark, {
        lifespan: 420,
        speed: { min: 60, max: 200 },
        scale: { start: 1.1, end: 0 },
        alpha: { start: 1, end: 0 },
        quantity: 12,
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(DEPTH.effects);
  }

  sync(world: World): void {
    this.scrollBackground(world.distance);

    this.playerSprite
      .setPosition(world.player.position.x, world.player.position.y)
      .setAlpha(world.player.invulnerableFor > 0 ? 0.5 : 1);

    this.syncEnemies(world);
    this.syncProjectiles(world);
  }

  playEvents(events: GameEvent[]): void {
    for (const event of events) {
      switch (event.type) {
        case 'enemyDestroyed':
          this.explosion.explode(12, event.position.x, event.position.y);
          this.scene.cameras.main.shake(80, 0.002);
          break;
        case 'playerHit':
          this.explosion.explode(8, event.position.x, event.position.y);
          this.scene.cameras.main.shake(160, 0.006);
          this.flashPlayer();
          break;
        case 'playerDestroyed':
          this.explosion.explode(30, event.position.x, event.position.y);
          this.scene.cameras.main.shake(300, 0.01);
          break;
        case 'shotFired':
          break;
      }
    }
  }

  /** Removes all dynamic sprites, e.g. when the level restarts. */
  reset(): void {
    this.clearSprites(this.enemySprites);
    this.clearSprites(this.projectileSprites);
  }

  destroy(): void {
    this.clearSprites(this.enemySprites);
    this.clearSprites(this.projectileSprites);
    for (const star of this.stars) {
      star.sprite.destroy();
    }
    this.stars.length = 0;
    this.playerSprite.destroy();
    this.explosion.destroy();
  }

  private createStars(): void {
    const { width, height } = this.level.arena;

    for (let index = 0; index < STAR_COUNT; index += 1) {
      const parallax = Phaser.Math.FloatBetween(0.3, 1.2);
      const sprite = this.scene.add
        .image(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), TEXTURES.star)
        .setScale(parallax)
        .setAlpha(0.25 + (parallax / 1.2) * 0.6)
        .setDepth(DEPTH.background);

      this.stars.push({ sprite, baseY: sprite.y, parallax });
    }
  }

  private scrollBackground(distance: number): void {
    const height = this.level.arena.height;

    for (const star of this.stars) {
      star.sprite.y = Phaser.Math.Wrap(star.baseY + distance * star.parallax, -8, height + 8);
    }
  }

  private syncEnemies(world: World): void {
    const seen = new Set<number>();

    for (const enemy of world.enemies) {
      seen.add(enemy.id);
      let sprite = this.enemySprites.get(enemy.id);
      if (!sprite) {
        sprite = this.scene.add
          .image(enemy.position.x, enemy.position.y, TEXTURES.enemy)
          .setDepth(DEPTH.enemy);
        this.enemySprites.set(enemy.id, sprite);
      }
      sprite.setPosition(enemy.position.x, enemy.position.y);
    }

    this.removeMissing(this.enemySprites, seen);
  }

  private syncProjectiles(world: World): void {
    const seen = new Set<number>();

    for (const projectile of world.projectiles) {
      seen.add(projectile.id);
      let sprite = this.projectileSprites.get(projectile.id);
      if (!sprite) {
        sprite = this.scene.add
          .image(projectile.position.x, projectile.position.y, TEXTURES.bullet)
          .setDepth(DEPTH.projectile);
        this.projectileSprites.set(projectile.id, sprite);
      }
      sprite.setPosition(projectile.position.x, projectile.position.y);
      sprite.setRotation(Math.atan2(projectile.velocity.y, projectile.velocity.x) + Math.PI / 2);
    }

    this.removeMissing(this.projectileSprites, seen);
  }

  private removeMissing(
    sprites: Map<number, Phaser.GameObjects.Image>,
    seen: Set<number>,
  ): void {
    for (const [id, sprite] of sprites) {
      if (!seen.has(id)) {
        sprite.destroy();
        sprites.delete(id);
      }
    }
  }

  private clearSprites(sprites: Map<number, Phaser.GameObjects.Image>): void {
    for (const sprite of sprites.values()) {
      sprite.destroy();
    }
    sprites.clear();
  }

  private flashPlayer(): void {
    this.playerSprite.setTint(0xff9a9a);
    this.scene.time.delayedCall(120, () => this.playerSprite.clearTint());
  }
}
