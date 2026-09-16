import { createWorld, stepWorld, type World } from '@game/shared';
import Phaser from 'phaser';

import { LEVEL } from '../config';
import { PlayerInput } from '../input/PlayerInput';
import { WorldRenderer } from '../render/WorldRenderer';
import { createGameTextures } from '../textures';
import { Hud } from '../ui/Hud';

/**
 * Gameplay scene. It owns the timing loop and wires the pure simulation to the
 * input, renderer and HUD adapters. It contains no gameplay rules itself.
 */
export class GameScene extends Phaser.Scene {
  private world!: World;
  private controls!: PlayerInput;
  private worldRenderer!: WorldRenderer;
  private hud!: Hud;
  private restartKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super('Game');
  }

  create(): void {
    createGameTextures(this);

    this.world = createWorld(LEVEL);
    this.worldRenderer = new WorldRenderer(this, LEVEL);
    this.controls = new PlayerInput(this);
    this.hud = new Hud(this);
    this.worldRenderer.sync(this.world);

    this.restartKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.dispose();
      this.worldRenderer.destroy();
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
    this.worldRenderer.playEvents(this.world.events);
    this.world.events.length = 0;
    this.hud.update(this.world);

    if (this.world.status === 'gameover') {
      this.hud.showGameOver(this.world.score);
    }
  }

  private restart(): void {
    this.world = createWorld(LEVEL);
    this.worldRenderer.reset();
    this.hud.hideGameOver();
  }
}
