from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.repositories.lead_repository import LeadRepository
from app.schemas.lead import LeadCreate, LeadStatusUpdate


class LeadService:
    def __init__(self, db: Session) -> None:
        self.repository = LeadRepository(db)

    def create_lead(self, payload: LeadCreate) -> Lead:
        if payload.website:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Spam detected")

        lead = Lead(
            name=payload.name,
            company=payload.company,
            contact=payload.contact,
            message=payload.message,
            utm_source=payload.utm_source,
            utm_medium=payload.utm_medium,
            utm_campaign=payload.utm_campaign,
            utm_content=payload.utm_content,
            utm_term=payload.utm_term,
            referrer=payload.referrer,
            landing_path=payload.landing_path,
        )
        return self.repository.create(lead)

    def list_leads(self) -> list[Lead]:
        return self.repository.list()

    def get_lead(self, lead_id: int) -> Lead:
        lead = self.repository.get(lead_id)
        if lead is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
        return lead

    def update_status(self, lead_id: int, payload: LeadStatusUpdate) -> Lead:
        lead = self.get_lead(lead_id)
        lead.status = payload.status
        return self.repository.save(lead)
