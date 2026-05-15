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

const statusBodySchema = z.object({
  status: z.enum(['WATCHING', 'WATCHED', 'DROPPED', 'PLANNED']),
});

const titleSelect = {
  id: true,
  slug: true,
  name: true,
  coverKey: true,
  coverBlurHash: true,
} as const;

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.currentUser!;
    const entries = await prisma.animeListEntry.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: { title: { select: titleSelect } },
    });

    res.json({
      entries: entries.map((e) => ({
        status: e.status,
        title: {
          id: e.title.id,
          slug: e.title.slug,
          name: e.title.name,
          coverKey: e.title.coverKey,
          coverBlurHash: e.title.coverBlurHash,
        },
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

    const title = await findTitle(slug, user.role === 'ADMIN');
    if (!title) throw new HttpError(404, 'Тайтл не найден');

    const entry = await prisma.animeListEntry.findUnique({
      where: { userId_titleId: { userId: user.id, titleId: title.id } },
    });

    res.json({ status: entry?.status ?? null });
  }),
);

router.put(
  '/:slug',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugParamsSchema.parse(req.params);
    const { status } = statusBodySchema.parse(req.body);
    const user = req.currentUser!;

    const title = await findTitle(slug, user.role === 'ADMIN');
    if (!title) throw new HttpError(404, 'Тайтл не найден');

    await prisma.animeListEntry.upsert({
      where: { userId_titleId: { userId: user.id, titleId: title.id } },
      update: { status },
      create: { userId: user.id, titleId: title.id, status },
    });

    res.json({ status });
  }),
);

router.delete(
  '/:slug',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugParamsSchema.parse(req.params);
    const user = req.currentUser!;

    const title = await findTitle(slug, user.role === 'ADMIN');
    if (!title) throw new HttpError(404, 'Тайтл не найден');

    await prisma.animeListEntry.deleteMany({
      where: { userId: user.id, titleId: title.id },
    });

    res.json({ status: null });
  }),
);

function findTitle(slug: string, includeDrafts: boolean) {
  const where = {
    slug: { equals: slug.trim(), mode: 'insensitive' as const },
  };
  return prisma.title.findFirst({
    where: includeDrafts ? where : { ...where, published: true },
    select: { id: true },
  });
}

export { router as animeListRouter };
