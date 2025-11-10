'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MouseEvent, useState } from "react";
import { clientConfig } from "@/lib/client-config";
import { useAuthModal } from "@/app/auth-modal-context";

type Props = {
  titleSlug: string;
  isAuthenticated: boolean;
};

export function CommentForm({ titleSlug, isAuthenticated }: Props) {
  const router = useRouter();
  const { openModal } = useAuthModal();
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuthLinkClick = (mode: 'login' | 'register') => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    openModal(mode);
  };

  if (!isAuthenticated) {
    return (
      <div className="comment-form comment-form--guest">
        <p>
          <Link href="/login" onClick={handleAuthLinkClick('login')}>Войдите</Link> или{" "}
          <Link href="/register" onClick={handleAuthLinkClick('register')}>зарегистрируйтесь</Link>, чтобы оставить комментарий.
        </p>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `${clientConfig.apiProxyBasePath}/titles/${titleSlug}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ body }),
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Не удалось отправить комментарий");
      }

      setBody("");
      setMessage("Комментарий отправлен на модерацию.");
      router.refresh();
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <label className="comment-form-label" htmlFor="comment-body">
        Сообщение
      </label>
      <textarea
        id="comment-body"
        className="comment-form-textarea"
        name="comment"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        minLength={3}
        maxLength={2000}
        required
        placeholder="Поделитесь впечатлениями от тайтла"
      />
      <div className="comment-form-actions">
        <button type="submit" className="comment-form-submit" disabled={isSubmitting}>
          {isSubmitting ? "Отправляем…" : "Отправить"}
        </button>
        <span className="comment-form-hint">до 2000 символов</span>
      </div>
      {message ? <p className="comment-form-message">{message}</p> : null}
      {error ? <p className="comment-form-error">{error}</p> : null}
    </form>
  );
}
