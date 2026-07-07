import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import slugify from 'slugify';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import type { Episode as EpisodeModel, Genre, Tag, Rating } from '@prisma/client';
import { asyncHandler } from '../utils/async-handler';
import { HttpError } from '../utils/http-error';
import { requireAuth } from '../middleware/require-auth';
import { requireAdmin } from '../middleware/require-admin';
import { AGE_RATINGS } from '../constants/catalog-keywords';
import { deleteObject } from '../services/storage';
import { env } from '../env';

const titleAgeRatingEnum = z.enum(AGE_RATINGS);

type TitleWithEpisodes = Prisma.TitleGetPayload<{
  include: {
    episodes: true;
    genres: true;
    tags: true;
    ratings: true;
  };
}>;
type CommentWithUser = Prisma.CommentGetPayload<{ include: { user: true } }>;
type CommentWithReactions = Prisma.CommentGetPayload<{
  include: { user: true; reactions: true; replies: { include: { user: true; reactions: true } } };
}>;

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

const SLUG_MIN_LENGTH = 3;
const SLUG_MAX_LENGTH = 64;
const slugifyOptions = {
  lower: true,
  strict: true,
  trim: true,
  locale: 'ru',
} as const;

const trimSlugEdges = (value: string) => value.replace(/^-+|-+$/g, '');

const buildBaseSlug = (value: string) => {
  const generated = slugify(value, slugifyOptions);
  const trimmed = trimSlugEdges(generated);
  return trimSlugEdges(trimmed.slice(0, SLUG_MAX_LENGTH));
};

const ensureSlugMinLength = (value: string) => {
  if (value.length >= SLUG_MIN_LENGTH) {
    return value;
  }

  return `${value}${'x'.repeat(SLUG_MIN_LENGTH - value.length)}`;
};

const getUniqueSlug = async (baseSlug: string) => {
  let candidate = baseSlug;
  let counter = 1;

  while (await prisma.title.findUnique({ where: { slug: candidate } })) {
    const suffix = `-${counter}`;
    const maxBaseLength = Math.max(0, SLUG_MAX_LENGTH - suffix.length);
    const truncatedBase = trimSlugEdges(baseSlug.slice(0, maxBaseLength));
    candidate = `${truncatedBase}${suffix}`;
    counter += 1;
  }

  return candidate;
};

const generateUniqueTitleSlug = async (name: string) => {
  const rawSlug = buildBaseSlug(name);
  const ensured = ensureSlugMinLength(rawSlug || 'title');
  return getUniqueSlug(ensured);
};

const titleCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(255),
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
  coverBlurHash: z
    .string()
    .trim()
    .max(100)
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
  cvhAggregator: z.enum(['kp', 'mali', 'mdl']).optional().nullable(),
});

const titleUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(255)
    .optional(),
  description: z
    .union([z.string().trim().max(5000), z.null()])
    .optional(),
  coverKey: z
    .union([z.string().trim().max(255), z.null()])
    .optional(),
  coverBlurHash: z
    .union([z.string().trim().max(100), z.null()])
    .optional(),
  published: z.boolean().optional(),
  genres: z.array(z.string().trim().min(1)).optional().transform((value) => normalizeStringList(value)),
  tags: z.array(z.string().trim().min(1)).optional().transform((value) => normalizeStringList(value)),
  originalReleaseDate: z.union([z.string(), z.null()]).optional(),
  ageRating: titleAgeRatingEnum.optional(),
  cvhAggregator: z.union([z.enum(['kp', 'mali', 'mdl']), z.null()]).optional(),
});

const episodeCreateSchema = z
  .object({
    number: z.coerce.number().int().positive().max(10000),
    playerSrc: z.string().url().optional().nullable(),
    cvhVideoId: z.string().trim().min(1).optional().nullable(),
    durationMinutes: z
      .union([z.coerce.number().int().positive().max(2000), z.literal(null)])
      .optional(),
    published: z.boolean().optional().default(false),
  })
  .refine((data) => data.playerSrc || data.cvhVideoId, {
    message: 'Необходимо указать либо ссылку на плеер (playerSrc), либо Content ID CDNVideoHub (cvhVideoId)',
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
        ratings: true,
      },
    });

    res.json({ titles: titles.map(toTitleDto(canSeeDrafts, req.currentUser?.id)) });
  }),
);

router.get(
  '/random',
  asyncHandler(async (_req: Request, res: Response) => {
    const availableCount = await prisma.title.count({
      where: {
        published: true,
      },
    });

    if (availableCount === 0) {
      throw new HttpError(404, 'Нет опубликованных тайтлов');
    }

    const randomIndex = Math.floor(Math.random() * availableCount);
    const [randomTitle] = await prisma.title.findMany({
      where: {
        published: true,
      },
      orderBy: {
        id: 'asc',
      },
      skip: randomIndex,
      take: 1,
      select: {
        slug: true,
      },
    });

    if (!randomTitle) {
      throw new HttpError(404, 'Тайтл не найден');
    }

    res.json({ title: randomTitle });
  }),
);

const slugSchema = z.object({ slug: z.string().min(1).transform((value) => value.trim()) });
const episodeIdSchema = z.object({ episodeId: z.string().min(1) });

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
        ratings: true,
      },
    });

    if (!title || (!title.published && !includeDrafts)) {
      throw new HttpError(404, 'Title not found');
    }

    res.json({ title: toTitleDto(includeDrafts, req.currentUser?.id)(title) });
  }),
);

const commentBodySchema = z.object({
  body: z
    .string()
    .trim()
    .min(3, 'Комментарий слишком короткий')
    .max(2000, 'Комментарий слишком длинный'),
  parentId: z.string().optional(),
});
const commentStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});
const commentParamsSchema = slugSchema.extend({
  commentId: z.string().min(1),
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

    const statusFilter = includeModeration ? {} : { status: 'APPROVED' as const };
    const currentUserId = req.currentUser?.id ?? null;
    const comments = await prisma.comment.findMany({
      where: { titleId: title.id, parentId: null, ...statusFilter },
      orderBy: { createdAt: 'asc' },
      include: {
        user: true,
        reactions: true,
        replies: {
          where: statusFilter,
          orderBy: { createdAt: 'asc' },
          include: { user: true, reactions: true },
        },
      },
    });

    res.json({ comments: comments.map(toCommentDto(includeModeration, currentUserId)) });
  }),
);

commentsRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugSchema.parse(req.params);
    const { body, parentId } = commentBodySchema.parse(req.body);
    const user = req.currentUser!;
    const title = await prisma.title.findFirst({ where: buildSlugWhere(slug) });

    if (!title || (!title.published && user.role !== 'ADMIN')) {
      throw new HttpError(404, 'Title not found');
    }

    if (parentId) {
      const parent = await prisma.comment.findFirst({
        where: { id: parentId, titleId: title.id, parentId: null },
        select: { id: true },
      });
      if (!parent) throw new HttpError(400, 'Parent comment not found');
    }

    const comment = await prisma.comment.create({
      data: { titleId: title.id, userId: user.id, body, status: 'APPROVED', parentId: parentId ?? null },
      include: { user: true, reactions: true, replies: { include: { user: true, reactions: true } } },
    });

    res.status(201).json({ comment: toCommentDto(user.role === 'ADMIN', user.id)(comment) });
  }),
);

commentsRouter.patch(
  '/:commentId',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug, commentId } = commentParamsSchema.parse(req.params);
    const { status } = commentStatusSchema.parse(req.body);
    const title = await prisma.title.findFirst({ where: buildSlugWhere(slug) });

    if (!title) {
      throw new HttpError(404, 'Title not found');
    }

    const comment = await prisma.comment.findFirst({
      where: { id: commentId, titleId: title.id },
      include: { user: true },
    });

    if (!comment) {
      throw new HttpError(404, 'Comment not found');
    }

    const updated = await prisma.comment.update({
      where: { id: comment.id },
      data: { status },
      include: { user: true, reactions: true, replies: { include: { user: true, reactions: true } } },
    });

    res.json({ comment: toCommentDto(true)(updated) });
  }),
);

commentsRouter.delete(
  '/:commentId',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug, commentId } = commentParamsSchema.parse(req.params);
    const title = await prisma.title.findFirst({ where: buildSlugWhere(slug) });

    if (!title) {
      throw new HttpError(404, 'Title not found');
    }

    const comment = await prisma.comment.findFirst({
      where: { id: commentId, titleId: title.id },
      select: { id: true },
    });

    if (!comment) {
      throw new HttpError(404, 'Comment not found');
    }

    await prisma.comment.delete({ where: { id: comment.id } });

    res.status(204).send();
  }),
);

const reactionTypeSchema = z.object({ type: z.enum(['LIKE', 'DISLIKE']) });

commentsRouter.post(
  '/:commentId/reactions',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug, commentId } = commentParamsSchema.parse(req.params);
    const { type } = reactionTypeSchema.parse(req.body);
    const user = req.currentUser!;
    const title = await prisma.title.findFirst({ where: buildSlugWhere(slug) });
    if (!title) throw new HttpError(404, 'Title not found');

    const comment = await prisma.comment.findFirst({
      where: { id: commentId, titleId: title.id },
      select: { id: true },
    });
    if (!comment) throw new HttpError(404, 'Comment not found');

    const existing = await prisma.commentReaction.findUnique({
      where: { commentId_userId: { commentId, userId: user.id } },
    });

    if (existing?.type === type) {
      await prisma.commentReaction.delete({ where: { commentId_userId: { commentId, userId: user.id } } });
    } else {
      await prisma.commentReaction.upsert({
        where: { commentId_userId: { commentId, userId: user.id } },
        create: { commentId, userId: user.id, type },
        update: { type },
      });
    }

    const reactions = await prisma.commentReaction.findMany({ where: { commentId } });
    res.json(reactionCounts(reactions as { type: string; userId: string }[], user.id));
  }),
);

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const data = titleCreateSchema.parse(req.body);
    const slug = await generateUniqueTitleSlug(data.name);
    const parsedOriginalReleaseDate = parseReleaseDateInput(data.originalReleaseDate);
    const genres = await ensureGenres(data.genres);
    const tags = await ensureTags(data.tags);

    try {
      const title = await prisma.title.create({
        data: {
          slug,
          name: data.name,
          description: data.description ?? null,
          coverKey: data.coverKey ?? null,
          coverBlurHash: data.coverBlurHash ?? null,
          published: data.published ?? false,
          genres: {
            connect: genres.map((genre) => ({ id: genre.id })),
          },
          tags: {
            connect: tags.map((tag) => ({ id: tag.id })),
          },
          originalReleaseDate: parsedOriginalReleaseDate ?? null,
          ageRating: data.ageRating ?? null,
          cvhAggregator: data.cvhAggregator ?? null,
        },
        include: {
          episodes: true,
          genres: true,
          tags: true,
          ratings: true,
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
    if (updates.coverBlurHash !== undefined) {
      data.coverBlurHash = updates.coverBlurHash;
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
    if (updates.cvhAggregator !== undefined) {
      data.cvhAggregator = updates.cvhAggregator;
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
        ratings: true,
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
          playerSrc: data.playerSrc ?? null,
          cvhVideoId: data.cvhVideoId ?? null,
          durationMinutes: data.durationMinutes ?? null,
          published: data.published ?? false,
        },
      });

      res.status(201).json({ episode: toEpisodeDto(true, episode) });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HttpError(409, 'Серия с таким номером уже существует');
      }

      if (error instanceof Error && error.message.includes('player_src host')) {
        throw new HttpError(400, error.message);
      }

      throw error;
    }
  }),
);

const episodeUpdateSchema = z
  .object({
    playerSrc: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
    cvhVideoId: z.union([z.string().trim().min(1), z.null()]).optional(),
    durationMinutes: z
      .union([z.coerce.number().int().positive().max(2000), z.null()])
      .optional(),
    published: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Only validate sources if both are explicitly being cleared
      if (data.playerSrc === null && data.cvhVideoId === null) return false;
      return true;
    },
    { message: 'Нельзя убрать оба источника одновременно' },
  );

episodesRouter.patch(
  '/:episodeId',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugSchema.parse(req.params);
    const { episodeId } = episodeIdSchema.parse(req.params);
    const updates = episodeUpdateSchema.parse(req.body);

    const title = await prisma.title.findFirst({
      where: buildSlugWhere(slug),
      select: { id: true },
    });

    if (!title) throw new HttpError(404, 'Title not found');

    const episode = await prisma.episode.findFirst({
      where: { id: episodeId, titleId: title.id },
    });

    if (!episode) throw new HttpError(404, 'Episode not found');

    // Build update payload — only touch provided fields
    const data: Prisma.EpisodeUpdateInput = {};
    if (updates.playerSrc !== undefined) {
      data.playerSrc = updates.playerSrc === '' ? null : (updates.playerSrc ?? null);
    }
    if (updates.cvhVideoId !== undefined) {
      data.cvhVideoId = updates.cvhVideoId;
    }
    if (updates.durationMinutes !== undefined) {
      data.durationMinutes = updates.durationMinutes;
    }
    if (updates.published !== undefined) {
      data.published = updates.published;
    }

    // Verify after merge that at least one source will remain
    const mergedPlayerSrc = updates.playerSrc !== undefined
      ? (updates.playerSrc === '' ? null : updates.playerSrc)
      : episode.playerSrc;
    const mergedCvhId = updates.cvhVideoId !== undefined ? updates.cvhVideoId : episode.cvhVideoId;
    if (!mergedPlayerSrc && !mergedCvhId) {
      throw new HttpError(400, 'Серия должна иметь хотя бы один источник (playerSrc или cvhVideoId)');
    }

    try {
      const updated = await prisma.episode.update({
        where: { id: episode.id },
        data,
      });
      res.json({ episode: toEpisodeDto(true, updated) });
    } catch (error) {
      if (error instanceof Error && error.message.includes('player_src host')) {
        throw new HttpError(400, error.message);
      }
      throw error;
    }
  }),
);

episodesRouter.delete(
  '/:episodeId',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugSchema.parse(req.params);
    const { episodeId } = episodeIdSchema.parse(req.params);
    const title = await prisma.title.findFirst({
      where: buildSlugWhere(slug),
      select: { id: true },
    });

    if (!title) {
      throw new HttpError(404, 'Title not found');
    }

    const episode = await prisma.episode.findFirst({
      where: {
        id: episodeId,
        titleId: title.id,
      },
    });

    if (!episode) {
      throw new HttpError(404, 'Episode not found');
    }

    await prisma.episode.delete({
      where: { id: episode.id },
    });

    res.status(204).send();
  }),
);

router.delete(
  '/:slug',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugSchema.parse(req.params);
    const title = await prisma.title.findFirst({
      where: buildSlugWhere(slug),
      select: { id: true, coverKey: true },
    });

    if (!title) {
      throw new HttpError(404, 'Title not found');
    }

    await prisma.title.delete({
      where: { id: title.id },
    });

    if (title.coverKey) {
      await deleteObject('covers', title.coverKey).catch(() => {});
    }

    res.status(204).send();
  }),
);

const ratingValueSchema = z.object({
  value: z.number().int().min(1).max(5),
});

router.post(
  '/:slug/ratings',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugSchema.parse(req.params);
    const { value } = ratingValueSchema.parse(req.body);
    const user = req.currentUser!;

    const title = await prisma.title.findFirst({
      where: buildSlugWhere(slug),
      select: { id: true },
    });
    if (!title) throw new HttpError(404, 'Title not found');

    await prisma.rating.upsert({
      where: { userId_titleId: { userId: user.id, titleId: title.id } },
      create: { userId: user.id, titleId: title.id, value },
      update: { value },
    });

    const [agg, myRecord] = await Promise.all([
      prisma.rating.aggregate({
        where: { titleId: title.id },
        _avg: { value: true },
        _count: true,
      }),
      prisma.rating.findFirst({
        where: { userId: user.id, titleId: title.id },
        select: { value: true },
      }),
    ]);

    res.json({
      avgRating: agg._avg.value,
      ratingCount: agg._count,
      myRating: myRecord?.value ?? null,
    });
  }),
);

router.delete(
  '/:slug/ratings',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugSchema.parse(req.params);
    const user = req.currentUser!;

    const title = await prisma.title.findFirst({
      where: buildSlugWhere(slug),
      select: { id: true },
    });
    if (!title) throw new HttpError(404, 'Title not found');

    await prisma.rating.deleteMany({
      where: { userId: user.id, titleId: title.id },
    });

    const agg = await prisma.rating.aggregate({
      where: { titleId: title.id },
      _avg: { value: true },
      _count: true,
    });

    res.json({
      avgRating: agg._avg.value,
      ratingCount: agg._count,
      myRating: null,
    });
  }),
);

router.use('/:slug/comments', commentsRouter);
router.use('/:slug/episodes', episodesRouter);

type EpisodeWithParent = TitleWithEpisodes['episodes'][number];
type CommentAuthor = CommentWithUser['user'];

function toTitleDto(includeDrafts: boolean, userId?: string) {
  return (title: TitleWithEpisodes) => {
    const ratingCount = title.ratings.length;
    const avgRating =
      ratingCount > 0
        ? title.ratings.reduce((sum: number, r: Rating) => sum + r.value, 0) / ratingCount
        : null;
    const myRating = userId
      ? (title.ratings.find((r: Rating) => r.userId === userId)?.value ?? null)
      : null;

    return {
      id: title.id,
      slug: title.slug,
      name: title.name,
      description: title.description,
      genres: title.genres.map((genre) => genre.name),
      tags: title.tags.map((tag) => tag.name),
      ageRating: title.ageRating,
      originalReleaseDate: title.originalReleaseDate,
      coverKey: title.coverKey,
      coverBlurHash: title.coverBlurHash,
      published: title.published,
      createdAt: title.createdAt,
      updatedAt: title.updatedAt,
      cvhAggregator: title.cvhAggregator ?? null,
      avgRating,
      ratingCount,
      myRating,
      episodes: title.episodes
        .slice()
        .sort((a, b) => a.number - b.number)
        .map((episode: EpisodeWithParent) => toEpisodeDto(includeDrafts, episode)),
    };
  };
}

function toEpisodeDto(includeDrafts: boolean, episode: EpisodeModel) {
  const isVisible = includeDrafts || episode.published;

  return {
    id: episode.id,
    number: episode.number,
    durationMinutes: episode.durationMinutes,
    playerSrc: isVisible ? (episode.playerSrc ?? undefined) : undefined,
    cvhVideoId: isVisible ? (episode.cvhVideoId ?? undefined) : undefined,
    published: episode.published,
  };
}

function reactionCounts(reactions: { type: string; userId?: string }[], userId: string | null) {
  return {
    likeCount: reactions.filter((r) => r.type === 'LIKE').length,
    dislikeCount: reactions.filter((r) => r.type === 'DISLIKE').length,
    userReaction: userId
      ? (reactions.find((r) => r.userId === userId)?.type ?? null)
      : null,
  };
}

function toCommentDto(includeStatus: boolean, userId: string | null = null) {
  return (comment: CommentWithReactions) => ({
    id: comment.id,
    body: comment.body,
    status: includeStatus ? comment.status : undefined,
    createdAt: comment.createdAt,
    author: toCommentAuthor(comment.user),
    ...reactionCounts(comment.reactions as { type: string; userId: string }[], userId),
    replies: (comment.replies ?? []).map((r) => ({
      id: r.id,
      body: r.body,
      status: includeStatus ? r.status : undefined,
      createdAt: r.createdAt,
      author: toCommentAuthor(r.user),
      ...reactionCounts(r.reactions as { type: string; userId: string }[], userId),
      replies: [],
    })),
  });
}

function toCommentAuthor(user: CommentAuthor) {
  return {
    id: user.id,
    profileId: user.profileId,
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
