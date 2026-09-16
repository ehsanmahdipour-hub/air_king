/**
 * Application-level error with a safe, structured representation. The global
 * Fastify error handler maps these to HTTP responses without leaking internal
 * details.
 */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
