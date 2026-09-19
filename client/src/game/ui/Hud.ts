import type { LevelResult, World } from '@game/shared';
import Phaser from 'phaser';

import { DEPTH } from '../config';

const BAR_WIDTH = 180;
const BAR_HEIGHT = 14;
const PROGRESS_WIDTH = 220;

/**
 * Heads-up display. Reads the world each frame and never mutates it. Overlays
 * are reused for the ready/complete/game-over states.
 */
export class Hud {
  private readonly healthBar: Phaser.GameObjects.Rectangle;
  private readonly healthFill: Phaser.GameObjects.Rectangle;
  private readonly healthText: Phaser.GameObjects.Text;
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly progressBar: Phaser.GameObjects.Rectangle;
  private readonly progressFill: Phaser.GameObjects.Rectangle;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly overlayTitle: Phaser.GameObjects.Text;
  private readonly overlayDetail: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const { width, height } = scene.scale;
    const baseStyle = { fontFamily: 'monospace', fontSize: '16px', color: '#dbe7ff' };

    this.healthBar = scene.add
      .rectangle(20, 20, BAR_WIDTH, BAR_HEIGHT, 0x1b2740)
      .setOrigin(0, 0)
      .setDepth(DEPTH.hud);
    this.healthFill = scene.add
      .rectangle(20, 20, BAR_WIDTH, BAR_HEIGHT, 0x6ee7a8)
      .setOrigin(0, 0)
      .setDepth(DEPTH.hud + 1);
    this.healthText = scene.add
      .text(20 + BAR_WIDTH + 10, 18, '100', baseStyle)
      .setDepth(DEPTH.hud + 1);
    this.levelText = scene.add
      .text(20, 42, '', { ...baseStyle, fontSize: '13px', color: '#7fd1ff' })
      .setDepth(DEPTH.hud + 1);
    this.progressBar = scene.add
      .rectangle(20, 64, PROGRESS_WIDTH, BAR_HEIGHT, 0x1b2740)
      .setOrigin(0, 0)
      .setDepth(DEPTH.hud);
    this.progressFill = scene.add
      .rectangle(20, 64, PROGRESS_WIDTH, BAR_HEIGHT, 0x7fd1ff)
      .setOrigin(0, 0)
      .setDepth(DEPTH.hud + 1);
    this.scoreText = scene.add
      .text(width - 20, 18, 'Score: 0', baseStyle)
      .setOrigin(1, 0)
      .setDepth(DEPTH.hud + 1);

    this.overlay = scene.add
      .rectangle(width / 2, height / 2, width, height, 0x05070f, 0.72)
      .setDepth(DEPTH.hud + 10)
      .setVisible(false);
    this.overlayTitle = scene.add
      .text(width / 2, height / 2 - 40, '', {
        fontFamily: 'monospace',
        fontSize: '34px',
        color: '#7fd1ff',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.hud + 11)
      .setVisible(false);
    this.overlayDetail = scene.add
      .text(width / 2, height / 2 - 4, '', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#dbe7ff',
        align: 'left',
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.hud + 11)
      .setVisible(false);
  }

  update(world: World): void {
    const ratio =
      world.player.maxHealth > 0 ? world.player.health / world.player.maxHealth : 0;

    this.healthFill.setDisplaySize(Math.max(0.001, BAR_WIDTH * ratio), BAR_HEIGHT);
    this.healthFill.setFillStyle(ratio > 0.5 ? 0x6ee7a8 : ratio > 0.25 ? 0xe7c96e : 0xff8b8b);
    this.healthText.setText(`${Math.ceil(world.player.health)}`);
    this.levelText.setText(
      `Level ${world.level.levelNumber} — ${world.level.name} · ${world.level.difficulty}`,
    );
    this.scoreText.setText(`Score: ${world.score}`);

    const progress = computeProgress(world);
    this.progressFill.setDisplaySize(Math.max(0.001, PROGRESS_WIDTH * progress), BAR_HEIGHT);
  }

  showOverlay(title: string, detail: string, color = '#7fd1ff'): void {
    this.overlayTitle.setText(title).setColor(color);
    this.overlayDetail.setText(detail);
    this.setOverlayVisible(true);
  }

  /** Level-complete summary built from the centralized level result. */
  showLevelComplete(result: LevelResult, bestScore: number, hint: string): void {
    const rows = [
      `Level             ${result.levelNumber} — ${result.levelName}`,
      '',
      `Score             ${result.score}`,
      `Completion bonus  ${result.completionBonus}`,
      `Total score       ${result.totalScore}`,
      `Coins earned      ${result.coins}`,
      `Best score        ${bestScore}`,
      '',
      hint,
    ];
    this.showOverlay('LEVEL COMPLETE', rows.join('\n'), '#6ee7a8');
  }

  hideOverlay(): void {
    this.setOverlayVisible(false);
  }

  destroy(): void {
    this.healthBar.destroy();
    this.healthFill.destroy();
    this.healthText.destroy();
    this.levelText.destroy();
    this.scoreText.destroy();
    this.progressBar.destroy();
    this.progressFill.destroy();
    this.overlay.destroy();
    this.overlayTitle.destroy();
    this.overlayDetail.destroy();
  }

  private setOverlayVisible(visible: boolean): void {
    this.overlay.setVisible(visible);
    this.overlayTitle.setVisible(visible);
    this.overlayDetail.setVisible(visible);
  }
}

function computeProgress(world: World): number {
  const { level, director } = world;

  if (level.completionMode === 'reach-distance') {
    const goal = level.lengthUnits ?? 1;
    return Phaser.Math.Clamp(world.distance / goal, 0, 1);
  }

  const total = director.totalEnemies;
  if (total <= 0) {
    return 0;
  }

  const remaining = Math.max(0, total - director.enemiesSpawned) + world.enemies.length;
  return Phaser.Math.Clamp(1 - remaining / total, 0, 1);
}