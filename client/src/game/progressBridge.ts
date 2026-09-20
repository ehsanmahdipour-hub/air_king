import type { CompleteLevelResponse, GameSettings, UpgradeLevels } from '@game/shared';

/**
 * Progress bridge injected by the React shell into the game. It keeps the game
 * simulation and Phaser layers free of API code: the game reports a completion
 * and reads/populates the best-score map; the shell owns the network calls.
 */
export interface GameProgressBridge {
  /** Best score per level, seeded from the server and updated on completion. */
  bestScores: Map<string, number>;
  /** Level ids already completed, seeded from the server. */
  completedLevelIds: Set<string>;
  /** Furthest unlocked level id; the game starts here when present. */
  currentLevelId?: string;
  /** Player upgrade levels applied to the loadout. */
  upgradeLevels?: UpgradeLevels;
  /** Equipped aircraft id applied to the loadout. */
  aircraftId?: string;
  /** Current player settings (controls and audio). */
  settings?: GameSettings;
  /** Pause menu: exit the game back to the menu. */
  onExitToMenu?: () => void;
  /** Pause menu: open the settings panel. */
  onOpenSettings?: () => void;
  /**
   * Submits a level completion to the server. Returns the server response, or
   * `null` when it could not be saved (e.g. offline).
   */
  onLevelComplete: (
    levelId: string,
    score: number,
  ) => Promise<CompleteLevelResponse | null>;
}