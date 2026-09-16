import { useEffect, useRef, useState } from 'react';

import { createGame } from '../game/createGame';
import { fetchHealth } from './api';

type ApiStatus = 'checking' | 'ok' | 'unreachable';

export function App() {
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
    <div className="app">
      <header className="app__header">
        <h1>Air Combat</h1>
        <span className={`app__status app__status--${apiStatus}`}>API: {apiStatus}</span>
      </header>

      <div className="app__stage" ref={stageRef} />

      <footer className="app__footer">Phase 1 foundation — game engine and render loop online</footer>
    </div>
  );
}
