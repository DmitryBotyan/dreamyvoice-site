import type { ReactNode } from "react";

/** Иконки экранов авторизации вместо символов-заглушек в тексте. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const MailIcon = () => (
  <Icon>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M3.8 7.2 12 13l8.2-5.8" />
  </Icon>
);

export const CheckIcon = () => (
  <Icon>
    <polyline points="4.5 12.5 9.5 17.5 19.5 6.5" />
  </Icon>
);
