import sanitizeHtml from 'sanitize-html';

/**
 * Тело новости приходит из визуального редактора админки как HTML.
 * Перед сохранением прогоняем его через строгий allow-list: наружу отдаётся
 * только разметка, которую умеет генерировать редактор.
 */
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
    'figure',
    'figcaption',
    'hr',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt'],
  },
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
  // Картинка без src остаётся после вырезания запрещённой схемы — она бесполезна.
  exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
};

export const sanitizeNewsBody = (html: string) => sanitizeHtml(html, OPTIONS).trim();

/** Текст без разметки — для авто-описания и SEO. */
export const newsBodyToPlainText = (html: string) =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();

/** Есть ли в теле хоть какое-то содержимое (текст или картинка). */
export const isEmptyNewsBody = (html: string) =>
  newsBodyToPlainText(html).length === 0 && !/<img\b/i.test(html);
