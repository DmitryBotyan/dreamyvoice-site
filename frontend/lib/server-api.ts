import 'server-only';

import { cookies } from 'next/headers';
import { serverConfig } from './server-config';
import type {
  Comment,
  CommentStatus,
  Episode,
  FavoriteTitle,
  PublicUser,
  TeamMember,
  Title,
} from './types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await Promise.resolve(cookies());
  const headers = new Headers(init?.headers as HeadersInit);
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  if (cookieHeader.length > 0) {
    headers.set('Cookie', cookieHeader);
  }

  const response = await fetch(`${serverConfig.apiBaseUrl}${path}`, {
    ...init,
    headers,
    cache: init?.cache ?? 'no-store',
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const payload = await response.json();
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      // ignore body parse issues
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getCurrentUser() {
  try {
    const data = await request<{ user: PublicUser }>('/auth/me');
    return data.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function getTitles(options: { includeDrafts?: boolean } = {}) {
  const query = options.includeDrafts ? '?includeDrafts=1' : '';
  const data = await request<{ titles: Title[] }>(`/titles${query}`);
  return data.titles;
}

export async function getRandomTitle() {
  const data = await request<{ title: { slug: string } }>('/titles/random');
  return data.title;
}

export async function getGenres() {
  const data = await request<{ genres: string[] }>('/metadata/genres');
  return data.genres;
}

export async function getTags() {
  const data = await request<{ tags: string[] }>('/metadata/tags');
  return data.tags;
}

export async function getTitle(slug: string) {
  const encodedSlug = encodeURIComponent(slug);
  try {
    const data = await request<{ title: Title }>(`/titles/${encodedSlug}`);
    return data.title;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function getFavoriteTitles() {
  try {
    const data = await request<{ favorites: FavoriteTitle[] }>('/favorites');
    return data.favorites;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return [];
    }
    throw error;
  }
}

export async function getTitleComments(slug: string) {
  const encodedSlug = encodeURIComponent(slug);
  try {
    const data = await request<{ comments: Comment[] }>(`/titles/${encodedSlug}/comments`);
    return data.comments;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }

    throw error;
  }
}

export async function updateCommentStatus(slug: string, commentId: string, status: CommentStatus) {
  const encodedSlug = encodeURIComponent(slug);
  const encodedCommentId = encodeURIComponent(commentId);
  const data = await request<{ comment: Comment }>(`/titles/${encodedSlug}/comments/${encodedCommentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  return data.comment;
}

export async function deleteComment(slug: string, commentId: string) {
  const encodedSlug = encodeURIComponent(slug);
  const encodedCommentId = encodeURIComponent(commentId);
  await request<void>(`/titles/${encodedSlug}/comments/${encodedCommentId}`, {
    method: 'DELETE',
  });
}

export type CreateTitleInput = {
  name: string;
  description?: string;
  coverKey?: string;
  coverBlurHash?: string;
  published?: boolean;
  genres?: string[];
  tags?: string[];
  ageRating?: string;
  originalReleaseDate?: string;
};

export async function createTitle(input: CreateTitleInput) {
  const data = await request<{ title: Title }>('/titles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return data.title;
}

export type UpdateTitleInput = {
  name?: string;
  description?: string | null;
  coverKey?: string | null;
  coverBlurHash?: string | null;
  published?: boolean;
  genres?: string[];
  tags?: string[];
  ageRating?: string | null;
  originalReleaseDate?: string | null;
  cvhAggregator?: string | null;
};

export async function updateTitle(slug: string, input: UpdateTitleInput) {
  const encodedSlug = encodeURIComponent(slug);
  const data = await request<{ title: Title }>(`/titles/${encodedSlug}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return data.title;
}

export type CreateEpisodeInput = {
  number: number;
  playerSrc?: string | null;
  cvhVideoId?: string | null;
  durationMinutes?: number | null;
  published?: boolean;
};

export async function createEpisode(slug: string, input: CreateEpisodeInput) {
  const encodedSlug = encodeURIComponent(slug);
  const data = await request<{ episode: Episode }>(`/titles/${encodedSlug}/episodes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return data.episode;
}

// ─── CDNVideoHub API ──────────────────────────────────────────────────────────

export type CdnVideoStatus =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  | 11 | 12 | 13 | 14 | 15 | 16 | 1000;

export const CDN_VIDEO_STATUS_LABELS: Record<number, string> = {
  0: 'Неизвестно',
  1: 'OK',
  2: 'Ошибка',
  3: 'Загружается',
  4: 'Создаётся',
  5: 'Обрабатывается',
  6: 'Offline',
  7: 'Online',
  8: 'Трансляция не начата',
  9: 'Трансляция завершена',
  11: 'Заблокировано',
  12: 'Цензура',
  13: 'Авторские права',
  14: 'Недоступно',
  15: 'Ограниченный доступ',
  16: 'Трансляция прервана',
  1000: 'Готово',
};

export type CdnVideo = {
  id: number;
  status: CdnVideoStatus;
  error?: string;
  created_at: string;
  updated_at: string;
  uploader?: string;
  cvh_data?: {
    id?: string;
    title_id?: string;
    episode_id?: string;
    language_id?: number;
    voice_type_id?: number;
    video_type_id?: number;
    video_resolution_id?: number;
    storage_id?: number;
    voice_studio_id?: number;
    embedded_advertisement?: boolean;
  };
};

export type CdnVideoPostBody = {
  title_id?: string;
  episode_id?: string;
  language_id?: number;
  voice_type_id?: number;
  video_type_id?: number;
  video_resolution_id?: number;
  embedded_advertisement?: boolean;
  uploader?: string;
  voice_studio_id?: number;
};

export async function listCdnVideos(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const path = `/cdnvideohub/videos${qs ? `?${qs}` : ''}`;
  const data = await request<{ items: CdnVideo[] }>(path);
  return data.items ?? [];
}

export async function createCdnVideo(body: CdnVideoPostBody) {
  return request<CdnVideo>('/cdnvideohub/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function getCdnVideo(id: number) {
  return request<CdnVideo>(`/cdnvideohub/videos/${id}`);
}

export async function deleteCdnVideo(id: number) {
  await request<void>(`/cdnvideohub/videos/${id}`, { method: 'DELETE' });
}

export async function getCdnUploadingUrl(id: number) {
  return request<{ url: string }>(`/cdnvideohub/videos/${id}/uploading_url`);
}

export async function getTeamMembers() {
  const data = await request<{ teamMembers: TeamMember[] }>('/team-members');
  return data.teamMembers;
}

export type CreateTeamMemberInput = {
  name: string;
  role: string;
  avatarKey?: string;
};

export async function createTeamMember(input: CreateTeamMemberInput) {
  const payload: Record<string, string> = {
    name: input.name,
    role: input.role,
  };

  if (input.avatarKey) {
    payload.avatarKey = input.avatarKey;
  }

  const data = await request<{ teamMember: TeamMember }>('/team-members', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return data.teamMember;
}

export async function deleteTitle(slug: string) {
  const encodedSlug = encodeURIComponent(slug);
  await request<void>(`/titles/${encodedSlug}`, {
    method: 'DELETE',
  });
}

export type UpdateEpisodeInput = {
  playerSrc?: string | null;
  cvhVideoId?: string | null;
  durationMinutes?: number | null;
  published?: boolean;
};

export async function updateEpisode(slug: string, episodeId: string, input: UpdateEpisodeInput) {
  const encodedSlug = encodeURIComponent(slug);
  const encodedEpisodeId = encodeURIComponent(episodeId);
  const data = await request<{ episode: Episode }>(`/titles/${encodedSlug}/episodes/${encodedEpisodeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return data.episode;
}

export async function deleteEpisode(slug: string, episodeId: string) {
  const encodedSlug = encodeURIComponent(slug);
  const encodedEpisodeId = encodeURIComponent(episodeId);
  await request<void>(`/titles/${encodedSlug}/episodes/${encodedEpisodeId}`, {
    method: 'DELETE',
  });
}

export async function deleteTeamMember(id: string) {
  const encodedId = encodeURIComponent(id);
  await request<void>(`/team-members/${encodedId}`, {
    method: 'DELETE',
  });
}
