"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Episode } from "@/lib/types";
import { EpisodeCredits } from "./episode-credits";


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
  return hasCdn(ep) ? "cdn" : "iframe";
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
    const paramSource = searchParams?.get("source") as Source | null;
    if (paramSource === "cdn" || paramSource === "iframe") {
      const ep = playableEpisodes.find((e) => e.id === initialEpisodeId);
      // Only honour the URL param if the initial episode supports that source
      if (ep && (
        (paramSource === "cdn" && hasCdn(ep)) ||
        (paramSource === "iframe" && hasIframe(ep))
      )) {
        return paramSource;
      }
    }
    const ep = playableEpisodes.find((e) => e.id === initialEpisodeId);
    return ep ? defaultSource(ep) : "iframe";
  });

  // Derived values — placed before hooks that depend on them.
  const currentEpisode =
    playableEpisodes.find((ep) => ep.id === currentEpisodeId) ??
    playableEpisodes[0];

  const activeSrc = currentEpisode?.playerSrc;

  const bothSources =
    currentEpisode != null &&
    hasIframe(currentEpisode) &&
    hasCdn(currentEpisode);

  const singleSourceLabel =
    currentEpisode != null && hasCdn(currentEpisode) && !hasIframe(currentEpisode)
      ? "CDNVideoHub"
      : "Внешний плеер";

  useEffect(() => {
    setCurrentEpisodeId(initialEpisodeId);
    // Preserve source if the new episode supports it; otherwise fall back
    setSource((prev) => {
      const ep = playableEpisodes.find((e) => e.id === initialEpisodeId);
      if (!ep) return prev;
      if (prev === "cdn" && hasCdn(ep)) return "cdn";
      if (prev === "iframe" && hasIframe(ep)) return "iframe";
      return defaultSource(ep);
    });
  }, [initialEpisodeId, playableEpisodes]);

  const handleEpisodeChange = useCallback(
    (episode: Episode) => {
      setCurrentEpisodeId(episode.id);
      setSource((prev) => {
        if (prev === "cdn" && hasCdn(episode)) return "cdn";
        if (prev === "iframe" && hasIframe(episode)) return "iframe";
        return defaultSource(episode);
      });
      const params = new URLSearchParams(searchParams?.toString());
      params.set("episode", episode.number.toString());
      // Persist source in URL so it survives page reloads
      const currentSource = params.get("source") as Source | null;
      const preferredSource =
        currentSource === "cdn" || currentSource === "iframe"
          ? currentSource
          : defaultSource(episode);
      if (hasCdn(episode) || hasIframe(episode)) {
        params.set("source", preferredSource);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  // Track what episode number we set on the player so we can distinguish
  // our own attribute writes from player-initiated auto-advances.
  const intendedEpisodeNumberRef = useRef<number | null>(null);

  useEffect(() => {
    if (source === "cdn" && currentEpisode != null) {
      intendedEpisodeNumberRef.current = currentEpisode.number;
    }
  }, [source, currentEpisode]);

  useEffect(() => {
    if (source !== "cdn") return;

    let shadowObserver: MutationObserver | null = null;
    let attrObserver: MutationObserver | null = null;
    let intervalId: ReturnType<typeof setInterval>;

    const hide = (root: ShadowRoot) => {
      const el = root.querySelector(".controls") as HTMLElement | null;
      if (el && el.style.display !== "none") el.style.display = "none";
    };

    // CVH player may emit a custom event when it auto-advances an episode.
    // We listen to several likely names since the exact one is undocumented.
    const CVH_EPISODE_EVENTS = ["episodeChange", "episode-change", "changeEpisode", "nextEpisode", "epchange"];

    const handlePlayerEpisodeEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const num = Number(
        detail?.episode ?? detail?.episodeNumber ?? detail?.number ?? detail?.ep ?? NaN
      );
      if (isNaN(num) || num === intendedEpisodeNumberRef.current) return;
      const next = playableEpisodes.find((ep) => ep.number === num);
      if (next) handleEpisodeChange(next);
    };

    let playerEl: HTMLElement | null = null;

    const setup = () => {
      const player = document.getElementById("cvhPlayer") as (HTMLElement & { shadowRoot: ShadowRoot | null }) | null;
      if (!player?.shadowRoot) return false;

      playerEl = player;

      hide(player.shadowRoot);
      shadowObserver = new MutationObserver(() => hide(player.shadowRoot!));
      shadowObserver.observe(player.shadowRoot, { childList: true, subtree: true });

      // Detect when CVH player internally advances via attribute mutation.
      attrObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.attributeName !== "episode") continue;
          const raw = player.getAttribute("episode");
          const num = raw !== null ? Number(raw) : NaN;
          if (isNaN(num) || num === intendedEpisodeNumberRef.current) continue;
          const next = playableEpisodes.find((ep) => ep.number === num);
          if (next) handleEpisodeChange(next);
        }
      });
      attrObserver.observe(player, { attributes: true, attributeFilter: ["episode"] });

      // Detect auto-advance via custom events the player may dispatch.
      CVH_EPISODE_EVENTS.forEach((name) =>
        player.addEventListener(name, handlePlayerEpisodeEvent)
      );

      return true;
    };

    if (!setup()) {
      intervalId = setInterval(() => { if (setup()) clearInterval(intervalId); }, 200);
    }
    return () => {
      clearInterval(intervalId);
      shadowObserver?.disconnect();
      attrObserver?.disconnect();
      if (playerEl) {
        CVH_EPISODE_EVENTS.forEach((name) =>
          playerEl!.removeEventListener(name, handlePlayerEpisodeEvent)
        );
      }
    };
  }, [source, currentEpisodeId, playableEpisodes, handleEpisodeChange]);

  // Keep URL in sync when source is manually toggled
  const handleSourceChange = useCallback(
    (newSource: Source) => {
      setSource(newSource);
      const params = new URLSearchParams(searchParams?.toString());
      params.set("source", newSource);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <section className="episode-player">
      {playableEpisodes.length === 0 ? (
        <p className="episode-player-empty">
          Нет опубликованных серий с плеером
        </p>
      ) : currentEpisode != null ? (
        <>
          {/* Source toggle — only shown when episode has both sources */}
          {bothSources && (
            <div className="episode-player-source-row">
              <div
                className="episode-player-source-toggle"
                role="group"
                aria-label="Выбор источника плеера"
              >
                <button
                  type="button"
                  className={`episode-player-source-btn episode-player-source-btn--cdn${
                    source === "cdn"
                      ? " episode-player-source-btn--active episode-player-source-btn--cdn-active"
                      : ""
                  }`}
                  onClick={() => handleSourceChange("cdn")}
                >
                  CDNVideoHub
                </button>
                <button
                  type="button"
                  className={`episode-player-source-btn${
                    source === "iframe"
                      ? " episode-player-source-btn--active"
                      : ""
                  }`}
                  onClick={() => handleSourceChange("iframe")}
                >
                  Внешний плеер
                </button>
              </div>
            </div>
          )}

          {source === "cdn" && currentEpisode.cvhVideoId ? (
            <div className="episode-player-frame episode-player-frame--cdn">
              <video-player
                key={currentEpisode.id}
                id="cvhPlayer"
                ident="player_1"
                data-title-id={currentEpisode.cvhVideoId}
                data-publisher-id="2819"
                data-aggregator={cvhAggregator ?? "kp"}
                episode={currentEpisode.number}
                only-voice="dreamyvoice"
                is-show-banner="true"
                is-show-voice-only="true"
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

          <EpisodeCredits
            credits={currentEpisode.credits}
            episodeNumber={currentEpisode.number}
          />
        </>
      ) : null}

      <div className="episode-player-selector">
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
