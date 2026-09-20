import type { PlayerProfileData } from '@game/shared';

interface ProfilePanelProps {
  user: { username: string; email: string; role: string } | null;
  profile: PlayerProfileData;
  completedLevels: number;
  onLogout: () => void;
  onClose: () => void;
}

export function ProfilePanel({
  user,
  profile,
  completedLevels,
  onLogout,
  onClose,
}: ProfilePanelProps) {
  return (
    <section className="profile">
      <header className="panel__header">
        <h2>Profile</h2>
        <button type="button" className="app__button" onClick={onClose}>
          Close
        </button>
      </header>

      <dl className="profile__grid">
        <div>
          <dt>Username</dt>
          <dd>{user?.username ?? '—'}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user?.email ?? '—'}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{user?.role ?? 'player'}</dd>
        </div>
        <div>
          <dt>Coins</dt>
          <dd>{profile.coins}</dd>
        </div>
        <div>
          <dt>Current level</dt>
          <dd>{profile.currentLevelId}</dd>
        </div>
        <div>
          <dt>Equipped aircraft</dt>
          <dd>{profile.equippedAircraftId}</dd>
        </div>
        <div>
          <dt>Total score</dt>
          <dd>{profile.totalScore}</dd>
        </div>
        <div>
          <dt>Highest score</dt>
          <dd>{profile.highestScore}</dd>
        </div>
        <div>
          <dt>Levels completed</dt>
          <dd>{completedLevels}</dd>
        </div>
      </dl>

      <button type="button" className="app__button profile__logout" onClick={onLogout}>
        Log out
      </button>
    </section>
  );
}