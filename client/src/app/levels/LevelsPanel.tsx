import { LEVELS, getBoss, isLevelUnlocked } from '@game/shared';

interface LevelsPanelProps {
  completedLevelIds: ReadonlySet<string>;
  bestScores: ReadonlyMap<string, number>;
  currentLevelId: string;
  onPlay: (levelId: string) => void;
  onClose?: () => void;
}

/**
 * Stage select. Levels unlock strictly in order; the server enforces the same
 * rule on completion and owns the rewards. Replaying a completed level is
 * allowed but grants no completion coins.
 */
export function LevelsPanel({
  completedLevelIds,
  bestScores,
  currentLevelId,
  onPlay,
  onClose,
}: LevelsPanelProps) {
  const completed = [...completedLevelIds];

  return (
    <section className="levels">
      <header className="panel__header">
        <h2>Levels</h2>
        <span className="upgrades__coins">
          {completed.length}/{LEVELS.length} cleared
        </span>
        {onClose && (
          <button type="button" className="app__button" onClick={onClose}>
            Close
          </button>
        )}
      </header>

      <p className="levels__note">
        Levels unlock in order. Replaying a completed level does not grant completion coins again.
      </p>

      <div className="levels__grid">
        {LEVELS.map((level) => {
          const isCompleted = completedLevelIds.has(level.id);
          const isUnlocked = isLevelUnlocked(level.id, completed);
          const isCurrent = currentLevelId === level.id;
          const best = bestScores.get(level.id) ?? 0;
          const state = !isUnlocked ? 'locked' : isCompleted ? 'completed' : 'unlocked';

          return (
            <article className={`level-card level-card--${state}`} key={level.id}>
              <div className="level-card__top">
                <span className="level-card__num">{String(level.levelNumber).padStart(2, '0')}</span>
                <span className={`badge badge--${state}`}>
                  {state === 'locked' ? 'Locked' : state === 'completed' ? 'Completed' : 'Unlocked'}
                </span>
              </div>

              <h3 className="level-card__name">{level.name}</h3>
              <p className="level-card__meta">
                {level.environment.displayName} · {level.difficulty}
              </p>
              {level.boss && (
                <p className="level-card__boss">Boss: {getBoss(level.boss.bossId).displayName}</p>
              )}
              {best > 0 && <p className="level-card__best">Best: {best.toLocaleString()}</p>}
              {isCurrent && <p className="level-card__current">Current stage</p>}

              <div className="level-card__actions">
                {isUnlocked ? (
                  <button
                    type="button"
                    className="app__button level-card__button"
                    onClick={() => onPlay(level.id)}
                  >
                    {isCompleted ? 'Replay' : 'Play'}
                  </button>
                ) : (
                  <button type="button" className="app__button level-card__button" disabled>
                    Locked
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}