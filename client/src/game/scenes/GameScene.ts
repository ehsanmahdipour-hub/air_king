import {
  DEFAULT_SETTINGS,
  createWorld,
  getAircraft,
  getLevelIndex,
  getNextLevelId,
  isLevelUnlocked,
  stepWorld,
  type AircraftConfig,
  type CompleteLevelResponse,
  type GameEvent,
  type GameSettings,
  type LevelConfig,
  type UpgradeLevels,
  type World,
} from '@game/shared';
import Phaser from 'phaser';

import { CAMPAIGN } from '../config';
import { AudioManager } from '../audio/AudioManager';
import { PlayerInput } from '../input/PlayerInput';
import type { GameProgressBridge } from '../progressBridge';
import { Effects } from '../render/Effects';
import { WorldRenderer } from '../render/WorldRenderer';
import { createGameTextures } from '../textures';
import { Hud } from '../ui/Hud';

const PAUSE_ITEMS = ['Resume', 'Settings', 'Restart Level', 'Exit to Menu'];

/**
 * Gameplay scene. It owns the timing loop, drives the level system and wires
 * the pure simulation to the input, renderer, effects, audio, HUD and progress
 * bridge. It contains no gameplay rules and no API code.
 */
export class GameScene extends Phaser.Scene {
  private world!: World;
  private level!: LevelConfig;
  private completedLevelIds = new Set<string>();
  private bestScores = new Map<string, number>();
  private completionSynced = false;
  private serverReward: CompleteLevelResponse['result'] | null = null;
  private serverCurrentLevelId: string | null = null;

  private controls!: PlayerInput;
  private worldRenderer!: WorldRenderer;
  private effects!: Effects;
  private audio!: AudioManager;
  private hud!: Hud;

  private paused = false;
  private pauseIndex = 0;

  private restartKey?: Phaser.Input.Keyboard.Key;
  private nextKey?: Phaser.Input.Keyboard.Key;
  private pauseKey?: Phaser.Input.Keyboard.Key;
  private menuUpKey?: Phaser.Input.Keyboard.Key;
  private menuDownKey?: Phaser.Input.Keyboard.Key;
  private arrowUpKey?: Phaser.Input.Keyboard.Key;
  private arrowDownKey?: Phaser.Input.Keyboard.Key;
  private confirmKey?: Phaser.Input.Keyboard.Key;

  constructor(private readonly bridge?: GameProgressBridge) {
    super('Game');
  }

  create(): void {
    createGameTextures(this);

    this.completedLevelIds = this.bridge?.completedLevelIds ?? new Set();
    this.bestScores = this.bridge?.bestScores ?? new Map();

    this.controls = new PlayerInput(this);
    this.effects = new Effects(this);
    this.audio = new AudioManager();
    this.audio.applySettings(this.currentSettings());
    this.hud = new Hud(this);

    const keyCodes = Phaser.Input.Keyboard.KeyCodes;
    this.restartKey = this.input.keyboard?.addKey(keyCodes.R);
    this.nextKey = this.input.keyboard?.addKey(keyCodes.N);
    this.pauseKey = this.input.keyboard?.addKey(keyCodes.ESC);
    this.menuUpKey = this.input.keyboard?.addKey(keyCodes.W);
    this.menuDownKey = this.input.keyboard?.addKey(keyCodes.S);
    this.arrowUpKey = this.input.keyboard?.addKey(keyCodes.UP);
    this.arrowDownKey = this.input.keyboard?.addKey(keyCodes.DOWN);
    this.confirmKey = this.input.keyboard?.addKey(keyCodes.ENTER);

    const startId = this.bridge?.selectedLevelId ?? this.bridge?.currentLevelId;
    const startIndex = startId ? CAMPAIGN.findIndex((level) => level.id === startId) : 0;
    this.loadLevel(startIndex >= 0 ? startIndex : 0);

    if (this.bridge) {
      this.bridge.selectedLevelId = undefined;
      this.bridge.commands = {
        nextLevel: () => this.goToNextLevel(),
        replayLevel: () => this.restart(),
      };
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.worldRenderer?.destroy();
      this.effects.destroy();
      this.audio.dispose();
      this.hud.destroy();
    });
  }

  override update(_time: number, deltaMs: number): void {
    this.audio.applySettings(this.currentSettings());

    if (
      this.pressed(this.pauseKey) &&
      (this.world.status === 'ready' || this.world.status === 'playing')
    ) {
      this.paused = !this.paused;
      this.pauseIndex = 0;
    }

    if (this.paused) {
      this.handlePauseInput();
      this.worldRenderer.sync(this.world);
      this.hud.update(this.world);
      this.hud.showPause(PAUSE_ITEMS, this.pauseIndex);
      return;
    }

    // Freeze the simulation while a shell overlay (settings, shop, profile) is
    // open so gameplay and keyboard input cannot leak behind it.
    if (
      (this.world.status === 'ready' || this.world.status === 'playing') &&
      this.bridge?.isUiOpen?.()
    ) {
      this.worldRenderer.sync(this.world);
      this.hud.update(this.world);
      return;
    }

    switch (this.world.status) {
      case 'ready':
      case 'playing':
        stepWorld(this.world, this.controls.read(this.currentSettings()), deltaMs / 1000);
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

  private currentSettings(): GameSettings {
    return this.bridge?.settings ?? DEFAULT_SETTINGS;
  }

  private loadLevel(index: number): void {
    this.level = CAMPAIGN[index];
    this.world = createWorld(this.level, this.loadoutOptions());
    this.completionSynced = false;
    this.serverReward = null;
    this.serverCurrentLevelId = null;
    this.paused = false;

    this.worldRenderer?.destroy();
    this.worldRenderer = new WorldRenderer(this, this.level);
    this.cameras.main.fadeIn(200, 5, 7, 15);
    this.hud.hideOverlay();
  }

  private restart(): void {
    this.world = createWorld(this.level, this.loadoutOptions());
    this.completionSynced = false;
    this.serverReward = null;
    this.serverCurrentLevelId = null;
    this.paused = false;
    this.worldRenderer.reset();
    this.hud.hideOverlay();
  }

  /** Aircraft, upgrades and difficulty are read from the bridge per world. */
  private loadoutOptions(): {
    aircraft?: AircraftConfig;
    upgrades?: Partial<UpgradeLevels>;
    difficulty?: GameSettings['difficulty'];
  } {
    const aircraftId = this.bridge?.aircraftId;
    return {
      aircraft: aircraftId ? getAircraft(aircraftId) : undefined,
      upgrades: this.bridge?.upgradeLevels,
      difficulty: this.currentSettings().difficulty,
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

  private handlePauseInput(): void {
    if (this.pressed(this.menuUpKey) || this.pressed(this.arrowUpKey)) {
      this.pauseIndex = (this.pauseIndex + PAUSE_ITEMS.length - 1) % PAUSE_ITEMS.length;
    }
    if (this.pressed(this.menuDownKey) || this.pressed(this.arrowDownKey)) {
      this.pauseIndex = (this.pauseIndex + 1) % PAUSE_ITEMS.length;
    }
    if (this.pressed(this.confirmKey)) {
      this.selectPauseItem();
    }
  }

  private selectPauseItem(): void {
    switch (PAUSE_ITEMS[this.pauseIndex]) {
      case 'Resume':
        this.paused = false;
        break;
      case 'Settings':
        this.bridge?.onOpenSettings?.();
        break;
      case 'Restart Level':
        this.restart();
        break;
      case 'Exit to Menu':
        this.paused = false;
        this.bridge?.onExitToMenu?.();
        break;
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
        if (this.bridge?.onShowLevelComplete) {
          // The React shell renders the summary with real buttons.
          this.hud.hideOverlay();
        } else {
          this.renderSummary();
        }
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
    const bestScore = Math.max(this.bestScores.get(result.levelId) ?? 0, reward.totalScore);
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
      if (response) {
        this.serverReward = response.result;
        this.serverCurrentLevelId = response.profile.currentLevelId;
        this.bestScores.set(
          result.levelId,
          Math.max(this.bestScores.get(result.levelId) ?? 0, response.result.totalScore),
        );
      }
    } catch {
      // Keep the locally computed summary if the server could not be reached.
    }

    if (this.world.status === 'levelComplete') {
      this.emitSummary();
    }
  }

  /** Hands the level-complete summary to the shell (server-validated unlock). */
  private emitSummary(): void {
    const result = this.world.result;
    const emit = this.bridge?.onShowLevelComplete;
    if (!result || !emit) {
      return;
    }

    const reward = this.serverReward ?? {
      score: result.score,
      completionBonus: result.completionBonus,
      totalScore: result.totalScore,
      coins: result.coins,
    };
    const bestScore = Math.max(this.bestScores.get(result.levelId) ?? 0, reward.totalScore);

    const nextId = getNextLevelId(result.levelId);
    const nextConfig = nextId ? CAMPAIGN.find((candidate) => candidate.id === nextId) : undefined;
    const unlockedByServer =
      nextId && this.serverCurrentLevelId
        ? getLevelIndex(nextId) <= getLevelIndex(this.serverCurrentLevelId)
        : false;
    const unlocked = nextId
      ? unlockedByServer || isLevelUnlocked(nextId, [...this.completedLevelIds])
      : false;
    const nextLevel =
      nextId && nextConfig && unlocked
        ? { id: nextConfig.id, name: nextConfig.name, levelNumber: nextConfig.levelNumber }
        : null;

    emit({
      levelNumber: result.levelNumber,
      levelName: result.levelName,
      score: reward.score,
      completionBonus: reward.completionBonus,
      totalScore: reward.totalScore,
      coins: reward.coins,
      bestScore,
      nextLevel,
      isFinal: nextId === null,
    });
  }

  /** Maps simulation events to effects, audio and camera feedback. */
  private handleEvents(events: GameEvent[]): void {
    for (const event of events) {
      switch (event.type) {
        case 'shotFired':
        case 'enemyShot':
          this.effects.muzzleAt(event.position);
          this.audio.playSfx('shoot');
          break;
        case 'enemyHit':
          this.effects.impactAt(event.position);
          break;
        case 'enemyDestroyed':
          this.effects.explosionAt(event.position);
          this.audio.playSfx('explosion');
          this.cameras.main.shake(80, 0.002);
          break;
        case 'bossSpawned':
          this.audio.playSfx('boss');
          this.cameras.main.shake(200, 0.004);
          break;
        case 'bossPhase':
          this.effects.explosionAt(event.position, 10);
          this.audio.playSfx('boss');
          this.cameras.main.shake(160, 0.006);
          break;
        case 'bossShot':
          this.effects.muzzleAt(event.position);
          this.audio.playSfx('shoot');
          break;
        case 'bossHit':
          this.effects.impactAt(event.position);
          break;
        case 'bossDefeated':
          this.effects.explosionAt(event.position, 44);
          this.audio.playSfx('explosion');
          this.cameras.main.flash(200, 255, 220, 160);
          this.cameras.main.shake(320, 0.012);
          break;
        case 'playerHit':
          this.effects.hitAt(event.position);
          this.audio.playSfx('hit');
          this.cameras.main.flash(100, 120, 0, 0);
          this.cameras.main.shake(160, 0.006);
          this.worldRenderer.flashPlayer();
          break;
        case 'playerDestroyed':
          this.effects.explosionAt(event.position, 30);
          this.audio.playSfx('gameOver');
          this.cameras.main.shake(300, 0.01);
          break;
        case 'levelStart':
          this.audio.playSfx('jingle');
          break;
        case 'levelComplete':
          this.audio.playSfx('levelComplete');
          break;
      }
    }
  }

  private pressed(key: Phaser.Input.Keyboard.Key | undefined): boolean {
    return key !== undefined && Phaser.Input.Keyboard.JustDown(key);
  }
}