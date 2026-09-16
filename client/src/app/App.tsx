import { useState } from 'react';

import { AuthForm } from './auth/AuthForm';
import { useAuth } from './auth/AuthContext';
import { me } from './auth/authApi';
import { GameStage } from './GameStage';

type SessionCheck = 'idle' | 'checking' | 'ok' | 'error';

export function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1>Air Combat</h1>
        <SessionControls />
      </header>

      <main className="app__body">
        <AuthGate />
      </main>

      <footer className="app__footer">
        Phase 3 — core gameplay prototype · move with WASD or the mouse · fire with Space or
        click · press R to restart
      </footer>
    </div>
  );
}

function AuthGate() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <p className="app__message">Checking session…</p>;
  }

  return status === 'authenticated' ? <AccountView /> : <AuthForm />;
}

function SessionControls() {
  const { user, status, logout } = useAuth();

  if (status !== 'authenticated' || !user) {
    return null;
  }

  return (
    <div className="app__session">
      <span className="app__user">{user.username}</span>
      <button type="button" className="app__button" onClick={() => void logout()}>
        Log out
      </button>
    </div>
  );
}

/** Authenticated view. Calls the protected `/auth/me` endpoint on demand. */
function AccountView() {
  const { user } = useAuth();
  const [sessionCheck, setSessionCheck] = useState<SessionCheck>('idle');

  async function verifySession(): Promise<void> {
    setSessionCheck('checking');
    try {
      await me();
      setSessionCheck('ok');
    } catch {
      setSessionCheck('error');
    }
  }

  return (
    <div className="account">
      <div className="account__bar">
        <span>
          Signed in as <strong>{user?.email}</strong>
        </span>
        <button
          type="button"
          className="app__button"
          onClick={() => void verifySession()}
          disabled={sessionCheck === 'checking'}
        >
          {sessionCheck === 'checking' ? 'Checking…' : 'Verify protected route'}
        </button>
        {sessionCheck === 'ok' && <span className="account__ok">Protected route OK</span>}
        {sessionCheck === 'error' && <span className="account__error">Protected route failed</span>}
      </div>

      <GameStage />
    </div>
  );
}
