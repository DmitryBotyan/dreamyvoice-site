import express from 'express';
import cookieParser from 'cookie-parser';
import { env } from './env';
import { sessionMiddleware } from './middleware/session';
import { authRouter } from './routes/auth';
import { titlesRouter } from './routes/titles';
import { errorHandler } from './middleware/error-handler';
import { buildAdmin } from './admin';
import { requireAdmin } from './middleware/require-admin';
import { adminAuthRouter } from './routes/admin-auth';
import { mediaRouter } from './routes/media';
import { profileRouter } from './routes/profile';
import { metadataRouter } from './routes/metadata';
import { teamMembersRouter } from './routes/team-members';
import { syncCatalogMetadata } from './services/catalog-metadata';

async function bootstrap() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser(env.SESSION_COOKIE_SECRET));
  app.use(sessionMiddleware);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/auth', authRouter);
  app.use('/titles', titlesRouter);
  app.use('/metadata', metadataRouter);
  app.use('/team-members', teamMembersRouter);
  app.use('/admin/auth', adminAuthRouter);
  app.use('/media', mediaRouter);
  app.use('/profile', profileRouter);

  await syncCatalogMetadata();
  const { admin, router } = await buildAdmin();
  app.use(admin.options.rootPath, requireAdmin, router);

  app.use(errorHandler);

  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
