'use server';

import { revalidatePath } from 'next/cache';
import { ApiError, createTitle, deleteTitle } from '@/lib/server-api';

const collectList = (formData: FormData, key: string) =>
  Array.from(
    new Set(
      formData
        .getAll(key)
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  );

export type CreateTitleFormState = {
  success: boolean;
  error?: string;
};

const SLUG_REGEX = /^[a-z0-9-]+$/;

export async function createTitleAction(
  _prevState: CreateTitleFormState,
  formData: FormData,
): Promise<CreateTitleFormState> {
  const name = (formData.get('name') ?? '').toString().trim();
  const slug = (formData.get('slug') ?? '').toString().trim().toLowerCase();
  const descriptionInput = formData.get('description');
  const description =
    descriptionInput && typeof descriptionInput === 'string' && descriptionInput.trim().length > 0
      ? descriptionInput.trim()
      : undefined;
  const coverKeyInput = formData.get('coverKey');
  const coverKey =
    coverKeyInput && typeof coverKeyInput === 'string' && coverKeyInput.trim().length > 0
      ? coverKeyInput.trim()
      : undefined;
  const published = formData.get('published') === 'on';
  const genres = collectList(formData, 'genres');
  const tags = collectList(formData, 'tags');
  const ageRatingInput = formData.get('ageRating');
  const ageRating =
    ageRatingInput && typeof ageRatingInput === 'string' && ageRatingInput.trim().length > 0
      ? ageRatingInput.trim()
      : undefined;
  const originalReleaseDateInput = formData.get('originalReleaseDate');
  const originalReleaseDate =
    originalReleaseDateInput &&
    typeof originalReleaseDateInput === 'string' &&
    originalReleaseDateInput.trim().length > 0
      ? originalReleaseDateInput.trim()
      : undefined;

  if (name.length < 3) {
    return { success: false, error: 'Название должно содержать минимум 3 символа' };
  }

  if (name.length > 128) {
    return { success: false, error: 'Название слишком длинное' };
  }

  if (slug.length < 3 || slug.length > 64 || !SLUG_REGEX.test(slug)) {
    return { success: false, error: 'Slug может содержать 3-64 символа: латиница, цифры, дефис' };
  }

  if (description && description.length > 5000) {
    return { success: false, error: 'Описание слишком длинное' };
  }

  try {
    await createTitle({
      name,
      slug,
      description,
      coverKey,
      published,
      genres,
      tags,
      ageRating,
      originalReleaseDate,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Не удалось создать тайтл. Попробуйте позже.' };
  }

  revalidatePath('/');
  revalidatePath('/admin');

  return { success: true };
}

export async function deleteTitleAction(formData: FormData) {
  const slug = (formData.get('slug') ?? '').toString().trim().toLowerCase();
  if (!slug || !SLUG_REGEX.test(slug)) {
    throw new Error('Неверный slug');
  }

  try {
    await deleteTitle(slug);
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }

    throw new Error('Не удалось удалить тайтл');
  }

  revalidatePath('/');
  revalidatePath('/admin');
}
