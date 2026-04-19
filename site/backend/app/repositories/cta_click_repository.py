from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.cta_click import CTAClick


class CTAClickRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, click: CTAClick) -> CTAClick:
        self.db.add(click)
        self.db.commit()
        self.db.refresh(click)
        return click

    def list(self, limit: int = 100) -> list[CTAClick]:
        statement = select(CTAClick).order_by(desc(CTAClick.created_at)).limit(limit)
        return list(self.db.scalars(statement))
