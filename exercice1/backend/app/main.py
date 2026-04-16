from __future__ import annotations

import logging
import logging.config
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app import matching
from app.database import engine, get_db
from app.db_models import MatchResult, RankResult
from app.logging_config import LOGGING_CONFIG
from app.matching import (
    _score_experience,
    _score_job_type,
    _score_location,
    _score_skills,
    _to_number,
    _to_str,
    _to_str_list,
)
from app.models import (
    HealthResponse,
    MatchRequest,
    MatchResponse,
    RankRequest,
    RankedTalent,
)

logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application starting up")
    yield
    logger.info("Application shutting down")
    await engine.dispose()


app = FastAPI(
    title="Talio Matching API",
    description="Talent-company matching: score & rank endpoints",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every request with method, path, status code, and duration."""
    request_id = str(uuid.uuid4())[:8]
    start = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception as exc:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.error(
            "Unhandled exception on %s %s after %sms: %s",
            request.method, request.url.path, duration_ms, exc,
            exc_info=True,
        )
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "%s %s → %s  %.1fms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        extra={
            "request_id":  request_id,
            "method":      request.method,
            "path":        request.url.path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    return response


@app.get("/health", response_model=HealthResponse, tags=["meta"])
async def health() -> HealthResponse:
    """Liveness probe."""
    return HealthResponse(status="ok")


@app.post("/match", response_model=MatchResponse, tags=["matching"])
async def compute_match(
    request: MatchRequest,
    db: AsyncSession = Depends(get_db),
) -> MatchResponse:
    """
    Compute the match score between a single talent and a company offer.
    Persists the result to PostgreSQL.
    """
    t = request.talent.model_dump()
    c = request.company.model_dump()

    try:
        score = matching.match(t, c)

        talent_skills   = _to_str_list(t.get("skills"), "skills")
        years_exp       = _to_number(t.get("years_experience"), "years_experience")
        talent_loc      = _to_str(t.get("location"), "location")
        talent_job      = _to_str(t.get("job_type"), "job_type")
        required_skills = _to_str_list(c.get("skills_required"), "skills_required")
        exp_level       = _to_str(c.get("experience_level"), "experience_level")
        company_loc     = _to_str(c.get("location"), "location")
        company_job     = _to_str(c.get("job_type"), "job_type")

        breakdown = {
            "skills":     round(_score_skills(talent_skills, required_skills), 4),
            "experience": round(_score_experience(years_exp, exp_level), 4),
            "location":   round(_score_location(talent_loc, company_loc), 4),
            "job_type":   round(_score_job_type(talent_job, company_job), 4),
        }
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    db.add(MatchResult(talent=t, company=c, score=score, breakdown=breakdown))

    return MatchResponse(score=score, breakdown=breakdown)


@app.post("/rank", response_model=list[RankedTalent], tags=["matching"])
async def rank_talents(
    request: RankRequest,
    db: AsyncSession = Depends(get_db),
) -> list[RankedTalent]:
    """
    Rank a list of talents against a company offer, best match first.
    Persists the ranked results to PostgreSQL.
    """
    company_dict = request.company.model_dump()
    talent_dicts = [t.model_dump() for t in request.talents]

    try:
        results = matching.rank(company_dict, talent_dicts)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    db.add(
        RankResult(
            company=company_dict,
            results=[{"talent": r["talent"], "score": r["score"]} for r in results],
            talent_count=len(results),
        )
    )

    return [RankedTalent(talent=r["talent"], score=r["score"]) for r in results]
