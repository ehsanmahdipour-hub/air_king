import {
  DEFAULT_SETTINGS,
  DEFAULT_UPGRADE_LEVELS,
  type AircraftStateData,
  type GameSettings,
  type PlayerProfileData,
  type UpgradeId,
  type UpgradeLevels,
} from '@game/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AuthForm } from './auth/AuthForm';
import { useAuth } from './auth/AuthContext';
import { me } from './auth/authApi';
import { equipAircraft, getAircraft, purchaseAircraft } from './aircraft/aircraftApi';
import { AircraftPanel } from './aircraft/AircraftPanel';
import { GameStage } from './GameStage';
import { completeLevel, getProgress } from './progress/progressApi';
import { ProfilePanel } from './profile/ProfilePanel';
import { getSettings, updateSettings } from './settings/settingsApi';
import { SettingsPanel } from './settings/SettingsPanel';
import { getUpgrades, purchaseUpgrade } from './upgrades/upgradesApi';
import { UpgradesPanel } from './upgrades/UpgradesPanel';
import type { GameProgressBridge } from '../game/progressBridge';

type SessionCheck = 'idle' | 'checking' | 'ok' | 'error';
type LoadState = 'loading' | 'ready' | 'error';
type Screen = 'menu' | 'playing';
type Panel = 'none' | 'aircraft' | 'upgrades' | 'settings' | 'profile';

export function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1>Air Combat</h1>
        <SessionControls />
      </header>

      <main className="app__body">
        <AuthGate />
      </main>

      <footer className="app__footer">
        Phase 11 — settings & UX · WASD/mouse to fly · Space/click to fire · ESC to pause
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

function SessionControls() {
  const { user, status, logout } = useAuth();

  if (status !== 'authenticated' || !user) {
    return null;
  }

  return (
    <div className="app__session">
      <span className="app__user">{user.username}</span>
      <button type="button" className="app__button" onClick={() => void logout()}>
        Log out
      </button>
    </div>
  );
}

/**
 * Authenticated shell. Owns progression, upgrades, aircraft and settings
 * networking, renders the menu/panels, and injects a bridge into the game so
 * completions persist and the equipped aircraft/upgrades/settings drive play.
 */
function AccountView() {
  const { user, logout } = useAuth();
  const [sessionCheck, setSessionCheck] = useState<SessionCheck>('idle');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [screen, setScreen] = useState<Screen>('menu');
  const [panel, setPanel] = useState<Panel>('none');

  const [profile, setProfile] = useState<PlayerProfileData | null>(null);
  const [upgradeLevels, setUpgradeLevels] = useState<UpgradeLevels | null>(null);
  const [aircraft, setAircraft] = useState<AircraftStateData[] | null>(null);
  const [settings, setSettings] = useState<GameSettings | null>(null);

  const bridge = useMemo<GameProgressBridge>(
    () => ({
      bestScores: new Map<string, number>(),
      completedLevelIds: new Set<string>(),
      settings: DEFAULT_SETTINGS,
      onExitToMenu: () => {
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
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [bridge]);

  useEffect(() => {
    void load();
  }, [load]);

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
  }

  async function verifySession(): Promise<void> {
    setSessionCheck('checking');
    try {
      await me();
      setSessionCheck('ok');
    } catch {
      setSessionCheck('error');
    }
  }

  function openPanel(next: Panel): void {
    setPanel(next);
  }

  function renderPanel() {
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

  return (
    <div className="account">
      <div className="account__bar">
        <span>
          Signed in as <strong>{user?.email}</strong>
        </span>
        {profile && (
          <span className="account__progress">
            Coins: {profile.coins} · Level: {profile.currentLevelId} · Aircraft:{' '}
            {profile.equippedAircraftId}
          </span>
        )}
        {screen === 'playing' && (
          <button
            type="button"
            className="app__button"
            onClick={() => {
              setScreen('menu');
              setPanel('none');
            }}
          >
            Menu
          </button>
        )}
        <button type="button" className="app__button" onClick={() => openPanel('profile')}>
          Profile
        </button>
        <button type="button" className="app__button" onClick={() => openPanel('settings')}>
          Settings
        </button>
        <button
          type="button"
          className="app__button"
          onClick={() => void verifySession()}
          disabled={sessionCheck === 'checking'}
        >
          {sessionCheck === 'checking' ? 'Checking…' : 'Verify session'}
        </button>
        {sessionCheck === 'ok' && <span className="account__ok">Session OK</span>}
        {sessionCheck === 'error' && <span className="account__error">Session failed</span>}
      </div>

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
            <button
              type="button"
              className="menu__item"
              onClick={() => {
                setPanel('none');
                setScreen('playing');
              }}
            >
              Play
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
      </div>
    </div>
  );
}