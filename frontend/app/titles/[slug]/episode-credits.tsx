import { Fragment } from "react";
import { groupCreditsByRole } from "@/lib/episode-credits";
import type { EpisodeCredit } from "@/lib/types";

type Props = {
  credits?: EpisodeCredit[];
  episodeNumber: number;
};

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
              {group.credits.map((credit) => credit.name).join(", ")}
            </dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}
