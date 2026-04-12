import { config } from 'dotenv';
import { z } from 'zod';

config();

const optionalUrl = z
  .string()
  .trim()
  .url()
  .optional()
  .transform((value) => value?.replace(/\/+$/, ''));

const optionalNonEmptyString = z
  .string()
  .trim()
  .min(1)
  .optional();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().url(),
    SESSION_COOKIE_NAME: z.string().min(1),
    SESSION_COOKIE_SECRET: z.string().min(16),
    SESSION_COOKIE_SECURE: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
    SESSION_COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    SESSION_TTL_HOURS: z.coerce.number().int().positive().default(720),
    PLAYER_ALLOWED_HOSTS: z
      .string()
      .transform((value) =>
        value
          .split(',')
          .map((host) => host.trim().toLowerCase())
          .filter(Boolean),
      )
      .refine((hosts) => hosts.length > 0, 'PLAYER_ALLOWED_HOSTS must include at least one host'),
    S3_ENDPOINT: z.string().url(),
    S3_ACCESS_KEY: z.string().min(1),
    S3_SECRET_KEY: z.string().min(1),
    S3_BUCKET_AVATARS: z.string().min(1),
    S3_BUCKET_COVERS: z.string().min(1),
    S3_FORCE_PATH_STYLE: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
    CDN_VIDEOHUB_BASE_URL: optionalUrl,
    CDN_VIDEOHUB_TOKEN: optionalNonEmptyString,
    CDN_VIDEOHUB_PLAYER_BASE_URL: optionalUrl,
  })
  .superRefine((value, ctx) => {
    const hasApiBaseUrl = Boolean(value.CDN_VIDEOHUB_BASE_URL);
    const hasApiToken = Boolean(value.CDN_VIDEOHUB_TOKEN);

    if (hasApiBaseUrl !== hasApiToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CDN_VIDEOHUB_BASE_URL and CDN_VIDEOHUB_TOKEN must be set together',
        path: hasApiBaseUrl ? ['CDN_VIDEOHUB_TOKEN'] : ['CDN_VIDEOHUB_BASE_URL'],
      });
    }
  });

const rawEnv = envSchema.parse(process.env);

const sessionCookieSecure =
  rawEnv.SESSION_COOKIE_SECURE ??
  (rawEnv.NODE_ENV === 'production' ? true : false);

export const env = {
  ...rawEnv,
  sessionCookieSecure,
  isProduction: rawEnv.NODE_ENV === 'production',
  playerAllowedHostsSet: new Set(rawEnv.PLAYER_ALLOWED_HOSTS),
  mediaBucketsSet: new Set([rawEnv.S3_BUCKET_AVATARS, rawEnv.S3_BUCKET_COVERS]),
  cdnVideoHubPlayerBaseUrl: rawEnv.CDN_VIDEOHUB_PLAYER_BASE_URL ?? null,
  cdnVideoHub:
    rawEnv.CDN_VIDEOHUB_BASE_URL && rawEnv.CDN_VIDEOHUB_TOKEN
      ? {
          baseUrl: rawEnv.CDN_VIDEOHUB_BASE_URL,
          token: rawEnv.CDN_VIDEOHUB_TOKEN,
        }
      : null,
  s3: {
    endpoint: rawEnv.S3_ENDPOINT,
    accessKeyId: rawEnv.S3_ACCESS_KEY,
    secretAccessKey: rawEnv.S3_SECRET_KEY,
    forcePathStyle: rawEnv.S3_FORCE_PATH_STYLE,
    buckets: {
      avatars: rawEnv.S3_BUCKET_AVATARS,
      covers: rawEnv.S3_BUCKET_COVERS,
    },
  },
  sessionCookieOptions: {
    httpOnly: true,
    sameSite: rawEnv.SESSION_COOKIE_SAMESITE as 'lax' | 'strict' | 'none',
    secure: sessionCookieSecure,
  },
};
