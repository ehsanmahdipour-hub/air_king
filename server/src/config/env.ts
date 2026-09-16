import 'dotenv/config';

import { z } from 'zod';

/**
 * Runtime environment configuration. Parsed and validated once at startup so
 * the process fails fast on missing or invalid configuration instead of
 * failing later at an unpredictable point. Secrets have no defaults.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().min(1).default('0.0.0.0'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  ACCESS_TOKEN_TTL: z.string().min(1).default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
});

export const env = envSchema.parse(process.env);

export type Env = typeof env;
