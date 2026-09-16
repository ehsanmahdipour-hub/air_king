import type { FastifyInstance, FastifyReply } from 'fastify';

import { AppError } from '../errors';
import { requireAuth } from './middleware';
import { loginSchema, registerSchema } from './schemas';
import {
  authenticateUser,
  getPublicUserById,
  registerUser,
  revokeRefreshToken,
  rotateRefreshToken,
} from './service';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  refreshCookieOptions,
  signAccessToken,
} from './tokens';

function setRefreshCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}

function clearRefreshCookie(reply: FastifyReply): void {
  reply.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

function readRefreshCookie(cookies: Record<string, string | undefined>): string {
  const token = cookies[REFRESH_COOKIE_NAME];
  if (!token) {
    throw new AppError(401, 'invalid_refresh_token', 'Refresh token is missing');
  }
  return token;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/auth/register', async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const { user, refreshToken } = await registerUser(input);

    setRefreshCookie(reply, refreshToken);
    return reply.code(201).send({
      accessToken: await signAccessToken(user),
      user,
    });
  });

  app.post('/api/v1/auth/login', async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const { user, refreshToken } = await authenticateUser(input);

    setRefreshCookie(reply, refreshToken);
    return reply.send({
      accessToken: await signAccessToken(user),
      user,
    });
  });

  app.post('/api/v1/auth/refresh', async (request, reply) => {
    const token = readRefreshCookie(request.cookies);
    const { user, refreshToken } = await rotateRefreshToken(token);

    setRefreshCookie(reply, refreshToken);
    return reply.send({
      accessToken: await signAccessToken(user),
      user,
    });
  });

  app.post('/api/v1/auth/logout', async (request, reply) => {
    if (request.cookies[REFRESH_COOKIE_NAME]) {
      await revokeRefreshToken(request.cookies[REFRESH_COOKIE_NAME]);
    }

    clearRefreshCookie(reply);
    return reply.code(204).send();
  });

  app.get('/api/v1/auth/me', { preHandler: requireAuth }, async (request, reply) => {
    const user = await getPublicUserById(request.authUser!.id);
    if (!user) {
      throw new AppError(401, 'unauthorized', 'Account no longer exists');
    }
    return reply.send({ user });
  });
}
