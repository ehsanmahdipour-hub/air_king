import {
  AIRCRAFT,
  canPurchaseAircraft,
  type AircraftStateData,
  type PlayerProfileData,
} from '@game/shared';
import { useState } from 'react';

import { AircraftArt } from './aircraftArt';

interface AircraftPanelProps {
  profile: PlayerProfileData;
  states: AircraftStateData[];
  onPurchase: (aircraftId: string) => Promise<void>;
  onEquip: (aircraftId: string) => Promise<void>;
  onClose?: () => void;
}

const MAX_STATS = {
  health: Math.max(...AIRCRAFT.map((aircraft) => aircraft.maxHealth)),
  armor: Math.max(...AIRCRAFT.map((aircraft) => aircraft.armor), 1),
  speed: Math.max(...AIRCRAFT.map((aircraft) => aircraft.speed)),
  firePower: Math.max(...AIRCRAFT.map((aircraft) => aircraft.firePower)),
  fireRate: Math.max(...AIRCRAFT.map((aircraft) => aircraft.fireRate)),
};

function stateFor(states: AircraftStateData[], id: string): AircraftStateData {
  return states.find((state) => state.id === id) ?? { id, owned: false, equipped: false };
}

export function AircraftPanel({
  profile,
  states,
  onPurchase,
  onEquip,
  onClose,
}: AircraftPanelProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  async function run(id: string, action: () => Promise<void>, success: string): Promise<void> {
    setPending(id);
    setMessage(null);
    try {
      await action();
      setMessage({ kind: 'ok', text: success });
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Action failed.',
      });
    } finally {
      setPending(null);
    }
  }

  const ownedIds = states.filter((state) => state.owned).map((state) => state.id);

  return (
    <section className="hangar">
      <header className="panel__header">
        <h2>Hangar</h2>
        <span className="hangar__coins">Coins: {profile.coins}</span>
        {onClose && (
          <button type="button" className="app__button" onClick={onClose}>
            Close
          </button>
        )}
      </header>

      {message && (
        <p className={message.kind === 'ok' ? 'upgrades__ok' : 'upgrades__error'}>
          {message.text}
        </p>
      )}

      <div className="hangar__grid">
        {AIRCRAFT.map((aircraft) => {
          const state = stateFor(states, aircraft.id);
          const purchase = canPurchaseAircraft(aircraft, ownedIds, profile.coins);
          const unavailable = aircraft.availability !== 'available';
          const purchasable = aircraft.unlock.kind === 'purchase' && !unavailable;
          const affordable = purchasable && profile.coins >= aircraft.price;

          return (
            <article className="aircraft-card" key={aircraft.id}>
              <div className="aircraft-card__art">
                <AircraftArt aircraftId={aircraft.id} />
                <div className="aircraft-card__badges">
                  {state.equipped && <span className="badge badge--equipped">Equipped</span>}
                  {!state.equipped && state.owned && <span className="badge badge--owned">Owned</span>}
                  {!state.owned && unavailable && <span className="badge badge--locked">Coming soon</span>}
                  {!state.owned && !unavailable && <span className="badge badge--locked">Locked</span>}
                </div>
              </div>

              <h3 className="aircraft-card__name">
                {aircraft.displayName}
                <span className="aircraft-card__role">{aircraft.role}</span>
              </h3>
              <p className="aircraft-card__description">{aircraft.description}</p>

              <div className="stat-list">
                <StatBar label="Health" value={aircraft.maxHealth} max={MAX_STATS.health} />
                <StatBar label="Armor" value={aircraft.armor} max={MAX_STATS.armor} />
                <StatBar label="Speed" value={aircraft.speed} max={MAX_STATS.speed} />
                <StatBar label="Fire Power" value={aircraft.firePower} max={MAX_STATS.firePower} format={(v) => `${v.toFixed(2)}×`} />
                <StatBar label="Fire Rate" value={aircraft.fireRate} max={MAX_STATS.fireRate} format={(v) => `${v.toFixed(2)}×`} />
              </div>

              {aircraft.ability && (
                <p className="aircraft-card__ability">
                  <strong>{aircraft.ability.displayName}</strong> — {aircraft.ability.description}
                </p>
              )}

              <div className="aircraft-card__actions">
                {state.equipped ? (
                  <button type="button" className="app__button aircraft-card__button" disabled>
                    Equipped
                  </button>
                ) : state.owned ? (
                  <button
                    type="button"
                    className="app__button aircraft-card__button aircraft-card__button--primary"
                    disabled={pending === aircraft.id}
                    onClick={() =>
                      void run(aircraft.id, () => onEquip(aircraft.id), 'Aircraft equipped.')
                    }
                  >
                    Equip
                  </button>
                ) : unavailable ? (
                  <button type="button" className="app__button aircraft-card__button" disabled>
                    Coming soon
                  </button>
                ) : purchasable ? (
                  <button
                    type="button"
                    className="app__button aircraft-card__button aircraft-card__button--primary"
                    disabled={!affordable || pending === aircraft.id}
                    title={!affordable ? 'Not enough coins' : undefined}
                    onClick={() =>
                      void run(
                        aircraft.id,
                        () => onPurchase(aircraft.id),
                        `${aircraft.displayName} purchased.`,
                      )
                    }
                  >
                    Buy · {aircraft.price.toLocaleString()}
                  </button>
                ) : (
                  <button type="button" className="app__button aircraft-card__button" disabled>
                    Unavailable
                  </button>
                )}
              </div>

              {!purchase.ok && purchase.reason === 'insufficient_coins' && (
                <p className="aircraft-card__hint">Not enough coins</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  format?: (value: number) => string;
}

function StatBar({ label, value, max, format }: StatBarProps) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div className="stat-bar">
      <span className="stat-bar__label">{label}</span>
      <span className="stat-bar__track">
        <span className="stat-bar__fill" style={{ width: `${ratio * 100}%` }} />
      </span>
      <span className="stat-bar__value">{format ? format(value) : value}</span>
    </div>
  );
}