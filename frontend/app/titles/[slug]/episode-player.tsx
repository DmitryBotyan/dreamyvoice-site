"use client";

import { useMemo, useState } from "react";
import type { Episode } from "@/lib/types";

type Props = {
  episodes: Episode[];
};

export function EpisodePlayer({ episodes }: Props) {
  const playableEpisodes = useMemo(
    () => episodes.filter((episode) => Boolean(episode.playerSrc)),
    [episodes]
  );
  const [currentEpisodeId, setCurrentEpisodeId] = useState(
    playableEpisodes[0]?.id
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
          <div className="episode-player-frame">
            <iframe
              className="episode-player-iframe"
              title={currentEpisode.name}
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
                onClick={() => setCurrentEpisodeId(episode.id)}
                disabled={isDisabled}
              >
                Серия {episode.number}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
