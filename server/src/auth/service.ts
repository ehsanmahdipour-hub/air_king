import { Prisma } from '@prisma/client';

import { prisma } from '../db/prisma';
import { AppError } from '../errors';
import type { AuthenticatedUser } from './tokens';
import { hashPassword, verifyPassword } from './password';
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
} from './tokens';
import type { LoginInput, RegisterInput } from './schemas';

export interface PublicUser extends AuthenticatedUser {
  createdAt: Date;
}

interface UserRecord {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: Date;
}

/** Strips sensitive fields so a user record is safe to return to clients. */
function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  };
}

async function createRefreshToken(userId: string): Promise<string> {
  const token = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(token),
      expiresAt: refreshTokenExpiryDate(),
    },
  });

  return token;
}

export async function registerUser(
  input: RegisterInput,
): Promise<{ user: PublicUser; refreshToken: string }> {
  const passwordHash = await hashPassword(input.password);

  let user: UserRecord;
  try {
    user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash,
        profile: { create: {} },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'account_exists', 'Email or username is already registered');
    }
    throw error;
  }

  const refreshToken = await createRefreshToken(user.id);
  return { user: toPublicUser(user), refreshToken };
}

export async function authenticateUser(
  input: LoginInput,
): Promise<{ user: PublicUser; refreshToken: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Return the same error for unknown accounts and wrong passwords to avoid
  // revealing which emails are registered.
  if (!user) {
    throw new AppError(401, 'invalid_credentials', 'Invalid email or password');
  }

  const passwordValid = await verifyPassword(input.password, user.passwordHash);
  if (!passwordValid) {
    throw new AppError(401, 'invalid_credentials', 'Invalid email or password');
  }

  const refreshToken = await createRefreshToken(user.id);
  return { user: toPublicUser(user), refreshToken };
}

/**
 * Rotates a refresh token: the presented token is revoked and a new one is
 * issued. If an already-revoked token is presented (possible token theft), all
 * of that user's active refresh tokens are revoked.
 */
export async function rotateRefreshToken(
  rawToken: string,
): Promise<{ user: PublicUser; refreshToken: string }> {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(rawToken) },
    include: { user: true },
  });

  if (!stored || stored.expiresAt <= new Date()) {
    throw new AppError(401, 'invalid_refresh_token', 'Refresh token is invalid or expired');
  }

  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AppError(401, 'invalid_refresh_token', 'Refresh token is invalid or expired');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const refreshToken = await createRefreshToken(stored.userId);
  return { user: toPublicUser(stored.user), refreshToken };
}

/** Revokes a refresh token if it exists. Idempotent so logout is safe to retry. */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getPublicUserById(id: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toPublicUser(user) : null;
}
