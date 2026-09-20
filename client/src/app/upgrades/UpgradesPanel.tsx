import {
  UPGRADES,
  upgradeCost,
  upgradeEffectiveValue,
  upgradeNextValue,
  type PlayerProfileData,
  type UpgradeConfig,
  type UpgradeId,
  type UpgradeLevels,
} from '@game/shared';
import { useState } from 'react';

import { UpgradeIcon } from './upgradeIcons';

interface UpgradesPanelProps {
  profile: PlayerProfileData;
  levels: UpgradeLevels;
  onPurchase: (upgradeId: UpgradeId) => Promise<void>;
  onClose?: () => void;
}

const STAT_LABELS: Record<UpgradeConfig['stat'], string> = {
  weaponDamage: 'Damage',
  weaponFireRate: 'Shots/sec',
  weaponProjectileCount: 'Projectiles',
  weaponProjectileSpeed: 'Speed',
  aircraftHealth: 'Health',
  aircraftArmor: 'Armor',
  aircraftSpeed: 'Speed',
  aircraftFirePower: 'Damage multiplier',
};

function formatValue(upgrade: UpgradeConfig, value: number): string {
  if (upgrade.mode === 'multiply') {
    return `×${value.toFixed(2)}`;
  }
  if (upgrade.stat === 'weaponFireRate') {
    return value.toFixed(1);
  }
  return `${value}`;
}

export function UpgradesPanel({ profile, levels, onPurchase, onClose }: UpgradesPanelProps) {
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
      <header className="panel__header">
        <h2>Upgrades</h2>
        <span className="upgrades__coins">Coins: {profile.coins}</span>
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

      <div className="upgrades__columns">
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
      <h3 className="upgrades__column-title">{title}</h3>
      <div className="upgrades__cards">
        {upgrades.map((upgrade) => {
          const level = levels[upgrade.id];
          const current = upgradeEffectiveValue(upgrade, level);
          const nextLevel = upgradeNextValue(upgrade, level);
          const next = nextLevel === null ? null : upgradeEffectiveValue(upgrade, level + 1);
          const cost = upgradeCost(upgrade, level);
          const maxed = cost === null;
          const affordable = !maxed && coins >= cost;

          return (
            <article className="upgrade-card" key={upgrade.id}>
              <div className="upgrade-card__head">
                <span className="upgrade-card__icon">
                  <UpgradeIcon id={upgrade.id} />
                </span>
                <span className="upgrade-card__name">{upgrade.displayName}</span>
                <span className="upgrade-card__level">
                  Lv {level}/{upgrade.maxLevel}
                </span>
              </div>

              <p className="upgrade-card__desc">{upgrade.description}</p>

              <div className="upgrade-card__values">
                <span className="upgrade-card__stat">{STAT_LABELS[upgrade.stat]}</span>
                <span className="upgrade-card__value">{formatValue(upgrade, current)}</span>
                <span className="upgrade-card__arrow">→</span>
                <span className="upgrade-card__value upgrade-card__value--next">
                  {next === null ? 'MAX' : formatValue(upgrade, next)}
                </span>
              </div>

              <div className="upgrade-card__footer">
                <span className="upgrade-card__cost">
                  {maxed ? 'Maximum level' : `${cost.toLocaleString()} coins`}
                </span>
                <button
                  type="button"
                  className="app__button upgrade-card__button"
                  disabled={maxed || !affordable || pending === upgrade.id}
                  title={!maxed && !affordable ? 'Not enough coins' : undefined}
                  onClick={() => onBuy(upgrade.id)}
                >
                  {maxed ? 'Maxed' : 'Upgrade'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}