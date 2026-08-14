import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/async-handler';
import { requireAdmin } from '../middleware/require-admin';

/** Сквозной поиск по админке: тайтлы, новости, команда, комментарии. */
const router = Router();

const PER_GROUP = 5;

const querySchema = z.object({
  q: z.string().trim().min(2).max(100),
});

type SearchHit = {
  type: 'title' | 'news' | 'team' | 'comment';
  id: string;
  label: string;
  hint: string;
  href: string;
};

const contains = (q: string) => ({ contains: q, mode: 'insensitive' as const });

router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = querySchema.safeParse(req.query);

    if (!parsed.success) {
      res.json({ results: [] });
      return;
    }

    const { q } = parsed.data;

    const [titles, news, team, comments] = await Promise.all([
      prisma.title.findMany({
        where: { OR: [{ name: contains(q) }, { slug: contains(q) }] },
        take: PER_GROUP,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, slug: true, published: true },
      }),
      prisma.newsPost.findMany({
        where: { OR: [{ title: contains(q) }, { slug: contains(q) }] },
        take: PER_GROUP,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, slug: true, published: true },
      }),
      prisma.teamMember.findMany({
        where: { OR: [{ name: contains(q) }, { role: contains(q) }] },
        take: PER_GROUP,
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, role: true },
      }),
      prisma.comment.findMany({
        where: { body: contains(q) },
        take: PER_GROUP,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      }),
    ]);

    const results: SearchHit[] = [
      ...titles.map((title) => ({
        type: 'title' as const,
        id: title.id,
        label: title.name,
        hint: title.published ? 'Тайтл' : 'Тайтл · черновик',
        href: `/admin/titles/${title.slug}`,
      })),
      ...news.map((post) => ({
        type: 'news' as const,
        id: post.id,
        label: post.title,
        hint: post.published ? 'Новость' : 'Новость · черновик',
        href: `/admin/news/${post.slug}`,
      })),
      ...team.map((member) => ({
        type: 'team' as const,
        id: member.id,
        label: member.name,
        hint: `Команда · ${member.role}`,
        href: '/admin/team',
      })),
      ...comments.map((comment) => ({
        type: 'comment' as const,
        id: comment.id,
        label: comment.body.slice(0, 90),
        hint: `Комментарий · ${comment.user.username}`,
        href: '/admin/comments',
      })),
    ];

    res.json({ results });
  }),
);

export { router as adminSearchRouter };
