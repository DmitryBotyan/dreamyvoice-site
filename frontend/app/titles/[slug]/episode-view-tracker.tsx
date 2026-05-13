'use client';

import { useEffect } from 'react';

const LS_KEY = 'dv_seen_eps';

type Props = {
  slug: string;
  episodeCount: number;
};

export function EpisodeViewTracker({ slug, episodeCount }: Props) {
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
      stored[slug] = episodeCount;
      localStorage.setItem(LS_KEY, JSON.stringify(stored));
    } catch {
      // localStorage may be unavailable (private mode etc.)
    }
  }, [slug, episodeCount]);

  return null;
}
