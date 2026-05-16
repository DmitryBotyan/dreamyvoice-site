import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/async-handler';
import { prisma } from '../prisma';
import { HttpError } from '../utils/http-error';

const router = Router();

const usernameParamsSchema = z.object({
  username: z.string().trim().min(1),
});

const STATUSES = ['WATCHING', 'WATCHED', 'DROPPED', 'PLANNED'] as const;

router.get(
  '/:username',
  asyncHandler(async (req: Request, res: Response) => {
    const { username } = usernameParamsSchema.parse(req.params);

    const user = await prisma.user.findFirst({
      where: { username: { equals: username.trim(), mode: 'insensitive' } },
      select: {
        id: true,
        username: true,
        avatarKey: true,
        bio: true,
        role: true,
        favoriteGenres: true,
        createdAt: true,
        animeListEntries: {
          orderBy: { updatedAt: 'desc' },
          include: {
            title: {
              select: {
                id: true,
                slug: true,
                name: true,
                coverKey: true,
                coverBlurHash: true,
              },
            },
          },
        },
      },
    });

    if (!user) throw new HttpError(404, 'Пользователь не найден');

    const animeList = Object.fromEntries(
      STATUSES.map((status) => [
        status,
        user.animeListEntries
          .filter((e) => e.status === status)
          .map((e) => ({
            id: e.title.id,
            slug: e.title.slug,
            name: e.title.name,
            coverKey: e.title.coverKey,
            coverBlurHash: e.title.coverBlurHash,
          })),
      ]),
    );

    const recentActivity = user.animeListEntries.slice(0, 6).map((e) => ({
      status: e.status,
      updatedAt: e.updatedAt.toISOString(),
      title: { id: e.title.id, slug: e.title.slug, name: e.title.name },
    }));

    res.json({
      user: {
        id: user.id,
        username: user.username,
        avatarKey: user.avatarKey,
        bio: user.bio,
        role: user.role,
        favoriteGenres: user.favoriteGenres,
        createdAt: user.createdAt,
      },
      animeList,
      recentActivity,
    });
  }),
);

export { router as usersRouter };
