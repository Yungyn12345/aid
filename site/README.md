# AIDDoc landing

Лендинг AIDDoc внутри `site` теперь имеет рабочую Flask-реализацию:

- `landing_app/` - Flask app factory, config, routes, models.
- `templates/` - Jinja2-шаблоны.
- `static/` - CSS, JS и рабочие ассеты сайта.
- `photo/Desktop.svg` и `photo/Desktop.pdf` - только референсы дизайна, не вставляются как готовая страница.
- `frontend/` - прежняя Nuxt-реализация, оставлена как legacy.
- `backend/` - прежний FastAPI API, оставлен для существующего `/api/` контура.

## Локальный запуск Flask

```bash
cd site
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python wsgi.py
```

После запуска:

- сайт: `http://localhost:5000/`
- health: `http://localhost:5000/health`
- admin-задел: `http://localhost:5000/admin/`

По умолчанию SQLite база создается в `site/instance/site.sqlite3`.

## Docker Compose

Корневой `docker-compose.yml` собирает лендинг из `./site` и запускает его как сервис `frontend` на порту контейнера `3000`. Nginx продолжает проксировать `/` в `frontend:3000`.

## Основные env

- `FLASK_SECRET_KEY` - секрет Flask.
- `LANDING_SQLITE_URL` - SQLite URL для compose, по умолчанию `sqlite:////data/site.sqlite3`.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` - Basic Auth для будущей admin-зоны.
