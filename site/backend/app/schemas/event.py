from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CTAClickCreate(BaseModel):
    source: str = Field(min_length=2, max_length=80)
    target_url: str = Field(min_length=4, max_length=500)
    utm_source: str | None = Field(default=None, max_length=120)
    utm_medium: str | None = Field(default=None, max_length=120)
    utm_campaign: str | None = Field(default=None, max_length=180)
    utm_content: str | None = Field(default=None, max_length=180)
    utm_term: str | None = Field(default=None, max_length=180)
    referrer: str | None = Field(default=None, max_length=500)


class CTAClickRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    target_url: str
    utm_source: str | None
    utm_medium: str | None
    utm_campaign: str | None
    utm_content: str | None
    utm_term: str | None
    referrer: str | None
    ip: str | None
    user_agent: str | None
    created_at: datetime
