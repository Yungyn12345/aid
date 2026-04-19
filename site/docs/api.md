# API

## Публичные endpoints

- `GET /api/v1/health`
- `POST /api/v1/leads`
- `POST /api/v1/events/cta-click`

## Админские endpoints

- `POST /api/v1/admin/auth/login`
- `GET /api/v1/admin/leads`
- `GET /api/v1/admin/leads/{id}`
- `PATCH /api/v1/admin/leads/{id}/status`
- `GET /api/v1/admin/events/cta-clicks`

## Формат ошибок

Все ошибки возвращаются в виде:

```json
{
  "success": false,
  "error": {
    "code": "http_error",
    "message": "Human-readable message"
  }
}
```
