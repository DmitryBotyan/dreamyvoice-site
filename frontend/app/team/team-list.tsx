"use client";

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

export function TeamList({ teamMembers }: Props) {
  const [roleQuery, setRoleQuery] = useState("");

  const filteredMembers = useMemo(() => {
    const normalized = roleQuery.trim().toLowerCase();
    if (!normalized) {
      return teamMembers;
    }
    return teamMembers.filter((member) => member.role.toLowerCase().includes(normalized));
  }, [roleQuery, teamMembers]);

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
        {filteredMembers.length === 0 ? (
          <p className={styles.teamEmpty}>
            Участники команды пока не добавлены. После публикации они появятся здесь.
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
                  {avatarUrl ? <img src={avatarUrl} alt={`Фото ${member.name}`} /> : <span>{initials}</span>}
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
    </div>
  );
}
