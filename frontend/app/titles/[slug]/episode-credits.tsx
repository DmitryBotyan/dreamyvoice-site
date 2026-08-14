/* eslint-disable @next/next/no-img-element */
import { buildMediaUrl } from "@/lib/media";
import { groupCreditsByRole } from "@/lib/episode-credits";
import type { EpisodeCredit } from "@/lib/types";

type Props = {
  credits?: EpisodeCredit[];
  episodeNumber: number;
};

const createInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

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
      <ul className="episode-credits-groups" role="list">
        {groups.map((group) => (
          <li key={group.role} className="episode-credits-group">
            <span className="episode-credits-role">{group.role}</span>
            <ul className="episode-credits-people" role="list">
              {group.credits.map((credit) => {
                const avatarUrl = credit.avatarKey
                  ? buildMediaUrl("avatars", credit.avatarKey)
                  : null;

                return (
                  <li key={credit.id} className="episode-credits-person">
                    <span className="episode-credits-avatar" aria-hidden="true">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" width={28} height={28} />
                      ) : (
                        createInitials(credit.name)
                      )}
                    </span>
                    <span className="episode-credits-name">{credit.name}</span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
