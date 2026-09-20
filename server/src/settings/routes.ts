import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth/middleware';
import { getSettings, updateSettings } from './service';

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/settings', { preHandler: requireAuth }, async (request) => {
    return getSettings(request.authUser!.id);
  });

  app.put('/api/v1/settings', { preHandler: requireAuth }, async (request) => {
    return updateSettings(request.authUser!.id, request.body);
  });
}