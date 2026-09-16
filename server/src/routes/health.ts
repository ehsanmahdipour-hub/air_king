import type { FastifyInstance } from 'fastify';

import { prisma } from '../db/prisma';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/health', async () => ({
    status: 'ok',
    uptime: process.uptime(),
  }));

  app.get('/api/health/db', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch (error) {
      app.log.error(error, 'database health check failed');
      return reply.status(503).send({ status: 'error', database: 'unreachable' });
    }
  });
}
