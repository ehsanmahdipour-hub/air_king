import { useEffect, useRef, useState } from 'react';

import { createGame } from '../game/createGame';
import { fetchHealth } from './api';

type ApiStatus = 'checking' | 'ok' | 'unreachable';

/**
 * Hosts the Phaser canvas. Gameplay is not implemented yet; this proves the
 * engine boots and the client can reach the API.
 */
export function GameStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const game = createGame(stage);
    return () => {
      game.destroy(true);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchHealth()
      .then((health) => {
        if (!cancelled) {
          setApiStatus(health.status === 'ok' ? 'ok' : 'unreachable');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiStatus('unreachable');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="stage">
      <div className="stage__canvas" ref={stageRef} />
      <span className={`app__status app__status--${apiStatus}`}>API: {apiStatus}</span>
    </div>
  );
}
