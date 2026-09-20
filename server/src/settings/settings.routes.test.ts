import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS } from '@game/shared';

import { buildApp } from '../app';
import { prisma } from '../db/prisma';

const REGISTER = '/api/v1/auth/register';
const LOGIN = '/api/v1/auth/login';
const SETTINGS_URL = '/api/v1/settings';

function authHeader(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}

async function register(
  app: FastifyInstance,
  email: string,
): Promise<{ token: string; userId: string }> {
  const username = email.split('@')[0]?.replace(/[^a-z0-9_]/gi, '').slice(0, 20) ?? 'pilot';
  const response = await app.inject({
    method: 'POST',
    url: REGISTER,
    payload: { email, username, password: 'skyraider1' },
  });
  expect(response.statusCode).toBe(201);
  const body = response.json();
  return { token: body.accessToken as string, userId: body.user.id as string };
}

function getSettings(app: FastifyInstance, token: string) {
  return app.inject({ method: 'GET', url: SETTINGS_URL, headers: authHeader(token) });
}

function putSettings(app: FastifyInstance, token: string, payload: unknown) {
  return app.inject({
    method: 'PUT',
    url: SETTINGS_URL,
    headers: authHeader(token),
    payload: payload as object,
  });
}

describe('settings routes', () => {
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
    await prisma.playerAircraft.deleteMany();
    await prisma.playerUpgrade.deleteMany();
    await prisma.levelProgress.deleteMany();
    await prisma.playerProfile.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it('requires authentication', async () => {
    expect((await app.inject({ method: 'GET', url: SETTINGS_URL })).statusCode).toBe(401);
    expect((await app.inject({ method: 'PUT', url: SETTINGS_URL, payload: {} })).statusCode).toBe(401);
  });

  it('returns defaults for a new account', async () => {
    const { token } = await register(app, 'defaults@example.com');
    const response = await getSettings(app, token);

    expect(response.statusCode).toBe(200);
    expect(response.json().settings).toEqual(DEFAULT_SETTINGS);
  });

  it('persists valid settings', async () => {
    const { token } = await register(app, 'saver@example.com');
    const next = {
      movement: 'mouse',
      shooting: 'mouse',
      musicEnabled: false,
      sfxEnabled: true,
      masterVolume: 0.4,
      musicVolume: 0.2,
      sfxVolume: 0.9,
    };

    const response = await putSettings(app, token, next);
    expect(response.statusCode).toBe(200);
    expect(response.json().settings).toEqual(next);

    const fetched = await getSettings(app, token);
    expect(fetched.json().settings).toEqual(next);
  });

  it('rejects invalid settings', async () => {
    const { token } = await register(app, 'bad@example.com');

    expect((await putSettings(app, token, { ...DEFAULT_SETTINGS, movement: 'joystick' })).statusCode).toBe(400);
    expect((await putSettings(app, token, { ...DEFAULT_SETTINGS, masterVolume: 2 })).statusCode).toBe(400);
    expect((await putSettings(app, token, { movement: 'keyboard' })).statusCode).toBe(400);
  });

  it('restores settings in a later session', async () => {
    const { token } = await register(app, 'session@example.com');
    await putSettings(app, token, { ...DEFAULT_SETTINGS, movement: 'mouse', sfxEnabled: false });

    const login = await app.inject({
      method: 'POST',
      url: LOGIN,
      payload: { email: 'session@example.com', password: 'skyraider1' },
    });
    const freshToken = login.json().accessToken as string;

    const response = await getSettings(app, freshToken);
    expect(response.json().settings).toMatchObject({ movement: 'mouse', sfxEnabled: false });
  });

  it('merges stored partial settings over defaults', async () => {
    const { token, userId } = await register(app, 'partial@example.com');
    await prisma.playerProfile.update({
      where: { userId },
      data: { settingsJson: JSON.stringify({ movement: 'mouse' }) },
    });

    const response = await getSettings(app, token);
    expect(response.json().settings).toEqual({ ...DEFAULT_SETTINGS, movement: 'mouse' });
  });
});