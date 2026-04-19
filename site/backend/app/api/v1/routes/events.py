from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.rate_limit import limiter
from app.db.session import get_db
from app.schemas.common import SuccessResponse
from app.schemas.event import CTAClickCreate
from app.services.event_service import EventService

router = APIRouter(prefix="/events")


@router.post("/cta-click", response_model=SuccessResponse)
@limiter.limit("60/minute")
def log_cta_click(
    request: Request,
    payload: CTAClickCreate,
    db: Session = Depends(get_db),
) -> SuccessResponse:
    forwarded_for = request.headers.get("x-forwarded-for")
    client_ip = (
        forwarded_for.split(",")[0].strip()
        if forwarded_for
        else (request.client.host if request.client else None)
    )
    user_agent = request.headers.get("user-agent")
    EventService(db).create_cta_click(payload, ip=client_ip, user_agent=user_agent)
    return SuccessResponse()
