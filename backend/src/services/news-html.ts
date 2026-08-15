import sanitizeHtml from 'sanitize-html';

/**
 * Тело новости приходит из визуального редактора админки как HTML.
 * Перед сохранением прогоняем его через строгий allow-list: наружу отдаётся
 * только разметка, которую умеет генерировать редактор.
 */
/**
 * Видео вставляется только с площадок, которые мы разрешили: iframe с чужого
 * домена — это чужой код на нашей странице, поэтому список закрытый.
 */
const ALLOWED_IFRAME_HOSTNAMES = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'player.vimeo.com',
  'rutube.ru',
  'vk.com',
  'vkvideo.ru',
];

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'h2',
    'h3',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'img',
    'iframe',
    'figure',
    'figcaption',
    'hr',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    // width/height и data-blurhash нужны, чтобы место под картинку резервировалось
    // заранее и до загрузки показывалась размытая заглушка.
    img: ['src', 'alt', 'width', 'height', 'data-blurhash'],
    iframe: ['src', 'title', 'allow', 'allowfullscreen', 'loading', 'referrerpolicy'],
  },
  allowedIframeHostnames: ALLOWED_IFRAME_HOSTNAMES,
  allowIframeRelativeUrls: false,
  // Относительные ссылки нужны для картинок, залитых в наш же /media.
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: false,
  transformTags: {
    // Внешние ссылки открываем в новой вкладке и закрываем от tabnabbing.
    a: (tagName, attribs) => {
      const href = attribs.href ?? '';
      const isExternal = /^https?:\/\//i.test(href);

      return {
        tagName,
        attribs: isExternal
          ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' }
          : { ...attribs },
      };
    },
    // Редактор может оставить b/i/div от браузерного execCommand.
    b: 'strong',
    i: 'em',
    div: 'p',
  },
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],
  // Картинка или видео без src остаются после вырезания запрещённого адреса —
  // они бесполезны, поэтому убираем их целиком.
  exclusiveFilter: (frame) =>
    (frame.tag === 'img' || frame.tag === 'iframe') && !frame.attribs.src,
};

export const sanitizeNewsBody = (html: string) => sanitizeHtml(html, OPTIONS).trim();

/** Текст без разметки — для авто-описания и SEO. */
export const newsBodyToPlainText = (html: string) =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();

/** Есть ли в теле хоть какое-то содержимое (текст, картинка или видео). */
export const isEmptyNewsBody = (html: string) =>
  newsBodyToPlainText(html).length === 0 && !/<(img|iframe)\b/i.test(html);
