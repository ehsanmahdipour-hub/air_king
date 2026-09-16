import Fastify, { type FastifyInstance } from 'fastify';

import { healthRoutes } from './routes/health';

export interface BuildAppOptions {
  logger?: boolean;
}

/**
 * Builds and configures the Fastify instance without starting it. Exported
 * separately from the entrypoint so tests can use `app.inject()`.
 */
export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? true,
  });

  await app.register(healthRoutes);

  return app;
}
