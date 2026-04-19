from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.schemas.auth import AdminLoginRequest, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def admin_login(
    payload: AdminLoginRequest,
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    token = AuthService(settings).login(payload)
    return TokenResponse(access_token=token)
