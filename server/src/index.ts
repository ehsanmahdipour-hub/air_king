import 'dotenv/config';

import { buildApp } from './app';
import { prisma } from './db/prisma';

const DEFAULT_PORT = 3001;

async function start(): Promise<void> {
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  const host = process.env.HOST ?? '0.0.0.0';

  const app = await buildApp();

  try {
    await app.listen({ port, host });
  } catch (error) {
    app.log.error(error, 'failed to start server');
    await prisma.$disconnect();
    process.exit(1);
  }

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'shutting down');
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void start();
