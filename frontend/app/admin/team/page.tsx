/* eslint-disable @next/next/no-img-element */
import { getTeamMembers } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import { TeamMembersForm } from "../team-members-form";
import { DeleteLink } from "../delete-link";
import { deleteTeamMemberAction } from "../team-members/actions";
import styles from "../styles.module.css";

const createInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export default async function AdminTeamPage() {
  const teamMembers = await getTeamMembers();

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Команда</h1>
        <span className={styles.pageCount}>{teamMembers.length}</span>
      </header>

      <TeamMembersForm />

      <section className={styles.section}>
        {teamMembers.length === 0 ? (
          <p className={styles.empty}>Участники ещё не добавлены.</p>
        ) : (
          <ul className={styles.rowList} role="list">
            {teamMembers.map((member) => {
              const avatarUrl = member.avatarKey
                ? buildMediaUrl("avatars", member.avatarKey)
                : null;

              return (
                <li key={member.id} className={styles.row}>
                  <span className={styles.rowAvatar} aria-hidden="true">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" />
                    ) : (
                      createInitials(member.name)
                    )}
                  </span>
                  <div className={styles.rowMain}>
                    <p className={styles.rowTitle}>{member.name}</p>
                    <p className={styles.rowMeta}>{member.role}</p>
                  </div>
                  <div className={styles.rowActions}>
                    <DeleteLink
                      action={deleteTeamMemberAction}
                      fields={[{ name: "id", value: member.id }]}
                      formClassName={styles.deleteLinkForm}
                      className={styles.linkDanger}
                    >
                      Удалить
                    </DeleteLink>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
