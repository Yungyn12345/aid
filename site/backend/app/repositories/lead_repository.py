from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.lead import Lead


class LeadRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, lead: Lead) -> Lead:
        self.db.add(lead)
        self.db.commit()
        self.db.refresh(lead)
        return lead

    def list(self) -> list[Lead]:
        return list(self.db.scalars(select(Lead).order_by(desc(Lead.created_at))))

    def get(self, lead_id: int) -> Lead | None:
        return self.db.get(Lead, lead_id)

    def save(self, lead: Lead) -> Lead:
        self.db.add(lead)
        self.db.commit()
        self.db.refresh(lead)
        return lead
