import { createHash, randomBytes } from 'node:crypto';

import { SignJWT, jwtVerify } from 'jose';

import { env } from '../config/env';

const secretKey = new TextEncoder().encode(env.JWT_SECRET);
const JWT_ALGORITHM = 'HS256';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

/** Signs a short-lived access token. Only non-sensitive claims are embedded. */
export function signAccessToken(user: AuthenticatedUser): Promise<string> {
  return new SignJWT({ email: user.email, username: user.username, role: user.role })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_TOKEN_TTL)
    .sign(secretKey);
}

/** Verifies an access token and returns its claims, or throws if invalid. */
export async function verifyAccessToken(token: string): Promise<AuthenticatedUser> {
  const { payload } = await jwtVerify(token, secretKey, { algorithms: [JWT_ALGORITHM] });

  if (
    typeof payload.sub !== 'string' ||
    typeof payload.email !== 'string' ||
    typeof payload.username !== 'string' ||
    typeof payload.role !== 'string'
  ) {
    throw new Error('Access token payload is missing required claims');
  }

  return {
    id: payload.sub,
    email: payload.email,
    username: payload.username,
    role: payload.role,
  };
}

/**
 * Refresh tokens are opaque random values. Only their SHA-256 hash is stored in
 * the database, so a database leak does not expose usable session tokens.
 */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiryDate(): Date {
  const milliseconds = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + milliseconds);
}

export const REFRESH_TOKEN_TTL_SECONDS = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;
export const REFRESH_COOKIE_NAME = 'refresh_token';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

export interface CookieOptions {
  httpOnly: boolean;
  sameSite: 'lax';
  secure: boolean;
  path: string;
  maxAge: number;
}

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  };
}
