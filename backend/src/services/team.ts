import { prisma } from '../prisma';
import { deleteObject } from './storage';

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

export async function deleteTeamMember(id: string) {
  const member = await prisma.teamMember.findUnique({ where: { id } });
  if (!member) {
    return null;
  }

  await prisma.teamMember.delete({ where: { id } });

  if (member.avatarKey) {
    await deleteObject('avatars', member.avatarKey).catch(() => {});
  }

  return member;
}
