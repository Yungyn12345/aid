# AIDDoc Landing

Отдельный проект промо-сайта AIDDoc / АИ Декларант.

## Структура

- `frontend/` - Nuxt 3 лендинг
- `backend/` - FastAPI API
- `infra/` - Nginx и контейнерный слой
- `docs/` - документация

## Локальный запуск

1. Скопировать `site/.env.example` в `site/.env`.
2. При необходимости указать реальный upstream основного продукта в `AIDECLARANT_UPSTREAM`.
3. Запустить контейнеры из корня репозитория:

```bash
docker compose up --build
```

4. Применить миграции:

```bash
docker compose exec backend alembic upgrade head
```

## Ручной запуск

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Основные env

- `NUXT_PUBLIC_CTA_URL` - URL перехода по CTA.
- `NUXT_PUBLIC_API_BASE_URL` - публичный base URL backend.
- `DATABASE_URL` - строка подключения PostgreSQL.
- `CORS_ORIGINS` - JSON-массив разрешенных origin.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` - доступ к admin API.
- `AIDECLARANT_UPSTREAM` - upstream текущего основного продукта.

## HTTPS

Для локального/stage запуска используется корневой `docker-compose.yml`. Пример production-конфига с HTTPS-редиректом и TLS вынесен в `infra/nginx/conf.d/production-ssl.example.conf`.
