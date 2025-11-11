import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import type { Episode as EpisodeModel, Genre, Tag } from '@prisma/client';
import { asyncHandler } from '../utils/async-handler';
import { HttpError } from '../utils/http-error';
import { requireAuth } from '../middleware/require-auth';
import { requireAdmin } from '../middleware/require-admin';
import { AGE_RATINGS } from '../constants/catalog-keywords';

const titleAgeRatingEnum = z.enum(AGE_RATINGS);

type TitleWithEpisodes = Prisma.TitleGetPayload<{ include: { episodes: true } }>;
type CommentWithUser = Prisma.CommentGetPayload<{ include: { user: true } }>;

const router = Router();
const commentsRouter = Router({ mergeParams: true });
const episodesRouter = Router({ mergeParams: true });

const titleQuerySchema = z.object({
  includeDrafts: z
    .union([z.literal('1'), z.literal('0')])
    .optional()
    .transform((value) => value === '1'),
});

const parseReleaseDateInput = (value?: string | null): Date | null | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeStringList = (values?: string[] | null) =>
  Array.from(
    new Set(
      (values ?? [])
        .map((value) => value.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );

const ensureGenres = async (names?: string[] | null) => {
  const normalized = normalizeStringList(names);
  if (normalized.length === 0) {
    return [];
  }
  const existing = await prisma.genre.findMany({
    where: { name: { in: normalized } },
  });
  const existingNames = new Set(existing.map((genre) => genre.name));
  const missing = normalized.filter((name) => !existingNames.has(name));
  const created: Genre[] = [];
  for (const name of missing) {
    const genre = await prisma.genre.create({ data: { name } });
    created.push(genre);
  }
  return [...existing, ...created];
};

const ensureTags = async (names?: string[] | null) => {
  const normalized = normalizeStringList(names);
  if (normalized.length === 0) {
    return [];
  }
  const existing = await prisma.tag.findMany({
    where: { name: { in: normalized } },
  });
  const existingNames = new Set(existing.map((tag) => tag.name));
  const missing = normalized.filter((name) => !existingNames.has(name));
  const created: Tag[] = [];
  for (const name of missing) {
    const tag = await prisma.tag.create({ data: { name } });
    created.push(tag);
  }
  return [...existing, ...created];
};

const titleCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Slug может содержать только латинские буквы, цифры и дефис'),
  name: z
    .string()
    .trim()
    .min(3)
    .max(128),
  description: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .transform((value) => value || undefined),
  coverKey: z
    .string()
    .trim()
    .max(255)
    .optional()
    .transform((value) => value || undefined),
  genres: z
    .array(z.string().trim().min(1))
    .optional()
    .transform((value) => normalizeStringList(value)),
  tags: z
    .array(z.string().trim().min(1))
    .optional()
    .transform((value) => normalizeStringList(value)),
  originalReleaseDate: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value.trim() : undefined)),
  ageRating: titleAgeRatingEnum.optional(),
  published: z.boolean().optional().default(false),
});

const titleUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(128)
    .optional(),
  description: z
    .union([z.string().trim().max(5000), z.null()])
    .optional(),
  coverKey: z
    .union([z.string().trim().max(255), z.null()])
    .optional(),
  published: z.boolean().optional(),
  genres: z.array(z.string().trim().min(1)).optional().transform((value) => normalizeStringList(value)),
  tags: z.array(z.string().trim().min(1)).optional().transform((value) => normalizeStringList(value)),
  originalReleaseDate: z.union([z.string(), z.null()]).optional(),
  ageRating: titleAgeRatingEnum.optional(),
});

const episodeCreateSchema = z.object({
  number: z.coerce.number().int().positive().max(10000),
  name: z
    .string()
    .trim()
    .min(3)
    .max(128),
  playerSrc: z.string().url(),
  durationMinutes: z
    .union([z.coerce.number().int().positive().max(2000), z.literal(null)])
    .optional(),
  published: z.boolean().optional().default(false),
});

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const query = titleQuerySchema.parse(req.query);
    const canSeeDrafts = query.includeDrafts && req.currentUser?.role === 'ADMIN';

    const titles = await prisma.title.findMany({
      where: canSeeDrafts
        ? {}
        : {
            published: true,
          },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        episodes: {
          where: canSeeDrafts
            ? {}
            : {
                published: true,
              },
          orderBy: {
            number: 'asc',
          },
        },
        genres: true,
        tags: true,
      },
    });

    res.json({ titles: titles.map(toTitleDto(canSeeDrafts)) });
  }),
);

const slugSchema = z.object({ slug: z.string().min(1).transform((value) => value.trim()) });

router.get(
  '/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugSchema.parse(req.params);
    const includeDrafts = req.currentUser?.role === 'ADMIN';
    const title = await prisma.title.findFirst({
      where: buildSlugWhere(slug),
      include: {
        episodes: {
          where: includeDrafts
            ? {}
            : {
                published: true,
              },
          orderBy: { number: 'asc' },
        },
        genres: true,
        tags: true,
      },
    });

    if (!title || (!title.published && !includeDrafts)) {
      throw new HttpError(404, 'Title not found');
    }

    res.json({ title: toTitleDto(includeDrafts)(title) });
  }),
);

const commentBodySchema = z.object({
  body: z
    .string()
    .trim()
    .min(3, 'Комментарий слишком короткий')
    .max(2000, 'Комментарий слишком длинный'),
});

commentsRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugSchema.parse(req.params);
    const includeModeration = req.currentUser?.role === 'ADMIN';
    const title = await prisma.title.findFirst({ where: buildSlugWhere(slug) });

    if (!title || (!title.published && !includeModeration)) {
      throw new HttpError(404, 'Title not found');
    }

    const comments = await prisma.comment.findMany({
      where: {
        titleId: title.id,
        ...(includeModeration ? {} : { status: 'APPROVED' }),
      },
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    });

    res.json({ comments: comments.map(toCommentDto(includeModeration)) });
  }),
);

commentsRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugSchema.parse(req.params);
    const { body } = commentBodySchema.parse(req.body);
    const user = req.currentUser!;
    const title = await prisma.title.findFirst({ where: buildSlugWhere(slug) });

    if (!title || (!title.published && user.role !== 'ADMIN')) {
      throw new HttpError(404, 'Title not found');
    }

    const comment = await prisma.comment.create({
      data: {
        titleId: title.id,
        userId: user.id,
        body,
        status: user.role === 'ADMIN' ? 'APPROVED' : undefined,
      },
      include: { user: true },
    });

    res.status(201).json({ comment: toCommentDto(user.role === 'ADMIN')(comment) });
  }),
);

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const data = titleCreateSchema.parse(req.body);
    const parsedOriginalReleaseDate = parseReleaseDateInput(data.originalReleaseDate);
    const genres = await ensureGenres(data.genres);
    const tags = await ensureTags(data.tags);

    try {
      const title = await prisma.title.create({
        data: {
          slug: data.slug,
          name: data.name,
          description: data.description ?? null,
          coverKey: data.coverKey ?? null,
          published: data.published ?? false,
          genres: {
            connect: genres.map((genre) => ({ id: genre.id })),
          },
          tags: {
            connect: tags.map((tag) => ({ id: tag.id })),
          },
          originalReleaseDate: parsedOriginalReleaseDate ?? null,
          ageRating: data.ageRating ?? null,
        },
        include: {
          episodes: true,
          genres: true,
          tags: true,
        },
      });

      res.status(201).json({ title: toTitleDto(true)(title) });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HttpError(409, 'Тайтл с таким slug уже существует');
      }

      throw error;
    }
  }),
);

router.patch(
  '/:slug',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugSchema.parse(req.params);
    const updates = titleUpdateSchema.parse(req.body);

    if (!Object.values(updates).some((value) => value !== undefined)) {
      throw new HttpError(400, 'Нет изменений для сохранения');
    }

    const existing = await prisma.title.findFirst({
      where: buildSlugWhere(slug),
    });

    if (!existing) {
      throw new HttpError(404, 'Title not found');
    }

    const data: Prisma.TitleUpdateInput = {};
    if (updates.name !== undefined) {
      data.name = updates.name;
    }
    if (updates.description !== undefined) {
      data.description = updates.description;
    }
    if (updates.coverKey !== undefined) {
      data.coverKey = updates.coverKey;
    }
    if (updates.published !== undefined) {
      data.published = updates.published;
    }
    if (updates.genres !== undefined) {
      const genres = await ensureGenres(updates.genres);
      data.genres = {
        set: genres.map((genre) => ({ id: genre.id })),
      };
    }
    if (updates.tags !== undefined) {
      const tags = await ensureTags(updates.tags);
      data.tags = {
        set: tags.map((tag) => ({ id: tag.id })),
      };
    }
    if (updates.originalReleaseDate !== undefined) {
      data.originalReleaseDate = parseReleaseDateInput(updates.originalReleaseDate);
    }
    if (updates.ageRating !== undefined) {
      data.ageRating = updates.ageRating;
    }

    const updatedTitle = await prisma.title.update({
      where: { id: existing.id },
      data,
      include: {
        episodes: {
          orderBy: { number: 'asc' },
        },
        genres: true,
        tags: true,
      },
    });

    res.json({ title: toTitleDto(true)(updatedTitle) });
  }),
);

episodesRouter.post(
  '/',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugSchema.parse(req.params);
    const title = await prisma.title.findFirst({
      where: buildSlugWhere(slug),
    });

    if (!title) {
      throw new HttpError(404, 'Title not found');
    }

    const data = episodeCreateSchema.parse(req.body);

    try {
      const episode = await prisma.episode.create({
        data: {
          titleId: title.id,
          number: data.number,
          name: data.name,
          playerSrc: data.playerSrc,
          durationMinutes: data.durationMinutes ?? null,
          published: data.published ?? false,
        },
      });

      res.status(201).json({ episode: toEpisodeDto(true, episode) });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HttpError(409, 'Серия с таким номером уже существует');
      }

      throw error;
    }
  }),
);

router.use('/:slug/comments', commentsRouter);
router.use('/:slug/episodes', episodesRouter);

type EpisodeWithParent = TitleWithEpisodes['episodes'][number];
type CommentAuthor = CommentWithUser['user'];

function toTitleDto(includeDrafts: boolean) {
  return (title: TitleWithEpisodes) => ({
    id: title.id,
    slug: title.slug,
    name: title.name,
    description: title.description,
    genres: title.genres.map((genre) => genre.name),
    tags: title.tags.map((tag) => tag.name),
    ageRating: title.ageRating,
    originalReleaseDate: title.originalReleaseDate,
    coverKey: title.coverKey,
    published: title.published,
    createdAt: title.createdAt,
    updatedAt: title.updatedAt,
    episodes: title.episodes
      .slice()
      .sort((a, b) => a.number - b.number)
      .map((episode: EpisodeWithParent) => toEpisodeDto(includeDrafts, episode)),
  });
}

function toEpisodeDto(includeDrafts: boolean, episode: EpisodeModel) {
  return {
    id: episode.id,
    number: episode.number,
    name: episode.name,
    durationMinutes: episode.durationMinutes,
    playerSrc: includeDrafts || episode.published ? episode.playerSrc : undefined,
    published: episode.published,
  };
}

function toCommentDto(includeStatus: boolean) {
  return (comment: CommentWithUser) => ({
    id: comment.id,
    body: comment.body,
    status: includeStatus ? comment.status : undefined,
    createdAt: comment.createdAt,
    author: toCommentAuthor(comment.user),
  });
}

function toCommentAuthor(user: CommentAuthor) {
  return {
    id: user.id,
    username: user.username,
    avatarKey: user.avatarKey,
  };
}

export { router as titlesRouter };

function buildSlugWhere(slug: string) {
  return {
    slug: {
      equals: slug.trim(),
      mode: 'insensitive' as const,
    },
  };
}
