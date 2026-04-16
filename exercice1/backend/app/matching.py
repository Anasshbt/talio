"""
Matching engine — talent × company scoring.

──────────────────────────────────────────────────────────────────────────────
SCORING ALGORITHM
──────────────────────────────────────────────────────────────────────────────
The final score is a weighted sum of four independent components, each
normalised to [0, 1]:

  score = 0.40 × skills_score
        + 0.30 × experience_score
        + 0.20 × location_score
        + 0.10 × job_type_score

Weights rationale
  • Skills (40 %): primary technical requirement — most decisive criterion.
  • Experience (30 %): seniority fit determines productivity and retention.
  • Location (20 %): often non-negotiable but secondary to skill fit.
  • Job type (10 %): typically a hard filter; softened here to avoid
      discarding near-perfect candidates who mislabelled their role.

Component details
  • skills_score      = |talent_skills ∩ required_skills| / |required_skills|
                        → 1.0 when company has no requirement
  • experience_score  = 1.0 inside range, linear decay outside
                        (under-qualified penalised more than over-qualified)
  • location_score    = 1.0 if exact match (case-insensitive), else 0.0
  • job_type_score    = 1.0 if exact match (case-insensitive), else 0.0
──────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations
from typing import Any

# ─── Experience level ranges (inclusive, in years) ────────────────────────────

EXPERIENCE_RANGES: dict[str, tuple[float, float]] = {
    "junior":       (0.0,  2.0),
    "mid":          (3.0,  5.0),
    "intermediate": (3.0,  5.0),
    "senior":       (6.0, 99.0),
    "lead":         (8.0, 99.0),
    "expert":      (10.0, 99.0),
}

WEIGHTS: dict[str, float] = {
    "skills":     0.40,
    "experience": 0.30,
    "location":   0.20,
    "job_type":   0.10,
}


# ─── Input normalisation helpers ──────────────────────────────────────────────

def _to_str(value: Any, field: str) -> str:
    """Return a lower-stripped string.  None / missing → empty string."""
    if value is None:
        return ""
    if not isinstance(value, str):
        raise TypeError(f"'{field}' must be a string, got {type(value).__name__!r}")
    return value.strip().lower()


def _to_str_list(value: Any, field: str) -> list[str]:
    """Return a list of lower-stripped strings.  None → empty list."""
    if value is None:
        return []
    if not isinstance(value, list):
        raise TypeError(f"'{field}' must be a list, got {type(value).__name__!r}")
    result: list[str] = []
    for i, item in enumerate(value):
        if not isinstance(item, str):
            raise TypeError(
                f"'{field}[{i}]' must be a string, got {type(item).__name__!r}"
            )
        result.append(item.strip().lower())
    return result


def _to_number(value: Any, field: str) -> float:
    """Return a non-negative float.  None / missing → 0.0."""
    if value is None:
        return 0.0
    if isinstance(value, bool):
        raise TypeError(f"'{field}' must be a number, got bool")
    if not isinstance(value, (int, float)):
        raise TypeError(
            f"'{field}' must be a number, got {type(value).__name__!r}"
        )
    if value < 0:
        raise ValueError(f"'{field}' cannot be negative, got {value!r}")
    return float(value)


# ─── Scoring components ───────────────────────────────────────────────────────

def _score_skills(talent_skills: list[str], required_skills: list[str]) -> float:
    """
    Fraction of required skills covered by the talent.

    Returns 1.0 when the company has no skill requirement (open role).
    Returns 0.0 when the company requires skills but the talent has none.
    """
    if not required_skills:
        return 1.0
    talent_set = set(talent_skills)
    matched = sum(1 for s in required_skills if s in talent_set)
    return matched / len(required_skills)


def _score_experience(years: float, level: str) -> float:
    """
    Fit between years of experience and the expected seniority level.

    • Within range            → 1.0  (perfect fit)
    • Under-qualified (below) → linear decay to 0 over one range-width
    • Over-qualified  (above) → gentler decay (half-speed, over 20 years)

    Unknown level → 1.0  (no experience constraint)
    """
    level_key = level.strip().lower() if level else ""
    if level_key not in EXPERIENCE_RANGES:
        return 1.0

    lo, hi = EXPERIENCE_RANGES[level_key]

    if lo <= years <= hi:
        return 1.0
    if years < lo:
        # Under-qualified: steep penalty
        gap = lo - years
        return max(0.0, 1.0 - gap / max(lo, 1.0))
    # Over-qualified: gentle penalty (capped at 20 extra years ≡ 0)
    gap = years - hi
    return max(0.0, 1.0 - gap / 20.0)


def _score_location(talent_loc: str, company_loc: str) -> float:
    """Exact case-insensitive match.  Missing company location → no constraint."""
    if not company_loc:
        return 1.0
    if not talent_loc:
        return 0.0
    return 1.0 if talent_loc == company_loc else 0.0


def _score_job_type(talent_job: str, company_job: str) -> float:
    """Exact case-insensitive match.  Missing company job type → no constraint."""
    if not company_job:
        return 1.0
    if not talent_job:
        return 0.0
    return 1.0 if talent_job == company_job else 0.0


# ─── Public API ───────────────────────────────────────────────────────────────

def match(talent: dict[str, Any], company: dict[str, Any]) -> float:
    """
    Compute a normalised match score between a talent and a company offer.

    Parameters
    ----------
    talent : dict
        {
          "skills": list[str],         # e.g. ["Python", "SQL"]
          "years_experience": float,   # e.g. 2
          "location": str | None,      # e.g. "Paris"
          "job_type": str | None       # e.g. "Data Analyst"
        }
    company : dict
        {
          "skills_required": list[str],   # e.g. ["Python", "SQL"]
          "experience_level": str | None, # "junior" | "mid" | "senior" | …
          "location": str | None,
          "job_type": str | None
        }

    Returns
    -------
    float
        Normalised score in [0.0, 1.0].

    Raises
    ------
    TypeError  : when talent or company is not a dict, or a field has the wrong type.
    ValueError : when years_experience is negative.
    """
    if not isinstance(talent, dict):
        raise TypeError(f"'talent' must be a dict, got {type(talent).__name__!r}")
    if not isinstance(company, dict):
        raise TypeError(f"'company' must be a dict, got {type(company).__name__!r}")

    # --- Normalise talent fields ---
    talent_skills = _to_str_list(talent.get("skills"), "skills")
    years_exp     = _to_number(talent.get("years_experience"), "years_experience")
    talent_loc    = _to_str(talent.get("location"), "location")
    talent_job    = _to_str(talent.get("job_type"), "job_type")

    # --- Normalise company fields ---
    required_skills = _to_str_list(company.get("skills_required"), "skills_required")
    exp_level       = _to_str(company.get("experience_level"), "experience_level")
    company_loc     = _to_str(company.get("location"), "location")
    company_job     = _to_str(company.get("job_type"), "job_type")

    # --- Component scores ---
    skills_score = _score_skills(talent_skills, required_skills)
    exp_score    = _score_experience(years_exp, exp_level)
    loc_score    = _score_location(talent_loc, company_loc)
    job_score    = _score_job_type(talent_job, company_job)

    # --- Weighted sum ---
    raw = (
        WEIGHTS["skills"]     * skills_score
        + WEIGHTS["experience"] * exp_score
        + WEIGHTS["location"]   * loc_score
        + WEIGHTS["job_type"]   * job_score
    )

    return round(min(max(raw, 0.0), 1.0), 4)


def rank(
    company: dict[str, Any],
    talents: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Rank a list of talents against a company offer, best first.

    Parameters
    ----------
    company : dict   — same shape as for ``match``
    talents : list[dict] — list of talent dicts

    Returns
    -------
    list[dict]
        Sorted descending by score::

            [
              {"talent": {...}, "score": 0.95},
              {"talent": {...}, "score": 0.70},
              ...
            ]

    Raises
    ------
    TypeError  : when talents is not a list, or any entry has the wrong type.
    ValueError : when a talent entry contains an invalid value.
    """
    if not isinstance(talents, list):
        raise TypeError(f"'talents' must be a list, got {type(talents).__name__!r}")

    scored: list[dict[str, Any]] = []
    for i, talent in enumerate(talents):
        try:
            score = match(talent, company)
        except (TypeError, ValueError) as exc:
            raise type(exc)(f"Invalid talent at index {i}: {exc}") from exc
        scored.append({"talent": talent, "score": score})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored
