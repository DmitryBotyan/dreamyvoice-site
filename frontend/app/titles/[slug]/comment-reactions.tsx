'use client';

import { useState } from 'react';
import { clientConfig } from '@/lib/client-config';

type ReactionType = 'LIKE' | 'DISLIKE';

type Props = {
  titleSlug: string;
  commentId: string;
  likeCount: number;
  dislikeCount: number;
  userReaction: ReactionType | null;
  isAuthenticated: boolean;
};

export function CommentReactions({
  titleSlug,
  commentId,
  likeCount: initialLikes,
  dislikeCount: initialDislikes,
  userReaction: initialReaction,
  isAuthenticated,
}: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [reaction, setReaction] = useState<ReactionType | null>(initialReaction);
  const [pending, setPending] = useState(false);

  async function react(type: ReactionType) {
    if (!isAuthenticated || pending) return;

    // optimistic update
    const prev = { likes, dislikes, reaction };
    const toggling = reaction === type;
    setReaction(toggling ? null : type);
    if (type === 'LIKE') {
      setLikes((v) => v + (toggling ? -1 : 1));
      if (reaction === 'DISLIKE') setDislikes((v) => v - 1);
    } else {
      setDislikes((v) => v + (toggling ? -1 : 1));
      if (reaction === 'LIKE') setLikes((v) => v - 1);
    }

    setPending(true);
    try {
      const res = await fetch(
        `${clientConfig.apiProxyBasePath}/titles/${titleSlug}/comments/${commentId}/reactions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ type }),
        },
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLikes(data.likeCount);
      setDislikes(data.dislikeCount);
      setReaction(data.userReaction);
    } catch {
      setLikes(prev.likes);
      setDislikes(prev.dislikes);
      setReaction(prev.reaction);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="comment-reactions">
      <button
        type="button"
        className={`comment-reaction-btn${reaction === 'LIKE' ? ' comment-reaction-btn--active' : ''}`}
        onClick={() => react('LIKE')}
        disabled={!isAuthenticated || pending}
        aria-label={`Нравится, ${likes}`}
        aria-pressed={reaction === 'LIKE'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={reaction === 'LIKE' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>
        {likes > 0 && <span>{likes}</span>}
      </button>
      <button
        type="button"
        className={`comment-reaction-btn${reaction === 'DISLIKE' ? ' comment-reaction-btn--active comment-reaction-btn--dislike' : ''}`}
        onClick={() => react('DISLIKE')}
        disabled={!isAuthenticated || pending}
        aria-label={`Не нравится, ${dislikes}`}
        aria-pressed={reaction === 'DISLIKE'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={reaction === 'DISLIKE' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
        </svg>
        {dislikes > 0 && <span>{dislikes}</span>}
      </button>
    </div>
  );
}
