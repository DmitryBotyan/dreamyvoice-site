import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import sharp from 'sharp';
import { encode } from 'blurhash';
import { asyncHandler } from '../utils/async-handler';
import { HttpError } from '../utils/http-error';
import { ensureBucket, getObject, makeObjectKey, MediaBucket, uploadObject, deleteObject } from '../services/storage';
import { requireAuth } from '../middleware/require-auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const bucketSchema = z.object({
  bucket: z.enum(['avatars', 'covers']),
});

const keyParamSchema = z.object({
  key: z.string().min(1),
});

function assertBucketPermissions(bucket: MediaBucket, role?: string) {
  if (bucket === 'covers' && role !== 'ADMIN') {
    throw new HttpError(403, 'Только админы могут загружать обложки');
  }
}

type KeyParam = string | string[] | undefined;

function parseKeyParam(req: Request) {
  const params = req.params as Request['params'] & { key?: KeyParam; 0?: string };
  const rawKey = params.key ?? params[0];
  const normalizedKey = Array.isArray(rawKey) ? rawKey.join('/') : rawKey;

  return keyParamSchema.parse({ key: normalizedKey });
}

router.get(
  '/:bucket/*key',
  asyncHandler(async (req: Request, res: Response) => {
    const { bucket } = bucketSchema.parse(req.params);
    const { key } = parseKeyParam(req);
    ensureBucket(bucket);

    const object = await getObject(bucket, key);
    if (object.contentType) {
      res.setHeader('Content-Type', object.contentType);
    }
    if (object.contentLength !== undefined) {
      res.setHeader('Content-Length', object.contentLength);
    }

    object.body.pipe(res);
  }),
);

router.post(
  '/:bucket',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const { bucket } = bucketSchema.parse(req.params);
    const file = req.file;

    if (!file) {
      throw new HttpError(400, 'Файл обязателен');
    }

    ensureBucket(bucket);
    assertBucketPermissions(bucket, req.currentUser?.role);

    const key = (req.body?.key as string | undefined)?.trim() || makeObjectKey(file.originalname);
    await uploadObject({
      bucket,
      key,
      body: file.buffer,
      contentType: file.mimetype,
    });

    if (bucket === 'covers') {
      try {
        const { data, info } = await sharp(file.buffer)
          .resize(32, 32, { fit: 'cover', withoutEnlargement: false })
          .raw()
          .ensureAlpha()
          .toBuffer({ resolveWithObject: true });

        const blurHash = encode(
          new Uint8ClampedArray(data),
          info.width,
          info.height,
          4,
          3,
        );

        res.status(201).json({ bucket, key, blurHash });
        return;
      } catch {
        // Fall through to plain response if blur hash fails
      }
    }

    res.status(201).json({ bucket, key });
  }),
);

router.delete(
  '/:bucket/*key',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { bucket } = bucketSchema.parse(req.params);
    const { key } = parseKeyParam(req);

    ensureBucket(bucket);
    assertBucketPermissions(bucket, req.currentUser?.role);

    await deleteObject(bucket, key);
    res.status(204).send();
  }),
);

export { router as mediaRouter };
