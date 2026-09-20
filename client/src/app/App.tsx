import {
  DEFAULT_SETTINGS,
  DEFAULT_UPGRADE_LEVELS,
  getLevel,
  type AircraftStateData,
  type GameSettings,
  type PlayerProfileData,
  type UpgradeId,
  type UpgradeLevels,
} from '@game/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AuthForm } from './auth/AuthForm';
import { useAuth } from './auth/AuthContext';
import { me } from './auth/authApi';
import { equipAircraft, getAircraft, purchaseAircraft } from './aircraft/aircraftApi';
import { AircraftPanel } from './aircraft/AircraftPanel';
import { AirKingsLogo } from './branding/AirKingsLogo';
import { GameStage } from './GameStage';
import { LevelsPanel } from './levels/LevelsPanel';
import { completeLevel, getProgress } from './progress/progressApi';
import { ProfilePanel } from './profile/ProfilePanel';
import { getSettings, updateSettings } from './settings/settingsApi';
import { SettingsPanel } from './settings/SettingsPanel';
import { playUiClick, setUiAudioSettings } from './settings/uiSound';
import { getUpgrades, purchaseUpgrade } from './upgrades/upgradesApi';
import { UpgradesPanel } from './upgrades/UpgradesPanel';
import type { GameProgressBridge, LevelCompleteSummary } from '../game/progressBridge';

type LoadState = 'loading' | 'ready' | 'error';
type Screen = 'menu' | 'playing';
type Panel = 'none' | 'levels' | 'aircraft' | 'upgrades' | 'settings' | 'profile';

export function App() {
  return (
    <div className="app">
      <AuthGate />
      <footer className="app__footer">
        AIR KINGS · move with WASD/arrows or the mouse · fire with Space/click · ESC to pause
      </footer>
    </div>
  );
}

function AuthGate() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <p className="app__message">Checking session…</p>;
  }

  return status === 'authenticated' ? <AccountView /> : <AuthForm />;
}

/**
 * Authenticated shell. Owns progression, upgrades, aircraft and settings
 * networking, renders the game header/nav/panels, and injects a bridge into the
 * game so completions persist and the equipped loadout drives play.
 */
function AccountView() {
  const { user, logout } = useAuth();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [screen, setScreen] = useState<Screen>('menu');
  const [panel, setPanel] = useState<Panel>('none');

  const [profile, setProfile] = useState<PlayerProfileData | null>(null);
  const [upgradeLevels, setUpgradeLevels] = useState<UpgradeLevels | null>(null);
  const [aircraft, setAircraft] = useState<AircraftStateData[] | null>(null);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [summary, setSummary] = useState<LevelCompleteSummary | null>(null);

  const panelRef = useRef<Panel>('none');
  panelRef.current = panel;

  const bridge = useMemo<GameProgressBridge>(
    () => ({
      bestScores: new Map<string, number>(),
      completedLevelIds: new Set<string>(),
      settings: DEFAULT_SETTINGS,
      isUiOpen: () => panelRef.current !== 'none',
      onShowLevelComplete: (next) => setSummary(next),
      onExitToMenu: () => {
        setSummary(null);
        setScreen('menu');
        setPanel('none');
      },
      onOpenSettings: () => setPanel('settings'),
      onLevelComplete: async (levelId, score) => {
        const response = await completeLevel(levelId, score);
        setProfile(response.profile);
        bridge.currentLevelId = response.profile.currentLevelId;
        return response;
      },
    }),
    [],
  );

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const [progress, upgrades, roster, settingsResponse] = await Promise.all([
        getProgress(),
        getUpgrades(),
        getAircraft(),
        getSettings(),
      ]);

      setProfile(progress.profile);
      bridge.currentLevelId = progress.profile.currentLevelId;
      bridge.aircraftId = progress.profile.equippedAircraftId;
      for (const level of progress.levels) {
        if (level.completed) {
          bridge.completedLevelIds.add(level.levelId);
        }
        if (level.bestScore > 0) {
          bridge.bestScores.set(level.levelId, level.bestScore);
        }
      }

      setUpgradeLevels(upgrades.upgrades);
      bridge.upgradeLevels = upgrades.upgrades;
      setAircraft(roster.aircraft);
      setSettings(settingsResponse.settings);
      bridge.settings = settingsResponse.settings;
      setUiAudioSettings(settingsResponse.settings);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [bridge]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handler = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('button')) {
        playUiClick();
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  async function refreshRoster(): Promise<void> {
    const roster = await getAircraft();
    setAircraft(roster.aircraft);
    setProfile(roster.profile);
    bridge.aircraftId = roster.profile.equippedAircraftId;
  }

  async function handlePurchaseUpgrade(upgradeId: UpgradeId): Promise<void> {
    const response = await purchaseUpgrade(upgradeId);
    setProfile(response.profile);
    setUpgradeLevels((current) => {
      const next = { ...(current ?? DEFAULT_UPGRADE_LEVELS), [upgradeId]: response.upgrade.level };
      bridge.upgradeLevels = next;
      return next;
    });
  }

  async function handlePurchaseAircraft(aircraftId: string): Promise<void> {
    await purchaseAircraft(aircraftId);
    await refreshRoster();
  }

  async function handleEquipAircraft(aircraftId: string): Promise<void> {
    await equipAircraft(aircraftId);
    await refreshRoster();
  }

  async function handleSettingsChange(next: GameSettings): Promise<void> {
    const response = await updateSettings(next);
    setSettings(response.settings);
    bridge.settings = response.settings;
    setUiAudioSettings(response.settings);
  }

  async function verifySession(): Promise<void> {
    try {
      await me();
    } catch {
      // The auth layer handles an expired session by returning to the login screen.
    }
  }

  function continueRun(): void {
    bridge.selectedLevelId = undefined;
    setSummary(null);
    setPanel('none');
    setScreen('playing');
  }

  function startLevel(levelId: string): void {
    bridge.selectedLevelId = levelId;
    setSummary(null);
    setPanel('none');
    setScreen('playing');
  }

  function openPanel(next: Panel): void {
    setPanel(next);
  }

  function renderPanel() {
    if (panel === 'levels' && profile) {
      return (
        <LevelsPanel
          completedLevelIds={bridge.completedLevelIds}
          bestScores={bridge.bestScores}
          currentLevelId={profile.currentLevelId}
          onPlay={startLevel}
          onClose={() => setPanel('none')}
        />
      );
    }
    if (panel === 'aircraft' && profile && aircraft) {
      return (
        <AircraftPanel
          profile={profile}
          states={aircraft}
          onPurchase={handlePurchaseAircraft}
          onEquip={handleEquipAircraft}
          onClose={() => setPanel('none')}
        />
      );
    }
    if (panel === 'upgrades' && profile && upgradeLevels) {
      return (
        <UpgradesPanel
          profile={profile}
          levels={upgradeLevels}
          onPurchase={handlePurchaseUpgrade}
          onClose={() => setPanel('none')}
        />
      );
    }
    if (panel === 'settings' && settings) {
      return (
        <SettingsPanel
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setPanel('none')}
        />
      );
    }
    if (panel === 'profile' && profile) {
      return (
        <ProfilePanel
          user={user}
          profile={profile}
          completedLevels={bridge.completedLevelIds.size}
          onLogout={() => void logout()}
          onClose={() => setPanel('none')}
        />
      );
    }
    return null;
  }

  const levelNumber = profile ? safeLevelNumber(profile.currentLevelId) : 1;

  return (
    <div className="account">
      <header className="game-header">
        <div className="game-header__brand">
          <AirKingsLogo size={36} />
          <div className="game-header__titles">
            <span className="game-header__title">AIR KINGS</span>
            <span className="game-header__sub">Arcade Air Combat</span>
          </div>
        </div>

        {profile && (
          <div className="game-header__stats">
            <span className="hud-chip">
              <span className="hud-chip__label">Coins</span>
              <span className="hud-chip__value">{profile.coins.toLocaleString()}</span>
            </span>
            <span className="hud-chip">
              <span className="hud-chip__label">Level</span>
              <span className="hud-chip__value">{levelNumber}</span>
            </span>
            <span className="hud-chip hud-chip--wide">
              <span className="hud-chip__label">Aircraft</span>
              <span className="hud-chip__value">{profile.equippedAircraftId}</span>
            </span>
          </div>
        )}

        <nav className="game-nav">
          {screen === 'playing' && (
            <button
              type="button"
              className="game-nav__item"
              onClick={() => {
                setScreen('menu');
                setPanel('none');
              }}
            >
              Menu
            </button>
          )}
          <NavButton id="levels" panel={panel} label="Levels" onOpen={openPanel} />
          <NavButton id="aircraft" panel={panel} label="Aircraft" onOpen={openPanel} />
          <NavButton id="upgrades" panel={panel} label="Upgrades" onOpen={openPanel} />
          <NavButton id="settings" panel={panel} label="Settings" onOpen={openPanel} />
          <NavButton id="profile" panel={panel} label="Profile" onOpen={openPanel} />
        </nav>

        <div className="game-header__user">
          <span className="game-header__username">{user?.username}</span>
          <button type="button" className="app__button" onClick={() => void verifySession()}>
            Session
          </button>
          <button type="button" className="app__button" onClick={() => void logout()}>
            Log out
          </button>
        </div>
      </header>

      <div className="account__body">
        {loadState === 'loading' && <p className="app__message">Loading your profile…</p>}

        {loadState === 'error' && (
          <div className="app__message">
            <p>Could not load your profile. Check your connection and try again.</p>
            <button type="button" className="app__button" onClick={() => void load()}>
              Retry
            </button>
          </div>
        )}

        {loadState === 'ready' && screen === 'playing' && <GameStage bridge={bridge} />}

        {loadState === 'ready' && screen === 'menu' && panel === 'none' && (
          <nav className="menu">
            <button type="button" className="menu__item menu__item--primary" onClick={continueRun}>
              Continue
            </button>
            <button type="button" className="menu__item" onClick={() => openPanel('levels')}>
              Levels
            </button>
            <button type="button" className="menu__item" onClick={() => openPanel('aircraft')}>
              Aircraft
            </button>
            <button type="button" className="menu__item" onClick={() => openPanel('upgrades')}>
              Upgrades
            </button>
            <button type="button" className="menu__item" onClick={() => openPanel('settings')}>
              Settings
            </button>
            <button type="button" className="menu__item" onClick={() => openPanel('profile')}>
              Profile
            </button>
          </nav>
        )}

        {loadState === 'ready' && panel !== 'none' && (
          <div className="panel-overlay">{renderPanel()}</div>
        )}

        {loadState === 'ready' && screen === 'playing' && summary && (
          <LevelCompleteOverlay
            summary={summary}
            onNext={() => {
              bridge.commands?.nextLevel();
              setSummary(null);
            }}
            onReplay={() => {
              bridge.commands?.replayLevel();
              setSummary(null);
            }}
            onMenu={() => {
              setSummary(null);
              setScreen('menu');
              setPanel('none');
            }}
          />
        )}
      </div>
    </div>
  );
}

function safeLevelNumber(levelId: string): number {
  try {
    return getLevel(levelId).levelNumber;
  } catch {
    return 1;
  }
}

interface NavButtonProps {
  id: Panel;
  panel: Panel;
  label: string;
  onOpen: (panel: Panel) => void;
}

function NavButton({ id, panel, label, onOpen }: NavButtonProps) {
  return (
    <button
      type="button"
      className={`game-nav__item ${panel === id ? 'game-nav__item--active' : ''}`}
      onClick={() => onOpen(id)}
    >
      {label}
    </button>
  );
}

interface LevelCompleteOverlayProps {
  summary: LevelCompleteSummary;
  onNext: () => void;
  onReplay: () => void;
  onMenu: () => void;
}

function LevelCompleteOverlay({ summary, onNext, onReplay, onMenu }: LevelCompleteOverlayProps) {
  return (
    <div className="panel-overlay level-complete">
      <div className="level-complete__panel">
        <h2>LEVEL COMPLETE</h2>
        <p className="level-complete__level">
          Level {summary.levelNumber} — {summary.levelName}
        </p>

        <dl className="level-complete__stats">
          <div>
            <dt>Score</dt>
            <dd>{summary.score}</dd>
          </div>
          <div>
            <dt>Completion bonus</dt>
            <dd>{summary.completionBonus}</dd>
          </div>
          <div>
            <dt>Total score</dt>
            <dd>{summary.totalScore}</dd>
          </div>
          <div>
            <dt>Coins earned</dt>
            <dd>{summary.coins}</dd>
          </div>
          <div>
            <dt>Best score</dt>
            <dd>{summary.bestScore}</dd>
          </div>
        </dl>

        {summary.isFinal ? (
          <p className="level-complete__final">Campaign complete! You cleared every level.</p>
        ) : summary.nextLevel ? (
          <button type="button" className="app__button level-complete__primary" onClick={onNext}>
            Next Level — {summary.nextLevel.name}
          </button>
        ) : (
          <p className="level-complete__final">The next level is still locked.</p>
        )}

        <div className="level-complete__actions">
          <button type="button" className="app__button" onClick={onReplay}>
            Replay
          </button>
          <button type="button" className="app__button" onClick={onMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}