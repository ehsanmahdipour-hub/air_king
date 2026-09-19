import { useEffect, useRef, useState } from 'react';

import { createGame } from '../game/createGame';
import type { GameProgressBridge } from '../game/progressBridge';
import { fetchHealth } from './api';

type ApiStatus = 'checking' | 'ok' | 'unreachable';

/**
 * Hosts the Phaser canvas and passes the progress bridge so the game can load
 * best scores and persist completions without owning API code.
 */
export function GameStage({ bridge }: { bridge?: GameProgressBridge }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const game = createGame(stage, bridge);
    return () => {
      game.destroy(true);
    };
  }, [bridge]);

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