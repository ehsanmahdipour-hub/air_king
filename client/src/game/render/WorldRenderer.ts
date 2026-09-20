import type { LevelConfig, World } from '@game/shared';
import Phaser from 'phaser';

import { DEPTH } from '../config';
import { bossTexture, enemyTexture, TEXTURES } from '../textures';
import { SpritePool } from './SpritePool';

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
  private readonly enemyPool: SpritePool;
  private readonly projectilePool: SpritePool;
  private readonly stars: Star[] = [];
  private bossSprite?: Phaser.GameObjects.Image;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly level: LevelConfig,
  ) {
    this.enemyPool = new SpritePool(scene);
    this.projectilePool = new SpritePool(scene);

    scene.cameras.main.setBackgroundColor(level.environment.backgroundColor);
    this.createStars();

    this.playerSprite = scene.add
      .image(level.playerStart.x, level.playerStart.y, TEXTURES.player)
      .setDepth(DEPTH.player);
  }

  sync(world: World): void {
    this.scrollBackground(world.distance);

    this.playerSprite
      .setPosition(world.player.position.x, world.player.position.y)
      .setAlpha(world.player.invulnerableFor > 0 ? 0.5 : 1);

    this.syncEnemies(world);
    this.syncProjectiles(world);
    this.syncBoss(world);
  }

  /** Briefly tints the player sprite when it takes a hit. */
  flashPlayer(): void {
    this.playerSprite.setTint(0xff9a9a);
    this.scene.time.delayedCall(120, () => this.playerSprite.clearTint());
  }

  /** Releases all dynamic sprites back to their pools, e.g. on level restart. */
  reset(): void {
    this.releaseAll(this.enemySprites, this.enemyPool);
    this.releaseAll(this.projectileSprites, this.projectilePool);
  }

  destroy(): void {
    this.reset();
    this.enemyPool.destroy();
    this.projectilePool.destroy();

    for (const star of this.stars) {
      star.sprite.destroy();
    }
    this.stars.length = 0;

    this.bossSprite?.destroy();
    this.playerSprite.destroy();
  }

  private createStars(): void {
    const { width, height } = this.level.arena;

    for (let index = 0; index < STAR_COUNT; index += 1) {
      const parallax = Phaser.Math.FloatBetween(0.3, 1.2);
      const sprite = this.scene.add
        .image(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), TEXTURES.star)
        .setScale(parallax)
        .setAlpha(0.25 + (parallax / 1.2) * 0.6)
        .setTint(this.level.environment.starTint)
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
        sprite = this.enemyPool.acquire(enemyTexture(enemy.typeId), DEPTH.enemy);
        this.enemySprites.set(enemy.id, sprite);
      }
      sprite.setPosition(enemy.position.x, enemy.position.y);
    }

    this.removeMissing(this.enemySprites, seen, this.enemyPool);
  }

  private syncBoss(world: World): void {
    const boss = world.boss;
    if (!boss) {
      this.bossSprite?.destroy();
      this.bossSprite = undefined;
      return;
    }

    if (!this.bossSprite) {
      this.bossSprite = this.scene.add.image(
        boss.position.x,
        boss.position.y,
        bossTexture(boss.bossId),
      );
    }
    this.bossSprite
      .setTexture(bossTexture(boss.bossId))
      .setDepth(DEPTH.enemy)
      .setPosition(boss.position.x, boss.position.y)
      .setAlpha(boss.entering ? 0.85 : 1);
  }

  private syncProjectiles(world: World): void {
    const seen = new Set<number>();

    for (const projectile of world.projectiles) {
      seen.add(projectile.id);
      const texture =
        projectile.owner === 'player' ? TEXTURES.playerBullet : TEXTURES.enemyBullet;

      let sprite = this.projectileSprites.get(projectile.id);
      if (!sprite) {
        sprite = this.projectilePool.acquire(texture, DEPTH.projectile);
        this.projectileSprites.set(projectile.id, sprite);
      }
      sprite.setTexture(texture);
      sprite.setPosition(projectile.position.x, projectile.position.y);
      sprite.setRotation(Math.atan2(projectile.velocity.y, projectile.velocity.x) + Math.PI / 2);
    }

    this.removeMissing(this.projectileSprites, seen, this.projectilePool);
  }

  private removeMissing(
    sprites: Map<number, Phaser.GameObjects.Image>,
    seen: Set<number>,
    pool: SpritePool,
  ): void {
    for (const [id, sprite] of sprites) {
      if (!seen.has(id)) {
        pool.release(sprite);
        sprites.delete(id);
      }
    }
  }

  private releaseAll(
    sprites: Map<number, Phaser.GameObjects.Image>,
    pool: SpritePool,
  ): void {
    for (const sprite of sprites.values()) {
      pool.release(sprite);
    }
    sprites.clear();
  }
}
