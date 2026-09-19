import { z } from 'zod';

/**
 * Only the gameplay score is accepted from the client. Coin balances, prices,
 * bonuses and rewards are server-owned, so the schema is strict: any attempt to
 * send reward fields is rejected rather than silently ignored.
 */
export const completeLevelSchema = z
  .object({
    score: z
      .number()
      .int('Score must be a whole number')
      .nonnegative('Score must be non-negative'),
  })
  .strict();

export type CompleteLevelInput = z.infer<typeof completeLevelSchema>;
