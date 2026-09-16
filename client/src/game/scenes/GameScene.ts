import {
  createWorld,
  getNextLevelId,
  isLevelUnlocked,
  stepWorld,
  type GameEvent,
  type LevelConfig,
  type World,
} from '@game/shared';
import Phaser from 'phaser';

import { CAMPAIGN } from '../config';
import { PlayerInput } from '../input/PlayerInput';
import { Effects } from '../render/Effects';
import { WorldRenderer } from '../render/WorldRenderer';
import { createGameTextures } from '../textures';
import { Hud } from '../ui/Hud';

/**
 * Gameplay scene. It owns the timing loop, drives the level system and wires
 * the pure simulation to the input, renderer, effects and HUD adapters. It
 * contains no gameplay rules.
 */
export class GameScene extends Phaser.Scene {
  private world!: World;
  private level!: LevelConfig;
  /** In-memory completion set; persistence arrives in a later phase. */
  private readonly completedLevelIds: string[] = [];

  private controls!: PlayerInput;
  private worldRenderer!: WorldRenderer;
  private effects!: Effects;
  private hud!: Hud;
  private restartKey?: Phaser.Input.Keyboard.Key;
  private nextKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super('Game');
  }

  create(): void {
    createGameTextures(this);

    this.controls = new PlayerInput(this);
    this.effects = new Effects(this);
    this.hud = new Hud(this);
    this.restartKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.nextKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.N);

    this.loadLevel(0);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.dispose();
      this.worldRenderer?.destroy();
      this.effects.destroy();
      this.hud.destroy();
    });
  }

  override update(_time: number, deltaMs: number): void {
    switch (this.world.status) {
      case 'ready':
      case 'playing':
        stepWorld(this.world, this.controls.read(), deltaMs / 1000);
        break;
      case 'levelComplete':
        if (this.pressed(this.restartKey)) {
          this.restart();
        } else if (this.pressed(this.nextKey)) {
          this.goToNextLevel();
        }
        break;
      case 'gameover':
        if (this.pressed(this.restartKey)) {
          this.restart();
        }
        break;
    }

    this.worldRenderer.sync(this.world);
    this.handleEvents(this.world.events);
    this.world.events.length = 0;
    this.hud.update(this.world);
    this.updateOverlay();
  }

  private loadLevel(index: number): void {
    this.level = CAMPAIGN[index];
    this.world = createWorld(this.level);

    this.worldRenderer?.destroy();
    this.worldRenderer = new WorldRenderer(this, this.level);
    this.hud.hideOverlay();
  }

  private restart(): void {
    this.world = createWorld(this.level);
    this.worldRenderer.reset();
    this.hud.hideOverlay();
  }

  private goToNextLevel(): void {
    const nextId = getNextLevelId(this.level.id);
    if (!nextId || !isLevelUnlocked(nextId, this.completedLevelIds)) {
      return;
    }

    const nextIndex = CAMPAIGN.findIndex((level) => level.id === nextId);
    if (nextIndex >= 0) {
      this.loadLevel(nextIndex);
    }
  }

  private updateOverlay(): void {
    const { level, world } = this;

    switch (world.status) {
      case 'ready':
        this.hud.showOverlay(`LEVEL ${level.levelNumber}`, `${level.name}\nGet ready…`);
        break;
      case 'playing':
        this.hud.hideOverlay();
        break;
      case 'levelComplete': {
        if (!this.completedLevelIds.includes(level.id)) {
          this.completedLevelIds.push(level.id);
        }
        const nextId = getNextLevelId(level.id);
        const next = nextId ? CAMPAIGN.find((candidate) => candidate.id === nextId) : undefined;
        this.hud.showOverlay(
          'LEVEL COMPLETE',
          `Score: ${world.score}\n\nR replay · ${next ? `N next (${next.name})` : 'final level cleared'}`,
          '#6ee7a8',
        );
        break;
      }
      case 'gameover':
        this.hud.showOverlay('GAME OVER', `Score: ${world.score}\n\nPress R to restart`, '#ff8b8b');
        break;
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
        case 'levelStart':
        case 'levelComplete':
          break;
      }
    }
  }

  private pressed(key: Phaser.Input.Keyboard.Key | undefined): boolean {
    return key !== undefined && Phaser.Input.Keyboard.JustDown(key);
  }
}
