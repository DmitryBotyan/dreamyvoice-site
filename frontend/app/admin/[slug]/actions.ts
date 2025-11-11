'use server';

import { revalidatePath } from 'next/cache';
import { ApiError, createEpisode, updateTitle, deleteEpisode } from '@/lib/server-api';

const collectList = (formData: FormData, key: string) =>
  Array.from(
    new Set(
      formData
        .getAll(key)
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  );

export type UpdateTitleFormState = {
  success: boolean;
  error?: string;
};

export async function updateTitleAction(
  slug: string,
  _prevState: UpdateTitleFormState,
  formData: FormData,
): Promise<UpdateTitleFormState> {
  const name = (formData.get('name') ?? '').toString().trim();
  const descriptionInput = formData.get('description');
  const coverKeyInput = formData.get('coverKey');
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

  const description =
    descriptionInput && typeof descriptionInput === 'string' && descriptionInput.trim().length > 0
      ? descriptionInput.trim()
      : null;
  const coverKey =
    coverKeyInput && typeof coverKeyInput === 'string' && coverKeyInput.trim().length > 0
      ? coverKeyInput.trim()
      : null;

  try {
    await updateTitle(slug, {
      name,
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

    return { success: false, error: 'Не удалось сохранить изменения' };
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/${slug}`);

  return { success: true };
}

export type CreateEpisodeFormState = {
  success: boolean;
  error?: string;
};

export async function createEpisodeAction(
  slug: string,
  _prevState: CreateEpisodeFormState,
  formData: FormData,
): Promise<CreateEpisodeFormState> {
  const numberValue = formData.get('number');
  const name = (formData.get('episodeName') ?? '').toString().trim();
  const playerSrc = (formData.get('playerSrc') ?? '').toString().trim();
  const durationInput = formData.get('durationMinutes');
  const published = formData.get('episodePublished') === 'on';

  const number = Number(numberValue);
  if (!Number.isInteger(number) || number <= 0) {
    return { success: false, error: 'Номер серии должен быть положительным целым' };
  }

  if (name.length < 3) {
    return { success: false, error: 'Название серии слишком короткое' };
  }

  if (!playerSrc) {
    return { success: false, error: 'Укажите ссылку на плеер' };
  }

  try {
    new URL(playerSrc);
  } catch {
    return { success: false, error: 'Некорректный формат ссылки на плеер' };
  }

  let durationMinutes: number | null | undefined = undefined;
  if (durationInput && typeof durationInput === 'string' && durationInput.trim().length > 0) {
    const parsedDuration = Number(durationInput);
    if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
      return { success: false, error: 'Длительность указывается в минутах целым числом' };
    }
    durationMinutes = parsedDuration;
  }

  try {
    await createEpisode(slug, {
      number,
      name,
      playerSrc,
      durationMinutes,
      published,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Не удалось добавить серию' };
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/${slug}`);

  return { success: true };
}

export async function deleteEpisodeAction(slug: string, formData: FormData) {
  const episodeId = (formData.get('episodeId') ?? '').toString().trim();
  if (!episodeId) {
    throw new Error('Не удалось определить серию');
  }

  try {
    await deleteEpisode(slug, episodeId);
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }

    throw new Error('Не удалось удалить серию');
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/${slug}`);
}
