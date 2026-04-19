from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LeadCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    company: str | None = Field(default=None, max_length=180)
    contact: str = Field(min_length=3, max_length=180)
    message: str | None = Field(default=None, max_length=2000)
    utm_source: str | None = Field(default=None, max_length=120)
    utm_medium: str | None = Field(default=None, max_length=120)
    utm_campaign: str | None = Field(default=None, max_length=180)
    utm_content: str | None = Field(default=None, max_length=180)
    utm_term: str | None = Field(default=None, max_length=180)
    referrer: str | None = Field(default=None, max_length=500)
    landing_path: str | None = Field(default=None, max_length=500)
    website: str | None = Field(default=None, max_length=255)


class LeadCreateResponse(BaseModel):
    success: bool = True
    id: int


class LeadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: str | None
    contact: str
    message: str | None
    utm_source: str | None
    utm_medium: str | None
    utm_campaign: str | None
    utm_content: str | None
    utm_term: str | None
    referrer: str | None
    landing_path: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class LeadStatusUpdate(BaseModel):
    status: str = Field(min_length=2, max_length=50)
