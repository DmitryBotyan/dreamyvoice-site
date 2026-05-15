import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth';
import { asyncHandler } from '../utils/async-handler';
import { prisma } from '../prisma';
import { HttpError } from '../utils/http-error';
import { toPublicUser } from '../services/auth';
import { deleteObject, makeObjectKey, uploadObject } from '../services/storage';
import { createVerificationToken } from '../services/verification-token';
import { sendVerificationEmail } from '../services/email';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const allowedAvatarMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

const profileUpdateSchema = z.object({
  username: z.string().trim().min(3).max(32).optional(),
  bio: z.string().trim().max(500).nullable().optional(),
});

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ user: toPublicUser(req.currentUser!) });
  }),
);

router.patch(
  '/',
  requireAuth,
  upload.single('avatar'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.currentUser!;
    const { username, bio } = profileUpdateSchema.parse(req.body);

    if (username && username !== user.username) {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        throw new HttpError(409, 'Никнейм уже занят');
      }
    }

    const avatarFile = req.file;
    let newAvatarKey: string | undefined;

    if (avatarFile) {
      if (!allowedAvatarMimeTypes.has(avatarFile.mimetype)) {
        throw new HttpError(400, 'Допустимы только PNG, JPEG или WEBP');
      }

      const key = makeObjectKey(avatarFile.originalname);
      await uploadObject({
        bucket: 'avatars',
        key,
        body: avatarFile.buffer,
        contentType: avatarFile.mimetype,
      });
      newAvatarKey = key;

      if (user.avatarKey) {
        await deleteObject('avatars', user.avatarKey).catch(() => {});
      }
    }

    if (!username && !newAvatarKey && bio === undefined) {
      return res.json({ user: toPublicUser(user) });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: username ?? undefined,
        avatarKey: newAvatarKey ?? undefined,
        bio: bio !== undefined ? (bio || null) : undefined,
      },
    });

    res.json({ user: toPublicUser(updatedUser) });
  }),
);

// ── Email change ────────────────────────────────────────────────────────────

const emailChangeSchema = z.object({
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
});

router.post(
  '/email',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.currentUser!;
    const { email } = emailChangeSchema.parse(req.body);

    if (user.email === email && user.emailVerified) {
      throw new HttpError(409, 'Этот email уже привязан и подтверждён');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== user.id) {
      throw new HttpError(409, 'Этот email уже используется другим аккаунтом');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { email, emailVerified: false },
    });

    const token = await createVerificationToken(user.id, 'EMAIL_VERIFICATION');
    sendVerificationEmail(email, token).catch((err) => {
      console.error('[profile] failed to send verification email', err);
    });

    res.json({ message: 'Письмо с подтверждением отправлено', email });
  }),
);

export { router as profileRouter };
