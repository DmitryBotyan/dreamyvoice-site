import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import slugify from 'slugify';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/async-handler';
import { HttpError } from '../utils/http-error';
import { requireAdmin } from '../middleware/require-admin';
import { deleteObject } from '../services/storage';
import { isEmptyNewsBody, newsBodyToPlainText, sanitizeNewsBody } from '../services/news-html';

const router = Router();

const SLUG_MIN_LENGTH = 3;
const SLUG_MAX_LENGTH = 80;
const EXCERPT_MAX_LENGTH = 400;
const BODY_MAX_LENGTH = 100000;

const slugifyOptions = { lower: true, strict: true, trim: true, locale: 'ru' } as const;

const trimSlugEdges = (value: string) => value.replace(/^-+|-+$/g, '');

const buildBaseSlug = (value: string) => {
  const generated = trimSlugEdges(slugify(value, slugifyOptions));
  const truncated = trimSlugEdges(generated.slice(0, SLUG_MAX_LENGTH));
  return truncated.length >= SLUG_MIN_LENGTH
    ? truncated
    : `${truncated}${'x'.repeat(SLUG_MIN_LENGTH - truncated.length)}`;
};

const getUniqueSlug = async (baseSlug: string, ignoreId?: string) => {
  let candidate = baseSlug || 'news';
  let counter = 1;

  for (;;) {
    const existing = await prisma.newsPost.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === ignoreId) {
      return candidate;
    }

    const suffix = `-${counter}`;
    candidate = `${trimSlugEdges(baseSlug.slice(0, SLUG_MAX_LENGTH - suffix.length))}${suffix}`;
    counter += 1;
  }
};

const listQuerySchema = z.object({
  includeDrafts: z
    .union([z.literal('1'), z.literal('0')])
    .optional()
    .transform((value) => value === '1'),
});

const slugSchema = z.object({
  slug: z.string().min(1).transform((value) => value.trim()),
});

const newsCreateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  excerpt: z
    .string()
    .trim()
    .max(EXCERPT_MAX_LENGTH)
    .optional()
    .transform((value) => value || undefined),
  body: z.string().max(BODY_MAX_LENGTH),
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
  published: z.boolean().optional().default(false),
});

const newsUpdateSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  excerpt: z.union([z.string().trim().max(EXCERPT_MAX_LENGTH), z.null()]).optional(),
  body: z.string().max(BODY_MAX_LENGTH).optional(),
  coverKey: z.union([z.string().trim().max(255), z.null()]).optional(),
  coverBlurHash: z.union([z.string().trim().max(100), z.null()]).optional(),
  published: z.boolean().optional(),
});

type NewsPostWithAuthor = Prisma.NewsPostGetPayload<{ include: { author: true } }>;

/** Автоописание для карточки, если админ не заполнил его руками. */
const buildExcerpt = (explicit: string | null | undefined, body: string) => {
  if (explicit) {
    return explicit;
  }

  const plain = newsBodyToPlainText(body);
  if (plain.length <= 200) {
    return plain || null;
  }

  const truncated = plain.slice(0, 197);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${lastSpace > 120 ? truncated.slice(0, lastSpace) : truncated}...`;
};

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const query = listQuerySchema.parse(req.query);
    const canSeeDrafts = query.includeDrafts && req.currentUser?.role === 'ADMIN';

    const posts = await prisma.newsPost.findMany({
      where: canSeeDrafts ? {} : { published: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: { author: true },
    });

    res.json({ posts: posts.map(toNewsDto) });
  }),
);

router.get(
  '/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugSchema.parse(req.params);
    const isAdmin = req.currentUser?.role === 'ADMIN';

    const post = await prisma.newsPost.findFirst({
      where: { slug: { equals: slug, mode: 'insensitive' } },
      include: { author: true },
    });

    if (!post || (!post.published && !isAdmin)) {
      throw new HttpError(404, 'Новость не найдена');
    }

    res.json({ post: toNewsDto(post) });
  }),
);

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const data = newsCreateSchema.parse(req.body);
    const body = sanitizeNewsBody(data.body);

    if (isEmptyNewsBody(body)) {
      throw new HttpError(400, 'Текст новости не может быть пустым');
    }

    const slug = await getUniqueSlug(buildBaseSlug(data.title));
    const published = data.published ?? false;

    const post = await prisma.newsPost.create({
      data: {
        slug,
        title: data.title,
        excerpt: buildExcerpt(data.excerpt ?? null, body),
        body,
        coverKey: data.coverKey ?? null,
        coverBlurHash: data.coverBlurHash ?? null,
        published,
        publishedAt: published ? new Date() : null,
        authorId: req.currentUser?.id ?? null,
      },
      include: { author: true },
    });

    res.status(201).json({ post: toNewsDto(post) });
  }),
);

router.patch(
  '/:slug',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugSchema.parse(req.params);
    const updates = newsUpdateSchema.parse(req.body);

    const existing = await prisma.newsPost.findFirst({
      where: { slug: { equals: slug, mode: 'insensitive' } },
    });

    if (!existing) {
      throw new HttpError(404, 'Новость не найдена');
    }

    const data: Prisma.NewsPostUpdateInput = {};

    if (updates.title !== undefined) {
      data.title = updates.title;
      // Slug следует за заголовком, чтобы ссылки оставались читаемыми.
      data.slug = await getUniqueSlug(buildBaseSlug(updates.title), existing.id);
    }

    const nextBody = updates.body !== undefined ? sanitizeNewsBody(updates.body) : null;
    if (nextBody !== null) {
      if (isEmptyNewsBody(nextBody)) {
        throw new HttpError(400, 'Текст новости не может быть пустым');
      }
      data.body = nextBody;
    }

    if (updates.excerpt !== undefined || nextBody !== null) {
      const explicit = updates.excerpt !== undefined ? updates.excerpt : existing.excerpt;
      data.excerpt = buildExcerpt(explicit, nextBody ?? existing.body);
    }

    if (updates.coverKey !== undefined) {
      data.coverKey = updates.coverKey;
    }

    if (updates.coverBlurHash !== undefined) {
      data.coverBlurHash = updates.coverBlurHash;
    }

    if (updates.published !== undefined) {
      data.published = updates.published;
      // Дата публикации проставляется один раз — при первом выходе новости.
      if (updates.published && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
      if (!updates.published) {
        data.publishedAt = null;
      }
    }

    const post = await prisma.newsPost.update({
      where: { id: existing.id },
      data,
      include: { author: true },
    });

    res.json({ post: toNewsDto(post) });
  }),
);

router.delete(
  '/:slug',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = slugSchema.parse(req.params);

    const post = await prisma.newsPost.findFirst({
      where: { slug: { equals: slug, mode: 'insensitive' } },
      select: { id: true, coverKey: true },
    });

    if (!post) {
      throw new HttpError(404, 'Новость не найдена');
    }

    await prisma.newsPost.delete({ where: { id: post.id } });

    if (post.coverKey) {
      await deleteObject('covers', post.coverKey).catch(() => {});
    }

    res.status(204).send();
  }),
);

function toNewsDto(post: NewsPostWithAuthor) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    coverKey: post.coverKey,
    coverBlurHash: post.coverBlurHash,
    published: post.published,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author
      ? {
          id: post.author.id,
          profileId: post.author.profileId,
          username: post.author.username,
          avatarKey: post.author.avatarKey,
        }
      : null,
  };
}

export { router as newsRouter };
