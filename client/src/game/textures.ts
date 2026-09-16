import Phaser from 'phaser';

/**
 * Placeholder textures are generated procedurally so the prototype has no
 * external asset dependency. Swapping in real sprites later only changes this
 * module, not gameplay or the renderer.
 */
export const TEXTURES = {
  player: 'player',
  enemy: 'enemy',
  bullet: 'bullet',
  spark: 'spark',
  star: 'star',
} as const;

export function createGameTextures(scene: Phaser.Scene): void {
  createPlayerTexture(scene);
  createEnemyTexture(scene);
  createBulletTexture(scene);
  createSparkTexture(scene);
  createStarTexture(scene);
}

function createPlayerTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEXTURES.player)) {
    return;
  }

  const size = 44;
  const graphics = scene.add.graphics();
  graphics.fillStyle(0x8fd3ff, 1);
  graphics.fillTriangle(size / 2, 0, 0, size, size, size);
  graphics.fillStyle(0x4aa3e0, 1);
  graphics.fillRect(0, size * 0.55, size, size * 0.16);
  graphics.fillStyle(0xffe066, 1);
  graphics.fillCircle(size / 2, size * 0.9, size * 0.12);
  graphics.generateTexture(TEXTURES.player, size, size);
  graphics.destroy();
}

function createEnemyTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEXTURES.enemy)) {
    return;
  }

  const size = 36;
  const graphics = scene.add.graphics();
  graphics.fillStyle(0xff6b6b, 1);
  graphics.fillTriangle(size / 2, size, 0, 0, size, 0);
  graphics.fillStyle(0xaa3b3b, 1);
  graphics.fillRect(0, size * 0.3, size, size * 0.14);
  graphics.generateTexture(TEXTURES.enemy, size, size);
  graphics.destroy();
}

function createBulletTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEXTURES.bullet)) {
    return;
  }

  const graphics = scene.add.graphics();
  graphics.fillStyle(0x9be7ff, 1);
  graphics.fillRect(0, 0, 6, 16);
  graphics.fillStyle(0xffffff, 1);
  graphics.fillRect(0, 0, 6, 6);
  graphics.generateTexture(TEXTURES.bullet, 6, 16);
  graphics.destroy();
}

function createSparkTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEXTURES.spark)) {
    return;
  }

  const graphics = scene.add.graphics();
  graphics.fillStyle(0xffe066, 1);
  graphics.fillCircle(4, 4, 4);
  graphics.generateTexture(TEXTURES.spark, 8, 8);
  graphics.destroy();
}

function createStarTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEXTURES.star)) {
    return;
  }

  const graphics = scene.add.graphics();
  graphics.fillStyle(0xffffff, 1);
  graphics.fillCircle(2, 2, 2);
  graphics.generateTexture(TEXTURES.star, 4, 4);
  graphics.destroy();
}
