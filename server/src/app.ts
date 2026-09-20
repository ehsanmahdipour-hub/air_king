import cookie from '@fastify/cookie';
import Fastify, { type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

import { authRoutes } from './auth/routes';
import { aircraftRoutes } from './aircraft/routes';
import { AppError } from './errors';
import { progressRoutes } from './progress/routes';
import { healthRoutes } from './routes/health';
import { upgradeRoutes } from './upgrades/routes';

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

  await app.register(cookie);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({ error: error.code, message: error.message });
    }

    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: 'validation_error',
        message: 'Invalid request data',
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    request.log.error(error, 'unhandled request error');
    return reply
      .code(500)
      .send({ error: 'internal_error', message: 'An unexpected error occurred' });
  });

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(progressRoutes);
  await app.register(upgradeRoutes);
  await app.register(aircraftRoutes);

  return app;
}
