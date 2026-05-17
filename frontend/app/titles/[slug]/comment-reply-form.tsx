'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientConfig } from '@/lib/client-config';

type Props = {
  titleSlug: string;
  parentId: string;
  onCancel: () => void;
};

export function CommentReplyForm({ titleSlug, parentId, onCancel }: Props) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (trimmed.length < 3) {
      setError('Минимум 3 символа.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `${clientConfig.apiProxyBasePath}/titles/${titleSlug}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ body: trimmed, parentId }),
        },
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message ?? 'Не удалось отправить ответ — попробуйте ещё раз.');
      }
      setBody('');
      onCancel();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="comment-reply-form" onSubmit={handleSubmit}>
      <textarea
        className="comment-form-textarea comment-reply-textarea"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Ваш ответ…"
        maxLength={2000}
        rows={3}
        autoFocus
      />
      <div className="comment-form-actions">
        <button type="submit" className="comment-form-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Отправляем…' : 'Ответить'}
        </button>
        <button type="button" className="comment-reply-cancel" onClick={onCancel} disabled={isSubmitting}>
          Отмена
        </button>
      </div>
      {error && <p className="comment-form-error">{error}</p>}
    </form>
  );
}
