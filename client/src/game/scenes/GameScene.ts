import {
  createWorld,
  getAircraft,
  getNextLevelId,
  isLevelUnlocked,
  stepWorld,
  type AircraftConfig,
  type CompleteLevelResponse,
  type GameEvent,
  type LevelConfig,
  type UpgradeLevels,
  type World,
} from '@game/shared';
import Phaser from 'phaser';

import { CAMPAIGN } from '../config';
import { PlayerInput } from '../input/PlayerInput';
import type { GameProgressBridge } from '../progressBridge';
import { Effects } from '../render/Effects';
import { WorldRenderer } from '../render/WorldRenderer';
import { createGameTextures } from '../textures';
import { Hud } from '../ui/Hud';

/**
 * Gameplay scene. It owns the timing loop, drives the level system and wires
 * the pure simulation to the input, renderer, effects, HUD and progress bridge.
 * It contains no gameplay rules and no API code.
 */
export class GameScene extends Phaser.Scene {
  private world!: World;
  private level!: LevelConfig;
  private completedLevelIds = new Set<string>();
  private bestScores = new Map<string, number>();
  private completionSynced = false;
  private serverReward: CompleteLevelResponse['result'] | null = null;

  private controls!: PlayerInput;
  private worldRenderer!: WorldRenderer;
  private effects!: Effects;
  private hud!: Hud;
  private restartKey?: Phaser.Input.Keyboard.Key;
  private nextKey?: Phaser.Input.Keyboard.Key;

  constructor(private readonly bridge?: GameProgressBridge) {
    super('Game');
  }

  create(): void {
    createGameTextures(this);

    this.completedLevelIds = this.bridge?.completedLevelIds ?? new Set();
    this.bestScores = this.bridge?.bestScores ?? new Map();

    this.controls = new PlayerInput(this);
    this.effects = new Effects(this);
    this.hud = new Hud(this);
    this.restartKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.nextKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.N);

    const startId = this.bridge?.currentLevelId;
    const startIndex = startId ? CAMPAIGN.findIndex((level) => level.id === startId) : 0;
    this.loadLevel(startIndex >= 0 ? startIndex : 0);

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
    this.world = createWorld(this.level, this.loadoutOptions());
    this.completionSynced = false;
    this.serverReward = null;

    this.worldRenderer?.destroy();
    this.worldRenderer = new WorldRenderer(this, this.level);
    this.hud.hideOverlay();
  }

  private restart(): void {
    this.world = createWorld(this.level, this.loadoutOptions());
    this.completionSynced = false;
    this.serverReward = null;
    this.worldRenderer.reset();
    this.hud.hideOverlay();
  }

  /** Aircraft and upgrades are read from the bridge when a world is created. */
  private loadoutOptions(): { aircraft?: AircraftConfig; upgrades?: Partial<UpgradeLevels> } {
    const aircraftId = this.bridge?.aircraftId;
    return {
      aircraft: aircraftId ? getAircraft(aircraftId) : undefined,
      upgrades: this.bridge?.upgradeLevels,
    };
  }

  private goToNextLevel(): void {
    const nextId = getNextLevelId(this.level.id);
    if (!nextId || !isLevelUnlocked(nextId, [...this.completedLevelIds])) {
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
        if (!world.result) {
          break;
        }
        this.completedLevelIds.add(level.id);
        if (!this.completionSynced) {
          this.completionSynced = true;
          void this.syncCompletion();
        }
        this.renderSummary();
        break;
      }
      case 'gameover':
        this.hud.showOverlay('GAME OVER', `Score: ${world.score}\n\nPress R to restart`, '#ff8b8b');
        break;
    }
  }

  /** Renders the level-complete summary, preferring the server reward. */
  private renderSummary(): void {
    const result = this.world.result;
    if (!result) {
      return;
    }

    const reward = this.serverReward ?? {
      score: result.score,
      completionBonus: result.completionBonus,
      totalScore: result.totalScore,
      coins: result.coins,
    };
    const bestScore = Math.max(
      this.bestScores.get(result.levelId) ?? 0,
      reward.totalScore,
    );
    const merged = { ...result, ...reward };

    const nextId = getNextLevelId(result.levelId);
    const next = nextId ? CAMPAIGN.find((candidate) => candidate.id === nextId) : undefined;
    const hint = next ? `R replay · N next (${next.name})` : 'R replay · final level cleared';
    this.hud.showLevelComplete(merged, bestScore, hint);
  }

  /**
   * Sends the completion to the server and adopts its authoritative reward.
   * Failures leave the locally computed summary in place.
   */
  private async syncCompletion(): Promise<void> {
    const bridge = this.bridge;
    const result = this.world.result;
    if (!bridge || !result) {
      return;
    }

    try {
      const response = await bridge.onLevelComplete(result.levelId, result.score);
      if (!response) {
        return;
      }
      this.serverReward = response.result;
      this.bestScores.set(
        result.levelId,
        Math.max(this.bestScores.get(result.levelId) ?? 0, response.result.totalScore),
      );
      if (this.world.status === 'levelComplete') {
        this.renderSummary();
      }
    } catch {
      // Keep the locally computed summary if the server could not be reached.
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