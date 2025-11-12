"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { buildMediaUrl } from "@/lib/media";
import styles from "./team.module.css";
import type { TeamMember } from "@/lib/types";

type Props = {
  teamMembers: TeamMember[];
};

const createInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const SOCIAL_LINKS = [
  {
    label: "Telegram",
    href: "https://t.me/DreamyVoice_Official",
    className: "site-footer-icon--telegram",
    icon: (
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    ),
  },
  {
    label: "VK",
    href: "https://vk.com/dreamyvoice",
    className: "site-footer-icon--vk",
    icon: (
      <path d="m9.489.004.729-.003h3.564l.73.003.914.01.433.007.418.011.403.014.388.016.374.021.36.025.345.03.333.033c1.74.196 2.933.616 3.833 1.516.9.9 1.32 2.092 1.516 3.833l.034.333.029.346.025.36.02.373.025.588.012.41.013.644.009.915.004.98-.001 3.313-.003.73-.01.914-.007.433-.011.418-.014.403-.016.388-.021.374-.025.36-.03.345-.033.333c-.196 1.74-.616 2.933-1.516 3.833-.9.9-2.092 1.32-3.833 1.516l-.333.034-.346.029-.36.025-.373.02-.588.025-.41.012-.644.013-.915.009-.98.004-3.313-.001-.73-.003-.914-.01-.433-.007-.418-.011-.403-.014-.388-.016-.374-.021-.36-.025-.345-.03-.333-.033c-1.74-.196-2.933-.616-3.833-1.516-.9-.9-1.32-2.092-1.516-3.833l-.034-.333-.029-.346-.025-.36-.02-.373-.025-.588-.012-.41-.013-.644-.009-.915-.004-.98.001-3.313.003-.73.01-.914.007-.433.011-.418.014-.403.016-.388.021-.374.025-.36.03-.345.033-.333c.196-1.74.616-2.933 1.516-3.833.9-.9 2.092-1.32 3.833-1.516l.333-.034.346-.029.36-.025.373-.02.588-.025.41-.012.644-.013.915-.009ZM6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z" />
    ),
  },
];

const SUPPORT_REQUISITES = [
  {
    label: "Тинькофф",
    value: "5536 9141 4567 0025",
    description: "Карта для быстрых переводов внутри РФ",
  },
  {
    label: "ЮMoney",
    value: "4100 1234 5678 901",
    description: "Поддержка в несколько кликов с комиссий банка",
  },
  {
    label: "Boosty",
    value: "boosty.to/dreamyvoice",
    description: "Подписка на закрытые посты и превью релизов",
    href: "https://boosty.to/dreamyvoice",
  },
  {
    label: "USDT",
    value: "TRC20 · TDV8hQyXfU9G3Gh7A6E6qDYQpJb7",
    description: "Для переводов из других стран",
  },
];

export function TeamList({ teamMembers }: Props) {
  const [roleQuery, setRoleQuery] = useState("");

  const filteredMembers = useMemo(() => {
    const normalized = roleQuery.trim().toLowerCase();
    if (!normalized) {
      return teamMembers;
    }
    return teamMembers.filter((member) =>
      member.role.toLowerCase().includes(normalized)
    );
  }, [roleQuery, teamMembers]);

  return (
    <div className={styles.page}>
      <section className={styles.aboutSection}>
        <div className={styles.aboutVisual} aria-hidden="true">
          <Image
            src="/team-photo.png"
            alt=""
            width={520}
            height={520}
            priority
          />
        </div>
        <div className={styles.aboutContent}>
          <h1 className={styles.aboutTitle}>
            Делимся любимыми тайтлами в авторской озвучке
          </h1>
          <p className={styles.aboutText}>
            Команда энтузиастов, которая собирает и озвучивает аниме-тайтлы
            целиком: от отбора релизов до финального мастеринга и публикации. Мы
            хотим, чтобы каждая серия звучала по-настоящему живо, а зрители
            ощущали заботу внутри самих сцен и комментариев.
          </p>
          <ul className={styles.socialLinks} role="list">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  className={`site-footer-icon ${link.className}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    role="presentation"
                    aria-hidden="true"
                    className="site-footer-icon-graphic"
                  >
                    {link.icon}
                  </svg>
                  <span className="sr-only">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section
        className={styles.controls}
        aria-label="Список участников команды"
      >
        <div>
          <h2 className={styles.headingTitle}>Наша команда</h2>
        </div>
        <form
          className={styles.roleSearch}
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <label htmlFor="role-search" className="sr-only">
            Найти участника по роли
          </label>
          <input
            id="role-search"
            type="search"
            placeholder="Поиск по ролям"
            autoComplete="off"
            value={roleQuery}
            onChange={(event) => setRoleQuery(event.target.value)}
          />
        </form>
      </section>
      <section aria-label="Команда DreamyVoice">
        {filteredMembers.length === 0 ? (
          <p className={styles.teamEmpty}>
            Участники команды пока не добавлены. После публикации они появятся
            здесь.
          </p>
        ) : (
          <ul className={styles.teamGrid} role="list">
            {filteredMembers.map((member) => {
              const initials = createInitials(member.name);
              const avatarUrl = member.avatarKey
                ? buildMediaUrl("avatars", member.avatarKey)
                : null;

              return (
                <li key={member.id} className={styles.memberCard}>
                  <div className={styles.memberAvatar} aria-hidden="true">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={`Фото ${member.name}`} />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className={styles.memberMeta}>
                    <p className={styles.memberName}>{member.name}</p>
                    <p className={styles.memberRole}>{member.role}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section
        className={styles.supportSection}
        aria-labelledby="support-title"
      >
        <div className={styles.supportIntro}>
          <p className={styles.supportEyebrow}>Поддержать нас</p>
          <h2 id="support-title" className={styles.supportTitle}>
            Каждая помощь приближает новый релиз
          </h2>
          <p className={styles.supportText}>
            Мы развиваем площадку без внешних сервисов, поэтому донаты помогают
            покрывать студийное время, серверы и работу над плеером. Выберите
            удобный способ и укажите пометку DreamVoice, чтобы мы знали, кому
            сказать спасибо.
          </p>
        </div>
        <dl className={styles.supportList}>
          {SUPPORT_REQUISITES.map((item) => (
            <div key={item.label} className={styles.supportItem}>
              <dt>{item.label}</dt>
              <dd>
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noreferrer">
                    {item.value}
                  </a>
                ) : (
                  item.value
                )}
              </dd>
              {item.description ? (
                <dd className={styles.supportDescription}>
                  {item.description}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
