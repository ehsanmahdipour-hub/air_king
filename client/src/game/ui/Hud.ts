import type { World } from '@game/shared';
import Phaser from 'phaser';

import { DEPTH } from '../config';

const BAR_WIDTH = 180;
const BAR_HEIGHT = 14;

/**
 * Heads-up display. Reads the world each frame and never mutates it.
 */
export class Hud {
  private readonly healthBar: Phaser.GameObjects.Rectangle;
  private readonly healthFill: Phaser.GameObjects.Rectangle;
  private readonly healthText: Phaser.GameObjects.Text;
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly scoreText: Phaser.GameObjects.Text;
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
    this.scoreText = scene.add
      .text(width - 20, 18, 'Score: 0', baseStyle)
      .setOrigin(1, 0)
      .setDepth(DEPTH.hud + 1);

    this.overlay = scene.add
      .rectangle(width / 2, height / 2, width, height, 0x05070f, 0.72)
      .setDepth(DEPTH.hud + 10)
      .setVisible(false);
    this.overlayTitle = scene.add
      .text(width / 2, height / 2 - 40, 'GAME OVER', {
        fontFamily: 'monospace',
        fontSize: '34px',
        color: '#ff8b8b',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.hud + 11)
      .setVisible(false);
    this.overlayDetail = scene.add
      .text(width / 2, height / 2 + 20, '', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#dbe7ff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.hud + 11)
      .setVisible(false);
  }

  update(world: World): void {
    const ratio =
      world.player.maxHealth > 0 ? world.player.health / world.player.maxHealth : 0;

    this.healthFill.setDisplaySize(Math.max(0.001, BAR_WIDTH * ratio), BAR_HEIGHT);
    this.healthFill.setFillStyle(ratio > 0.5 ? 0x6ee7a8 : ratio > 0.25 ? 0xe7c96e : 0xff8b8b);
    this.healthText.setText(`${Math.ceil(world.player.health)}`);
    this.levelText.setText(`Level: ${world.level.name}`);
    this.scoreText.setText(`Score: ${world.score}`);
  }

  showGameOver(score: number): void {
    this.overlayDetail.setText(`Score: ${score}\n\nPress R to restart`);
    this.setOverlayVisible(true);
  }

  hideGameOver(): void {
    this.setOverlayVisible(false);
  }

  destroy(): void {
    this.healthBar.destroy();
    this.healthFill.destroy();
    this.healthText.destroy();
    this.levelText.destroy();
    this.scoreText.destroy();
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
