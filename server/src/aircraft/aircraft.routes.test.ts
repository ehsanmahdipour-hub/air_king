import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AIRCRAFT, FORTRESS, INTERCEPTOR } from '@game/shared';

import { buildApp } from '../app';
import { prisma } from '../db/prisma';

const REGISTER = '/api/v1/auth/register';
const LOGIN = '/api/v1/auth/login';
const AIRCRAFT_URL = '/api/v1/aircraft';

function purchaseUrl(aircraftId: string): string {
  return `/api/v1/aircraft/${aircraftId}/purchase`;
}

function equipUrl(aircraftId: string): string {
  return `/api/v1/aircraft/${aircraftId}/equip`;
}

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

async function login(app: FastifyInstance, email: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: LOGIN,
    payload: { email, password: 'skyraider1' },
  });
  expect(response.statusCode).toBe(200);
  return response.json().accessToken as string;
}

async function grantCoins(userId: string, coins: number): Promise<void> {
  await prisma.playerProfile.update({ where: { userId }, data: { coins } });
}

function getAircraft(app: FastifyInstance, token: string) {
  return app.inject({ method: 'GET', url: AIRCRAFT_URL, headers: authHeader(token) });
}

function purchase(app: FastifyInstance, token: string, aircraftId: string) {
  return app.inject({ method: 'POST', url: purchaseUrl(aircraftId), headers: authHeader(token) });
}

function equip(app: FastifyInstance, token: string, aircraftId: string) {
  return app.inject({ method: 'POST', url: equipUrl(aircraftId), headers: authHeader(token) });
}

describe('aircraft routes', () => {
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

  describe('GET /aircraft', () => {
    it('requires authentication', async () => {
      const response = await app.inject({ method: 'GET', url: AIRCRAFT_URL });
      expect(response.statusCode).toBe(401);
    });

    it('returns every aircraft with the starter owned and equipped', async () => {
      const { token } = await register(app, 'roster@example.com');
      const response = await getAircraft(app, token);

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.aircraft).toHaveLength(AIRCRAFT.length);

      const starter = body.aircraft.find((entry: { id: string }) => entry.id === 'starter');
      expect(starter).toEqual({ id: 'starter', owned: true, equipped: true });

      const interceptor = body.aircraft.find((entry: { id: string }) => entry.id === 'interceptor');
      expect(interceptor).toEqual({ id: 'interceptor', owned: false, equipped: false });
    });
  });

  describe('POST /aircraft/:aircraftId/purchase', () => {
    it('requires authentication', async () => {
      const response = await app.inject({ method: 'POST', url: purchaseUrl('interceptor') });
      expect(response.statusCode).toBe(401);
    });

    it('purchases an aircraft and deducts coins', async () => {
      const { token, userId } = await register(app, 'buyer@example.com');
      await grantCoins(userId, INTERCEPTOR.price);

      const response = await purchase(app, token, INTERCEPTOR.id);

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.aircraft).toEqual({ id: INTERCEPTOR.id, owned: true, equipped: false });
      expect(body.profile.coins).toBe(0);
    });

    it('rejects a purchase with insufficient coins', async () => {
      const { token, userId } = await register(app, 'poor@example.com');
      await grantCoins(userId, INTERCEPTOR.price - 1);

      const response = await purchase(app, token, INTERCEPTOR.id);
      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('insufficient_coins');

      const roster = await getAircraft(app, token);
      expect(roster.json().profile.coins).toBe(INTERCEPTOR.price - 1);
      expect(
        roster.json().aircraft.find((entry: { id: string }) => entry.id === INTERCEPTOR.id).owned,
      ).toBe(false);
    });

    it('rejects a duplicate purchase without taking coins again', async () => {
      const { token, userId } = await register(app, 'dupe@example.com');
      await grantCoins(userId, INTERCEPTOR.price * 2);

      const first = await purchase(app, token, INTERCEPTOR.id);
      const second = await purchase(app, token, INTERCEPTOR.id);

      expect(first.statusCode).toBe(200);
      expect(second.statusCode).toBe(409);
      expect(second.json().error).toBe('aircraft_owned');

      const roster = await getAircraft(app, token);
      expect(roster.json().profile.coins).toBe(INTERCEPTOR.price);
    });

    it('rejects an unknown aircraft id', async () => {
      const { token } = await register(app, 'unknown@example.com');
      const response = await purchase(app, token, 'x-wing');
      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('unknown_aircraft');
    });

    it('rejects purchasing the default aircraft', async () => {
      const { token, userId } = await register(app, 'default@example.com');
      await grantCoins(userId, 1_000_000);

      const response = await purchase(app, token, 'starter');
      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('aircraft_not_purchasable');
    });
  });

  describe('POST /aircraft/:aircraftId/equip', () => {
    it('equips an owned aircraft', async () => {
      const { token, userId } = await register(app, 'equip@example.com');
      await grantCoins(userId, INTERCEPTOR.price);
      await purchase(app, token, INTERCEPTOR.id);

      const response = await equip(app, token, INTERCEPTOR.id);
      expect(response.statusCode).toBe(200);
      expect(response.json().aircraft).toEqual({
        id: INTERCEPTOR.id,
        owned: true,
        equipped: true,
      });
      expect(response.json().profile.equippedAircraftId).toBe(INTERCEPTOR.id);
    });

    it('rejects equipping an aircraft that is not owned', async () => {
      const { token } = await register(app, 'notowned@example.com');
      const response = await equip(app, token, FORTRESS.id);
      expect(response.statusCode).toBe(403);
      expect(response.json().error).toBe('aircraft_not_owned');
    });

    it('rejects equipping an unknown aircraft', async () => {
      const { token } = await register(app, 'badid@example.com');
      const response = await equip(app, token, 'x-wing');
      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('unknown_aircraft');
    });
  });

  it('restores ownership and the equipped aircraft in a later session', async () => {
    const { token, userId } = await register(app, 'persist@example.com');
    await grantCoins(userId, INTERCEPTOR.price);
    await purchase(app, token, INTERCEPTOR.id);
    await equip(app, token, INTERCEPTOR.id);

    const freshToken = await login(app, 'persist@example.com');
    const roster = await getAircraft(app, freshToken);

    expect(roster.json().profile.equippedAircraftId).toBe(INTERCEPTOR.id);
    expect(
      roster.json().aircraft.find((entry: { id: string }) => entry.id === INTERCEPTOR.id),
    ).toEqual({ id: INTERCEPTOR.id, owned: true, equipped: true });
  });

  it('keeps ownership isolated between users', async () => {
    const buyer = await register(app, 'alpha@example.com');
    const other = await register(app, 'bravo@example.com');
    await grantCoins(buyer.userId, INTERCEPTOR.price);
    await purchase(app, buyer.token, INTERCEPTOR.id);

    const roster = await getAircraft(app, other.token);
    expect(
      roster.json().aircraft.find((entry: { id: string }) => entry.id === INTERCEPTOR.id).owned,
    ).toBe(false);
    expect(roster.json().profile.equippedAircraftId).toBe('starter');
  });
});