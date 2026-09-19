import {
  UPGRADES,
  upgradeCost,
  upgradeNextValue,
  upgradeValue,
  type PlayerProfileData,
  type UpgradeConfig,
  type UpgradeId,
  type UpgradeLevels,
} from '@game/shared';
import { useState } from 'react';

interface UpgradesPanelProps {
  profile: PlayerProfileData;
  levels: UpgradeLevels;
  onPurchase: (upgradeId: UpgradeId) => Promise<void>;
}

function formatValue(upgrade: UpgradeConfig, value: number): string {
  if (upgrade.mode === 'multiply') {
    return `×${value.toFixed(2)}`;
  }
  return `+${value}`;
}

export function UpgradesPanel({ profile, levels, onPurchase }: UpgradesPanelProps) {
  const [pending, setPending] = useState<UpgradeId | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  async function buy(upgradeId: UpgradeId): Promise<void> {
    setPending(upgradeId);
    setMessage(null);
    try {
      await onPurchase(upgradeId);
      setMessage({ kind: 'ok', text: 'Upgrade purchased.' });
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Purchase failed.',
      });
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="upgrades">
      <div className="upgrades__header">
        <h2>Upgrades</h2>
        <span className="upgrades__coins">Coins: {profile.coins}</span>
      </div>

      {message && (
        <p className={message.kind === 'ok' ? 'upgrades__ok' : 'upgrades__error'}>
          {message.text}
        </p>
      )}

      <div className="upgrades__grid">
        <UpgradeColumn
          title="Weapon"
          category="weapon"
          levels={levels}
          coins={profile.coins}
          pending={pending}
          onBuy={buy}
        />
        <UpgradeColumn
          title="Aircraft"
          category="aircraft"
          levels={levels}
          coins={profile.coins}
          pending={pending}
          onBuy={buy}
        />
      </div>
    </section>
  );
}

interface UpgradeColumnProps {
  title: string;
  category: UpgradeConfig['category'];
  levels: UpgradeLevels;
  coins: number;
  pending: UpgradeId | null;
  onBuy: (upgradeId: UpgradeId) => void;
}

function UpgradeColumn({ title, category, levels, coins, pending, onBuy }: UpgradeColumnProps) {
  const upgrades = UPGRADES.filter((upgrade) => upgrade.category === category);

  return (
    <div className="upgrades__column">
      <h3>{title}</h3>
      {upgrades.map((upgrade) => {
        const level = levels[upgrade.id];
        const current = upgradeValue(upgrade, level);
        const next = upgradeNextValue(upgrade, level);
        const cost = upgradeCost(upgrade, level);
        const maxed = cost === null;
        const affordable = !maxed && coins >= cost;

        return (
          <div className="upgrade" key={upgrade.id}>
            <div className="upgrade__info">
              <span className="upgrade__name">{upgrade.displayName}</span>
              <span className="upgrade__level">
                Lv {level}/{upgrade.maxLevel}
              </span>
              <span className="upgrade__value">
                {formatValue(upgrade, current)}
                {next !== null ? ` → ${formatValue(upgrade, next)}` : ''}
              </span>
            </div>
            <button
              type="button"
              className="app__button"
              disabled={maxed || !affordable || pending === upgrade.id}
              title={!maxed && !affordable ? 'Not enough coins' : undefined}
              onClick={() => onBuy(upgrade.id)}
            >
              {maxed ? 'Max' : `Buy ${cost}`}
            </button>
          </div>
        );
      })}
    </div>
  );
}