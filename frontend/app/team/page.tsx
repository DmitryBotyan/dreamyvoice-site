"use client";

import { useMemo, useState, type CSSProperties } from "react";
import styles from "./team.module.css";

type TeamMember = {
  name: string;
  role: string;
  accent: string;
};

const teamMembers: TeamMember[] = [
  {
    name: "Алексей Романов",
    role: "Руководитель студии",
    accent: "linear-gradient(135deg, #ffb347, #ffcc33)",
  },
  {
    name: "Ольга Соколова",
    role: "Главный режиссёр озвучки",
    accent: "linear-gradient(135deg, #2193b0, #6dd5ed)",
  },
  {
    name: "Дмитрий Орлов",
    role: "Звукорежиссёр",
    accent: "linear-gradient(135deg, #cc2b5e, #753a88)",
  },
  {
    name: "Марина Соловьёва",
    role: "Технический продюсер",
    accent: "linear-gradient(135deg, #0f2027, #2c5364)",
  },
  {
    name: "Ирина Лебедева",
    role: "Сценарист адаптаций",
    accent: "linear-gradient(135deg, #ff416c, #ff4b2b)",
  },
  {
    name: "Софья Громова",
    role: "Актриса озвучивания",
    accent: "linear-gradient(135deg, #7f7fd5, #86a8e7)",
  },
  {
    name: "Кирилл Волков",
    role: "Актёр озвучивания",
    accent: "linear-gradient(135deg, #667db6, #0082c8)",
  },
  {
    name: "Анна Ковалева",
    role: "Актриса озвучивания",
    accent: "linear-gradient(135deg, #f7971e, #ffd200)",
  },
  {
    name: "Наталья Кузьмина",
    role: "Актриса дубляжа",
    accent: "linear-gradient(135deg, #870000, #190a05)",
  },
  {
    name: "Сергей Мельников",
    role: "Актёр дубляжа",
    accent: "linear-gradient(135deg, #4b6cb7, #182848)",
  },
  {
    name: "Татьяна Шилова",
    role: "Вокальный коуч",
    accent: "linear-gradient(135deg, #ff5f6d, #ffc371)",
  },
  {
    name: "Андрей Корнилов",
    role: "Саунд-дизайнер",
    accent: "linear-gradient(135deg, #005c97, #363795)",
  },
  {
    name: "Елена Савина",
    role: "Редактор субтитров",
    accent: "linear-gradient(135deg, #093028, #237a57)",
  },
  {
    name: "Павел Фадеев",
    role: "Проджект-менеджер",
    accent: "linear-gradient(135deg, #3a1c71, #d76d77)",
  },
  {
    name: "Виктория Нестерова",
    role: "Специалист по сообществу",
    accent: "linear-gradient(135deg, #40e0d0, #ff8c00)",
  },
  {
    name: "Максим Платонов",
    role: "Инженер релизов",
    accent: "linear-gradient(135deg, #11998e, #38ef7d)",
  },
];

const createInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export default function TeamPage() {
  const [roleQuery, setRoleQuery] = useState("");

  const filteredMembers = useMemo(() => {
    const normalized = roleQuery.trim().toLowerCase();
    if (!normalized) {
      return teamMembers;
    }
    return teamMembers.filter((member) => member.role.toLowerCase().includes(normalized));
  }, [roleQuery]);

  return (
    <div className={styles.page}>
      <section className={styles.controls}>
        <div>
          <h1 className={styles.headingTitle}>Наша команда</h1>
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
        <ul className={styles.teamGrid} role="list">
          {filteredMembers.map((member) => (
            <li key={member.name} className={styles.memberCard}>
              <div
                className={styles.memberAvatar}
                style={{ "--avatar-accent": member.accent } as CSSProperties}
                aria-hidden="true"
              >
                <span>{createInitials(member.name)}</span>
              </div>
              <div className={styles.memberMeta}>
                <p className={styles.memberName}>{member.name}</p>
                <p className={styles.memberRole}>{member.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
