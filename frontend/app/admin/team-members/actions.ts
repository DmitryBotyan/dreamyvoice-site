'use server';

import { revalidatePath } from 'next/cache';
import { ApiError, createTeamMember } from '@/lib/server-api';

export type CreateTeamMemberFormState = {
  success: boolean;
  error?: string;
};

const NAME_MIN_LENGTH = 2;
const ROLE_MIN_LENGTH = 2;

export async function createTeamMemberAction(
  _prevState: CreateTeamMemberFormState,
  formData: FormData,
): Promise<CreateTeamMemberFormState> {
  const name = (formData.get('name') ?? '').toString().trim();
  const role = (formData.get('role') ?? '').toString().trim();
  if (name.length < NAME_MIN_LENGTH) {
    return { success: false, error: `Имя должно содержать минимум ${NAME_MIN_LENGTH} символа` };
  }

  if (role.length < ROLE_MIN_LENGTH) {
    return { success: false, error: `Роль должна быть длиннее ${ROLE_MIN_LENGTH - 1} символов` };
  }

  const avatarKeyInput = formData.get('avatarKey');
  const avatarKey =
    avatarKeyInput && typeof avatarKeyInput === 'string' && avatarKeyInput.trim().length > 0
      ? avatarKeyInput.trim()
      : undefined;

  try {
    await createTeamMember({ name, role, avatarKey });
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Не удалось добавить участника. Попробуйте позже.' };
  }

  revalidatePath('/team');
  revalidatePath('/admin');

  return { success: true };
}
