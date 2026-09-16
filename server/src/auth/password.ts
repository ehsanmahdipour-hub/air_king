import { hash, verify } from '@node-rs/argon2';

/**
 * Argon2id parameters following the OWASP-recommended baseline
 * (19 MiB memory, 2 iterations, 1 degree of parallelism). `@node-rs/argon2`
 * defaults to the Argon2id variant; `password.test.ts` asserts the produced
 * hash uses it so the default cannot change silently.
 */
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, ARGON2_OPTIONS);
}

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, plainPassword);
  } catch {
    return false;
  }
}
