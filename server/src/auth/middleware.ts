import type { FastifyReply, FastifyRequest } from 'fastify';

import { verifyAccessToken, type AuthenticatedUser } from './tokens';

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthenticatedUser;
  }
}

export function extractBearerToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

/**
 * Fastify preHandler that requires a valid access token. On success the caller
 * is attached to `request.authUser`; otherwise a 401 response is sent and the
 * handler chain is stopped.
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = extractBearerToken(request.headers.authorization);

  if (!token) {
    await reply.code(401).send({ error: 'unauthorized', message: 'Authentication required' });
    return;
  }

  try {
    request.authUser = await verifyAccessToken(token);
  } catch {
    await reply
      .code(401)
      .send({ error: 'unauthorized', message: 'Invalid or expired access token' });
  }
}
