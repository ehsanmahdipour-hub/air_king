import { ApiError, getAccessToken } from './auth/authApi';

/**
 * Authenticated JSON request helper shared by feature API modules. Attaches the
 * in-memory access token and normalizes error responses into `ApiError`.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
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