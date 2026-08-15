/**
 * Ссылка на видео → адрес для вставки в iframe.
 *
 * Список площадок закрытый и повторяет allow-list санитайзера на бэкенде:
 * если добавляете сюда новый домен, добавьте его и там, иначе вставка
 * молча пропадёт при сохранении новости.
 */
const ALLOWED_EMBED_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'player.vimeo.com',
  'rutube.ru',
  'vk.com',
  'vkvideo.ru',
]);

const youtubeEmbed = (id: string) => `https://www.youtube.com/embed/${id}`;

const parseUrl = (raw: string): URL | null => {
  const value = raw.trim();
  if (!value) {
    return null;
  }

  try {
    // Без схемы URL не разбирается, а вставляют часто просто «youtu.be/…».
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
};

export function toVideoEmbedUrl(raw: string): string | null {
  const url = parseUrl(raw);
  if (!url) {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be') {
    return segments[0] ? youtubeEmbed(segments[0]) : null;
  }

  if (host === 'youtube.com' || host === 'www.youtube.com' || host.endsWith('youtube-nocookie.com')) {
    if (segments[0] === 'embed') {
      return url.toString();
    }
    // watch?v=… , shorts/… , live/…
    const fromQuery = url.searchParams.get('v');
    if (fromQuery) {
      return youtubeEmbed(fromQuery);
    }
    if ((segments[0] === 'shorts' || segments[0] === 'live') && segments[1]) {
      return youtubeEmbed(segments[1]);
    }
    return null;
  }

  if (host === 'rutube.ru') {
    if (segments[0] === 'play' && segments[1] === 'embed' && segments[2]) {
      return url.toString();
    }
    if (segments[0] === 'video' && segments[1]) {
      return `https://rutube.ru/play/embed/${segments[1]}`;
    }
    return null;
  }

  if (host === 'vimeo.com' || host === 'www.vimeo.com') {
    return segments[0] ? `https://player.vimeo.com/video/${segments[0]}` : null;
  }

  if (host === 'player.vimeo.com') {
    return url.toString();
  }

  if (host === 'vk.com' || host === 'vkvideo.ru' || host === 'www.vk.com') {
    // Готовая ссылка из «Экспорта» ВК уже содержит oid, id и hash.
    if (url.pathname.startsWith('/video_ext.php')) {
      return url.toString();
    }
    // vk.com/video-12345_67890 → плеер по owner id и video id.
    const match = /^video(-?\d+)_(\d+)$/.exec(segments[0] ?? '');
    if (match) {
      return `https://vk.com/video_ext.php?oid=${match[1]}&id=${match[2]}`;
    }
    return null;
  }

  // Прямую ссылку на плеер разрешённого домена пропускаем как есть.
  return ALLOWED_EMBED_HOSTS.has(host) ? url.toString() : null;
}

export const VIDEO_EMBED_HINT = 'Поддерживаются YouTube, RuTube, VK и Vimeo';
