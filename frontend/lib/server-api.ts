import 'server-only';

import { cookies } from 'next/headers';
import { serverConfig } from './server-config';
import type { Comment, Episode, PublicUser, TeamMember, Title } from './types';

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

export type CreateTitleInput = {
  slug: string;
  name: string;
  description?: string;
  coverKey?: string;
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
  published?: boolean;
  genres?: string[];
  tags?: string[];
  ageRating?: string | null;
  originalReleaseDate?: string | null;
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
  name: string;
  playerSrc: string;
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
