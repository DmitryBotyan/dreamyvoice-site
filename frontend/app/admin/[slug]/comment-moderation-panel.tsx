'use client';

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Comment, CommentStatus } from "@/lib/types";
import type { UpdateCommentStatusFormState } from "./actions";
import styles from "../styles.module.css";

const statusLabels: Record<CommentStatus, string> = {
  PENDING: "На модерации",
  APPROVED: "Опубликован",
  REJECTED: "Отклонен",
};

const statusClassNames: Record<CommentStatus, string> = {
  PENDING: styles.adminCommentStatusPending,
  APPROVED: styles.adminCommentStatusApproved,
  REJECTED: styles.adminCommentStatusRejected,
};

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow",
});

const initialState: UpdateCommentStatusFormState = { success: false };

type Props = {
  comments: Comment[];
  action: (
    state: UpdateCommentStatusFormState,
    formData: FormData,
  ) => Promise<UpdateCommentStatusFormState>;
};

type ModerationCardProps = {
  comment: Comment;
  action: Props["action"];
};

const statusOptions: CommentStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export function CommentModerationPanel({ comments, action }: Props) {
  return (
    <div className={styles.adminPanel}>
      <div className={styles.panelHeader}>
        <h2>Комментарии ({comments.length})</h2>
        <p>Меняйте статус сообщений прямо в админке.</p>
      </div>
      {comments.length === 0 ? (
        <p className={styles.adminEmpty}>Комментариев пока нет.</p>
      ) : (
        <ul className={styles.adminCommentList} role="list">
          {comments.map((comment) => (
            <li key={comment.id}>
              <CommentModerationCard comment={comment} action={action} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentModerationCard({ comment, action }: ModerationCardProps) {
  const [state, formAction] = useActionState(action, initialState);
  const status = (comment.status ?? "PENDING") as CommentStatus;
  const statusBadge = `${styles.adminBadge} ${styles.adminCommentStatusBadge} ${
    statusClassNames[status]
  }`;

  return (
    <form action={formAction} className={styles.adminCommentCard}>
      <input type="hidden" name="commentId" value={comment.id} />
      <div className={styles.adminCommentHeader}>
        <div>
          <p className={styles.adminCommentAuthor}>{comment.author.username}</p>
          <p className={styles.adminCommentDate}>
            {dateTimeFormatter.format(new Date(comment.createdAt))}
          </p>
        </div>
        <span className={statusBadge}>{statusLabels[status]}</span>
      </div>
      <p className={styles.adminCommentBody}>{comment.body}</p>
      <div className={styles.adminCommentControls}>
        <label className={styles.adminCommentStatusControl}>
          <span>Изменить статус</span>
          <select name="status" defaultValue={status}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {statusLabels[option]}
              </option>
            ))}
          </select>
        </label>
        <CommentSubmitButton />
      </div>
      {state.error ? (
        <p className={`${styles.formStatus} ${styles.formStatusError}`} role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success && !state.error ? (
        <p className={`${styles.formStatus} ${styles.formStatusSuccess}`}>
          Статус обновлён.
        </p>
      ) : null}
    </form>
  );
}

function CommentSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Сохраняем..." : "Сохранить"}
    </button>
  );
}
