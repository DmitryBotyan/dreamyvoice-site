import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { prisma } from '../prisma';
import type { User } from '@prisma/client';
import { HttpError } from '../utils/http-error';

const SALT_ROUNDS = 12;
const PENDING_REGISTRATION_TTL_HOURS = 24;

function generatePendingToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Stage a registration for double opt-in. The user record is NOT created
 * until they click the verification link. If the same email/username is
 * already pending, the previous record is overwritten (re-send flow).
 */
export async function createPendingRegistration(input: {
  username: string;
  password: string;
  email: string;
}) {
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

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const token = generatePendingToken();
  const expiresAt = new Date(Date.now() + PENDING_REGISTRATION_TTL_HOURS * 60 * 60 * 1000);

  await prisma.pendingRegistration.deleteMany({
    where: { OR: [{ email }, { username }] },
  });

  const pending = await prisma.pendingRegistration.create({
    data: { token, username, email, passwordHash, expiresAt },
  });

  return pending;
}

/**
 * Consume a pending registration token: create the actual User row and
 * remove the pending record. Returns null if the token is unknown or
 * expired (caller should treat both the same way to avoid leaking info).
 */
export async function consumePendingRegistration(token: string) {
  const pending = await prisma.pendingRegistration.findUnique({ where: { token } });
  if (!pending) return null;
  if (pending.expiresAt.getTime() < Date.now()) {
    await prisma.pendingRegistration.delete({ where: { id: pending.id } }).catch(() => {});
    return null;
  }

  const totalUsers = await prisma.user.count();
  const role = totalUsers === 0 ? 'ADMIN' : 'USER';

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        username: pending.username,
        email: pending.email,
        passwordHash: pending.passwordHash,
        emailVerified: true,
        role,
      },
    });
    await tx.pendingRegistration.delete({ where: { id: pending.id } });
    return created;
  });

  return user;
}

export async function authenticateUser(input: { login: string; password: string }) {
  const login = input.login.trim();
  const isEmail = login.includes('@');

  let user;
  if (isEmail) {
    user = await prisma.user.findUnique({ where: { email: login.toLowerCase() } });
  } else {
    user = await prisma.user.findUnique({ where: { username: login } });
  }

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
    bio: user.bio,
    createdAt: user.createdAt,
  };
}
