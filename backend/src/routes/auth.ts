import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../utils/async-handler';
import {
  authenticateUser,
  consumePendingRegistration,
  createPendingRegistration,
  toPublicUser,
} from '../services/auth';
import { createSession, deleteSession, setSessionCookie, clearSessionCookie } from '../services/session';
import { createVerificationToken, validateVerificationToken } from '../services/verification-token';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email';
import { verifyRecaptcha } from '../utils/recaptcha';
import { prisma } from '../prisma';
import { HttpError } from '../utils/http-error';
import { env } from '../env';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(6).max(128),
  email: z.string().email(),
  recaptchaToken: z.string().min(1),
});

const loginSchema = z.object({
  login: z.string().min(3).max(254),
  password: z.string().min(6).max(128),
  recaptchaToken: z.string().min(1),
});

router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password, email, recaptchaToken } = registerSchema.parse(req.body);

    const captchaOk = await verifyRecaptcha(recaptchaToken);
    if (!captchaOk) {
      throw new HttpError(400, 'Проверка капчи не прошла — обновите страницу и попробуйте снова');
    }

    // В dev: создаём юзера сразу с подтверждённым email, без письма
    if (!env.isProduction) {
      if (await prisma.user.findUnique({ where: { username } })) {
        throw new HttpError(409, 'Никнейм уже занят');
      }
      if (await prisma.user.findUnique({ where: { email } })) {
        throw new HttpError(409, 'Email уже зарегистрирован');
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const role = (await prisma.user.count()) === 0 ? 'ADMIN' : 'USER';
      const user = await prisma.user.create({
        data: { username, email, passwordHash, emailVerified: true, role },
      });
      const { session, expiresAt } = await createSession(user.id, {
        userAgent: req.get('user-agent'),
        ip: req.ip,
      });
      setSessionCookie(res, session.id, expiresAt);
      return res.json({ user: toPublicUser(user) });
    }

    const pending = await createPendingRegistration({ username, password, email });
    sendVerificationEmail(pending.email, pending.token).catch((err) => {
      console.error('[auth] failed to send verification email', err);
    });

    res.status(202).json({ message: 'Verification email sent', email: pending.email });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { login, password, recaptchaToken } = loginSchema.parse(req.body);

    const captchaOk = await verifyRecaptcha(recaptchaToken);
    if (!captchaOk) {
      throw new HttpError(400, 'Проверка капчи не прошла — обновите страницу и попробуйте снова');
    }

    const user = await authenticateUser({ login, password });

    if (!user) {
      throw new HttpError(401, 'Неверный логин или пароль');
    }

    const { session, expiresAt } = await createSession(user.id, {
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });
    setSessionCookie(res, session.id, expiresAt);

    res.json({ user: toPublicUser(user) });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    if (req.currentSession) {
      await deleteSession(req.currentSession.id);
    }

    clearSessionCookie(res);
    res.status(204).send();
  }),
);

router.get(
  '/me',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.currentUser) {
      throw new HttpError(401, 'Not authenticated');
    }

    res.json({ user: toPublicUser(req.currentUser) });
  }),
);

router.post(
  '/verify-email',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.body);

    // New flow: token belongs to a pending registration. Create the user
    // and log them in.
    const newUser = await consumePendingRegistration(token);
    if (newUser) {
      const { session, expiresAt } = await createSession(newUser.id, {
        userAgent: req.get('user-agent'),
        ip: req.ip,
      });
      setSessionCookie(res, session.id, expiresAt);
      res.json({ message: 'Account activated', user: toPublicUser(newUser) });
      return;
    }

    // Смена почты: адрес ждал подтверждения в pendingEmail — переносим его в email.
    const changeUserId = await validateVerificationToken(token, 'EMAIL_CHANGE');
    if (changeUserId) {
      const changingUser = await prisma.user.findUnique({ where: { id: changeUserId } });
      if (!changingUser?.pendingEmail) {
        throw new HttpError(400, 'Запрос на смену email уже неактуален');
      }

      // Пока письмо шло, адрес мог занять кто-то другой.
      const taken = await prisma.user.findUnique({
        where: { email: changingUser.pendingEmail },
      });
      if (taken && taken.id !== changingUser.id) {
        await prisma.user.update({
          where: { id: changingUser.id },
          data: { pendingEmail: null },
        });
        throw new HttpError(409, 'Этот email уже используется другим аккаунтом');
      }

      await prisma.user.update({
        where: { id: changingUser.id },
        data: {
          email: changingUser.pendingEmail,
          emailVerified: true,
          pendingEmail: null,
        },
      });

      res.json({ message: 'Email confirmed' });
      return;
    }

    // Legacy flow: token belongs to an already-existing user that was
    // created before the double-opt-in change. Flip the verified flag.
    const userId = await validateVerificationToken(token, 'EMAIL_VERIFICATION');
    if (!userId) {
      throw new HttpError(400, 'Ссылка недействительна или устарела');
    }

    await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });

    res.json({ message: 'Email confirmed' });
  }),
);

router.post(
  '/forgot-password',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, recaptchaToken } = z
      .object({ email: z.string().email(), recaptchaToken: z.string().min(1) })
      .parse(req.body);

    const captchaOk = await verifyRecaptcha(recaptchaToken);
    if (!captchaOk) {
      throw new HttpError(400, 'Captcha verification failed');
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (user) {
      const token = await createVerificationToken(user.id, 'PASSWORD_RESET');
      sendPasswordResetEmail(email, token).catch(() => {});
    }

    res.json({ message: 'If an account with this email exists, a reset link has been sent' });
  }),
);

router.post(
  '/reset-password',
  asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = z
      .object({ token: z.string().min(1), password: z.string().min(6).max(128) })
      .parse(req.body);

    const userId = await validateVerificationToken(token, 'PASSWORD_RESET');
    if (!userId) {
      throw new HttpError(400, 'Ссылка для сброса недействительна или устарела');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    res.json({ message: 'Password updated' });
  }),
);

router.post(
  '/resend-verification',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.currentUser) {
      throw new HttpError(401, 'Not authenticated');
    }

    const pending = req.currentUser.pendingEmail;

    if (!pending && req.currentUser.emailVerified) {
      throw new HttpError(400, 'Email уже подтверждён');
    }

    const target = pending ?? req.currentUser.email;
    if (!target) {
      throw new HttpError(400, 'К аккаунту не привязан email');
    }

    const token = await createVerificationToken(
      req.currentUser.id,
      pending ? 'EMAIL_CHANGE' : 'EMAIL_VERIFICATION',
    );
    sendVerificationEmail(target, token).catch(() => {});

    res.json({ message: 'Verification email sent' });
  }),
);

export { router as authRouter };
