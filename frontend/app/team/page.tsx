import type { Metadata } from "next";
import { getTeamMembers } from '@/lib/server-api';
import { TeamList } from './team-list';
import { createBaseMetadata, getAbsoluteUrl } from "@/lib/seo";

export const metadata: Metadata = createBaseMetadata({
  title: "Команда DreamyVoice",
  description:
    "Знакомьтесь с командой озвучки DreamyVoice. Профессиональные актеры и режиссеры, которые создают качественную русскую озвучку аниме.",
  url: getAbsoluteUrl("/team"),
});

export default async function TeamPage() {
  const teamMembers = await getTeamMembers();

  return <TeamList teamMembers={teamMembers} />;
}
