import { createWorld, stepWorld, type GameEvent, type World } from '@game/shared';
import Phaser from 'phaser';

import { LEVEL } from '../config';
import { PlayerInput } from '../input/PlayerInput';
import { Effects } from '../render/Effects';
import { WorldRenderer } from '../render/WorldRenderer';
import { createGameTextures } from '../textures';
import { Hud } from '../ui/Hud';

/**
 * Gameplay scene. It owns the timing loop and wires the pure simulation to the
 * input, renderer, effects and HUD adapters. It contains no gameplay rules.
 */
export class GameScene extends Phaser.Scene {
  private world!: World;
  private controls!: PlayerInput;
  private worldRenderer!: WorldRenderer;
  private effects!: Effects;
  private hud!: Hud;
  private restartKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super('Game');
  }

  create(): void {
    createGameTextures(this);

    this.world = createWorld(LEVEL);
    this.worldRenderer = new WorldRenderer(this, LEVEL);
    this.effects = new Effects(this);
    this.controls = new PlayerInput(this);
    this.hud = new Hud(this);
    this.worldRenderer.sync(this.world);

    this.restartKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.dispose();
      this.worldRenderer.destroy();
      this.effects.destroy();
      this.hud.destroy();
    });
  }

  override update(_time: number, deltaMs: number): void {
    if (this.world.status === 'running') {
      stepWorld(this.world, this.controls.read(), deltaMs / 1000);
    } else if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.restart();
    }

    this.worldRenderer.sync(this.world);
    this.handleEvents(this.world.events);
    this.world.events.length = 0;
    this.hud.update(this.world);

    if (this.world.status === 'gameover') {
      this.hud.showGameOver(this.world.score);
    }
  }

  /** Maps simulation events to effects and camera feedback. */
  private handleEvents(events: GameEvent[]): void {
    for (const event of events) {
      switch (event.type) {
        case 'shotFired':
        case 'enemyShot':
          this.effects.muzzleAt(event.position);
          break;
        case 'enemyHit':
          this.effects.impactAt(event.position);
          break;
        case 'enemyDestroyed':
          this.effects.explosionAt(event.position);
          this.cameras.main.shake(80, 0.002);
          break;
        case 'playerHit':
          this.effects.hitAt(event.position);
          this.cameras.main.shake(160, 0.006);
          this.worldRenderer.flashPlayer();
          break;
        case 'playerDestroyed':
          this.effects.explosionAt(event.position, 30);
          this.cameras.main.shake(300, 0.01);
          break;
      }
    }
  }

  private restart(): void {
    this.world = createWorld(LEVEL);
    this.worldRenderer.reset();
    this.hud.hideGameOver();
  }
}
