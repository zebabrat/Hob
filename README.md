# Hob

Монорепа на npm workspaces: React-фронтенд, Fastify-бэкенд и общие типы API.

```
frontend/   React 19 + Vite + Tailwind 4 + react-router (dev-порт 5173)
backend/    Fastify 5 + Prisma 7 / PostgreSQL (порт 3001)
shared/     @hob/shared — типы, общие для клиента и сервера
```

`shared` собирается в `dist/` и подключается как обычный пакет (`@hob/shared`) через симлинк
workspaces — алиасы в tsconfig не нужны. Связи между пакетами описаны TypeScript project
references, поэтому `tsc --build` в корне собирает всё в правильном порядке.

## Быстрый старт

```bash
npm install
cp backend/.env.example backend/.env   # вписать DATABASE_URL
npm run db:migrate -w @hob/backend     # применить миграции
npm run dev:backend                    # http://localhost:3001
npm run dev:frontend                   # http://localhost:5173
```

Vite проксирует `/api` на бэкенд, так что в dev запросы идут с того же origin и CORS не нужен.

### Подключение к базе

Две переменные, потому что у managed-Postgres два эндпоинта:

| Переменная | Эндпоинт | Кто использует |
|---|---|---|
| `DATABASE_URL` | pooled (`…-pooler.…`) | приложение в рантайме |
| `DIRECT_URL` | прямой | только `prisma migrate` |

Приложение ходит через пул: каждый холодный инстанс serverless-функции открывает
свои соединения, и на прямом эндпоинте они быстро упираются в лимит. Миграции,
наоборот, требуют прямого подключения — pooler в transaction mode не тянет их
запросы. Если `DIRECT_URL` не задан, Prisma возьмёт `DATABASE_URL`.

## Деплой

Два независимых проекта на Vercel, деплой по push в `main`. Каждый смотрит на
свою папку и читает свой `vercel.json` — они не пересекаются.

| Проект | Root Directory | Конфиг | Переменные |
|---|---|---|---|
| hob-frontend | `frontend` | `frontend/vercel.json` | `VITE_API_URL` — домен бэкенда |
| hob-backend | `backend` | `backend/vercel.json` | `DATABASE_URL` (pooled), опц. `CORS_ORIGIN` |

Root Directory задаётся только в дашборде (Settings → Build & Deployment) —
из репозитория это не настраивается. Всё остальное живёт в `vercel.json`, и он
перекрывает поля, заданные в дашборде.

Фронтенд собирается пресетом Vite в `dist`; rewrite на `index.html` нужен,
чтобы перезагрузка на `/sign-in` не давала 404 — роутинг клиентский.

Бэкенд деплоится как функция: автодетект фреймворка отключён, все пути идут в
`backend/api/index.ts`, который поднимает Fastify без привязки к порту.
`backend/public/` пустая и существует только как выходная папка, которую
требует платформа.

## Скрипты

Корень:

| Команда | Что делает |
|---|---|
| `npm run build` | сборка всех пакетов |
| `npm run typecheck` | `tsc --build` по всей монорепе |
| `npm run clean` | удалить артефакты сборки |
| `npm run dev:backend` / `dev:frontend` | dev-серверы |

Backend (`-w @hob/backend`): `dev` (tsx watch), `build`, `start`, `db:generate`, `db:migrate`.
Frontend (`-w @hob/frontend`): `dev`, `build`, `preview`, `lint` (oxlint).

## API

| Метод | Путь | Ответ | Сессия |
|---|---|---|---|
| GET | `/api/health` | `200 HealthResponse` | — |
| POST | `/api/auth/sign-up` | `201 UserDto` + cookie, `400`, `409` | — |
| POST | `/api/auth/sign-in` | `200 UserDto` + cookie, `400`, `401` | — |
| POST | `/api/auth/sign-out` | `204`, cookie очищается | — |
| GET | `/api/auth/me` | `200 UserDto`, `401` | нужна |
| GET | `/api/users` | `200 UserDto[]` | нужна |
| GET | `/api/users/:id` | `200 UserDto`, `404` | нужна |
| POST | `/api/users` | `201 UserDto`, `400`, `409` | нужна |
| PUT | `/api/users/:id` | `200 UserDto`, `400`, `404`, `409` | нужна |
| DELETE | `/api/users/:id` | `204`, `404` | нужна |

Валидация — JSON Schema на уровне роутов; неизвестные поля в теле дают `400`
(`removeAdditional: false` в конфиге Fastify). Занятый email — `409`, а не сырая ошибка Prisma.

Сессия — случайный токен в таблице `Session` и httpOnly-cookie (`SameSite=Lax`, `Secure` в
production, TTL 7 дней). Проверку делает preHandler `requireSession`
(`backend/src/middleware/requireSession.ts`), он же кладёт пользователя в `request.currentUser`.
Пароли хэшируются bcrypt; хэш не покидает бэкенд — все запросы идут через `userSelect`.

## Соглашения

- PascalCase — только для React-компонентов и папок страниц (`HealthStatus.tsx`, `HomePage/`),
  остальные файлы в camelCase (`db.ts`, `routes/users.ts`, `useHealth.ts`)
- точки входа: `backend/src/index.ts`, `frontend/src/app/main.tsx`
- всё, что уходит по сети, типизируется из `@hob/shared` — не дублировать типы в пакетах
- комментарии объясняют «почему», а не «что»

Фронтенд разложен по слоям `app / pages / features / shared`; правила и границы импортов —
в `.claude/skills/frontend-architecture/SKILL.md`. Кратко:

```
frontend/src/
  app/                 App.tsx (роутинг), main.tsx, index.css, routes/AuthGate.tsx
  pages/               HomePage, SignInPage, SignUpPage — только композиция, без логики
  features/auth/       формы входа/регистрации, сессия, useSignIn/useSignUp/useSignOut
  features/health/     статус бэкенда
  shared/api/          общий fetch-клиент и обработка ошибок сети
```

Импорты между слоями идут через алиасы (`features/health`, `shared/api/client`). Алиасы заданы
в двух местах — `compilerOptions.paths` в `frontend/tsconfig.app.json` и `resolve.alias` в
`frontend/vite.config.ts`; менять нужно оба.

## Что не в git

`node_modules/`, `dist/`, `*.tsbuildinfo`, `backend/.env` и сгенерированный Prisma-клиент
(`backend/src/generated/`). После клона: `npm install` и `npm run db:generate -w @hob/backend`.
