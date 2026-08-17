/* eslint-disable @next/next/no-img-element */
import { Fragment } from "react";
import { buildMediaUrl } from "@/lib/media";
import { groupCreditsByRole } from "@/lib/episode-credits";
import type { EpisodeCredit } from "@/lib/types";

type Props = {
  credits?: EpisodeCredit[];
  episodeNumber: number;
};

/** Заглушка для тех, у кого аватарки нет: первая буква имени. */
const firstLetter = (name: string) => name.trim()[0]?.toUpperCase() ?? "?";

/**
 * Титры серии: список «роль — кто делал». Строками, без карточки и плашек —
 * блок и так лежит внутри плеера, а имена читаются как обычный текст.
 */
export function EpisodeCredits({ credits, episodeNumber }: Props) {
  const groups = groupCreditsByRole(credits);

  if (groups.length === 0) {
    return null;
  }

  return (
    <section
      className="episode-credits"
      aria-label={`Над серией ${episodeNumber} работали`}
    >
      <h3 className="episode-credits-title">Над серией работали</h3>
      <dl className="episode-credits-list">
        {groups.map((group) => (
          <Fragment key={group.role}>
            <dt className="episode-credits-role">{group.role}</dt>
            <dd className="episode-credits-people">
              {group.credits.map((credit) => {
                const avatarUrl = credit.avatarKey
                  ? buildMediaUrl("avatars", credit.avatarKey)
                  : null;

                return (
                  <span key={credit.id} className="episode-credits-person">
                    <span className="episode-credits-avatar" aria-hidden="true">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" width={24} height={24} />
                      ) : (
                        firstLetter(credit.name)
                      )}
                    </span>
                    {credit.name}
                  </span>
                );
              })}
            </dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}
