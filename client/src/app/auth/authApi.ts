export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

/** Error thrown for non-2xx API responses, carrying the server error code. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// The access token is kept in memory only (never localStorage) to limit XSS
// exposure. The httpOnly refresh cookie restores the session on reload.
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Current in-memory access token, if the user is authenticated. */
export function getAccessToken(): string | null {
  return accessToken;
}

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

/**
 * Notified when a request fails authentication and the session cannot be
 * refreshed, so the app can return to the login screen gracefully.
 */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

function notifySessionExpired(): void {
  for (const listener of [...sessionExpiredListeners]) {
    listener();
  }
}

interface RawResponse {
  response: Response;
  data: unknown;
}

async function send(path: string, init: RequestInit, withAuth: boolean): Promise<RawResponse> {
  const headers = new Headers(init.headers);
  if (init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (withAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(path, { ...init, headers, credentials: 'include' });
  const data: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  return { response, data };
}

function toApiError(response: Response, data: unknown): ApiError {
  const errorData = (data ?? {}) as { error?: unknown; message?: unknown };
  const code = typeof errorData.error === 'string' ? errorData.error : 'request_failed';
  const message =
    typeof errorData.message === 'string'
      ? errorData.message
      : `Request failed with status ${response.status}`;
  return new ApiError(response.status, code, message);
}

// Single-flight silent refresh so concurrent 401s share one refresh request.
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { response, data } = await send('/api/v1/auth/refresh', { method: 'POST' }, false);
        if (!response.ok) {
          accessToken = null;
          return false;
        }
        const session = data as AuthResponse;
        accessToken = session.accessToken;
        return true;
      } catch {
        accessToken = null;
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

/**
 * Authenticated JSON request used by every feature API: attaches the access
 * token and, on a 401, transparently refreshes it once and retries. If the
 * session can no longer be refreshed the app is notified and a clear
 * `session_expired` error is thrown instead of a raw token error.
 */
export async function authorizedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let { response, data } = await send(path, init, true);

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      ({ response, data } = await send(path, init, true));
    }
    if (response.status === 401) {
      notifySessionExpired();
      throw new ApiError(401, 'session_expired', 'Your session expired. Please log in again.');
    }
  }

  if (!response.ok) {
    throw toApiError(response, data);
  }
  return data as T;
}

function storeSession(response: AuthResponse): AuthResponse {
  setAccessToken(response.accessToken);
  return response;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { response, data } = await send(
    '/api/v1/auth/register',
    { method: 'POST', body: JSON.stringify(input) },
    false,
  );
  if (!response.ok) {
    throw toApiError(response, data);
  }
  return storeSession(data as AuthResponse);
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { response, data } = await send(
    '/api/v1/auth/login',
    { method: 'POST', body: JSON.stringify(input) },
    false,
  );
  if (!response.ok) {
    throw toApiError(response, data);
  }
  return storeSession(data as AuthResponse);
}

/** Explicitly restores a session from the refresh cookie (used on app load). */
export async function refresh(): Promise<AuthResponse> {
  const { response, data } = await send('/api/v1/auth/refresh', { method: 'POST' }, false);
  if (!response.ok) {
    throw toApiError(response, data);
  }
  return storeSession(data as AuthResponse);
}

export async function logout(): Promise<void> {
  try {
    await send('/api/v1/auth/logout', { method: 'POST' }, true);
  } finally {
    setAccessToken(null);
  }
}

export async function me(): Promise<AuthUser> {
  const response = await authorizedRequest<{ user: AuthUser }>('/api/v1/auth/me');
  return response.user;
}