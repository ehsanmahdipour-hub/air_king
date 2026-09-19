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

async function request<T>(path: string, init: RequestInit = {}, withAuth = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (withAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(path, { ...init, headers, credentials: 'include' });
  const data: unknown = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const errorData = (data ?? {}) as { error?: unknown; message?: unknown };
    const code = typeof errorData.error === 'string' ? errorData.error : 'request_failed';
    const message =
      typeof errorData.message === 'string'
        ? errorData.message
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, code, message);
  }

  return data as T;
}

function storeSession(response: AuthResponse): AuthResponse {
  setAccessToken(response.accessToken);
  return response;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const response = await request<AuthResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return storeSession(response);
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const response = await request<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return storeSession(response);
}

export async function refresh(): Promise<AuthResponse> {
  const response = await request<AuthResponse>('/api/v1/auth/refresh', { method: 'POST' });
  return storeSession(response);
}

export async function logout(): Promise<void> {
  try {
    await request<null>('/api/v1/auth/logout', { method: 'POST' });
  } finally {
    setAccessToken(null);
  }
}

export async function me(): Promise<AuthUser> {
  const response = await request<{ user: AuthUser }>('/api/v1/auth/me', {}, true);
  return response.user;
}
