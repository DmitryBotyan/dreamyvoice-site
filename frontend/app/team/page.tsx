import type { Metadata } from "next";
import { getTeamMembers } from '@/lib/server-api';
import { TeamList } from './team-list';
import { createBaseMetadata, getAbsoluteUrl } from "@/lib/seo";

export const metadata: Metadata = createBaseMetadata({
  title: "Команда",
  description:
    "Кто делает озвучку DreamyVoice: актёры озвучки, переводчики, звукорежиссёры и все, кто работает над сериями. Здесь же можно поддержать команду.",
  url: getAbsoluteUrl("/team"),
});

export default async function TeamPage() {
  const teamMembers = await getTeamMembers();

  return <TeamList teamMembers={teamMembers} />;
}
