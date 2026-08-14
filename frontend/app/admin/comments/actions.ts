'use server';

import { revalidatePath } from 'next/cache';
import { ApiError, deleteCommentById } from '@/lib/server-api';

export async function deleteCommentAction(formData: FormData) {
  const commentId = (formData.get('commentId') ?? '').toString().trim();
  const titleSlug = (formData.get('titleSlug') ?? '').toString().trim();

  if (!commentId) {
    throw new Error('Не удалось определить комментарий');
  }

  try {
    await deleteCommentById(commentId);
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw new Error('Не удалось удалить комментарий');
  }

  revalidatePath('/admin/comments');
  revalidatePath('/admin');
  if (titleSlug) {
    revalidatePath(`/titles/${titleSlug}`);
  }
}
