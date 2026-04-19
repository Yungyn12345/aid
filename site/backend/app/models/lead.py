from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Lead(TimestampMixin, Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    company: Mapped[str | None] = mapped_column(String(180), nullable=True)
    contact: Mapped[str] = mapped_column(String(180), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    utm_source: Mapped[str | None] = mapped_column(String(120), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(120), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(180), nullable=True)
    utm_content: Mapped[str | None] = mapped_column(String(180), nullable=True)
    utm_term: Mapped[str | None] = mapped_column(String(180), nullable=True)
    referrer: Mapped[str | None] = mapped_column(String(500), nullable=True)
    landing_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="new", nullable=False)
