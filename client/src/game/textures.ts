import Phaser from 'phaser';

/**
 * Placeholder textures are generated procedurally so the prototype has no
 * external asset dependency. Swapping in real sprites later only changes this
 * module, not gameplay or the renderer.
 */
export const TEXTURES = {
  player: 'player',
  fighter: 'enemy-fighter',
  bomber: 'enemy-bomber',
  mine: 'enemy-mine',
  turret: 'enemy-turret',
  playerBullet: 'player-bullet',
  enemyBullet: 'enemy-bullet',
  spark: 'spark',
  star: 'star',
} as const;

/** Maps a simulation enemy type id to its sprite texture. */
const ENEMY_TEXTURES: Record<string, string> = {
  fighter: TEXTURES.fighter,
  bomber: TEXTURES.bomber,
  mine: TEXTURES.mine,
  turret: TEXTURES.turret,
};

export function enemyTexture(typeId: string): string {
  return ENEMY_TEXTURES[typeId] ?? TEXTURES.fighter;
}

export function createGameTextures(scene: Phaser.Scene): void {
  createPlayerTexture(scene);
  createFighterTexture(scene);
  createBomberTexture(scene);
  createMineTexture(scene);
  createTurretTexture(scene);
  createPlayerBulletTexture(scene);
  createEnemyBulletTexture(scene);
  createSparkTexture(scene);
  createStarTexture(scene);
}

function draw(scene: Phaser.Scene, key: string, width: number, height: number, paint: (g: Phaser.GameObjects.Graphics) => void): void {
  if (scene.textures.exists(key)) {
    return;
  }
  const graphics = scene.add.graphics();
  paint(graphics);
  graphics.generateTexture(key, width, height);
  graphics.destroy();
}

function createPlayerTexture(scene: Phaser.Scene): void {
  const size = 44;
  draw(scene, TEXTURES.player, size, size, (graphics) => {
    graphics.fillStyle(0x8fd3ff, 1);
    graphics.fillTriangle(size / 2, 0, 0, size, size, size);
    graphics.fillStyle(0x4aa3e0, 1);
    graphics.fillRect(0, size * 0.55, size, size * 0.16);
    graphics.fillStyle(0xffe066, 1);
    graphics.fillCircle(size / 2, size * 0.9, size * 0.12);
  });
}

function createFighterTexture(scene: Phaser.Scene): void {
  const size = 36;
  draw(scene, TEXTURES.fighter, size, size, (graphics) => {
    graphics.fillStyle(0xff6b6b, 1);
    graphics.fillTriangle(size / 2, size, 0, 0, size, 0);
    graphics.fillStyle(0xaa3b3b, 1);
    graphics.fillRect(0, size * 0.3, size, size * 0.14);
  });
}

function createBomberTexture(scene: Phaser.Scene): void {
  const size = 52;
  draw(scene, TEXTURES.bomber, size, size, (graphics) => {
    graphics.fillStyle(0xffb45e, 1);
    graphics.fillTriangle(size / 2, size, 0, size * 0.18, size, size * 0.18);
    graphics.fillStyle(0xd98a2b, 1);
    graphics.fillRect(0, size * 0.1, size, size * 0.2);
    graphics.fillStyle(0xfff1c9, 1);
    graphics.fillCircle(size / 2, size * 0.4, size * 0.1);
  });
}

function createMineTexture(scene: Phaser.Scene): void {
  const size = 36;
  const center = size / 2;
  draw(scene, TEXTURES.mine, size, size, (graphics) => {
    graphics.fillStyle(0x9aa4b2, 1);
    graphics.fillRect(center - 2, 0, 4, size);
    graphics.fillRect(0, center - 2, size, 4);
    graphics.fillStyle(0x6b7280, 1);
    graphics.fillCircle(center, center, size * 0.4);
    graphics.fillStyle(0x2f3542, 1);
    graphics.fillCircle(center, center, size * 0.2);
  });
}

function createTurretTexture(scene: Phaser.Scene): void {
  const size = 44;
  draw(scene, TEXTURES.turret, size, size, (graphics) => {
    graphics.fillStyle(0x596273, 1);
    graphics.fillRect(size / 2 - 4, size * 0.45, 8, size * 0.5);
    graphics.fillStyle(0x8b98a8, 1);
    graphics.fillRect(size * 0.12, size * 0.12, size * 0.76, size * 0.58);
    graphics.fillStyle(0xcbd5e1, 1);
    graphics.fillCircle(size / 2, size * 0.36, size * 0.16);
  });
}

function createPlayerBulletTexture(scene: Phaser.Scene): void {
  draw(scene, TEXTURES.playerBullet, 6, 16, (graphics) => {
    graphics.fillStyle(0x9be7ff, 1);
    graphics.fillRect(0, 0, 6, 16);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 6, 6);
  });
}

function createEnemyBulletTexture(scene: Phaser.Scene): void {
  draw(scene, TEXTURES.enemyBullet, 8, 16, (graphics) => {
    graphics.fillStyle(0xff8a4c, 1);
    graphics.fillRect(0, 0, 8, 16);
    graphics.fillStyle(0xffe0b3, 1);
    graphics.fillRect(0, 0, 8, 6);
  });
}

function createSparkTexture(scene: Phaser.Scene): void {
  draw(scene, TEXTURES.spark, 8, 8, (graphics) => {
    graphics.fillStyle(0xffe066, 1);
    graphics.fillCircle(4, 4, 4);
  });
}

function createStarTexture(scene: Phaser.Scene): void {
  draw(scene, TEXTURES.star, 4, 4, (graphics) => {
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(2, 2, 2);
  });
}
