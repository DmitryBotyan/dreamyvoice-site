import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/async-handler';
import { requireAuth } from '../middleware/require-auth';
import { prisma } from '../prisma';
import { HttpError } from '../utils/http-error';

const router = Router();

const slugParamsSchema = z.object({
  slug: z.string().trim().min(1),
});

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.currentUser!;
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        title: {
          select: {
            id: true,
            slug: true,
            name: true,
            coverKey: true,
          },
        },
      },
    });

    res.json({
      favorites: favorites.map((favorite) => ({
        id: favorite.title.id,
        slug: favorite.title.slug,
        name: favorite.title.name,
        coverKey: favorite.title.coverKey,
      })),
    });
  }),
);

router.get(
  '/:slug',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugParamsSchema.parse(req.params);
    const user = req.currentUser!;
    const includeDrafts = user.role === 'ADMIN';
    const title = await prisma.title.findFirst({
      where: includeDrafts
        ? buildSlugWhere(slug)
        : {
            ...buildSlugWhere(slug),
            published: true,
          },
    });

    if (!title) {
      throw new HttpError(404, 'Тайтл не найден');
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_titleId: {
          userId: user.id,
          titleId: title.id,
        },
      },
    });

    res.json({ isFavorite: Boolean(favorite) });
  }),
);

router.post(
  '/:slug',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugParamsSchema.parse(req.params);
    const user = req.currentUser!;
    const includeDrafts = user.role === 'ADMIN';
    const title = await prisma.title.findFirst({
      where: includeDrafts
        ? buildSlugWhere(slug)
        : {
            ...buildSlugWhere(slug),
            published: true,
          },
    });

    if (!title) {
      throw new HttpError(404, 'Тайтл не найден');
    }

    await prisma.favorite.upsert({
      where: {
        userId_titleId: {
          userId: user.id,
          titleId: title.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        titleId: title.id,
      },
    });

    res.status(200).json({ isFavorite: true });
  }),
);

router.delete(
  '/:slug',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugParamsSchema.parse(req.params);
    const user = req.currentUser!;
    const includeDrafts = user.role === 'ADMIN';
    const title = await prisma.title.findFirst({
      where: includeDrafts
        ? buildSlugWhere(slug)
        : {
            ...buildSlugWhere(slug),
            published: true,
          },
    });

    if (!title) {
      throw new HttpError(404, 'Тайтл не найден');
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: user.id,
        titleId: title.id,
      },
    });

    res.status(200).json({ isFavorite: false });
  }),
);

function buildSlugWhere(slug: string) {
  return {
    slug: {
      equals: slug.trim(),
      mode: 'insensitive' as const,
    },
  };
}

export { router as favoritesRouter };
