import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { GENRE_KEYWORDS, TAG_KEYWORDS, AGE_RATINGS } from './constants/catalog-keywords';

const prismaModels = Object.fromEntries(Prisma.dmmf.datamodel.models.map((model) => [model.name, model]));

export async function buildAdmin() {
  const [{ default: AdminJS }, { default: AdminJSExpress }, prismaAdapter] = await Promise.all([
    import('adminjs'),
    import('@adminjs/express'),
    import('@adminjs/prisma'),
  ]);

  const { Database, Resource } = prismaAdapter as { Database: any; Resource: any };

  AdminJS.registerAdapter({ Database, Resource });

  const toLabel = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
  const buildOptions = (values: readonly string[]) =>
    values.map((value) => ({
      value,
      label: toLabel(value),
    }));

  const titleResourceOptions = {
    navigation: 'Контент',
    properties: {
      genres: {
        reference: 'Genre',
        isArray: true,
      },
      tags: {
        reference: 'Tag',
        isArray: true,
      },
      ageRating: {
        availableValues: buildOptions(AGE_RATINGS),
      },
      originalReleaseDate: {
        type: 'date',
      },
    },
  };

  const admin = new AdminJS({
    rootPath: '/admin',
    branding: {
      companyName: 'DreamyVoice Admin',
    },
    resources: [
      { resource: { model: prismaModels.User, client: prisma }, options: { navigation: 'Контент' } },
      { resource: { model: prismaModels.Title, client: prisma }, options: titleResourceOptions },
      { resource: { model: prismaModels.Genre, client: prisma }, options: { navigation: 'Словари' } },
      { resource: { model: prismaModels.Tag, client: prisma }, options: { navigation: 'Словари' } },
      { resource: { model: prismaModels.Episode, client: prisma }, options: { navigation: 'Контент' } },
      { resource: { model: prismaModels.Comment, client: prisma }, options: { navigation: 'Модерация' } },
      { resource: { model: prismaModels.Session, client: prisma }, options: { navigation: 'Техническое' } },
    ],
  });

  const router = AdminJSExpress.buildRouter(admin);

  return { admin, router };
}
