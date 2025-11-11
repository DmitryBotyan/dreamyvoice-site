import { getTeamMembers } from '@/lib/server-api';
import { TeamList } from './team-list';

export default async function TeamPage() {
  const teamMembers = await getTeamMembers();

  return <TeamList teamMembers={teamMembers} />;
}
