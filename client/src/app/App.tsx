import {
  DEFAULT_UPGRADE_LEVELS,
  type AircraftStateData,
  type PlayerProfileData,
  type UpgradeId,
  type UpgradeLevels,
} from '@game/shared';
import { useEffect, useMemo, useState } from 'react';

import { AuthForm } from './auth/AuthForm';
import { useAuth } from './auth/AuthContext';
import { me } from './auth/authApi';
import { equipAircraft, getAircraft, purchaseAircraft } from './aircraft/aircraftApi';
import { AircraftPanel } from './aircraft/AircraftPanel';
import { GameStage } from './GameStage';
import { completeLevel, getProgress } from './progress/progressApi';
import { getUpgrades, purchaseUpgrade } from './upgrades/upgradesApi';
import { UpgradesPanel } from './upgrades/UpgradesPanel';
import type { GameProgressBridge } from '../game/progressBridge';

type SessionCheck = 'idle' | 'checking' | 'ok' | 'error';

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
        Phase 9 — aircraft shop · move with WASD or the mouse · fire with Space or click · press R
        to replay · press N for the next level when complete
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
 * Authenticated view. Owns progression, upgrade and aircraft networking: it
 * loads the player's persisted state, renders the shop panels and injects a
 * bridge into the game so completions are validated and saved and the equipped
 * aircraft/upgrades drive the loadout.
 */
function AccountView() {
  const { user } = useAuth();
  const [sessionCheck, setSessionCheck] = useState<SessionCheck>('idle');
  const [profile, setProfile] = useState<PlayerProfileData | null>(null);
  const [upgradeLevels, setUpgradeLevels] = useState<UpgradeLevels | null>(null);
  const [aircraft, setAircraft] = useState<AircraftStateData[] | null>(null);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showAircraft, setShowAircraft] = useState(false);

  const bridge = useMemo<GameProgressBridge>(
    () => ({
      bestScores: new Map<string, number>(),
      completedLevelIds: new Set<string>(),
      onLevelComplete: async (levelId, score) => {
        const response = await completeLevel(levelId, score);
        setProfile(response.profile);
        bridge.currentLevelId = response.profile.currentLevelId;
        return response;
      },
    }),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    Promise.all([getProgress(), getUpgrades(), getAircraft()])
      .then(([progress, upgrades, roster]) => {
        if (cancelled) {
          return;
        }
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
      })
      .catch(() => {
        if (!cancelled) {
          // Play without persisted progression if the API is unreachable.
          setUpgradeLevels(DEFAULT_UPGRADE_LEVELS);
          bridge.upgradeLevels = DEFAULT_UPGRADE_LEVELS;
          setAircraft([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bridge]);

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
      const next = {
        ...(current ?? DEFAULT_UPGRADE_LEVELS),
        [upgradeId]: response.upgrade.level,
      };
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

  async function verifySession(): Promise<void> {
    setSessionCheck('checking');
    try {
      await me();
      setSessionCheck('ok');
    } catch {
      setSessionCheck('error');
    }
  }

  const ready = upgradeLevels !== null && aircraft !== null;

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
        <button
          type="button"
          className="app__button"
          onClick={() => setShowAircraft((visible) => !visible)}
        >
          {showAircraft ? 'Hide aircraft' : 'Aircraft'}
        </button>
        <button
          type="button"
          className="app__button"
          onClick={() => setShowUpgrades((visible) => !visible)}
        >
          {showUpgrades ? 'Hide upgrades' : 'Upgrades'}
        </button>
        <button
          type="button"
          className="app__button"
          onClick={() => void verifySession()}
          disabled={sessionCheck === 'checking'}
        >
          {sessionCheck === 'checking' ? 'Checking…' : 'Verify protected route'}
        </button>
        {sessionCheck === 'ok' && <span className="account__ok">Protected route OK</span>}
        {sessionCheck === 'error' && <span className="account__error">Protected route failed</span>}
      </div>

      {showAircraft && profile && aircraft && (
        <AircraftPanel
          profile={profile}
          states={aircraft}
          onPurchase={handlePurchaseAircraft}
          onEquip={handleEquipAircraft}
        />
      )}

      {showUpgrades && profile && upgradeLevels && (
        <UpgradesPanel
          profile={profile}
          levels={upgradeLevels}
          onPurchase={handlePurchaseUpgrade}
        />
      )}

      {ready ? (
        <GameStage bridge={bridge} />
      ) : (
        <p className="app__message">Loading progression…</p>
      )}
    </div>
  );
}