import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth/middleware';
import { completeLevelSchema } from './schemas';
import { completeLevel, getProgress } from './service';

export async function progressRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/progress', { preHandler: requireAuth }, async (request) => {
    return getProgress(request.authUser!.id);
  });

  app.post<{ Params: { levelId: string } }>(
    '/api/v1/progress/levels/:levelId/complete',
    { preHandler: requireAuth },
    async (request) => {
      const input = completeLevelSchema.parse(request.body);
      return completeLevel(request.authUser!.id, request.params.levelId, input.score);
    },
  );
}
