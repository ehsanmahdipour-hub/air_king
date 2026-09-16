import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password';
import {
  PASSWORD_MAX_LENGTH,
  loginSchema,
  passwordSchema,
  registerSchema,
} from './schemas';

describe('password hashing', () => {
  it('verifies a correct password', async () => {
    const hash = await hashPassword('skyraider1');
    expect(await verifyPassword('skyraider1', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('skyraider1');
    expect(await verifyPassword('wrong-password1', hash)).toBe(false);
  });

  it('never stores the plaintext password', async () => {
    const hash = await hashPassword('skyraider1');
    expect(hash).not.toContain('skyraider1');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('produces a unique salt per hash', async () => {
    const [first, second] = await Promise.all([
      hashPassword('skyraider1'),
      hashPassword('skyraider1'),
    ]);
    expect(first).not.toBe(second);
  });

  it('returns false for malformed hashes rather than throwing', async () => {
    expect(await verifyPassword('skyraider1', 'not-a-valid-hash')).toBe(false);
  });
});

describe('password policy', () => {
  it.each(['skyraider1', 'Abcdefg1', 'a1'.repeat(4)])('accepts %s', (password) => {
    expect(passwordSchema.safeParse(password).success).toBe(true);
  });

  it.each([
    ['too short', 'Abc1'],
    ['no number', 'skyraiders'],
    ['no letter', '12345678'],
    ['too long', `a1${'x'.repeat(PASSWORD_MAX_LENGTH)}`],
  ])('rejects %s', (_label, password) => {
    expect(passwordSchema.safeParse(password).success).toBe(false);
  });
});

describe('registration schema', () => {
  it('normalizes email to lowercase and trims fields', () => {
    const parsed = registerSchema.parse({
      email: '  Pilot@Example.COM ',
      username: '  pilot_one  ',
      password: 'skyraider1',
    });

    expect(parsed.email).toBe('pilot@example.com');
    expect(parsed.username).toBe('pilot_one');
  });

  it('rejects invalid emails and usernames', () => {
    const base = { password: 'skyraider1' };
    expect(registerSchema.safeParse({ ...base, email: 'nope', username: 'pilot' }).success).toBe(
      false,
    );
    expect(
      registerSchema.safeParse({ ...base, email: 'a@b.com', username: 'bad name!' }).success,
    ).toBe(false);
  });
});

describe('login schema', () => {
  it('requires a non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });
});
