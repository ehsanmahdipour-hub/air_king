import Phaser from 'phaser';

/**
 * Procedurally generated textures. All art is produced here so it can be
 * replaced with real sprites later without touching gameplay or the renderer.
 * The style is clean sci-fi arcade: strong silhouettes, a couple of highlight
 * tones and glow accents, kept small for performance.
 */
export const TEXTURES = {
  player: 'player',
  fighter: 'enemy-fighter',
  bomber: 'enemy-bomber',
  mine: 'enemy-mine',
  turret: 'enemy-turret',
  diver: 'enemy-diver',
  boss: 'boss',
  playerBullet: 'player-bullet',
  enemyBullet: 'enemy-bullet',
  spark: 'spark',
  glow: 'glow',
  star: 'star',
  nebula: 'nebula',
} as const;

const ENEMY_TEXTURES: Record<string, string> = {
  fighter: TEXTURES.fighter,
  bomber: TEXTURES.bomber,
  mine: TEXTURES.mine,
  turret: TEXTURES.turret,
  diver: TEXTURES.diver,
};

const BOSS_TEXTURES: Record<string, string> = {
  dreadnought: TEXTURES.boss,
  hydra: TEXTURES.boss,
  leviathan: TEXTURES.boss,
};

export function enemyTexture(typeId: string): string {
  return ENEMY_TEXTURES[typeId] ?? TEXTURES.fighter;
}

export function bossTexture(bossId: string): string {
  return BOSS_TEXTURES[bossId] ?? TEXTURES.boss;
}

export function createGameTextures(scene: Phaser.Scene): void {
  createPlayerTexture(scene);
  createFighterTexture(scene);
  createBomberTexture(scene);
  createMineTexture(scene);
  createTurretTexture(scene);
  createDiverTexture(scene);
  createBossTexture(scene);
  createPlayerBulletTexture(scene);
  createEnemyBulletTexture(scene);
  createSparkTexture(scene);
  createGlowTexture(scene);
  createStarTexture(scene);
  createNebulaTexture(scene);
}

function draw(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  paint: (g: Phaser.GameObjects.Graphics) => void,
): void {
  if (scene.textures.exists(key)) {
    return;
  }
  const graphics = scene.add.graphics();
  paint(graphics);
  graphics.generateTexture(key, width, height);
  graphics.destroy();
}

/** Soft radial blob used for nebulae and glow accents. */
function softBlob(
  graphics: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  radius: number,
  color: number,
  maxAlpha: number,
  steps = 26,
): void {
  for (let step = steps; step >= 1; step -= 1) {
    const t = step / steps;
    graphics.fillStyle(color, maxAlpha * (1 - t) * (1 - t));
    graphics.fillCircle(cx, cy, radius * t);
  }
}

function createPlayerTexture(scene: Phaser.Scene): void {
  const size = 48;
  draw(scene, TEXTURES.player, size, size, (graphics) => {
    // Engine glow.
    graphics.fillStyle(0xff9a3c, 0.9);
    graphics.fillRect(size / 2 - 5, size * 0.82, 10, 10);
    graphics.fillStyle(0xffe066, 1);
    graphics.fillRect(size / 2 - 3, size * 0.84, 6, 8);

    // Swept rear wings.
    graphics.fillStyle(0x2f6fb0, 1);
    graphics.fillTriangle(2, 40, 46, 40, 24, 20);
    graphics.fillStyle(0x3f86cc, 1);
    graphics.fillTriangle(10, 38, 38, 38, 24, 24);

    // Fuselage.
    graphics.fillStyle(0x8fd3ff, 1);
    graphics.fillTriangle(24, 2, 15, 44, 33, 44);
    graphics.fillStyle(0xb9e6ff, 1);
    graphics.fillTriangle(24, 4, 21, 40, 27, 40);

    // Wing-tip accents.
    graphics.fillStyle(0x7fd1ff, 1);
    graphics.fillRect(0, 38, 6, 3);
    graphics.fillRect(42, 38, 6, 3);

    // Cockpit.
    graphics.fillStyle(0x0d2233, 1);
    graphics.fillCircle(24, 17, 4);
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillCircle(23, 16, 1.4);
  });
}

function createFighterTexture(scene: Phaser.Scene): void {
  const size = 38;
  draw(scene, TEXTURES.fighter, size, size, (graphics) => {
    graphics.fillStyle(0x8f2530, 1);
    graphics.fillTriangle(1, 5, 37, 5, 19, 27);
    graphics.fillStyle(0xd94b57, 1);
    graphics.fillTriangle(19, 34, 9, 3, 29, 3);
    graphics.fillStyle(0xff8f9a, 1);
    graphics.fillTriangle(19, 32, 15, 5, 23, 5);
    graphics.fillStyle(0x2a0f13, 1);
    graphics.fillCircle(19, 15, 3.2);
    graphics.fillStyle(0xffffff, 0.85);
    graphics.fillCircle(18, 14, 1.1);
  });
}

function createBomberTexture(scene: Phaser.Scene): void {
  const size = 54;
  draw(scene, TEXTURES.bomber, size, size, (graphics) => {
    graphics.fillStyle(0xa8641c, 1);
    graphics.fillRect(4, 4, 46, 26);
    graphics.fillStyle(0xd98a2b, 1);
    graphics.fillTriangle(4, 30, 50, 30, 27, 50);
    graphics.fillStyle(0xf0a94a, 1);
    graphics.fillRect(8, 6, 38, 18);
    graphics.fillStyle(0x3a2410, 1);
    graphics.fillCircle(16, 15, 4);
    graphics.fillCircle(38, 15, 4);
    graphics.fillStyle(0xffe0a3, 1);
    graphics.fillCircle(16, 14, 1.6);
    graphics.fillCircle(38, 14, 1.6);
    graphics.fillStyle(0x7a4a12, 1);
    graphics.fillRect(2, 6, 6, 22);
    graphics.fillRect(46, 6, 6, 22);
  });
}

function createMineTexture(scene: Phaser.Scene): void {
  const size = 40;
  const c = size / 2;
  draw(scene, TEXTURES.mine, size, size, (graphics) => {
    // Spikes.
    graphics.fillStyle(0x9aa4b2, 1);
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const x = c + Math.cos(angle) * (c - 4);
      const y = c + Math.sin(angle) * (c - 4);
      graphics.fillCircle(x, y, 3.2);
    }
    // Body with a metallic highlight.
    graphics.fillStyle(0x4b5563, 1);
    graphics.fillCircle(c, c, c - 7);
    graphics.fillStyle(0x6b7280, 1);
    graphics.fillCircle(c - 2, c - 2, c - 10);
    graphics.fillStyle(0x2f3542, 1);
    graphics.fillCircle(c, c, c - 14);
    // Warning core.
    graphics.fillStyle(0xff5b5b, 1);
    graphics.fillCircle(c, c, 5);
    graphics.fillStyle(0xffd0d0, 1);
    graphics.fillCircle(c - 1.5, c - 1.5, 2);
  });
}

function createTurretTexture(scene: Phaser.Scene): void {
  const size = 46;
  const c = size / 2;
  draw(scene, TEXTURES.turret, size, size, (graphics) => {
    // Barrel.
    graphics.fillStyle(0x39404d, 1);
    graphics.fillRect(c - 5, size * 0.5, 10, size * 0.5);
    graphics.fillStyle(0x596273, 1);
    graphics.fillRect(c - 3, size * 0.52, 6, size * 0.46);
    // Armored base.
    graphics.fillStyle(0x4b5563, 1);
    graphics.fillRect(size * 0.1, size * 0.08, size * 0.8, size * 0.5);
    graphics.fillStyle(0x6b7280, 1);
    graphics.fillRect(size * 0.16, size * 0.14, size * 0.68, size * 0.38);
    // Glowing core.
    graphics.fillStyle(0xffb347, 1);
    graphics.fillCircle(c, size * 0.32, 5);
    graphics.fillStyle(0xfff0c2, 1);
    graphics.fillCircle(c - 1, size * 0.31, 2);
  });
}

function createDiverTexture(scene: Phaser.Scene): void {
  const size = 36;
  draw(scene, TEXTURES.diver, size, size, (graphics) => {
    // Fins.
    graphics.fillStyle(0x6d28d9, 1);
    graphics.fillTriangle(2, 8, 34, 8, 18, 30);
    // Dart body.
    graphics.fillStyle(0xc084fc, 1);
    graphics.fillTriangle(18, 35, 11, 2, 25, 2);
    graphics.fillStyle(0xe9d5ff, 1);
    graphics.fillTriangle(18, 33, 15, 4, 21, 4);
    // Red dive nose.
    graphics.fillStyle(0xff5b5b, 1);
    graphics.fillTriangle(18, 35, 15, 26, 21, 26);
    graphics.fillStyle(0x2a0f3a, 1);
    graphics.fillCircle(18, 14, 2.6);
  });
}

function createBossTexture(scene: Phaser.Scene): void {
  const size = 104;
  const c = size / 2;
  draw(scene, TEXTURES.boss, size, size, (graphics) => {
    // Spikes.
    graphics.fillStyle(0x7a1f2b, 1);
    graphics.fillRect(c - 5, 0, 10, size * 0.22);
    graphics.fillRect(c - 5, size * 0.78, 10, size * 0.22);
    graphics.fillRect(0, c - 5, size * 0.22, 10);
    graphics.fillRect(size * 0.78, c - 5, size * 0.22, 10);
    graphics.fillCircle(c - 40, c - 40, 8);
    graphics.fillCircle(c + 40, c - 40, 8);
    graphics.fillCircle(c - 40, c + 40, 8);
    graphics.fillCircle(c + 40, c + 40, 8);

    // Hull.
    graphics.fillStyle(0x5c1720, 1);
    graphics.fillCircle(c, c, size * 0.44);
    graphics.fillStyle(0x8f2a36, 1);
    graphics.fillCircle(c - 3, c - 3, size * 0.36);
    graphics.fillStyle(0xb33a4a, 1);
    graphics.fillCircle(c, c, size * 0.26);

    // Glowing core.
    graphics.fillStyle(0xff9a3c, 1);
    graphics.fillCircle(c, c, size * 0.13);
    graphics.fillStyle(0xffe066, 1);
    graphics.fillCircle(c, c, size * 0.07);
  });
}

function createPlayerBulletTexture(scene: Phaser.Scene): void {
  draw(scene, TEXTURES.playerBullet, 8, 20, (graphics) => {
    graphics.fillStyle(0x3fa9ff, 0.55);
    graphics.fillRect(0, 2, 8, 18);
    graphics.fillStyle(0x9be7ff, 1);
    graphics.fillRect(1, 0, 6, 20);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(2, 0, 4, 7);
  });
}

function createEnemyBulletTexture(scene: Phaser.Scene): void {
  draw(scene, TEXTURES.enemyBullet, 10, 18, (graphics) => {
    graphics.fillStyle(0xff5b2e, 0.5);
    graphics.fillRect(0, 2, 10, 16);
    graphics.fillStyle(0xff8a4c, 1);
    graphics.fillRect(1, 0, 8, 18);
    graphics.fillStyle(0xffe0b3, 1);
    graphics.fillRect(3, 0, 4, 6);
  });
}

function createSparkTexture(scene: Phaser.Scene): void {
  draw(scene, TEXTURES.spark, 10, 10, (graphics) => {
    softBlob(graphics, 5, 5, 5, 0xffe066, 1, 8);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(5, 5, 1.6);
  });
}

function createGlowTexture(scene: Phaser.Scene): void {
  draw(scene, TEXTURES.glow, 48, 48, (graphics) => {
    softBlob(graphics, 24, 24, 24, 0xffffff, 0.85, 20);
  });
}

function createStarTexture(scene: Phaser.Scene): void {
  draw(scene, TEXTURES.star, 4, 4, (graphics) => {
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(2, 2, 2);
  });
}

function createNebulaTexture(scene: Phaser.Scene): void {
  const size = 256;
  draw(scene, TEXTURES.nebula, size, size, (graphics) => {
    softBlob(graphics, size / 2, size / 2, size / 2, 0xffffff, 0.5, 34);
    softBlob(graphics, size * 0.38, size * 0.42, size * 0.34, 0xffffff, 0.35, 24);
    softBlob(graphics, size * 0.62, size * 0.58, size * 0.3, 0xffffff, 0.3, 24);
  });
}