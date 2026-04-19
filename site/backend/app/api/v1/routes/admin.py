from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.schemas.event import CTAClickRead
from app.schemas.lead import LeadRead, LeadStatusUpdate
from app.services.event_service import EventService
from app.services.lead_service import LeadService

router = APIRouter()


@router.get("/leads", response_model=list[LeadRead], dependencies=[Depends(require_admin)])
def list_leads(db: Session = Depends(get_db)) -> list[LeadRead]:
    return LeadService(db).list_leads()


@router.get("/leads/{lead_id}", response_model=LeadRead, dependencies=[Depends(require_admin)])
def get_lead(lead_id: int, db: Session = Depends(get_db)) -> LeadRead:
    return LeadService(db).get_lead(lead_id)


@router.patch(
    "/leads/{lead_id}/status",
    response_model=LeadRead,
    dependencies=[Depends(require_admin)],
)
def update_lead_status(
    lead_id: int,
    payload: LeadStatusUpdate,
    db: Session = Depends(get_db),
) -> LeadRead:
    return LeadService(db).update_status(lead_id, payload)


@router.get(
    "/events/cta-clicks",
    response_model=list[CTAClickRead],
    dependencies=[Depends(require_admin)],
)
def list_cta_clicks(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[CTAClickRead]:
    return EventService(db).list_cta_clicks(limit=limit)
