import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../app';
import { prisma } from '../db/prisma';

const REGISTER = '/api/v1/auth/register';
const LOGIN = '/api/v1/auth/login';
const LOGOUT = '/api/v1/auth/logout';
const REFRESH = '/api/v1/auth/refresh';
const ME = '/api/v1/auth/me';

const validUser = {
  email: 'pilot@example.com',
  username: 'pilot_one',
  password: 'skyraider1',
};

interface ResponseLike {
  headers: Record<string, unknown>;
}

/** Extracts the `refresh_token=...` pair from a Set-Cookie response header. */
function refreshCookieFrom(response: ResponseLike): string {
  const header = response.headers['set-cookie'];
  const raw = Array.isArray(header) ? header[0] : header;

  if (typeof raw !== 'string') {
    throw new Error('Expected a Set-Cookie header');
  }

  const [pair] = raw.split(';');
  return pair;
}

async function register(app: FastifyInstance, user = validUser) {
  return app.inject({ method: 'POST', url: REGISTER, payload: user });
}

describe('auth routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /auth/register', () => {
    it('registers a user and returns an access token and user', async () => {
      const response = await register(app);

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.user).toMatchObject({
        email: validUser.email,
        username: validUser.username,
        role: 'player',
      });
      expect(typeof body.accessToken).toBe('string');
      expect(body.user).not.toHaveProperty('passwordHash');
      expect(refreshCookieFrom(response)).toContain('refresh_token=');
    });

    it('stores a hashed password, never the plaintext', async () => {
      await register(app);

      const stored = await prisma.user.findUnique({ where: { email: validUser.email } });
      expect(stored).not.toBeNull();
      expect(stored?.passwordHash).not.toBe(validUser.password);
      expect(stored?.passwordHash.startsWith('$argon2id$')).toBe(true);
    });

    it('rejects a duplicate email with 409', async () => {
      await register(app);
      const response = await register(app, { ...validUser, username: 'different_name' });

      expect(response.statusCode).toBe(409);
      expect(response.json().error).toBe('account_exists');
    });

    it('rejects a duplicate username with 409', async () => {
      await register(app);
      const response = await register(app, { ...validUser, email: 'other@example.com' });

      expect(response.statusCode).toBe(409);
      expect(response.json().error).toBe('account_exists');
    });

    it.each([
      ['too short', 'Ab1'],
      ['without a number', 'skyraiders'],
      ['without a letter', '12345678'],
    ])('rejects a %s password with 400', async (_label, password) => {
      const response = await register(app, { ...validUser, password });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('validation_error');
    });
  });

  describe('POST /auth/login', () => {
    it('logs in with valid credentials', async () => {
      await register(app);

      const response = await app.inject({
        method: 'POST',
        url: LOGIN,
        payload: { email: validUser.email, password: validUser.password },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(typeof body.accessToken).toBe('string');
      expect(body.user).not.toHaveProperty('passwordHash');
      expect(refreshCookieFrom(response)).toContain('refresh_token=');
    });

    it('rejects a wrong password with 401', async () => {
      await register(app);

      const response = await app.inject({
        method: 'POST',
        url: LOGIN,
        payload: { email: validUser.email, password: 'wrong-password1' },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().error).toBe('invalid_credentials');
    });

    it('rejects an unknown email with the same 401 error', async () => {
      const response = await app.inject({
        method: 'POST',
        url: LOGIN,
        payload: { email: 'nobody@example.com', password: 'skyraider1' },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().error).toBe('invalid_credentials');
    });

    it('rejects a missing password with 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: LOGIN,
        payload: { email: validUser.email },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('validation_error');
    });
  });

  describe('GET /auth/me (protected)', () => {
    it('rejects a request without a token', async () => {
      const response = await app.inject({ method: 'GET', url: ME });

      expect(response.statusCode).toBe(401);
      expect(response.json().error).toBe('unauthorized');
    });

    it('rejects an invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: ME,
        headers: { authorization: 'Bearer not-a-real-token' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('returns the current user for a valid token', async () => {
      const registration = await register(app);
      const { accessToken } = registration.json();

      const response = await app.inject({
        method: 'GET',
        url: ME,
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.user.email).toBe(validUser.email);
      expect(body.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('POST /auth/refresh', () => {
    it('issues a new access token and rotates the refresh cookie', async () => {
      const registration = await register(app);
      const cookie = refreshCookieFrom(registration);

      const response = await app.inject({
        method: 'POST',
        url: REFRESH,
        headers: { cookie },
      });

      expect(response.statusCode).toBe(200);
      expect(typeof response.json().accessToken).toBe('string');
      expect(refreshCookieFrom(response)).not.toBe(cookie);
    });

    it('rejects a reused (already rotated) refresh token', async () => {
      const registration = await register(app);
      const cookie = refreshCookieFrom(registration);

      await app.inject({ method: 'POST', url: REFRESH, headers: { cookie } });
      const reuse = await app.inject({ method: 'POST', url: REFRESH, headers: { cookie } });

      expect(reuse.statusCode).toBe(401);
      expect(reuse.json().error).toBe('invalid_refresh_token');
    });

    it('rejects a refresh without a cookie', async () => {
      const response = await app.inject({ method: 'POST', url: REFRESH });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes the refresh token and prevents further refreshes', async () => {
      const registration = await register(app);
      const cookie = refreshCookieFrom(registration);

      const logout = await app.inject({ method: 'POST', url: LOGOUT, headers: { cookie } });
      expect(logout.statusCode).toBe(204);

      const refresh = await app.inject({ method: 'POST', url: REFRESH, headers: { cookie } });
      expect(refresh.statusCode).toBe(401);
    });

    it('is idempotent without a cookie', async () => {
      const response = await app.inject({ method: 'POST', url: LOGOUT });
      expect(response.statusCode).toBe(204);
    });
  });
});
