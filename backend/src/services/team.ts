import { prisma } from '../prisma';

export type CreateTeamMemberInput = {
  name: string;
  role: string;
  avatarKey?: string;
};

export async function getTeamMembers() {
  return prisma.teamMember.findMany({
    orderBy: { createdAt: 'asc' },
  });
}

export async function createTeamMember(input: CreateTeamMemberInput) {
  return prisma.teamMember.create({
    data: {
      name: input.name.trim(),
      role: input.role.trim(),
      avatarKey: input.avatarKey?.trim() || null,
    },
  });
}
