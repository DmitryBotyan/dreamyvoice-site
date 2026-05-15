'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { deleteCommentAction } from './actions';

type Props = {
  titleSlug: string;
  commentId: string;
  authorName: string;
};

export function CommentDeleteButton({ titleSlug, commentId, authorName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    confirmBtnRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, isPending]);

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteCommentAction(titleSlug, commentId);
      if (!result.success) {
        setError(result.error ?? 'Не удалось удалить комментарий — попробуйте ещё раз');
        return;
      }
      setIsOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        className="comment-card-delete"
        onClick={() => setIsOpen(true)}
        aria-label={`Удалить комментарий пользователя ${authorName}`}
        title="Удалить комментарий"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M2 2 L12 12 M12 2 L2 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {isOpen ? (
        <div
          className="comment-delete-modal-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isPending) {
              setIsOpen(false);
            }
          }}
        >
          <div
            className="comment-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="comment-delete-title"
            ref={dialogRef}
          >
            <h3 id="comment-delete-title" className="comment-delete-modal-title">
              Удалить комментарий?
            </h3>
            <p className="comment-delete-modal-text">
              Комментарий пользователя <strong>{authorName}</strong> будет
              удалён без возможности восстановления.
            </p>
            {error ? (
              <p className="comment-delete-modal-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="comment-delete-modal-actions">
              <button
                type="button"
                className="comment-delete-modal-cancel"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Отмена
              </button>
              <button
                type="button"
                className="comment-delete-modal-confirm"
                onClick={handleConfirm}
                disabled={isPending}
                ref={confirmBtnRef}
              >
                {isPending ? 'Удаляем…' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
