import type { CompleteLevelResponse, GameSettings, UpgradeLevels } from '@game/shared';

/** Summary the game hands to the shell for the level-complete screen. */
export interface LevelCompleteSummary {
  levelNumber: number;
  levelName: string;
  score: number;
  completionBonus: number;
  totalScore: number;
  coins: number;
  bestScore: number;
  /** Next unlocked level, or null when none is available. */
  nextLevel: { id: string; name: string; levelNumber: number } | null;
  /** True when the completed level is the final campaign level. */
  isFinal: boolean;
}

/** Commands the shell can issue to the running game. */
export interface GameCommands {
  nextLevel: () => void;
  replayLevel: () => void;
}

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
  /** True while a shell overlay is open, so the game pauses behind it. */
  isUiOpen?: () => boolean;
  /** Called once per completion with the data for the level-complete screen. */
  onShowLevelComplete?: (summary: LevelCompleteSummary) => void;
  /** Command handlers registered by the game for shell-driven navigation. */
  commands?: GameCommands;
  /**
   * Submits a level completion to the server. Returns the server response, or
   * `null` when it could not be saved (e.g. offline).
   */
  onLevelComplete: (
    levelId: string,
    score: number,
  ) => Promise<CompleteLevelResponse | null>;
}