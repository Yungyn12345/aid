from pydantic import BaseModel


class SuccessResponse(BaseModel):
    success: bool = True


class HealthResponse(BaseModel):
    status: str = "ok"


class ErrorEnvelope(BaseModel):
    success: bool = False
    error: dict[str, str | list[dict[str, str]]]
