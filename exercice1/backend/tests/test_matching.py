"""
Unit tests for the matching engine.

Coverage:
  - Nominal cases: perfect match, zero match, partial matches
  - Each scoring component in isolation
  - Edge cases: empty lists, None fields, missing keys, unknown experience level
  - Error cases: wrong types, negative experience
  - rank() function: ordering, empty list, single entry
"""

import pytest
from app.matching import match, rank, _score_skills, _score_experience

# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

TALENT_FULL = {
    "skills": ["Python", "SQL", "Machine Learning"],
    "years_experience": 2,
    "location": "Paris",
    "job_type": "Data Analyst",
}

COMPANY_FULL = {
    "skills_required": ["Python", "SQL"],
    "experience_level": "junior",
    "location": "Paris",
    "job_type": "Data Analyst",
}


# ─────────────────────────────────────────────────────────────────────────────
# Nominal — match()
# ─────────────────────────────────────────────────────────────────────────────

class TestMatchNominal:
    def test_perfect_match_returns_1(self):
        talent = {
            "skills": ["Python", "SQL"],
            "years_experience": 1,
            "location": "Paris",
            "job_type": "Data Analyst",
        }
        company = {
            "skills_required": ["Python", "SQL"],
            "experience_level": "junior",
            "location": "Paris",
            "job_type": "Data Analyst",
        }
        assert match(talent, company) == 1.0

    def test_score_example_from_spec(self):
        """The exercise's example data should yield a high score."""
        score = match(TALENT_FULL, COMPANY_FULL)
        # All 4 components are perfect → 1.0
        assert score == 1.0

    def test_complete_mismatch_is_low(self):
        talent = {
            "skills": ["Java"],
            "years_experience": 10,
            "location": "Lyon",
            "job_type": "Backend Developer",
        }
        company = {
            "skills_required": ["Python", "SQL"],
            "experience_level": "junior",
            "location": "Paris",
            "job_type": "Data Analyst",
        }
        score = match(talent, company)
        assert score < 0.5

    def test_partial_skills_match(self):
        talent = {**TALENT_FULL, "skills": ["Python"]}  # 1 of 2 required
        score = match(talent, COMPANY_FULL)
        # skills_score = 0.5, rest perfect → 0.4*0.5 + 0.3 + 0.2 + 0.1 = 0.8
        assert score == pytest.approx(0.8, abs=1e-4)

    def test_location_mismatch_reduces_score(self):
        talent = {**TALENT_FULL, "location": "Lyon"}
        score = match(talent, COMPANY_FULL)
        # loc_score = 0 → 0.4 + 0.3 + 0 + 0.1 = 0.8
        assert score == pytest.approx(0.8, abs=1e-4)

    def test_job_type_mismatch_reduces_score(self):
        talent = {**TALENT_FULL, "job_type": "Backend Developer"}
        score = match(talent, COMPANY_FULL)
        # job_score = 0 → 0.4 + 0.3 + 0.2 + 0 = 0.9
        assert score == pytest.approx(0.9, abs=1e-4)

    def test_score_is_always_between_0_and_1(self):
        """Property: score ∈ [0, 1] regardless of inputs."""
        cases = [
            ({"skills": [], "years_experience": 0}, {"skills_required": ["X", "Y"]}),
            ({"skills": ["A"] * 10, "years_experience": 50}, {"skills_required": [], "experience_level": "junior"}),
        ]
        for t, c in cases:
            s = match(t, c)
            assert 0.0 <= s <= 1.0, f"Out of range: {s}"


# ─────────────────────────────────────────────────────────────────────────────
# Skills component
# ─────────────────────────────────────────────────────────────────────────────

class TestSkillsScore:
    def test_all_required_skills_present(self):
        assert _score_skills(["python", "sql"], ["python", "sql"]) == 1.0

    def test_no_required_skills(self):
        assert _score_skills(["python"], []) == 1.0

    def test_no_talent_skills(self):
        assert _score_skills([], ["python", "sql"]) == 0.0

    def test_partial_coverage(self):
        assert _score_skills(["python"], ["python", "sql"]) == pytest.approx(0.5)

    def test_extra_talent_skills_ignored(self):
        # Talent has more skills than required → still 1.0
        assert _score_skills(["python", "sql", "spark", "java"], ["python", "sql"]) == 1.0

    def test_case_insensitive_via_match(self):
        talent = {**TALENT_FULL, "skills": ["PYTHON", "SQL"]}
        assert match(talent, COMPANY_FULL) == 1.0


# ─────────────────────────────────────────────────────────────────────────────
# Experience component
# ─────────────────────────────────────────────────────────────────────────────

class TestExperienceScore:
    def test_junior_in_range(self):
        assert _score_experience(1, "junior") == 1.0

    def test_junior_at_boundaries(self):
        assert _score_experience(0, "junior") == 1.0
        assert _score_experience(2, "junior") == 1.0

    def test_mid_in_range(self):
        assert _score_experience(4, "mid") == 1.0

    def test_senior_in_range(self):
        assert _score_experience(8, "senior") == 1.0

    def test_underqualified_penalty(self):
        # 0 years for mid (expected 3-5): gap = 3, penalty = 3/3 = 1 → 0
        assert _score_experience(0, "mid") == 0.0

    def test_slightly_underqualified(self):
        # 2 years for mid: gap = 1, penalty = 1/3 → score ≈ 0.667
        score = _score_experience(2, "mid")
        assert 0.0 < score < 1.0

    def test_overqualified_gentle_penalty(self):
        # 10 years for junior (max 2): gap = 8, penalty = 8/20 = 0.4 → 0.6
        score = _score_experience(10, "junior")
        assert score == pytest.approx(0.6, abs=1e-4)

    def test_unknown_level_no_penalty(self):
        assert _score_experience(5, "wizard") == 1.0

    def test_empty_level_no_penalty(self):
        assert _score_experience(5, "") == 1.0

    def test_intermediate_alias(self):
        assert _score_experience(4, "intermediate") == 1.0


# ─────────────────────────────────────────────────────────────────────────────
# Edge cases — missing / null / empty fields
# ─────────────────────────────────────────────────────────────────────────────

class TestEdgeCases:
    def test_missing_all_talent_fields(self):
        """Empty talent dict should not raise."""
        score = match({}, COMPANY_FULL)
        assert 0.0 <= score <= 1.0

    def test_missing_all_company_fields(self):
        """Empty company dict means no constraints → perfect score."""
        score = match(TALENT_FULL, {})
        assert score == 1.0

    def test_none_location_talent(self):
        talent = {**TALENT_FULL, "location": None}
        score = match(talent, COMPANY_FULL)
        # location_score = 0 → 0.4 + 0.3 + 0 + 0.1 = 0.8
        assert score == pytest.approx(0.8, abs=1e-4)

    def test_none_location_company(self):
        company = {**COMPANY_FULL, "location": None}
        score = match(TALENT_FULL, company)
        # No location constraint → 1.0
        assert score == 1.0

    def test_none_job_type_company(self):
        company = {**COMPANY_FULL, "job_type": None}
        score = match(TALENT_FULL, company)
        assert score == 1.0

    def test_none_skills_talent(self):
        talent = {**TALENT_FULL, "skills": None}
        score = match(talent, COMPANY_FULL)
        # skills_score = 0 → 0 + 0.3 + 0.2 + 0.1 = 0.6
        assert score == pytest.approx(0.6, abs=1e-4)

    def test_none_experience_talent(self):
        """None years_experience treated as 0."""
        talent = {**TALENT_FULL, "years_experience": None}
        score = match(talent, COMPANY_FULL)
        # years = 0 → junior range [0,2] → exp_score = 1.0
        assert score == 1.0

    def test_zero_years_junior(self):
        talent = {**TALENT_FULL, "years_experience": 0}
        assert match(talent, COMPANY_FULL) == 1.0

    def test_float_years(self):
        talent = {**TALENT_FULL, "years_experience": 1.5}
        score = match(talent, COMPANY_FULL)
        assert score == 1.0

    def test_skills_empty_list(self):
        talent = {**TALENT_FULL, "skills": []}
        score = match(talent, COMPANY_FULL)
        # skills_score = 0 → 0 + 0.3 + 0.2 + 0.1 = 0.6
        assert score == pytest.approx(0.6, abs=1e-4)


# ─────────────────────────────────────────────────────────────────────────────
# Error handling — wrong types
# ─────────────────────────────────────────────────────────────────────────────

class TestErrorHandling:
    def test_talent_not_dict_raises_type_error(self):
        with pytest.raises(TypeError, match="talent"):
            match("not a dict", COMPANY_FULL)

    def test_company_not_dict_raises_type_error(self):
        with pytest.raises(TypeError, match="company"):
            match(TALENT_FULL, "not a dict")

    def test_skills_not_list_raises_type_error(self):
        with pytest.raises(TypeError, match="skills"):
            match({**TALENT_FULL, "skills": "Python,SQL"}, COMPANY_FULL)

    def test_skills_item_not_string_raises_type_error(self):
        with pytest.raises(TypeError, match="skills"):
            match({**TALENT_FULL, "skills": [1, 2, 3]}, COMPANY_FULL)

    def test_negative_experience_raises_value_error(self):
        with pytest.raises(ValueError, match="negative"):
            match({**TALENT_FULL, "years_experience": -1}, COMPANY_FULL)

    def test_experience_wrong_type_raises_type_error(self):
        with pytest.raises(TypeError, match="years_experience"):
            match({**TALENT_FULL, "years_experience": "two"}, COMPANY_FULL)

    def test_experience_bool_raises_type_error(self):
        with pytest.raises(TypeError, match="years_experience"):
            match({**TALENT_FULL, "years_experience": True}, COMPANY_FULL)

    def test_location_wrong_type_raises_type_error(self):
        with pytest.raises(TypeError, match="location"):
            match({**TALENT_FULL, "location": 123}, COMPANY_FULL)


# ─────────────────────────────────────────────────────────────────────────────
# rank()
# ─────────────────────────────────────────────────────────────────────────────

class TestRank:
    def test_empty_list_returns_empty(self):
        assert rank(COMPANY_FULL, []) == []

    def test_single_talent(self):
        result = rank(COMPANY_FULL, [TALENT_FULL])
        assert len(result) == 1
        assert result[0]["score"] == 1.0
        assert result[0]["talent"] == TALENT_FULL

    def test_sorted_descending(self):
        weak = {"skills": [], "years_experience": 0, "location": "Lyon", "job_type": "Other"}
        strong = {**TALENT_FULL}
        mid = {**TALENT_FULL, "location": "Lyon"}  # location miss

        result = rank(COMPANY_FULL, [weak, mid, strong])
        scores = [r["score"] for r in result]

        assert scores == sorted(scores, reverse=True)

    def test_best_talent_is_first(self):
        best = {**TALENT_FULL}
        worst = {"skills": [], "years_experience": 15, "location": "Marseille", "job_type": "DevOps"}

        result = rank(COMPANY_FULL, [worst, best])
        assert result[0]["talent"] == best

    def test_rank_result_contains_talent_and_score(self):
        result = rank(COMPANY_FULL, [TALENT_FULL])
        assert "talent" in result[0]
        assert "score" in result[0]

    def test_talents_not_list_raises_type_error(self):
        with pytest.raises(TypeError, match="talents"):
            rank(COMPANY_FULL, TALENT_FULL)

    def test_invalid_talent_in_list_raises_with_index(self):
        with pytest.raises((TypeError, ValueError), match="index 1"):
            rank(COMPANY_FULL, [TALENT_FULL, "bad"])

    def test_scores_are_in_0_1_range(self):
        talents = [
            {"skills": ["Python"], "years_experience": 1, "location": "Paris", "job_type": "Data Analyst"},
            {"skills": [], "years_experience": 20, "location": "Tokyo", "job_type": "CEO"},
        ]
        for entry in rank(COMPANY_FULL, talents):
            assert 0.0 <= entry["score"] <= 1.0
