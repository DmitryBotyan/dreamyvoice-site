'use client';

import { useEffect, useState } from 'react';

const LS_KEY = 'dv_seen_eps';

type Props = {
  slug: string;
  episodeCount: number;
};

export function NewEpisodeBadge({ slug, episodeCount }: Props) {
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
      const seen: number | undefined = stored[slug];
      // Show for unvisited titles with episodes, or when new episodes appeared
      setIsNew(episodeCount > 0 && (seen ?? 0) < episodeCount);
    } catch {
      // ignore
    }
  }, [slug, episodeCount]);

  if (!isNew) return null;

  return (
    <span className="new-episode-badge" aria-label="Вышла новая серия">
      Новая серия
    </span>
  );
}
