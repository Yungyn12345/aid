from sqlalchemy.orm import Session

from app.models.cta_click import CTAClick
from app.repositories.cta_click_repository import CTAClickRepository
from app.schemas.event import CTAClickCreate


class EventService:
    def __init__(self, db: Session) -> None:
        self.repository = CTAClickRepository(db)

    def create_cta_click(
        self,
        payload: CTAClickCreate,
        ip: str | None,
        user_agent: str | None,
    ) -> CTAClick:
        event = CTAClick(
            source=payload.source,
            target_url=payload.target_url,
            utm_source=payload.utm_source,
            utm_medium=payload.utm_medium,
            utm_campaign=payload.utm_campaign,
            utm_content=payload.utm_content,
            utm_term=payload.utm_term,
            referrer=payload.referrer,
            ip=ip,
            user_agent=user_agent,
        )
        return self.repository.create(event)

    def list_cta_clicks(self, limit: int = 100) -> list[CTAClick]:
        return self.repository.list(limit=limit)
