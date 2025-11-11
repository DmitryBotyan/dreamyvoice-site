import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/async-handler';
import { getTeamMembers, createTeamMember } from '../services/team';
import { requireAdmin } from '../middleware/require-admin';

const router = Router();

const createSchema = z.object({
  name: z.string().trim().min(1).max(128),
  role: z.string().trim().min(1).max(128),
  avatarKey: z.string().trim().min(1).max(256).optional(),
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

export { router as teamMembersRouter };
