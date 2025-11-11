import { prisma } from '../prisma';
import { GENRE_KEYWORDS, TAG_KEYWORDS } from '../constants/catalog-keywords';

export async function syncCatalogMetadata() {
  await Promise.all([
    Promise.all(
      GENRE_KEYWORDS.map((genre) =>
        prisma.genre.upsert({
          where: { name: genre },
          create: { name: genre },
          update: {},
        }),
      ),
    ),
    Promise.all(
      TAG_KEYWORDS.map((tag) =>
        prisma.tag.upsert({
          where: { name: tag },
          create: { name: tag },
          update: {},
        }),
      ),
    ),
  ]);
}
