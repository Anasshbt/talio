# Exercice 4 — Code Review & Esprit Critique

**🎯 Objectif** : Lire, identifier des problèmes et améliorer du code existant

---

## 📝 Code original à analyser

```python
def match(talent, company):
    score = 0
    for skill in talent["skills"]:
        if skill in company["skills_required"]:
            score += 1
    if talent["location"] == company["location"]:
        score += 10
    if talent["years_experience"] > 5:
        score += 5
    return score
```

---

## 🔍 Problèmes identifiés — 9 problèmes, 7 catégories

### P1 — ⚠️ Score absolu, non normalisé `[Logique]` **Impact : Critique**

Le score retourné est une somme brute (0 à N+15) qui dépend du nombre de compétences. Deux talents incomparables peuvent avoir le même score.

**Correction** : Normaliser sur `[0.0, 1.0]` avec des poids fixes par composante.

---

### P2 — ⚖️ Poids incohérents entre composantes `[Logique]` **Impact : Critique**

La localisation vaut `+10` mais chaque compétence vaut `+1`. Une correspondance de lieu compte 10× plus qu'une compétence — même si on a 0 compétences requises.

**Correction** : Calculer séparément chaque composante (0–1) puis appliquer des poids explicites (`skills×0.4 + location×0.2 + experience×0.3`).

---

### P3 — 🔠 Comparaison sensible à la casse `[Normalisation]` **Impact : Élevé**

`'Paris' != 'paris' != 'PARIS'`. Idem pour les compétences : `'Python' != 'python'`.

**Correction** : Appliquer `.strip().lower()` sur toutes les chaînes avant comparaison.

---

### P4 — 📏 Seuil d'expérience arbitraire et binaire `[Biais]` **Impact : Élevé**

`years_experience > 5` est un booléen déguisé : +5 si senior, +0 sinon. Un candidat de 4.9 ans obtient le même score qu'un junior de 0 an.

**Correction** : Calculer un score continu basé sur la plage attendue par niveau (junior/mid/senior).

---

### P5 — 💥 Aucune gestion des clés manquantes `[Edge Cases]` **Impact : Critique**

`talent["skills"]` lève `KeyError` si la clé est absente. Idem pour `location`, `years_experience`, `skills_required`.

**Correction** : Utiliser `.get()` avec valeurs par défaut, ou valider via Pydantic avant d'appeler la fonction.

---

### P6 — 🐌 Lookup O(n) dans une liste `[Performance]` **Impact : Modéré → Élevé à l'échelle**

`if skill in company['skills_required']` est O(n) si `skills_required` est une `list`. Sur 50k talents × 100 compétences requises = 5M opérations.

**Correction** : Convertir `skills_required` en `set()` avant la boucle : O(1) par vérification.

---

### P7 — 0️⃣ Division par zéro latente `[Edge Cases]` **Impact : Modéré**

Si `skills_required` est vide, le score skills restera 0/0 si on tente de normaliser.

**Correction** : Si `len(skills_required) == 0`, considérer le score skills = `1.0` (pas de contrainte).

---

### P8 — 📖 Magic numbers et absence de documentation `[Lisibilité]`

Pourquoi 10 pour la location ? Pourquoi 5 pour l'expérience ? Aucune docstring, aucun commentaire.

**Correction** : Extraire les constantes nommées, ajouter docstring + type hints.

---

### P9 — 🔒 Aucune validation de types `[Sécurité]` **Impact : Modéré**

`years_experience` pourrait être une string (`'5'`), `None`, ou négatif. `talent['skills']` pourrait être une string — la boucle `for` itérerait sur les caractères.

**Correction** : Valider les types à l'entrée (`isinstance` / Pydantic) et rejeter avec `ValueError` explicite.

---

## ✅ Version améliorée

```python
from typing import Any

# ── Constantes explicites ────────────────────────────────────────────────
WEIGHTS = {
    "skills":     0.40,   # critère le plus discriminant
    "experience": 0.30,
    "location":   0.20,
    "job_type":   0.10,
}

EXP_RANGES: dict[str, tuple[float, float]] = {
    "junior":       (0,  2),
    "mid":          (3,  5),
    "senior":       (6,  9),
    "lead":         (8, 11),
    "expert":       (10, 99),
}


def _skills_score(talent_skills: list[str],
                  required_skills: list[str]) -> float:
    """Ratio de compétences matchées (insensible à la casse).
    Retourne 1.0 si aucune compétence requise (pas de contrainte).
    """
    if not required_skills:
        return 1.0                         # fix P7 — pas de division par 0

    required_set = {s.strip().lower() for s in required_skills}  # fix P6
    talent_set   = {s.strip().lower() for s in talent_skills}    # fix P3

    matched = len(talent_set & required_set)
    return matched / len(required_set)     # fix P1 — score [0, 1]


def _experience_score(years: float, level: str | None) -> float:
    """Score continu selon la plage du niveau attendu."""
    if level is None or level not in EXP_RANGES:
        return 1.0

    lo, hi = EXP_RANGES[level]
    if lo <= years <= hi:
        return 1.0
    if years < lo:
        gap = lo - years
        return max(0.0, 1.0 - gap * 0.25)  # fix P4 — score continu
    return max(0.7, 1.0 - (years - hi) * 0.05)


def _location_score(talent_loc: str | None,
                    company_loc: str | None) -> float:
    if not company_loc:
        return 1.0
    if not talent_loc:
        return 0.0
    return 1.0 if talent_loc.strip().lower() == company_loc.strip().lower() else 0.0  # fix P3


def match(talent: dict[str, Any],
          company: dict[str, Any]) -> dict[str, float]:
    """Calcule un score de matching normalisé [0, 1].

    Returns:
        {"score": float, "breakdown": {"skills": …, "experience": …, …}}

    Raises:
        TypeError: si years_experience n'est pas un nombre.
        ValueError: si years_experience est négatif.
    """
    # fix P5 — .get() avec valeurs par défaut
    talent_skills = talent.get("skills", [])
    required      = company.get("skills_required", [])
    years         = talent.get("years_experience") or 0
    level         = company.get("experience_level")
    talent_loc    = talent.get("location")
    company_loc   = company.get("location")

    # fix P9 — validation de types
    if not isinstance(talent_skills, list):
        raise TypeError(f"talent.skills doit être une liste, reçu {type(talent_skills)}")
    if not isinstance(years, (int, float)):
        raise TypeError(f"years_experience doit être un nombre, reçu {type(years)}")
    if years < 0:
        raise ValueError(f"years_experience ne peut pas être négatif : {years}")

    breakdown = {
        "skills":     _skills_score(talent_skills, required),
        "experience": _experience_score(float(years), level),
        "location":   _location_score(talent_loc, company_loc),
        "job_type":   _location_score(talent.get("job_type"), company.get("job_type")),
    }

    # fix P2 — poids explicites
    score = sum(breakdown[k] * WEIGHTS[k] for k in WEIGHTS)
    return {"score": round(score, 4), "breakdown": breakdown}
```

---

## 📐 Décisions d'architecture

| Décision | Problème(s) résolu(s) | Impact |
|----------|----------------------|--------|
| Score normalisé [0,1] avec poids explicites | P1, P2, P8 | Comparaison cohérente entre talents |
| Fonctions privées par composante | P2 | Testabilité unitaire |
| `.strip().lower()` sur toutes les chaînes | P3 | Robustesse sur données réelles |
| Score d'expérience continu | P4 | Pas de cliff edge |
| `.get()` avec valeurs par défaut | P5 | Zéro KeyError en production |
| `set()` pour lookup compétences | P6 | O(1) au lieu de O(n) |
| Retour 1.0 si skills_required vide | P7 | Pas de division par zéro |
| TypeError + ValueError explicites | P9 | Fail-fast, debugging facilité |
| Constantes WEIGHTS et EXP_RANGES nommées | P8 | Un seul endroit pour les règles métier |

---

## 🧪 Tests — 15 cas couvrant chaque problème

```python
import pytest
from matching import match, _skills_score, _experience_score


def test_skills_perfect_match():
    assert _skills_score(["Python", "SQL"], ["python", "sql"]) == 1.0

def test_skills_case_insensitive():               # P3
    assert _skills_score(["PYTHON"], ["python"]) == 1.0

def test_skills_partial_match():
    assert _skills_score(["Python"], ["Python", "SQL"]) == 0.5

def test_skills_no_required():                    # P7
    assert _skills_score(["Python"], []) == 1.0

def test_skills_empty_talent():
    assert _skills_score([], ["Python"]) == 0.0

def test_exp_in_range():
    assert _experience_score(2, "junior") == 1.0

def test_exp_boundary():
    assert _experience_score(0, "junior") == 1.0

def test_exp_under_qualified():                    # P4
    score = _experience_score(0, "senior")
    assert 0.0 <= score < 1.0

def test_exp_over_qualified_soft_penalty():        # P4
    score = _experience_score(12, "junior")
    assert score >= 0.7

def test_exp_no_level():
    assert _experience_score(3, None) == 1.0

def test_perfect_match():
    talent  = {"skills": ["python", "sql"], "years_experience": 1,
               "location": "paris", "job_type": "Data Analyst"}
    company = {"skills_required": ["Python", "SQL"], "experience_level": "junior",
               "location": "Paris", "job_type": "Data Analyst"}
    assert match(talent, company)["score"] == 1.0

def test_location_case_insensitive():              # P3
    talent  = {"skills": ["Python", "SQL"], "years_experience": 1,
               "location": "PARIS", "job_type": "Data Analyst"}
    company = {"skills_required": ["Python", "SQL"], "experience_level": "junior",
               "location": "Paris", "job_type": "Data Analyst"}
    assert match(talent, company)["score"] == 1.0

def test_missing_skills_key():                     # P5
    talent  = {"years_experience": 2, "location": "Paris"}
    company = {"skills_required": ["Python"], "experience_level": "junior",
               "location": "Paris"}
    result = match(talent, company)
    assert "score" in result

def test_negative_experience_raises():             # P9
    talent  = {"skills": [], "years_experience": -1, "location": "Paris"}
    company = {"skills_required": [], "experience_level": "junior", "location": "Paris"}
    with pytest.raises(ValueError):
        match(talent, company)

def test_skills_as_string_raises():                # P9
    talent  = {"skills": "Python", "years_experience": 2, "location": "Paris"}
    company = {"skills_required": [], "experience_level": "junior", "location": "Paris"}
    with pytest.raises(TypeError):
        match(talent, company)
```

---

**💡 Ce que nous évaluons** : esprit critique · qualité des améliorations · rigueur · capacité à expliquer ses décisions
