export type UserRole = 'USER' | 'ADMIN';

export type PublicUser = {
  id: string;
  profileId: number;
  username: string;
  email?: string | null;
  emailVerified: boolean;
  role: UserRole;
  avatarKey?: string | null;
  bio?: string | null;
  favoriteGenres?: string[];
  createdAt: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  avatarKey?: string | null;
  createdAt: string;
};

export type Episode = {
  id: string;
  number: number;
  name: string;
  durationMinutes?: number | null;
  playerSrc?: string;
  cvhVideoId?: string;
  published: boolean;
};

export type Title = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  coverKey?: string | null;
  coverBlurHash?: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  episodes: Episode[];
  genres: string[];
  tags: string[];
  ageRating?: string | null;
  originalReleaseDate?: string | null;
  cvhAggregator?: string | null;
  avgRating?: number | null;
  ratingCount?: number;
  myRating?: number | null;
};

export type FavoriteTitle = {
  id: string;
  slug: string;
  name: string;
  coverKey?: string | null;
  coverBlurHash?: string | null;
};

export type AnimeListStatus = 'WATCHING' | 'WATCHED' | 'DROPPED' | 'PLANNED';

export type AnimeListTitle = {
  id: string;
  slug: string;
  name: string;
  coverKey?: string | null;
  coverBlurHash?: string | null;
};

export type ActivityEntry = {
  status: AnimeListStatus;
  updatedAt: string;
  title: { id: string; slug: string; name: string };
};

export type PublicProfile = {
  id: string;
  profileId: number;
  username: string;
  avatarKey?: string | null;
  bio?: string | null;
  role: UserRole;
  favoriteGenres?: string[];
  createdAt: string;
  animeList: Record<AnimeListStatus, AnimeListTitle[]>;
  recentActivity?: ActivityEntry[];
};

export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type Comment = {
  id: string;
  body: string;
  status?: CommentStatus;
  createdAt: string;
  author: {
    id: string;
    profileId: number;
    username: string;
    avatarKey?: string | null;
  };
  likeCount: number;
  dislikeCount: number;
  userReaction: 'LIKE' | 'DISLIKE' | null;
  replies: Comment[];
};
