import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

/**
 * Password policy: 8-72 characters, at least one letter and one number.
 * The maximum matches the input length limit of Argon2's pre-hashing and keeps
 * validation simple without imposing needlessly complex rules.
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters long`)
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('A valid email address is required');

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters long')
  .max(24, 'Username must be at most 24 characters long')
  .regex(/^[A-Za-z0-9_]+$/, 'Username may only contain letters, numbers and underscores');

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
