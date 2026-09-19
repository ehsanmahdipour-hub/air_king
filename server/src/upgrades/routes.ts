import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth/middleware';
import { getUpgrades, purchaseUpgrade } from './service';

export async function upgradeRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/upgrades', { preHandler: requireAuth }, async (request) => {
    return getUpgrades(request.authUser!.id);
  });

  app.post<{ Params: { upgradeId: string } }>(
    '/api/v1/upgrades/:upgradeId/purchase',
    { preHandler: requireAuth },
    async (request) => {
      return purchaseUpgrade(request.authUser!.id, request.params.upgradeId);
    },
  );
}