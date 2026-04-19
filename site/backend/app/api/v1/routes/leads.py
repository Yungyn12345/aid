from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.rate_limit import limiter
from app.db.session import get_db
from app.schemas.lead import LeadCreate, LeadCreateResponse
from app.services.lead_service import LeadService

router = APIRouter()


@router.post("/leads", response_model=LeadCreateResponse)
@limiter.limit("20/minute")
def create_lead(
    request: Request,
    payload: LeadCreate,
    db: Session = Depends(get_db),
) -> LeadCreateResponse:
    _ = request
    lead = LeadService(db).create_lead(payload)
    return LeadCreateResponse(id=lead.id)
