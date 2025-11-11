import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/async-handler';
import { getTeamMembers, createTeamMember, deleteTeamMember } from '../services/team';
import { requireAdmin } from '../middleware/require-admin';

const router = Router();

const createSchema = z.object({
  name: z.string().trim().min(1).max(128),
  role: z.string().trim().min(1).max(128),
  avatarKey: z.string().trim().min(1).max(256).optional(),
});

const idSchema = z.object({
  id: z.string().min(1),
});

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const teamMembers = await getTeamMembers();
    res.json({ teamMembers });
  }),
);

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const payload = createSchema.parse(req.body);
    const teamMember = await createTeamMember(payload);
    res.status(201).json({ teamMember });
  }),
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const deleted = await deleteTeamMember(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Участник не найден' });
    }

    res.status(204).send();
  }),
);

export { router as teamMembersRouter };
