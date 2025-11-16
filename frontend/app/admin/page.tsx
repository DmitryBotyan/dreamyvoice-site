import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateTitleForm } from "./create-title-form";
import { TeamMembersForm } from "./team-members-form";
import { deleteTeamMemberAction } from "./team-members/actions";
import { DeleteLink } from "./delete-link";
import { deleteTitleAction } from "./actions";
import { getCurrentUser, getTeamMembers, getTitles, getTitleComments } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import type { Comment, TeamMember, Title } from "@/lib/types";
import styles from "./styles.module.css";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?redirect=/admin");
  }

  if (currentUser.role !== "ADMIN") {
    return (
      <section>
        <h1>Требуются права администратора</h1>
        <p>
          Вы вошли как {currentUser.username}, но ваша роль не позволяет
          работать с админкой.
        </p>
        <p>
          Вернуться к <Link href="/">каталогу</Link>.
        </p>
      </section>
    );
  }

  const titles: Title[] = await getTitles({ includeDrafts: true });
  const teamMembers: TeamMember[] = await getTeamMembers();
  const pendingByTitle = await Promise.all(
    titles.map(async (title) => {
      try {
        const comments = await getTitleComments(title.slug);
        return comments
          .filter((comment) => comment.status === "PENDING")
          .map((comment) => ({
            comment,
            titleName: title.name,
            titleSlug: title.slug,
          }));
      } catch {
        return [];
      }
    })
  );
  const pendingComments = pendingByTitle
    .flat()
    .sort(
      (a, b) =>
        new Date(b.comment.createdAt).getTime() -
        new Date(a.comment.createdAt).getTime()
    );

  return (
    <section className={styles.adminSection}>
      <header className={styles.adminHero}>
        <p className={styles.adminEyebrow}>Админ-панель</p>
        <div>
          <h1>Управление контентом</h1>
        </div>
      </header>

      <PendingCommentsPanel
        comments={pendingComments.slice(0, 5)}
        totalCount={pendingComments.length}
      />

      <CreateTitleForm />

      <div className={styles.adminPanel}>
        <div className={styles.panelHeader}>
          <h2>Участники команды ({teamMembers.length})</h2>
          <p>Добавляйте участников, чтобы они отображались на странице команды.</p>
        </div>

        <TeamMembersForm />

        {teamMembers.length === 0 ? (
          <p className={styles.adminEmpty}>
            Участники ещё не добавлены. Создайте первую карточку.
          </p>
        ) : (
          <ul className={styles.teamAdminList}>
            {teamMembers.map((member) => {
              const initials = member.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("");
              const avatarUrl = member.avatarKey ? buildMediaUrl("avatars", member.avatarKey) : null;

              return (
                <li key={member.id} className={styles.teamAdminCard}>
                  <div
                    className={styles.teamAdminAvatar}
                    style={avatarUrl ? { background: "transparent" } : undefined}
                    aria-hidden="true"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={`Фото ${member.name}`} />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className={styles.teamAdminMetaWrapper}>
                    <div className={styles.teamAdminMeta}>
                      <p className={styles.teamAdminName}>{member.name}</p>
                      <p className={styles.teamAdminRole}>{member.role}</p>
                    </div>
                    <div className={styles.teamAdminActions}>
                      <DeleteLink
                        action={deleteTeamMemberAction}
                        fields={[{ name: "id", value: member.id }]}
                        formClassName={styles.deleteLinkForm}
                        className={styles.adminLinkButton}
                      >
                        Удалить
                      </DeleteLink>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={styles.adminPanel}>
        <div className={styles.panelHeader}>
          <h2>Все тайтлы ({titles.length})</h2>
        </div>
        {titles.length === 0 ? (
          <p className={styles.adminEmpty}>
            Здесь появятся первые релизы после создания.
          </p>
        ) : (
          <ul className={styles.adminListGrid}>
            {titles.map((title) => (
              <li key={title.id}>
                <article className={styles.adminCard}>
                  <header className={styles.adminCardHeader}>
                    <strong className={styles.adminCardTitle}>
                      {title.name}
                    </strong>
                    <span
                      className={`${styles.adminBadge} ${
                        title.published
                          ? styles.adminBadgePublished
                          : styles.adminBadgeDraft
                      }`}
                    >
                      {title.published ? "Опубликован" : "Черновик"}
                    </span>
                  </header>
                  <p className={styles.adminMeta}>Slug: {title.slug}</p>
                  {title.description ? (
                    <p className={styles.adminDescription}>
                      {title.description}
                    </p>
                  ) : null}
                  <p className={styles.adminMeta}>
                    Серий: {title.episodes.length}
                  </p>
                  <p className={styles.adminMeta}>
                    Обновлён:{" "}
                    {new Date(title.updatedAt).toLocaleString("ru-RU", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                  <div className={styles.adminActionsRow}>
                    <Link className={styles.adminLink} href={`/admin/${title.slug}`}>
                      Редактировать
                    </Link>
                    <DeleteLink
                      action={deleteTitleAction}
                      fields={[{ name: "slug", value: title.slug }]}
                      formClassName={styles.deleteLinkForm}
                      className={styles.adminLinkButton}
                    >
                      Удалить тайтл
                    </DeleteLink>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

type PendingCommentItem = {
  comment: Comment;
  titleName: string;
  titleSlug: string;
};

const pendingFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow",
});

function PendingCommentsPanel({
  comments,
  totalCount,
}: {
  comments: PendingCommentItem[];
  totalCount: number;
}) {
  return (
    <section className={styles.pendingCommentsSection}>
      <div className={styles.pendingCommentsHeader}>
        <div>
          <p className={styles.pendingCommentsEyebrow}>Модерация</p>
          <h2>Новые комментарии</h2>
        </div>
        <span className={styles.pendingCommentsCount}>{totalCount}</span>
      </div>
      {totalCount === 0 ? (
        <p className={styles.pendingCommentsEmpty}>
          Все комментарии рассмотрены. Новых сообщений нет.
        </p>
      ) : (
        <ul className={styles.pendingCommentsList} role="list">
          {comments.map(({ comment, titleName, titleSlug }) => (
            <li key={comment.id}>
              <article className={styles.pendingCommentCard}>
                <header className={styles.pendingCommentCardHeader}>
                  <div>
                    <p className={styles.pendingCommentTitle}>{titleName}</p>
                    <p className={styles.pendingCommentMeta}>
                      {comment.author.username} ·{" "}
                      {pendingFormatter.format(new Date(comment.createdAt))}
                    </p>
                  </div>
                  <Link
                    href={`/admin/${titleSlug}`}
                    className={styles.pendingCommentLink}
                  >
                    Перейти к тайтлу
                  </Link>
                </header>
                <p className={styles.pendingCommentBody}>{comment.body}</p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
