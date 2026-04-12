'use server';

import { revalidatePath } from 'next/cache';
import { ApiError, createEpisode, updateEpisode, updateTitle, deleteEpisode, updateCommentStatus } from '@/lib/server-api';
import type { CommentStatus } from '@/lib/types';
import {
  DEFAULT_TITLE_STATUS,
  encodeStatusTag,
  normalizeStatusValue,
  stripStatusTags,
} from '@/lib/title-status';

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
  const tagsWithStatus = collectList(formData, 'tags');
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

  const statusInput = (formData.get('titleStatus') ?? '').toString();
  const normalizedStatus = normalizeStatusValue(statusInput) ?? DEFAULT_TITLE_STATUS;
  const tags = stripStatusTags(tagsWithStatus);
  if (normalizedStatus) {
    tags.push(encodeStatusTag(normalizedStatus));
  }

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
  const playerSrcRaw = (formData.get('playerSrc') ?? '').toString().trim();
  const cvhVideoIdRaw = (formData.get('cvhVideoId') ?? '').toString().trim();
  const durationInput = formData.get('durationMinutes');
  const published = formData.get('episodePublished') === 'on';

  const number = Number(numberValue);
  if (!Number.isInteger(number) || number <= 0) {
    return { success: false, error: 'Номер серии должен быть положительным целым' };
  }

  const playerSrc = playerSrcRaw || null;
  const cvhVideoId = cvhVideoIdRaw || null;

  if (!playerSrc && !cvhVideoId) {
    return { success: false, error: 'Укажите хотя бы один источник: ссылку на плеер или CDNVideoHub Video ID' };
  }

  if (playerSrc) {
    try {
      new URL(playerSrc);
    } catch {
      return { success: false, error: 'Некорректный формат ссылки на плеер' };
    }
  }

  if (cvhVideoId && !/^\d+$/.test(cvhVideoId)) {
    return { success: false, error: 'CDNVideoHub Video ID должен быть числом' };
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
      playerSrc,
      cvhVideoId,
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

export type UpdateEpisodeFormState = {
  success: boolean;
  error?: string;
};

export async function updateEpisodeAction(
  slug: string,
  episodeId: string,
  _prevState: UpdateEpisodeFormState,
  formData: FormData,
): Promise<UpdateEpisodeFormState> {
  const playerSrcRaw = (formData.get('playerSrc') ?? '').toString().trim();
  const cvhVideoIdRaw = (formData.get('cvhVideoId') ?? '').toString().trim();
  const durationInput = formData.get('durationMinutes');
  const published = formData.get('episodePublished') === 'on';

  // Empty string → null (clear the field); undefined = don't touch
  const playerSrc = playerSrcRaw === '' ? null : playerSrcRaw;
  const cvhVideoId = cvhVideoIdRaw === '' ? null : cvhVideoIdRaw;

  if (playerSrc) {
    try {
      new URL(playerSrc);
    } catch {
      return { success: false, error: 'Некорректный формат ссылки на плеер' };
    }
  }

  if (cvhVideoId && !/^\d+$/.test(cvhVideoId)) {
    return { success: false, error: 'CDNVideoHub Video ID должен быть числом' };
  }

  let durationMinutes: number | null | undefined = undefined;
  if (durationInput !== null && typeof durationInput === 'string') {
    const trimmed = durationInput.trim();
    if (trimmed === '') {
      durationMinutes = null;
    } else {
      const parsed = Number(trimmed);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return { success: false, error: 'Длительность указывается в минутах целым числом' };
      }
      durationMinutes = parsed;
    }
  }

  try {
    await updateEpisode(slug, episodeId, {
      playerSrc,
      cvhVideoId,
      durationMinutes,
      published,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Не удалось сохранить серию' };
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

export type UpdateCommentStatusFormState = {
  success: boolean;
  error?: string;
};

export async function updateCommentStatusAction(
  slug: string,
  _prevState: UpdateCommentStatusFormState,
  formData: FormData,
): Promise<UpdateCommentStatusFormState> {
  const commentId = (formData.get('commentId') ?? '').toString().trim();
  const statusValue = (formData.get('status') ?? '').toString().trim().toUpperCase();

  if (!commentId) {
    return { success: false, error: 'Не удалось определить комментарий' };
  }

  const allowedStatuses: CommentStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
  if (!allowedStatuses.includes(statusValue as CommentStatus)) {
    return { success: false, error: 'Некорректный статус' };
  }

  try {
    await updateCommentStatus(slug, commentId, statusValue as CommentStatus);
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Не удалось обновить статус' };
  }

  revalidatePath(`/admin/${slug}`);

  return { success: true };
}
