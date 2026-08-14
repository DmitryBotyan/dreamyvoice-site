'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  ApiError,
  createNewsPost,
  deleteNewsPost,
  updateNewsPost,
} from '@/lib/server-api';

export type NewsFormState = {
  success: boolean;
  error?: string;
};

type ParsedNewsForm =
  | {
      success: true;
      values: {
        title: string;
        excerpt: string | null;
        body: string;
        coverKey: string | null;
        coverBlurHash: string | null;
        published: boolean;
      };
    }
  | { success: false; error: string };

const getTrimmed = (formData: FormData, key: string) =>
  (formData.get(key) ?? '').toString().trim();

const parseNewsForm = (formData: FormData): ParsedNewsForm => {
  const title = getTrimmed(formData, 'title');
  const excerpt = getTrimmed(formData, 'excerpt');
  const body = (formData.get('body') ?? '').toString();
  const coverKey = getTrimmed(formData, 'coverKey');
  const coverBlurHash = getTrimmed(formData, 'coverBlurHash');
  const published = formData.get('published') === 'on';

  if (title.length < 3) {
    return { success: false, error: 'Заголовок должен содержать минимум 3 символа' };
  }

  if (title.length > 200) {
    return { success: false, error: 'Заголовок слишком длинный' };
  }

  if (excerpt.length > 400) {
    return { success: false, error: 'Краткое описание слишком длинное' };
  }

  // Редактор оставляет пустые теги, поэтому смотрим на текст и картинки.
  const hasText = body.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
  const hasImage = /<img\b/i.test(body);
  if (!hasText && !hasImage) {
    return { success: false, error: 'Добавьте текст новости' };
  }

  return {
    success: true,
    values: {
      title,
      excerpt: excerpt || null,
      body,
      coverKey: coverKey || null,
      coverBlurHash: coverBlurHash || null,
      published,
    },
  };
};

const revalidateNews = (slug?: string) => {
  revalidatePath('/news');
  revalidatePath('/admin/news');
  if (slug) {
    revalidatePath(`/news/${slug}`);
    revalidatePath(`/admin/news/${slug}`);
  }
};

export async function createNewsPostAction(
  _prevState: NewsFormState,
  formData: FormData,
): Promise<NewsFormState> {
  const parsed = parseNewsForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  try {
    const post = await createNewsPost(parsed.values);
    revalidateNews(post.slug);
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Не удалось создать новость' };
  }

  return { success: true };
}

export async function updateNewsPostAction(
  slug: string,
  _prevState: NewsFormState,
  formData: FormData,
): Promise<NewsFormState> {
  const parsed = parseNewsForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  let nextSlug = slug;

  try {
    const post = await updateNewsPost(slug, parsed.values);
    nextSlug = post.slug;
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Не удалось сохранить новость' };
  }

  revalidateNews(slug);

  // Slug следует за заголовком — после переименования уводим админа на новый адрес.
  if (nextSlug !== slug) {
    revalidateNews(nextSlug);
    redirect(`/admin/news/${nextSlug}`);
  }

  return { success: true };
}

export async function deleteNewsPostAction(formData: FormData) {
  const slug = (formData.get('slug') ?? '').toString().trim();
  if (!slug) {
    throw new Error('Не удалось определить новость');
  }

  try {
    await deleteNewsPost(slug);
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw new Error('Не удалось удалить новость');
  }

  revalidateNews(slug);
  redirect('/admin/news');
}
