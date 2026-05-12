'use server';

import { revalidatePath } from 'next/cache';
import { ApiError, deleteComment } from '@/lib/server-api';

export type DeleteCommentFormState = {
  success: boolean;
  error?: string;
};

export async function deleteCommentAction(
  slug: string,
  commentId: string,
): Promise<DeleteCommentFormState> {
  if (!commentId) {
    return { success: false, error: 'Не удалось определить комментарий' };
  }

  try {
    await deleteComment(slug, commentId);
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Не удалось удалить комментарий' };
  }

  revalidatePath(`/titles/${slug}`);
  revalidatePath(`/admin/${slug}`);

  return { success: true };
}
