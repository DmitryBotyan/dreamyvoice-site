"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Episode } from "@/lib/types";


type Props = {
  episodes: Episode[];
  cvhAggregator?: string | null;
};

type Source = "iframe" | "cdn";

const getEpisodeDisplayName = (episode: Episode) =>
  episode.name && episode.name.trim().length > 0
    ? episode.name.trim()
    : `Серия ${episode.number}`;

function hasIframe(ep: Episode) {
  return Boolean(ep.playerSrc);
}

function hasCdn(ep: Episode) {
  return Boolean(ep.cvhVideoId);
}

function isPlayable(ep: Episode) {
  return hasIframe(ep) || hasCdn(ep);
}

function defaultSource(ep: Episode): Source {
  return hasIframe(ep) ? "iframe" : "cdn";
}

export function EpisodePlayer({ episodes, cvhAggregator }: Props) {
  const playableEpisodes = useMemo(
    () => episodes.filter(isPlayable),
    [episodes]
  );

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialEpisodeId = useMemo(() => {
    const param = searchParams?.get("episode");
    if (!param) return playableEpisodes[0]?.id;
    const byId = playableEpisodes.find((ep) => ep.id === param);
    if (byId) return byId.id;
    const byNumber = playableEpisodes.find(
      (ep) => ep.number.toString() === param
    );
    return byNumber?.id ?? playableEpisodes[0]?.id;
  }, [playableEpisodes, searchParams]);

  const [currentEpisodeId, setCurrentEpisodeId] = useState(
    () => initialEpisodeId
  );
  const [source, setSource] = useState<Source>(() => {
    const ep = playableEpisodes.find((e) => e.id === initialEpisodeId);
    return ep ? defaultSource(ep) : "iframe";
  });

  useEffect(() => {
    setCurrentEpisodeId(initialEpisodeId);
    const ep = playableEpisodes.find((e) => e.id === initialEpisodeId);
    if (ep) setSource(defaultSource(ep));
  }, [initialEpisodeId, playableEpisodes]);

  const handleEpisodeChange = useCallback(
    (episode: Episode) => {
      setCurrentEpisodeId(episode.id);
      setSource(defaultSource(episode));
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
    playableEpisodes.find((ep) => ep.id === currentEpisodeId) ??
    playableEpisodes[0];

  const activeSrc = currentEpisode?.playerSrc;

  const bothSources =
    currentEpisode != null &&
    hasIframe(currentEpisode) &&
    hasCdn(currentEpisode);

  // Single-source label: based on which source the episode actually has
  const singleSourceLabel =
    currentEpisode != null && hasCdn(currentEpisode) && !hasIframe(currentEpisode)
      ? "CDNVideoHub"
      : "Внешний плеер";

  return (
    <section className="episode-player">
      <div className="episode-player-heading">
        <p className="episode-player-eyebrow">Онлайн просмотр</p>
        <h2 className="episode-player-title">Плеер</h2>
      </div>

      {playableEpisodes.length === 0 ? (
        <p className="episode-player-empty">
          Нет опубликованных серий с плеером
        </p>
      ) : currentEpisode != null ? (
        <>
          {/* Source indicator / toggle — above episode label */}
          <div className="episode-player-source-row">
            {bothSources ? (
              <div
                className="episode-player-source-toggle"
                role="group"
                aria-label="Выбор источника плеера"
              >
                <button
                  type="button"
                  className={`episode-player-source-btn${
                    source === "iframe"
                      ? " episode-player-source-btn--active"
                      : ""
                  }`}
                  onClick={() => setSource("iframe")}
                >
                  Внешний плеер
                </button>
                <button
                  type="button"
                  className={`episode-player-source-btn episode-player-source-btn--cdn${
                    source === "cdn"
                      ? " episode-player-source-btn--active episode-player-source-btn--cdn-active"
                      : ""
                  }`}
                  onClick={() => setSource("cdn")}
                >
                  CDNVideoHub
                </button>
              </div>
            ) : (
              <p className="episode-player-source-label">{singleSourceLabel}</p>
            )}
          </div>

          <div className="episode-player-current">
            <p className="episode-player-current-number">
              Серия {currentEpisode.number}
            </p>
          </div>

          {source === "cdn" && currentEpisode.cvhVideoId ? (
            <div className="episode-player-frame episode-player-frame--cdn">
              <video-player
                id="cvhPlayer"
                ident="player_1"
                data-title-id={currentEpisode.cvhVideoId}
                data-publisher-id="2819"
                data-aggregator={cvhAggregator ?? "kp"}
                episode={currentEpisode.number}
                is-show-banner="true"
                disable-licensed="false"
              />
            </div>
          ) : activeSrc ? (
            <div className="episode-player-frame">
              <iframe
                key={activeSrc}
                className="episode-player-iframe"
                title={`${getEpisodeDisplayName(currentEpisode)} (серия ${currentEpisode.number})`}
                src={activeSrc}
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
              />
            </div>
          ) : null}
        </>
      ) : null}

      <div className="episode-player-selector">
        <p className="episode-player-selector-label">Выбор серии</p>
        <div className="episode-player-selector-grid">
          {episodes.map((episode) => {
            const isActive = currentEpisode?.id === episode.id;
            const isDisabled = !isPlayable(episode);
            const cdnOnly = !hasIframe(episode) && hasCdn(episode);
            return (
              <button
                key={episode.id}
                type="button"
                className={[
                  "episode-player-selector-button",
                  isActive ? "episode-player-selector-button--active" : "",
                  cdnOnly ? "episode-player-selector-button--cdn" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleEpisodeChange(episode)}
                disabled={isDisabled}
                aria-label={`Серия ${episode.number}: ${getEpisodeDisplayName(episode)}${
                  cdnOnly ? " (CDN)" : ""
                }`}
              >
                <span className="episode-player-selector-button-number">
                  Серия {episode.number}
                </span>
                {cdnOnly && (
                  <span
                    className="episode-player-selector-button-cdn-dot"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
