import { PrismaClient } from '@prisma/client';
import { env } from './env';

const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
  query: {
    episode: {
      create({ args, query }) {
        validateEpisodePayload(args.data);
        return query(args);
      },
      update({ args, query }) {
        validateEpisodePayload(args.data);
        return query(args);
      },
      upsert({ args, query }) {
        validateEpisodePayload(args.create);
        validateEpisodePayload(args.update);
        return query(args);
      },
      createMany({ args, query }) {
        validateEpisodePayload(args.data);
        return query(args);
      },
      updateMany({ args, query }) {
        validateEpisodePayload(args.data);
        return query(args);
      },
    },
  },
});

function validateEpisodePayload(payload: unknown) {
  const values = collectPlayerSrcValues(payload);
  values.forEach(assertAllowedHost);
}

function collectPlayerSrcValues(payload: unknown): string[] {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload.flatMap(collectPlayerSrcValues);
  }

  if (typeof payload !== 'object') {
    return [];
  }

  const data = payload as Record<string, unknown>;

  // null explicitly means "clear playerSrc" — skip validation
  if (data.playerSrc === null || data.player_src === null) {
    return [];
  }

  const rawValue =
    pickString(data.playerSrc) ??
    pickString(data.player_src) ??
    pickString(data.playerSRC) ??
    pickString(data.set);

  return rawValue ? [rawValue] : [];
}

function pickString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && typeof (value as any).set === 'string') {
    return (value as any).set;
  }
  return undefined;
}

function assertAllowedHost(urlString: string) {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error('player_src must be a valid URL');
  }

  const host = parsed.hostname.toLowerCase();
  if (!env.playerAllowedHostsSet.has(host)) {
    throw new Error(`player_src host "${host}" is not allowed`);
  }
}
