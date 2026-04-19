from fastapi import HTTPException, status

from app.core.config import Settings
from app.core.security import create_access_token
from app.schemas.auth import AdminLoginRequest


class AuthService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def login(self, payload: AdminLoginRequest) -> str:
        if (
            payload.username != self.settings.admin_username
            or payload.password != self.settings.admin_password
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin credentials",
            )
        return create_access_token(payload.username, self.settings)
