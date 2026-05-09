import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import type { User } from '@prisma/client';
import { HttpError } from '../utils/http-error';

const SALT_ROUNDS = 12;

export async function registerUser(input: { username: string; password: string; email: string }) {
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    throw new HttpError(409, 'Username is already taken');
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw new HttpError(409, 'Email is already registered');
  }

  const totalUsers = await prisma.user.count();
  const role = totalUsers === 0 ? 'ADMIN' : 'USER';

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      role,
    },
  });

  return user;
}

export async function authenticateUser(input: { username: string; password: string }) {
  const username = input.username.trim();
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return user;
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
    role: user.role,
    avatarKey: user.avatarKey,
    createdAt: user.createdAt,
  };
}
