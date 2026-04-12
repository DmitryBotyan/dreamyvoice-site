import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/async-handler';
import { requireAdmin } from '../middleware/require-admin';
import { HttpError } from '../utils/http-error';
import {
  isCdnConfigured,
  listVideos,
  createVideo,
  getVideo,
  updateVideo,
  deleteVideo,
  getUploadingUrl,
  proxyUploadChunk,
  type VideoListParams,
  type VideoPostBody,
  type VideoPatchBody,
} from '../services/cdnvideohub';

const router = Router();

function requireCdn(_req: Request, _res: Response, next: (err?: unknown) => void) {
  if (!isCdnConfigured()) {
    return next(new HttpError(503, 'CDNVideoHub is not configured on this server'));
  }
  next();
}

const videoIdSchema = z.object({ id: z.coerce.number().int().positive() });

const videoListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  status: z.coerce.number().int().optional(),
  cvh_id: z.string().optional(),
  cvh_title_id: z.string().optional(),
  cvh_episode_id: z.coerce.number().int().optional(),
  cvh_language_id: z.coerce.number().int().optional(),
  cvh_voice_type_id: z.coerce.number().int().optional(),
  cvh_video_type_id: z.coerce.number().int().optional(),
  cvh_video_resolution_id: z.coerce.number().int().optional(),
  cvh_embedded_advertisement: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  uploader: z.string().optional(),
  error_is_null: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  created_at_from: z.string().optional(),
  created_at_to: z.string().optional(),
  updated_at_from: z.string().optional(),
  updated_at_to: z.string().optional(),
});

// GET /cdnvideohub/videos
router.get(
  '/videos',
  requireAdmin,
  requireCdn,
  asyncHandler(async (req: Request, res: Response) => {
    const params = videoListQuerySchema.parse(req.query) as VideoListParams;
    const videos = await listVideos(params);
    res.json(videos);
  }),
);

// POST /cdnvideohub/videos
router.post(
  '/videos',
  requireAdmin,
  requireCdn,
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as VideoPostBody;
    const video = await createVideo(body);
    res.status(201).json(video);
  }),
);

// GET /cdnvideohub/videos/:id
router.get(
  '/videos/:id',
  requireAdmin,
  requireCdn,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = videoIdSchema.parse(req.params);
    const video = await getVideo(id);
    res.json(video);
  }),
);

// PATCH /cdnvideohub/videos/:id
router.patch(
  '/videos/:id',
  requireAdmin,
  requireCdn,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = videoIdSchema.parse(req.params);
    const body = req.body as VideoPatchBody;
    const video = await updateVideo(id, body);
    res.json(video);
  }),
);

// DELETE /cdnvideohub/videos/:id
router.delete(
  '/videos/:id',
  requireAdmin,
  requireCdn,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = videoIdSchema.parse(req.params);
    await deleteVideo(id);
    res.status(204).send();
  }),
);

// GET /cdnvideohub/videos/:id/uploading_url
router.get(
  '/videos/:id/uploading_url',
  requireAdmin,
  requireCdn,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = videoIdSchema.parse(req.params);
    const result = await getUploadingUrl(id);
    res.json(result);
  }),
);

// POST /cdnvideohub/upload/:encodedUrl
// Streams video chunk directly to CDN — no full buffering.
router.post(
  '/upload/:encodedUrl',
  requireAdmin,
  requireCdn,
  asyncHandler(async (req: Request, res: Response) => {
    const encodedUrl = req.params.encodedUrl;
    if (!encodedUrl) {
      throw new HttpError(400, 'encodedUrl is required');
    }

    const contentRange = req.headers['content-range'];
    const contentDisposition = req.headers['content-disposition'];

    if (!contentRange) {
      throw new HttpError(400, 'Content-Range header is required');
    }
    if (!contentDisposition) {
      throw new HttpError(400, 'Content-Disposition header is required');
    }

    if (!Buffer.isBuffer(req.body)) {
      throw new HttpError(400, 'Binary request body is required');
    }

    // Stream the raw request body straight to CDN without buffering
    await proxyUploadChunk(encodedUrl, req.body, {
      'Content-Range': contentRange,
      'Content-Disposition': contentDisposition,
    });

    res.status(200).send();
  }),
);

export { router as cdnVideoHubRouter };
