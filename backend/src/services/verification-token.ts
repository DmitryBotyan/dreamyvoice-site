import crypto from 'crypto';
import { prisma } from '../prisma';
import type { TokenType } from '@prisma/client';

const TTL: Record<TokenType, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
  EMAIL_CHANGE: 24 * 60 * 60 * 1000,
};

export async function createVerificationToken(userId: string, type: TokenType) {
  await prisma.verificationToken.deleteMany({ where: { userId, type } });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TTL[type]);

  await prisma.verificationToken.create({ data: { token, userId, type, expiresAt } });
  return token;
}

export async function validateVerificationToken(token: string, type: TokenType) {
  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || record.type !== type || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.verificationToken.delete({ where: { id: record.id } });
  return record.userId;
}
