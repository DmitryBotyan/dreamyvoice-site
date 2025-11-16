## Назначение проекта

Проект представляет собой **self-hosted веб-платформу для команды озвучки**, где публикуются аниме-тайтлы и серии с внешними плеерами.
На сайте пользователи могут смотреть серии, оставлять комментарии и управлять своим профилем.
Все данные и файлы хранятся **локально**, без использования облачных сервисов.

---

## Архитектура

```
project-root/
├─ frontend/        # Next.js 15 (App Router)
├─ backend/         # Node.js + Express/Fastify + Prisma
├─ data/            # постоянные данные: база и S3-хранилище
│  ├─ postgres/
│  └─ minio/
└─ docker-compose.dev.yml
```

### Сервисы

* **frontend** — интерфейс сайта (Next.js).
* **backend** — API, авторизация (Node.js + Prisma).
* **db** — PostgreSQL 16.
* **minio** — локальное S3-хранилище для аватарок и обложек.
* **adminer** — опциональная панель для работы с базой.

Все сервисы разворачиваются через Docker Compose.
Данные хранятся в каталоге `./data`, чтобы сохраняться между перезапусками контейнеров.

---

## Модель данных

**User**

* `id`
* `username` (уникальный)
* `password_hash`
* `role` (`user` или `admin`)
* `avatar_key` (ключ файла в S3)
* `created_at`

**Title**

* `id`
* `slug` (уникальный)
* `name`
* `description`
* `cover_key` (ключ файла в S3)
* `published`
* `created_at`
* `updated_at`

**Episode**

* `id`
* `title_id` (внешний ключ)
* `number` (уникален в пределах тайтла)
* `name`
* `player_src` (URL внешнего iframe)
* `duration_minutes`
* `published`
* `created_at`

**Comment**

* `id`
* `title_id`
* `user_id`
* `body`
* `status`
* `created_at`

**Session**

* `id`
* `user_id`
* `expires_at`
* `created_at`
* `user_agent`
* `ip`

---

## Авторизация и сессии

* Регистрация: по **никнейму и паролю**.
* Пароли хэшируются с помощью **bcrypt**.
* Авторизация через **cookie-сессию**:

  * cookie httpOnly, SameSite=Lax;
  * при входе создаётся запись в таблице `Session`;
  * при каждом запросе сервер проверяет сессию по cookie;
  * срок жизни сессии регулируется переменной окружения.

---

## Хранение файлов

* Используется **MinIO** (локальный S3-сервер) с двумя бакетами:

  * `avatars` — аватарки пользователей;
  * `covers` — обложки тайтлов.
* Backend сохраняет файлы в S3 и хранит ключи (`avatar_key`, `cover_key`) в БД.
* Доступ к медиа идёт через backend-роуты `/media/...`, без публичных бакетов.

---

## Работа с плеерами

* Каждая серия (`Episode`) содержит только поле `player_src` — URL iframe.
* HTML iframe **не хранится** в базе.
* Фронтенд сам формирует iframe-элемент при рендере страницы.
* Backend валидирует URL по белому списку доменов, указанных в `.env` (`PLAYER_ALLOWED_HOSTS`).

---

## Конфигурация окружения

Основные переменные `.env` для backend:

```
DATABASE_URL=postgresql://app:app_pass@db:5432/app?schema=public
PORT=4000

SESSION_COOKIE_NAME=session
SESSION_COOKIE_SECRET=<random_string>
SESSION_TTL_HOURS=720

PLAYER_ALLOWED_HOSTS=aniqit.com,aniqit.xyz

S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin_pass
S3_BUCKET_AVATARS=avatars
S3_BUCKET_COVERS=covers
S3_FORCE_PATH_STYLE=true
```

---

## Роль агента

AI-агент — участник разработки проекта.
Он работает с кодом фронтенда и бэкенда и должен:

1. Поддерживать **self-hosted** подход — никаких внешних облаков и SaaS.
2. Следить за чистотой архитектуры и корректностью моделей Prisma.
3. Помогать писать читаемый код на TypeScript и JavaScript.
4. Уважать минимализм — без лишних библиотек и кэшей.
5. Соблюдать безопасность: валидация URL, защита cookie, контроль ролей.
6. Держать инфраструктуру Docker в рабочем состоянии.

---

## Назначение сайта

Сайт — это каталог аниме-тайтлов с сериями в озвучке команды.
Каждая страница тайтла содержит описание, список серий, встроенный плеер и комментарии пользователей.
Управление контентом осуществляется через API с проверкой прав администратора.
Все данные и файлы остаются под полным контролем разработчиков и команды.
