import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_ECONOMY_CONFIG, calculateLevelReward } from '@game/shared';

import { buildApp } from '../app';
import { prisma } from '../db/prisma';

const REGISTER = '/api/v1/auth/register';
const LOGIN = '/api/v1/auth/login';
const PROGRESS = '/api/v1/progress';

function completeUrl(levelId: string): string {
  return `/api/v1/progress/levels/${levelId}/complete`;
}

function authHeader(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}

async function register(app: FastifyInstance, email: string): Promise<string> {
  const username = email.split('@')[0]?.replace(/[^a-z0-9_]/gi, '').slice(0, 20) ?? 'pilot';
  const response = await app.inject({
    method: 'POST',
    url: REGISTER,
    payload: { email, username, password: 'skyraider1' },
  });
  expect(response.statusCode).toBe(201);
  return response.json().accessToken as string;
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

function getProgress(app: FastifyInstance, token: string) {
  return app.inject({ method: 'GET', url: PROGRESS, headers: authHeader(token) });
}

function completeLevel(app: FastifyInstance, token: string, levelId: string, payload: unknown) {
  return app.inject({
    method: 'POST',
    url: completeUrl(levelId),
    headers: authHeader(token),
    payload: payload as object,
  });
}

/** Authoritative coins for the first clear of level 1 (score 1000). */
const expectedCoins = calculateLevelReward({
  totalScore: 1000 + 500,
  levelNumber: 1,
  difficulty: 'normal',
  firstCompletion: true,
  config: DEFAULT_ECONOMY_CONFIG,
}).totalCoins;

describe('progress routes', () => {
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
    await prisma.levelProgress.deleteMany();
    await prisma.playerProfile.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('GET /progress', () => {
    it('requires authentication', async () => {
      const response = await app.inject({ method: 'GET', url: PROGRESS });
      expect(response.statusCode).toBe(401);
      expect(response.json().error).toBe('unauthorized');
    });

    it('returns default progress for a new account', async () => {
      const token = await register(app, 'newpilot@example.com');
      const response = await getProgress(app, token);

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.profile).toEqual({
        coins: 0,
        totalScore: 0,
        highestScore: 0,
        currentLevelId: 'level-01',
        equippedAircraftId: 'starter',
      });
      expect(body.levels).toEqual([]);
    });
  });

  describe('POST /progress/levels/:levelId/complete', () => {
    it('requires authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: completeUrl('level-01'),
        payload: { score: 100 },
      });
      expect(response.statusCode).toBe(401);
    });

    it('persists a first completion with a server-computed reward', async () => {
      const token = await register(app, 'pilot@example.com');
      const response = await completeLevel(app, token, 'level-01', { score: 1000 });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      expect(body.firstCompletion).toBe(true);
      expect(body.result).toEqual({
        score: 1000,
        completionBonus: 500,
        totalScore: 1500,
        coins: expectedCoins,
      });
      expect(body.level).toEqual({ levelId: 'level-01', completed: true, bestScore: 1000 });
      expect(body.profile).toMatchObject({
        coins: expectedCoins,
        totalScore: 1000,
        highestScore: 1500,
        currentLevelId: 'level-02',
      });
    });

    it('restores persisted progress in a later session', async () => {
      const token = await register(app, 'session@example.com');
      await completeLevel(app, token, 'level-01', { score: 1000 });

      // Simulate a new session: log in again and read progress.
      const freshToken = await login(app, 'session@example.com');
      const response = await getProgress(app, freshToken);

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.profile.coins).toBe(expectedCoins);
      expect(body.profile.currentLevelId).toBe('level-02');
      expect(body.levels).toContainEqual({
        levelId: 'level-01',
        completed: true,
        bestScore: 1000,
      });
    });

    it('does not award coins again for a duplicate submission', async () => {
      const token = await register(app, 'dupe@example.com');
      const first = await completeLevel(app, token, 'level-01', { score: 1000 });
      expect(first.json().firstCompletion).toBe(true);

      const second = await completeLevel(app, token, 'level-01', { score: 1000 });
      expect(second.statusCode).toBe(200);
      const body = second.json();
      expect(body.firstCompletion).toBe(false);
      expect(body.result.coins).toBe(0);
      expect(body.profile.coins).toBe(expectedCoins);
    });

    it('improves best and total score on a better replay without extra coins', async () => {
      const token = await register(app, 'replay@example.com');
      await completeLevel(app, token, 'level-01', { score: 800 });
      const better = await completeLevel(app, token, 'level-01', { score: 1500 });

      const body = better.json();
      expect(body.firstCompletion).toBe(false);
      expect(body.result.coins).toBe(0);
      expect(body.level.bestScore).toBe(1500);
      expect(body.profile.totalScore).toBe(1500);
      expect(body.profile.coins).toBe(
        calculateLevelReward({
          totalScore: 1300,
          levelNumber: 1,
          difficulty: 'normal',
          firstCompletion: true,
          config: DEFAULT_ECONOMY_CONFIG,
        }).totalCoins,
      );
    });

    it('grants larger rewards for later levels', async () => {
      const token = await register(app, 'progression@example.com');

      const first = await completeLevel(app, token, 'level-01', { score: 1000 });
      const second = await completeLevel(app, token, 'level-02', { score: 1000 });

      expect(first.statusCode).toBe(200);
      expect(second.statusCode).toBe(200);
      expect(second.json().result.coins).toBeGreaterThan(first.json().result.coins);
    });

    it('rejects completing a locked level', async () => {
      const token = await register(app, 'locked@example.com');
      const response = await completeLevel(app, token, 'level-02', { score: 100 });

      expect(response.statusCode).toBe(403);
      expect(response.json().error).toBe('level_locked');
    });

    it('rejects an unknown level id', async () => {
      const token = await register(app, 'unknown@example.com');
      const response = await completeLevel(app, token, 'level-99', { score: 100 });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('unknown_level');
    });

    it.each([
      ['negative', -1, 'validation_error'],
      ['fractional', 10.5, 'validation_error'],
      ['implausible', 999_999, 'invalid_score'],
    ])('rejects a %s score', async (_label, score, expectedError) => {
      const token = await register(app, `${expectedError}-${String(score)}@example.com`);
      const response = await completeLevel(app, token, 'level-01', { score });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe(expectedError);
    });

    it('accepts a score equal to the theoretical maximum', async () => {
      const token = await register(app, 'max@example.com');
      const response = await completeLevel(app, token, 'level-01', { score: 2150 });
      expect(response.statusCode).toBe(200);
    });

    it('rejects client-supplied reward fields', async () => {
      const token = await register(app, 'cheat@example.com');
      const response = await completeLevel(app, token, 'level-01', { score: 100, coins: 999_999 });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('validation_error');
    });

    it('keeps each user’s progress isolated', async () => {
      const tokenA = await register(app, 'alpha@example.com');
      const tokenB = await register(app, 'bravo@example.com');
      await completeLevel(app, tokenA, 'level-01', { score: 1200 });

      const response = await getProgress(app, tokenB);
      expect(response.json().profile).toEqual({
        coins: 0,
        totalScore: 0,
        highestScore: 0,
        currentLevelId: 'level-01',
        equippedAircraftId: 'starter',
      });
      expect(response.json().levels).toEqual([]);
    });
  });
});