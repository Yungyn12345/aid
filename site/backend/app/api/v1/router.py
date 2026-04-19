from fastapi import APIRouter

from app.api.v1.routes.admin import router as admin_router
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.events import router as events_router
from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.leads import router as leads_router

router = APIRouter()
router.include_router(health_router, tags=["health"])
router.include_router(leads_router, tags=["leads"])
router.include_router(events_router, tags=["events"])
router.include_router(auth_router, prefix="/admin/auth", tags=["admin-auth"])
router.include_router(admin_router, prefix="/admin", tags=["admin"])
