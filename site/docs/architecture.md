# Архитектура

## Контуры

- `frontend/`: Nuxt 3 + TypeScript + Tailwind CSS. Лендинг, SEO, CTA и форма заявки.
- `backend/`: FastAPI + SQLAlchemy + Alembic. Публичные события, заявки, admin API.
- `infra/`: Nginx reverse proxy и контейнерный запуск.
- `docs/`: документация по архитектуре и API.

## Схема маршрутизации

- `/` -> Nuxt frontend лендинга
- `/api/v1/*` -> FastAPI backend лендинга
- `/aideclarant` и `/aideclarant/*` -> внешний upstream основного продукта

## Потоки данных

1. Пользователь открывает лендинг на `/`.
2. CTA отправляет событие `cta-click` в backend и переводит на URL из env.
3. Форма заявки отправляет `POST /api/v1/leads`.
4. Backend сохраняет данные в PostgreSQL.
5. Admin получает доступ к заявкам и событиям через JWT-защищенные endpoints.
