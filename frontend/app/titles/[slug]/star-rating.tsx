'use client';

import { useCallback, useState } from 'react';
import { Star } from 'lucide-react';
import { clientConfig } from '@/lib/client-config';
import { useAuthModal } from '@/app/auth-modal-context';

type Props = {
  slug: string;
  initialAvgRating: number | null;
  initialRatingCount: number;
  initialMyRating: number | null;
  isAuthenticated: boolean;
};

export function StarRating({
  slug,
  initialAvgRating,
  initialRatingCount,
  initialMyRating,
  isAuthenticated,
}: Props) {
  const { openModal } = useAuthModal();
  const [myRating, setMyRating] = useState(initialMyRating);
  const [avgRating, setAvgRating] = useState(initialAvgRating);
  const [ratingCount, setRatingCount] = useState(initialRatingCount);
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = useCallback(
    async (value: number) => {
      if (!isAuthenticated) {
        openModal('login');
        return;
      }
      if (isSubmitting) return;

      setIsSubmitting(true);
      const prevMyRating = myRating;

      // Optimistic update
      setMyRating(value);

      try {
        const res = await fetch(
          `${clientConfig.apiProxyBasePath}/titles/${encodeURIComponent(slug)}/ratings`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value }),
          },
        );

        if (res.status === 401) {
          openModal('login');
          setMyRating(prevMyRating);
          return;
        }

        if (!res.ok) {
          setMyRating(prevMyRating);
          return;
        }

        const payload = await res.json();
        setAvgRating(payload.avgRating ?? null);
        setRatingCount(payload.ratingCount ?? 0);
        setMyRating(payload.myRating ?? null);
      } catch {
        setMyRating(prevMyRating);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isAuthenticated, isSubmitting, myRating, openModal, slug],
  );

  // What to visually highlight: hover > my rating > rounded average
  const displayValue =
    hoverValue ??
    myRating ??
    (avgRating !== null ? Math.round(avgRating) : 0);

  const isHovering = hoverValue !== null;

  return (
    <div className="star-rating">
      <div
        className="star-rating-stars"
        role="group"
        aria-label="Оценка тайтла"
        onMouseLeave={() => setHoverValue(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= displayValue;
          const isMine = !isHovering && myRating !== null && star <= myRating;
          const isHovered = isHovering && star <= (hoverValue ?? 0);

          return (
            <button
              key={star}
              type="button"
              className={[
                'star-rating-star',
                filled ? 'star-rating-star--filled' : '',
                isMine ? 'star-rating-star--mine' : '',
                isHovered ? 'star-rating-star--hover' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onMouseEnter={() => setHoverValue(star)}
              onClick={() => handleVote(star)}
              aria-label={`Оценить ${star} из 5`}
              disabled={isSubmitting}
            >
              <Star size={20} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      {ratingCount > 0 && (
        <span className="star-rating-info">
          {avgRating !== null ? avgRating.toFixed(1) : '—'}{' '}
          <span className="star-rating-count">({ratingCount})</span>
        </span>
      )}
    </div>
  );
}
