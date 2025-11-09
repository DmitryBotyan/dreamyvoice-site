# DreamyVoice

Self-hosted платформа для команды озвучки: каталог тайтлов, серии с внешними плеерами, комментарии и админ-панель. Монорепозиторий содержит Next.js фронтенд, Express/Prisma бэкенд и инфраструктурные конфиги.

## Структура

```
project-root/
├─ frontend/   # Next.js 16 (App Router)
├─ backend/    # Express + Prisma + AdminJS
├─ data/       # тома для postgres/minio
└─ docker-compose.dev.yml
```

## Быстрый старт

1. **Зависимости**
   ```bash
   cd backend  && pnpm install
   cd ../frontend && pnpm install
   ```

2. **Переменные окружения**
   - Скопируйте `backend/.env.example` → `backend/.env` и задайте:
     ```
     DATABASE_URL=postgresql://app:app_pass@db:5432/app?schema=public
     PLAYER_ALLOWED_HOSTS=aniqit.com,aniqit.xyz
     SESSION_* ...
     S3_ENDPOINT=http://minio:9000
     S3_ACCESS_KEY=...
     S3_SECRET_KEY=...
     S3_BUCKET_AVATARS=avatars
     S3_BUCKET_COVERS=covers
     ```
   - Для фронтенда достаточно `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` (либо используйте значение по умолчанию).

3. **Инфраструктура**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```
   Поднимаются Postgres, MinIO и Adminer. Данные лежат в `./data`.

4. **Миграции / Prisma**
   ```bash
   cd backend
   pnpm db:push   # создаёт схему
   pnpm prisma:generate
   ```

5. **Запуск сервисов**
   ```bash
   cd backend  && pnpm dev   # API + AdminJS на http://localhost:4000
   cd frontend && pnpm dev   # Next.js на http://localhost:3000
   ```

   Первый зарегистрированный пользователь получает роль `ADMIN` и доступ в `/admin`.

## Разработка

- **Backend**
  - Роуты в `src/routes/*`; используйте `asyncHandler` и выбрасывайте `HttpError`.
  - `sessionMiddleware` добавляет `req.currentUser`. Для защиты эндпоинтов есть `requireAuth` и `requireAdmin`.
  - Минимальный S3-слой в `services/storage.ts` управляет MinIO (upload/get/delete). Медиа доступны через `/media/:bucket/:key`.
  - Комментарии обслуживаются маршрутом `/titles/:slug/comments` (GET/POST). Пользовательские посты уходят в статус `PENDING`, админы видят модерацию.

- **Frontend**
  - App Router, SSR-запросы идут через `lib/server-api.ts`, который автоматически пробрасывает cookies.
  - Интерактивные элементы (форма входа, плеер, комментарии) реализованы клиентскими компонентами.
  - Стилизация минимальная — только базовые HTML-элементы.

- **Best practices**
  - Соблюдайте self-hosted подход (никаких внешних SaaS).
  - Валидация URL плееров находится на уровне Prisma расширения (`prisma.ts`).
  - Помните о ролях: только админы публикуют тайтлы/эпизоды и могут грузить обложки.
  - Перед коммитом прогоняйте сборку:
    ```bash
    cd backend  && pnpm run build
    cd frontend && pnpm run build
    ```