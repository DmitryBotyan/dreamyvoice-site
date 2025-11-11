import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { prisma } from '../prisma';
import { AGE_RATINGS } from '../constants/catalog-keywords';

const router = Router();

router.get(
  '/genres',
  asyncHandler(async (_req, res) => {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ genres: genres.map((genre) => genre.name) });
  }),
);

router.get(
  '/tags',
  asyncHandler(async (_req, res) => {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ tags: tags.map((tag) => tag.name) });
  }),
);

router.get('/age-ratings', (_req, res) => {
  res.json({ ageRatings: AGE_RATINGS });
});

export { router as metadataRouter };
