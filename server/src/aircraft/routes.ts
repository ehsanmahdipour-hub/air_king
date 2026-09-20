import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth/middleware';
import { equipAircraft, getAircraftState, purchaseAircraft } from './service';

export async function aircraftRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/aircraft', { preHandler: requireAuth }, async (request) => {
    return getAircraftState(request.authUser!.id);
  });

  app.post<{ Params: { aircraftId: string } }>(
    '/api/v1/aircraft/:aircraftId/purchase',
    { preHandler: requireAuth },
    async (request) => {
      return purchaseAircraft(request.authUser!.id, request.params.aircraftId);
    },
  );

  app.post<{ Params: { aircraftId: string } }>(
    '/api/v1/aircraft/:aircraftId/equip',
    { preHandler: requireAuth },
    async (request) => {
      return equipAircraft(request.authUser!.id, request.params.aircraftId);
    },
  );
}