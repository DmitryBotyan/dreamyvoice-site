import { env } from '../env';

// ─── Types from swagger ───────────────────────────────────────────────────────

export type VideoStatus =
  | 0   // UNDEF
  | 1   // OK
  | 2   // ERROR
  | 3   // UPLOADING
  | 4   // CREATING
  | 5   // PROCESSING
  | 6   // OFFLINE
  | 7   // ONLINE
  | 8   // LIVE_NOT_STARTED
  | 9   // LIVE_ENDED
  | 11  // BLOCKED
  | 12  // CENSORED
  | 13  // COPYRIGHTS_RESTRICTED
  | 14  // UNAVAILABLE
  | 15  // LIMITED_ACCESS
  | 16  // LIVE_INTERRUPTED
  | 1000; // READY

export type SkipName =
  | 'Опенинг'
  | 'Эндинг'
  | 'Сцена после титров'
  | 'Рекламная вставка'
  | 'Запрещенный контент';

export type Skip = {
  start: number;
  end: number;
  name: SkipName;
  require: boolean;
};

export type CVHData = {
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
  skip?: Skip[];
};

export type CdnVideo = {
  id: number;
  status: VideoStatus;
  error?: string;
  created_at: string;
  updated_at: string;
  uploader?: string;
  cvh_data?: CVHData;
};

export type VideoCollection = {
  items: CdnVideo[];
};

export type VideoPostBody = {
  title_id?: string;
  episode_id?: string;
  language_id?: number;
  voice_type_id?: number;
  video_type_id?: number;
  video_resolution_id?: number;
  embedded_advertisement?: boolean;
  skip?: Skip[];
  uploader?: string;
  voice_studio_id?: number;
};

export type VideoPatchBody = {
  language_id?: number;
  voice_type_id?: number;
  video_type_id?: number;
  video_resolution_id?: number;
  embedded_advertisement?: boolean;
};

export type VideoListParams = {
  created_at_from?: string;
  created_at_to?: string;
  updated_at_from?: string;
  updated_at_to?: string;
  cvh_id?: string;
  cvh_title_id?: string;
  cvh_episode_id?: number;
  cvh_language_id?: number;
  cvh_voice_type_id?: number;
  cvh_video_type_id?: number;
  cvh_video_resolution_id?: number;
  cvh_embedded_advertisement?: boolean;
  uploader?: string;
  status?: VideoStatus;
  error_is_null?: boolean;
  limit?: number;
  offset?: number;
};

export type UploadingURL = {
  url: string;
};

export type UploadChunkHeaders = {
  'Content-Range': string;
  'Content-Disposition': string;
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

function requireConfig() {
  if (!env.cdnVideoHub) {
    throw new Error('CDNVideoHub is not configured (CDN_VIDEOHUB_BASE_URL / CDN_VIDEOHUB_TOKEN missing)');
  }
  return env.cdnVideoHub;
}

async function cdnRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const cfg = requireConfig();

  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${cfg.token}`);

  const response = await fetch(`${cfg.baseUrl}/api${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `CDN API error ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function isCdnConfigured(): boolean {
  return Boolean(env.cdnVideoHub);
}

export async function listVideos(params: VideoListParams = {}): Promise<VideoCollection> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return cdnRequest<VideoCollection>(`/videos${qs ? `?${qs}` : ''}`);
}

export async function createVideo(body: VideoPostBody): Promise<CdnVideo> {
  return cdnRequest<CdnVideo>('/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function getVideo(id: number): Promise<CdnVideo> {
  return cdnRequest<CdnVideo>(`/videos/${id}`);
}

export async function updateVideo(id: number, body: VideoPatchBody): Promise<CdnVideo> {
  return cdnRequest<CdnVideo>(`/videos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function deleteVideo(id: number): Promise<void> {
  return cdnRequest<void>(`/videos/${id}`, { method: 'DELETE' });
}

export async function getUploadingUrl(id: number): Promise<UploadingURL> {
  return cdnRequest<UploadingURL>(`/videos/${id}/uploading_url`);
}

/**
 * Proxies a single video chunk upload directly to the CDN.
 * The body must be a ReadableStream or Buffer (raw binary).
 */
export async function proxyUploadChunk(
  encodedUrl: string,
  body: Buffer,
  chunkHeaders: UploadChunkHeaders,
): Promise<void> {
  const cfg = requireConfig();

  const headers = new Headers({
    Authorization: `Bearer ${cfg.token}`,
    'Content-Type': 'application/octet-stream',
    'Content-Range': chunkHeaders['Content-Range'],
    'Content-Disposition': chunkHeaders['Content-Disposition'],
  });

  const response = await fetch(`${cfg.baseUrl}/api/uploading/${encodedUrl}`, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    let message = `CDN upload error ${response.status}`;
    try {
      const errBody = (await response.json()) as { error?: string };
      if (errBody?.error) message = errBody.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
}
