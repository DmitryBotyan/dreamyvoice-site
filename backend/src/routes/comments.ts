import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/async-handler';
import { HttpError } from '../utils/http-error';
import { requireAdmin } from '../middleware/require-admin';

/**
 * Сквозной список комментариев для админки: смотреть и удалять.
 * Модерации нет — комментарии публикуются сразу.
 */
const router = Router();

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional().default(100),
});

const idSchema = z.object({ id: z.string().min(1) });

router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { limit } = listQuerySchema.parse(req.query);

    const comments = await prisma.comment.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        title: { select: { slug: true, name: true } },
        parent: { select: { id: true } },
      },
    });

    res.json({
      comments: comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        isReply: Boolean(comment.parentId),
        author: {
          id: comment.user.id,
          profileId: comment.user.profileId,
          username: comment.user.username,
          avatarKey: comment.user.avatarKey,
        },
        title: comment.title,
      })),
    });
  }),
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = idSchema.parse(req.params);

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!comment) {
      throw new HttpError(404, 'Комментарий не найден');
    }

    // Ответы удалятся каскадом вместе с родителем.
    await prisma.comment.delete({ where: { id: comment.id } });

    res.status(204).send();
  }),
);

export { router as commentsAdminRouter };
