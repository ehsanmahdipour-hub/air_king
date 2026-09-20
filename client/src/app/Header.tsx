import type { PlayerProfileData } from '@game/shared';

import { AirKingsLogo } from './branding/AirKingsLogo';

export type HeaderPanel = 'none' | 'levels' | 'aircraft' | 'upgrades' | 'settings' | 'profile';
export type HeaderScreen = 'menu' | 'playing';

interface GameHeaderProps {
  username: string;
  profile: PlayerProfileData;
  levelNumber: number;
  screen: HeaderScreen;
  panel: HeaderPanel;
  onOpen: (panel: HeaderPanel) => void;
  onExitToMenu: () => void;
  onLogout: () => void;
}

/**
 * Persistent game header. Player identity and stats live on the left; navigation
 * and system actions live on the right. The underlying authentication/session is
 * owned by the auth layer and is untouched by this header.
 */
export function GameHeader({
  username,
  profile,
  levelNumber,
  screen,
  panel,
  onOpen,
  onExitToMenu,
  onLogout,
}: GameHeaderProps) {
  return (
    <header className="game-header">
      <div className="game-header__identity">
        <div className="game-header__brand">
          <AirKingsLogo size={36} />
          <div className="game-header__titles">
            <span className="game-header__title">AIR KINGS</span>
            <span className="game-header__sub">Arcade Air Combat</span>
          </div>
        </div>

        <div className="game-header__stats">
          <span className="hud-chip hud-chip--user">
            <span className="hud-chip__label">Pilot</span>
            <span className="hud-chip__value">{username}</span>
          </span>
          <span className="hud-chip">
            <span className="hud-chip__label">Coins</span>
            <span className="hud-chip__value">{profile.coins.toLocaleString()}</span>
          </span>
          <span className="hud-chip">
            <span className="hud-chip__label">Score</span>
            <span className="hud-chip__value">{profile.highestScore.toLocaleString()}</span>
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
      </div>

      <div className="game-header__actions">
        <nav className="game-nav">
          {screen === 'playing' && (
            <button type="button" className="game-nav__item" onClick={onExitToMenu}>
              Menu
            </button>
          )}
          <NavButton id="levels" panel={panel} label="Levels" onOpen={onOpen} />
          <NavButton id="aircraft" panel={panel} label="Aircraft" onOpen={onOpen} />
          <NavButton id="upgrades" panel={panel} label="Upgrades" onOpen={onOpen} />
          <NavButton id="settings" panel={panel} label="Settings" onOpen={onOpen} />
          <NavButton id="profile" panel={panel} label="Profile" onOpen={onOpen} />
        </nav>

        <button type="button" className="app__button game-header__logout" onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}

interface NavButtonProps {
  id: HeaderPanel;
  panel: HeaderPanel;
  label: string;
  onOpen: (panel: HeaderPanel) => void;
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