'use client';

'use client';

import { useCallback, useEffect, useState } from 'react';
import { clientConfig } from '@/lib/client-config';
import { useAuthModal } from '@/app/auth-modal-context';

type Props = {
  slug: string;
};

export function FavoriteToggle({ slug }: Props) {
  const { openModal } = useAuthModal();
  const [isFavorite, setIsFavorite] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFavoriteState = useCallback(async () => {
    try {
      const response = await fetch(
        `${clientConfig.apiProxyBasePath}/favorites/${encodeURIComponent(slug)}`,
        {
          credentials: 'include',
        },
      );

      if (response.status === 401) {
        setIsFavorite(false);
        return;
      }

      if (!response.ok) {
        console.error('Не удалось загрузить состояние избранного', response.status);
        setIsFavorite(false);
        return;
      }

      const payload = await response.json();
      setIsFavorite(Boolean(payload.isFavorite));
    } catch (error) {
      console.error(error);
    }
  }, [slug]);

  useEffect(() => {
    fetchFavoriteState();
  }, [fetchFavoriteState]);

  const toggleFavorite = useCallback(async () => {
    if (isLoading || isFavorite === null) {
      return;
    }

    setIsLoading(true);

    try {
      const method = isFavorite ? 'DELETE' : 'POST';
      const response = await fetch(
        `${clientConfig.apiProxyBasePath}/favorites/${encodeURIComponent(slug)}`,
        {
          method,
          credentials: 'include',
        },
      );

      if (response.status === 401) {
        openModal('login');
        return;
      }

      if (!response.ok) {
        throw new Error('Не удалось обновить избранное');
      }

      const payload = await response.json();
      setIsFavorite(Boolean(payload.isFavorite));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [isFavorite, isLoading, openModal, slug]);

  return (
      <button
        type="button"
        className={`favorite-toggle${isFavorite ? ' favorite-toggle--active' : ''}`}
        onClick={toggleFavorite}
        disabled={isLoading || isFavorite === null}
        aria-pressed={Boolean(isFavorite)}
        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
      >
        <span aria-hidden="true">★</span>
        <span className="sr-only">
          {isFavorite ? 'Убрано из избранного' : 'Добавить в избранное'}
        </span>
      </button>
  );
}
