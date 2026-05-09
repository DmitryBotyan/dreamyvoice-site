type Template = {
  subject: string;
  html: string;
  text: string;
};

type Options = {
  appUrl: string;
  link: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const COLORS = {
  background: '#111113',
  surface: '#1d1d26',
  surfaceMuted: '#14141b',
  border: 'rgba(255, 255, 255, 0.08)',
  foreground: '#f7f5ff',
  muted: 'rgba(226, 222, 255, 0.7)',
  accent: '#8f63ff',
  accentStrong: '#a97cff',
};

function layout(params: {
  appUrl: string;
  preheader: string;
  heading: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  footnoteHtml?: string;
}): string {
  const { appUrl, preheader, heading, bodyHtml, cta, footnoteHtml } = params;
  const ctaHtml = cta
    ? `
      <tr>
        <td align="center" style="padding: 12px 0 4px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="center" bgcolor="${COLORS.accent}" style="border-radius: 10px;">
                <a href="${cta.href}" target="_blank" rel="noopener" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; line-height: 1; color: #ffffff; text-decoration: none; border-radius: 10px;">${cta.label}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : '';
  const footnoteRow = footnoteHtml
    ? `<tr><td style="padding-top: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.5; color: ${COLORS.muted};">${footnoteHtml}</td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; color: ${COLORS.foreground};">
  <span style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${COLORS.background}" style="background-color: ${COLORS.background};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 560px;">
          <tr>
            <td align="left" style="padding-bottom: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <a href="${appUrl}" target="_blank" rel="noopener" style="font-size: 18px; font-weight: 700; letter-spacing: 0.02em; color: ${COLORS.foreground}; text-decoration: none;">
                Dreamy<span style="color: ${COLORS.accentStrong};">Voice</span>
              </a>
            </td>
          </tr>
          <tr>
            <td bgcolor="${COLORS.surface}" style="background-color: ${COLORS.surface}; border: 1px solid ${COLORS.border}; border-radius: 14px; padding: 36px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; line-height: 1.3; font-weight: 600; color: ${COLORS.foreground}; padding-bottom: 16px;">
                    ${escapeHtml(heading)}
                  </td>
                </tr>
                <tr>
                  <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: ${COLORS.muted}; padding-bottom: 24px;">
                    ${bodyHtml}
                  </td>
                </tr>
                ${ctaHtml}
                ${footnoteRow}
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.6; color: ${COLORS.muted};">
              Это автоматическое письмо от DreamyVoice. Не отвечайте на него.<br>
              <a href="${appUrl}" target="_blank" rel="noopener" style="color: ${COLORS.muted}; text-decoration: underline;">${escapeHtml(appUrl.replace(/^https?:\/\//, ''))}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildVerificationEmail({ appUrl, link }: Options): Template {
  const heading = 'Подтвердите ваш email';
  const preheader = 'Перейдите по ссылке, чтобы активировать аккаунт DreamyVoice';
  const bodyHtml = `
    <p style="margin: 0 0 12px 0;">Спасибо за регистрацию в DreamyVoice. Чтобы завершить создание аккаунта, подтвердите ваш email — это нужно сделать в течение 24 часов.</p>
    <p style="margin: 0;">Если кнопка не работает, скопируйте ссылку:<br>
      <a href="${link}" target="_blank" rel="noopener" style="color: ${COLORS.accentStrong}; word-break: break-all; text-decoration: underline;">${escapeHtml(link)}</a>
    </p>
  `;
  const footnoteHtml = 'Если вы не регистрировались — просто проигнорируйте это письмо, ничего не произойдёт.';
  const html = layout({
    appUrl,
    preheader,
    heading,
    bodyHtml,
    cta: { label: 'Подтвердить email', href: link },
    footnoteHtml,
  });
  const text = [
    'Подтвердите ваш email — DreamyVoice',
    '',
    'Спасибо за регистрацию. Чтобы завершить создание аккаунта, перейдите по ссылке (срок действия — 24 часа):',
    link,
    '',
    'Если вы не регистрировались — проигнорируйте это письмо.',
  ].join('\n');
  return { subject: 'Подтверждение email — DreamyVoice', html, text };
}

export function buildPasswordResetEmail({ appUrl, link }: Options): Template {
  const heading = 'Сброс пароля';
  const preheader = 'Перейдите по ссылке, чтобы задать новый пароль';
  const bodyHtml = `
    <p style="margin: 0 0 12px 0;">Мы получили запрос на сброс пароля для вашего аккаунта DreamyVoice. Чтобы задать новый пароль, нажмите на кнопку ниже — ссылка действует один час.</p>
    <p style="margin: 0;">Если кнопка не работает, скопируйте ссылку:<br>
      <a href="${link}" target="_blank" rel="noopener" style="color: ${COLORS.accentStrong}; word-break: break-all; text-decoration: underline;">${escapeHtml(link)}</a>
    </p>
  `;
  const footnoteHtml = 'Если вы не запрашивали сброс — проигнорируйте это письмо. Пароль останется прежним.';
  const html = layout({
    appUrl,
    preheader,
    heading,
    bodyHtml,
    cta: { label: 'Задать новый пароль', href: link },
    footnoteHtml,
  });
  const text = [
    'Сброс пароля — DreamyVoice',
    '',
    'Мы получили запрос на сброс пароля. Перейдите по ссылке, чтобы задать новый (срок — 1 час):',
    link,
    '',
    'Если вы не запрашивали сброс — проигнорируйте это письмо.',
  ].join('\n');
  return { subject: 'Сброс пароля — DreamyVoice', html, text };
}
