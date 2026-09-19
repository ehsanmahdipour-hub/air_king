import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { UPGRADES } from '@game/shared';

import { buildApp } from '../app';
import { prisma } from '../db/prisma';

const REGISTER = '/api/v1/auth/register';
const UPGRADES_URL = '/api/v1/upgrades';

function purchaseUrl(upgradeId: string): string {
  return `/api/v1/upgrades/${upgradeId}/purchase`;
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

async function grantCoins(userId: string, coins: number): Promise<void> {
  await prisma.playerProfile.update({ where: { userId }, data: { coins } });
}

function getUpgrades(app: FastifyInstance, token: string) {
  return app.inject({ method: 'GET', url: UPGRADES_URL, headers: authHeader(token) });
}

function purchase(app: FastifyInstance, token: string, upgradeId: string) {
  return app.inject({ method: 'POST', url: purchaseUrl(upgradeId), headers: authHeader(token) });
}

describe('upgrade routes', () => {
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
    await prisma.playerUpgrade.deleteMany();
    await prisma.levelProgress.deleteMany();
    await prisma.playerProfile.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('GET /upgrades', () => {
    it('requires authentication', async () => {
      const response = await app.inject({ method: 'GET', url: UPGRADES_URL });
      expect(response.statusCode).toBe(401);
    });

    it('returns every upgrade at level 1 for a new account', async () => {
      const { token } = await register(app, 'fresh@example.com');
      const response = await getUpgrades(app, token);

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.profile.coins).toBe(0);
      expect(Object.keys(body.upgrades)).toHaveLength(UPGRADES.length);
      for (const value of Object.values(body.upgrades)) {
        expect(value).toBe(1);
      }
    });
  });

  describe('POST /upgrades/:upgradeId/purchase', () => {
    it('requires authentication', async () => {
      const response = await app.inject({ method: 'POST', url: purchaseUrl('weapon-damage') });
      expect(response.statusCode).toBe(401);
    });

    it('deducts coins and raises the upgrade level', async () => {
      const { token, userId } = await register(app, 'buyer@example.com');
      await grantCoins(userId, 10);

      const response = await purchase(app, token, 'weapon-damage');

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.upgrade).toEqual({ id: 'weapon-damage', level: 2 });
      expect(body.profile.coins).toBe(0);

      const persisted = await getUpgrades(app, token);
      expect(persisted.json().upgrades['weapon-damage']).toBe(2);
    });

    it('rejects a purchase with insufficient coins', async () => {
      const { token, userId } = await register(app, 'poor@example.com');
      await grantCoins(userId, 5);

      const response = await purchase(app, token, 'weapon-damage');
      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('insufficient_coins');

      const persisted = await getUpgrades(app, token);
      expect(persisted.json().profile.coins).toBe(5);
    });

    it('rejects an unknown upgrade id', async () => {
      const { token } = await register(app, 'unknown@example.com');
      const response = await purchase(app, token, 'weapon-laser');
      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('unknown_upgrade');
    });

    it('enforces the maximum level', async () => {
      const { token, userId } = await register(app, 'maxed@example.com');
      await grantCoins(userId, 1_000_000);

      expect((await purchase(app, token, 'weapon-projectile-count')).statusCode).toBe(200);
      expect((await purchase(app, token, 'weapon-projectile-count')).statusCode).toBe(200);

      const response = await purchase(app, token, 'weapon-projectile-count');
      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('max_level');
    });

    it('does not allow buying twice when only one is affordable', async () => {
      const { token, userId } = await register(app, 'dupe@example.com');
      await grantCoins(userId, 10);

      const first = await purchase(app, token, 'weapon-damage');
      const second = await purchase(app, token, 'weapon-damage');

      expect(first.statusCode).toBe(200);
      expect(second.statusCode).toBe(400);
      expect(second.json().error).toBe('insufficient_coins');

      const persisted = await getUpgrades(app, token);
      expect(persisted.json().profile.coins).toBe(0);
      expect(persisted.json().upgrades['weapon-damage']).toBe(2);
    });

    it('never overspends under concurrent purchases', async () => {
      const { token, userId } = await register(app, 'race@example.com');
      await grantCoins(userId, 10);

      const responses = await Promise.all([
        purchase(app, token, 'weapon-damage'),
        purchase(app, token, 'weapon-damage'),
      ]);

      const successes = responses.filter((response) => response.statusCode === 200).length;
      expect(successes).toBeLessThanOrEqual(1);

      const persisted = await getUpgrades(app, token);
      const body = persisted.json();
      expect(body.profile.coins).toBeGreaterThanOrEqual(0);
      expect(body.upgrades['weapon-damage']).toBeLessThanOrEqual(2);
    });

    it('keeps progress isolated between users', async () => {
      const buyer = await register(app, 'alpha@example.com');
      const other = await register(app, 'bravo@example.com');
      await grantCoins(buyer.userId, 50);
      await purchase(app, buyer.token, 'weapon-damage');

      const response = await getUpgrades(app, other.token);
      expect(response.json().profile.coins).toBe(0);
      expect(response.json().upgrades['weapon-damage']).toBe(1);
    });
  });
});