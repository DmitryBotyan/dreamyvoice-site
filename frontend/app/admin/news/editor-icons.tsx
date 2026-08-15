import type { ReactNode } from "react";

/** Иконки тулбара: единая сетка 24×24, обводка цветом текста. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const BulletListIcon = () => (
  <Icon>
    <line x1="9" y1="6.5" x2="20" y2="6.5" />
    <line x1="9" y1="12" x2="20" y2="12" />
    <line x1="9" y1="17.5" x2="20" y2="17.5" />
    <circle cx="4.75" cy="6.5" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="4.75" cy="12" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="4.75" cy="17.5" r="1.15" fill="currentColor" stroke="none" />
  </Icon>
);

export const OrderedListIcon = () => (
  <Icon>
    <line x1="10" y1="6.5" x2="20" y2="6.5" />
    <line x1="10" y1="12" x2="20" y2="12" />
    <line x1="10" y1="17.5" x2="20" y2="17.5" />
    <path d="M4 4.6h1.1v4" />
    <path d="M3.8 10.6h1.9l-2 3h2.1" />
    <path d="M3.9 15.9h1.8l-1.2 1.5h.2a1 1 0 1 1-.8 1.6" />
  </Icon>
);

export const QuoteIcon = () => (
  <Icon>
    <path d="M9.5 6.5C7 7.6 5.6 9.6 5.6 12.2v5.3h5.3v-5.3H8.2c0-1.6.7-2.8 2.2-3.6z" />
    <path d="M18.6 6.5c-2.5 1.1-3.9 3.1-3.9 5.7v5.3H20v-5.3h-2.7c0-1.6.7-2.8 2.2-3.6z" />
  </Icon>
);

export const RuleIcon = () => (
  <Icon>
    <line x1="4" y1="12" x2="20" y2="12" />
  </Icon>
);

export const LinkIcon = () => (
  <Icon>
    <path d="M10.2 13.8a3.6 3.6 0 0 0 5.4.4l2.6-2.6a3.6 3.6 0 0 0-5.1-5.1l-1.5 1.5" />
    <path d="M13.8 10.2a3.6 3.6 0 0 0-5.4-.4l-2.6 2.6a3.6 3.6 0 0 0 5.1 5.1l1.5-1.5" />
  </Icon>
);

export const UnlinkIcon = () => (
  <Icon>
    <path d="M10.4 13.6a3.5 3.5 0 0 0 4.9.2l1.6-1.6" />
    <path d="M13.6 10.4a3.5 3.5 0 0 0-4.9-.2l-1.6 1.6a3.5 3.5 0 0 0 2.1 5.9" />
    <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" />
  </Icon>
);

export const ImageIcon = () => (
  <Icon>
    <rect x="3.5" y="5" width="17" height="14" rx="2.2" />
    <circle cx="8.6" cy="10" r="1.4" />
    <path d="M4.2 16.6l4.3-4a1.8 1.8 0 0 1 2.4 0l5.2 4.8" />
    <path d="M14.6 14.2l1.6-1.5a1.8 1.8 0 0 1 2.4 0l1.6 1.4" />
  </Icon>
);

export const VideoIcon = () => (
  <Icon>
    <rect x="3.5" y="5.5" width="12.5" height="13" rx="2.2" />
    <path d="M16 10.4l4.5-2.6v8.4L16 13.6z" />
  </Icon>
);

export const ClearFormatIcon = () => (
  <Icon>
    <path d="M8.5 5.5h11" />
    <path d="M15.4 5.5l-4 13" />
    <line x1="4" y1="19" x2="12" y2="19" />
  </Icon>
);
