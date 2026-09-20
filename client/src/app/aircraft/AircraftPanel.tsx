import {
  AIRCRAFT,
  canPurchaseAircraft,
  type AircraftConfig,
  type AircraftStateData,
  type PlayerProfileData,
} from '@game/shared';
import { useState } from 'react';

interface AircraftPanelProps {
  profile: PlayerProfileData;
  states: AircraftStateData[];
  onPurchase: (aircraftId: string) => Promise<void>;
  onEquip: (aircraftId: string) => Promise<void>;
  onClose?: () => void;
}

function stateFor(states: AircraftStateData[], id: string): AircraftStateData {
  return states.find((state) => state.id === id) ?? { id, owned: false, equipped: false };
}

function statLine(aircraft: AircraftConfig): string {
  return [
    `HP ${aircraft.maxHealth}`,
    `Armor ${aircraft.armor}`,
    `Speed ${aircraft.speed}`,
    `Power ×${aircraft.firePower.toFixed(2)}`,
    `Fire rate ×${aircraft.fireRate.toFixed(2)}`,
  ].join(' · ');
}

export function AircraftPanel({ profile, states, onPurchase, onEquip, onClose }: AircraftPanelProps) {
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
    <section className="aircraft">
      <div className="aircraft__header">
        <h2>Aircraft</h2>
        <span className="upgrades__coins">Coins: {profile.coins}</span>
        {onClose && (
          <button type="button" className="app__button" onClick={onClose}>
            Close
          </button>
        )}
      </div>

      {message && (
        <p className={message.kind === 'ok' ? 'upgrades__ok' : 'upgrades__error'}>
          {message.text}
        </p>
      )}

      <div className="aircraft__grid">
        {AIRCRAFT.map((aircraft) => {
          const state = stateFor(states, aircraft.id);
          const purchase = canPurchaseAircraft(aircraft, ownedIds, profile.coins);
          const unavailable = aircraft.availability !== 'available';
          const purchasable = aircraft.unlock.kind === 'purchase' && !unavailable;
          const affordable = purchasable && profile.coins >= aircraft.price;

          return (
            <div className="aircraft__card" key={aircraft.id}>
              <div className="aircraft__title">
                <span className="aircraft__name">{aircraft.displayName}</span>
                {state.equipped && <span className="aircraft__badge">Equipped</span>}
                {!state.equipped && state.owned && (
                  <span className="aircraft__badge aircraft__badge--owned">Owned</span>
                )}
              </div>
              <p className="aircraft__description">{aircraft.description}</p>
              <p className="aircraft__stats">{statLine(aircraft)}</p>
              {aircraft.ability && (
                <p className="aircraft__ability">
                  Ability: {aircraft.ability.displayName} — {aircraft.ability.description}
                </p>
              )}

              <div className="aircraft__actions">
                {state.equipped ? (
                  <button type="button" className="app__button" disabled>
                    Equipped
                  </button>
                ) : state.owned ? (
                  <button
                    type="button"
                    className="app__button"
                    disabled={pending === aircraft.id}
                    onClick={() =>
                      void run(aircraft.id, () => onEquip(aircraft.id), 'Aircraft equipped.')
                    }
                  >
                    Equip
                  </button>
                ) : unavailable ? (
                  <button type="button" className="app__button" disabled>
                    Coming soon
                  </button>
                ) : purchasable ? (
                  <button
                    type="button"
                    className="app__button"
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
                    Buy {aircraft.price}
                  </button>
                ) : (
                  <button type="button" className="app__button" disabled>
                    Unavailable
                  </button>
                )}
              </div>

              {!purchase.ok && purchase.reason === 'insufficient_coins' && (
                <p className="aircraft__hint">Not enough coins</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}