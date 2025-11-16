"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Episode } from "@/lib/types";

type Props = {
  episodes: Episode[];
};

const getEpisodeDisplayName = (episode: Episode) =>
  episode.name && episode.name.trim().length > 0
    ? episode.name.trim()
    : `Серия ${episode.number}`;

export function EpisodePlayer({ episodes }: Props) {
  const playableEpisodes = useMemo(
    () => episodes.filter((episode) => Boolean(episode.playerSrc)),
    [episodes]
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialEpisodeId = useMemo(() => {
    const param = searchParams?.get("episode");
    if (!param) {
      return playableEpisodes[0]?.id;
    }

    const byId = playableEpisodes.find((episode) => episode.id === param);
    if (byId) {
      return byId.id;
    }

    const byNumber = playableEpisodes.find(
      (episode) => episode.number.toString() === param
    );
    return byNumber?.id ?? playableEpisodes[0]?.id;
  }, [playableEpisodes, searchParams]);

  const [currentEpisodeId, setCurrentEpisodeId] = useState(
    () => initialEpisodeId
  );

  useEffect(() => {
    setCurrentEpisodeId(initialEpisodeId);
  }, [initialEpisodeId]);

  const handleEpisodeChange = useCallback(
    (episode: Episode) => {
      setCurrentEpisodeId(episode.id);
      const params = new URLSearchParams(searchParams?.toString());
      params.set("episode", episode.number.toString());
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const currentEpisode =
    playableEpisodes.find((episode) => episode.id === currentEpisodeId) ??
    playableEpisodes[0];

  return (
    <section className="episode-player">
      <div className="episode-player-heading">
        <p className="episode-player-eyebrow">Онлайн просмотр</p>
        <h2 className="episode-player-title">Плеер</h2>
      </div>
      {currentEpisode ? (
        <>
          <div className="episode-player-current">
            <p className="episode-player-current-number">
              Серия {currentEpisode.number}
            </p>
            <p className="episode-player-current-name">
              {getEpisodeDisplayName(currentEpisode)}
            </p>
          </div>
          <div className="episode-player-frame">
            <iframe
              className="episode-player-iframe"
              title={`${getEpisodeDisplayName(
                currentEpisode
              )} (серия ${currentEpisode.number})`}
              src={currentEpisode.playerSrc}
              allowFullScreen
            />
          </div>
        </>
      ) : (
        <p className="episode-player-empty">
          Нет опубликованных серий с плеером
        </p>
      )}
      <div className="episode-player-selector">
        <p className="episode-player-selector-label">Выбор серии</p>
        <div className="episode-player-selector-grid">
          {episodes.map((episode) => {
            const isActive = currentEpisode?.id === episode.id;
            const isDisabled = !episode.playerSrc;
            return (
              <button
                key={episode.id}
                type="button"
                className={`episode-player-selector-button${
                  isActive ? " episode-player-selector-button--active" : ""
                }`}
                onClick={() => handleEpisodeChange(episode)}
                disabled={isDisabled}
                aria-label={`Серия ${episode.number}: ${getEpisodeDisplayName(
                  episode
                )}`}
              >
                <span className="episode-player-selector-button-number">
                  Серия {episode.number}
                </span>
                <span className="episode-player-selector-button-name">
                  {getEpisodeDisplayName(episode)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
