from __future__ import annotations
from pydantic import BaseModel, Field


class Talent(BaseModel):
    skills: list[str] = Field(default_factory=list)
    years_experience: float = Field(default=0.0, ge=0)
    location: str | None = None
    job_type: str | None = None


class Company(BaseModel):
    skills_required: list[str] = Field(default_factory=list)
    experience_level: str | None = None
    location: str | None = None
    job_type: str | None = None


# ─── Request / Response models ─────────────────────────────────────────────────

class MatchRequest(BaseModel):
    talent: Talent
    company: Company


class MatchResponse(BaseModel):
    score: float
    breakdown: dict[str, float] | None = None


class RankRequest(BaseModel):
    company: Company
    talents: list[Talent]


class RankedTalent(BaseModel):
    talent: Talent
    score: float


class HealthResponse(BaseModel):
    status: str
