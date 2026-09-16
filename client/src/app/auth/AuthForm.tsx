import { useState, type FormEvent } from 'react';

import { useAuth } from './AuthContext';

type Mode = 'login' | 'register';

export function AuthForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  function switchMode(next: Mode): void {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isRegister) {
        await register({ email, username, password });
      } else {
        await login({ email, password });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth">
      <div className="auth__tabs">
        <button
          type="button"
          className={!isRegister ? 'auth__tab auth__tab--active' : 'auth__tab'}
          onClick={() => switchMode('login')}
        >
          Log in
        </button>
        <button
          type="button"
          className={isRegister ? 'auth__tab auth__tab--active' : 'auth__tab'}
          onClick={() => switchMode('register')}
        >
          Register
        </button>
      </div>

      <form className="auth__form" onSubmit={handleSubmit}>
        <label className="auth__field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        {isRegister && (
          <label className="auth__field">
            <span>Username</span>
            <input
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={24}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
        )}

        <label className="auth__field">
          <span>Password</span>
          <input
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {isRegister && (
          <p className="auth__hint">
            At least 8 characters, including one letter and one number.
          </p>
        )}

        {error && <p className="auth__error">{error}</p>}

        <button className="auth__submit" type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
        </button>
      </form>
    </section>
  );
}
