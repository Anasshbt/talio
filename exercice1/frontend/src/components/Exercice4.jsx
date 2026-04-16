import { useState } from "react";

const PROBLEMS = [
  {
    id: "P1",
    category: "Logique",
    categoryColor: "#DC2626",
    categoryBg: "#FEF2F2",
    icon: "⚠️",
    title: "Score absolu, non normalisé",
    desc: "Le score retourné est une somme brute (0 à N+15) qui dépend du nombre de compétences. Deux talents incomparables peuvent avoir le même nombre.",
    lines: [2, 6, 8],
    impact: "Critique — rend le classement entre talents impossible sans contexte",
    fix: "Normaliser sur [0.0, 1.0] avec des poids fixes par composante.",
  },
  {
    id: "P2",
    category: "Logique",
    categoryColor: "#DC2626",
    categoryBg: "#FEF2F2",
    icon: "⚖️",
    title: "Poids incohérents entre composantes",
    desc: "La localisation vaut +10 mais chaque compétence vaut seulement +1. Une correspondance de lieu compte 10× plus qu'une compétence — même si on a 0 compétences requises.",
    lines: [5, 7],
    impact: "Critique — biais systématique en faveur de la localisation",
    fix: "Calculer séparément chaque composante (0–1) puis appliquer des poids explicites (ex: skills×0.4 + location×0.2 + experience×0.3).",
  },
  {
    id: "P3",
    category: "Normalisation",
    categoryColor: "#9B5CF6",
    categoryBg: "#FDF4FF",
    icon: "🔠",
    title: "Comparaison de chaînes sensible à la casse",
    desc: '\'Paris\' != \'paris\' != \'PARIS\'. Idem pour les compétences : \'Python\' != \'python\'.',
    lines: [5],
    impact: "Élevé — faux négatifs fréquents en données réelles",
    fix: "Appliquer .strip().lower() sur toutes les chaînes avant comparaison.",
  },
  {
    id: "P4",
    category: "Biais",
    categoryColor: "#D97706",
    categoryBg: "#FFFBEB",
    icon: "📏",
    title: "Seuil d'expérience arbitraire et binaire",
    desc: "years_experience > 5 est un booléen déguisé : +5 si senior, +0 sinon. Un candidat de 4.9 ans obtient le même score qu'un junior de 0 an.",
    lines: [7],
    impact: "Élevé — biais contre les profils intermédiaires, non calibré",
    fix: "Calculer un score continu basé sur la plage attendue par niveau (junior/mid/senior).",
  },
  {
    id: "P5",
    category: "Edge Cases",
    categoryColor: "#0EA5E9",
    categoryBg: "#F0F9FF",
    icon: "💥",
    title: "Aucune gestion des clés manquantes",
    desc: 'talent["skills"] lève KeyError si la clé est absente. Idem pour location, years_experience, skills_required.',
    lines: [2, 5, 7],
    impact: "Critique — crash en production sur données réelles incomplètes",
    fix: "Utiliser .get() avec valeurs par défaut, ou valider via Pydantic avant d'appeler la fonction.",
  },
  {
    id: "P6",
    category: "Performance",
    categoryColor: "#059669",
    categoryBg: "#F0FDF4",
    icon: "🐌",
    title: "Lookup O(n) dans une liste",
    desc: "if skill in company['skills_required'] est O(n) si skills_required est une list. Sur 50k talents × 100 compétences requises = 5M opérations.",
    lines: [3],
    impact: "Modéré → Élevé à l'échelle",
    fix: "Convertir skills_required en set() avant la boucle : O(1) par vérification.",
  },
  {
    id: "P7",
    category: "Edge Cases",
    categoryColor: "#0EA5E9",
    categoryBg: "#F0F9FF",
    icon: "0️⃣",
    title: "Division par zéro latente",
    desc: "Si skills_required est vide, le score skills restera 0/0 si on tente de normaliser. La logique actuelle retourne simplement 0, donnant un score négatif aux non-locaux.",
    lines: [2, 3, 4],
    impact: "Modéré — comportement non prévisible selon le contexte d'appel",
    fix: "Si len(skills_required) == 0, considérer le score skills = 1.0 (pas de contrainte).",
  },
  {
    id: "P8",
    category: "Lisibilité",
    categoryColor: "#64748B",
    categoryBg: "#F8FAFC",
    icon: "📖",
    title: "Magic numbers et absence de documentation",
    desc: "Pourquoi 10 pour la location ? Pourquoi 5 pour l'expérience ? Pourquoi le seuil est 5 ans ? Aucune docstring, aucun commentaire.",
    lines: [5, 7, 8],
    impact: "Faible (code) mais risque élevé de maintenance",
    fix: "Extraire les constantes nommées, ajouter docstring + type hints.",
  },
  {
    id: "P9",
    category: "Sécurité",
    categoryColor: "#BE123C",
    categoryBg: "#FFF1F2",
    icon: "🔒",
    title: "Aucune validation de types",
    desc: "years_experience pourrait être une string ('5'), None, ou négatif. talent['skills'] pourrait être une string au lieu d'une liste — la boucle for itérerait sur les caractères.",
    lines: [7, 2],
    impact: "Modéré — comportement silencieusement incorrect",
    fix: "Valider les types à l'entrée (isinstance / Pydantic) et rejeter avec ValueError explicite.",
  },
];

const IMPROVED_CODE = `from typing import Any

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

    # fix P6 — set pour O(1) par lookup
    required_set = {s.strip().lower() for s in required_skills}
    talent_set   = {s.strip().lower() for s in talent_skills}  # fix P3

    matched = len(talent_set & required_set)
    return matched / len(required_set)     # fix P1 — score [0, 1]


def _experience_score(years: float, level: str | None) -> float:
    """Score continu selon la plage du niveau attendu.
    - Dans la plage : 1.0
    - Hors plage : pénalité linéaire (plus forte en sous-qualification)
    """
    if level is None or level not in EXP_RANGES:
        return 1.0                         # pas de contrainte

    lo, hi = EXP_RANGES[level]
    if lo <= years <= hi:
        return 1.0
    if years < lo:
        # fix P4 — score continu, pas binaire
        gap = lo - years
        return max(0.0, 1.0 - gap * 0.25) # pénalité 25 % par an manquant
    # sur-qualifié : pénalité douce
    return max(0.7, 1.0 - (years - hi) * 0.05)


def _location_score(talent_loc: str | None,
                    company_loc: str | None) -> float:
    """1.0 si correspondance (insensible à la casse), 0.0 sinon.
    Pas de contrainte → 1.0.
    """
    if not company_loc:
        return 1.0
    if not talent_loc:
        return 0.0
    # fix P3 — normalisation casse + espaces
    return 1.0 if talent_loc.strip().lower() == company_loc.strip().lower() else 0.0


def match(talent: dict[str, Any],
          company: dict[str, Any]) -> dict[str, float]:
    """Calcule un score de matching normalisé [0, 1].

    Args:
        talent: doit contenir skills (list), years_experience (float),
                location (str), job_type (str).
        company: doit contenir skills_required (list), experience_level (str),
                 location (str), job_type (str).

    Returns:
        {"score": float, "breakdown": {"skills": …, "experience": …, …}}

    Raises:
        TypeError: si years_experience n'est pas un nombre.
        ValueError: si years_experience est négatif.
    """
    # fix P5 — .get() avec valeurs par défaut, pas de KeyError
    talent_skills  = talent.get("skills", [])
    required       = company.get("skills_required", [])
    years          = talent.get("years_experience") or 0
    level          = company.get("experience_level")
    talent_loc     = talent.get("location")
    company_loc    = company.get("location")

    # fix P9 — validation de types explicite
    if not isinstance(talent_skills, list):
        raise TypeError(f"talent.skills doit être une liste, reçu {type(talent_skills)}")
    if not isinstance(years, (int, float)):
        raise TypeError(f"years_experience doit être un nombre, reçu {type(years)}")
    if years < 0:
        raise ValueError(f"years_experience ne peut pas être négatif : {years}")

    # ── Composantes ─────────────────────────────────────────────────────
    breakdown = {
        "skills":     _skills_score(talent_skills, required),
        "experience": _experience_score(float(years), level),
        "location":   _location_score(talent_loc, company_loc),
        "job_type":   _location_score(                         # même logique
            talent.get("job_type"), company.get("job_type")
        ),
    }

    # fix P2 — poids explicites, pas de magic numbers
    score = sum(breakdown[k] * WEIGHTS[k] for k in WEIGHTS)

    return {"score": round(score, 4), "breakdown": breakdown}`;

const TESTS_CODE = `import pytest
from matching import match, _skills_score, _experience_score


# ── Tests _skills_score ──────────────────────────────────────────────────

def test_skills_perfect_match():
    assert _skills_score(["Python", "SQL"], ["python", "sql"]) == 1.0

def test_skills_case_insensitive():               # P3
    assert _skills_score(["PYTHON"], ["python"]) == 1.0

def test_skills_partial_match():
    assert _skills_score(["Python"], ["Python", "SQL"]) == 0.5

def test_skills_no_required():                    # P7 — pas de div par 0
    assert _skills_score(["Python"], []) == 1.0

def test_skills_empty_talent():
    assert _skills_score([], ["Python"]) == 0.0


# ── Tests _experience_score ──────────────────────────────────────────────

def test_exp_in_range():
    assert _experience_score(2, "junior") == 1.0

def test_exp_boundary():
    assert _experience_score(0, "junior") == 1.0   # borne basse inclusive

def test_exp_under_qualified():                    # P4 — score continu
    score = _experience_score(0, "senior")         # 0 ans pour senior (6+)
    assert 0.0 <= score < 1.0

def test_exp_over_qualified_soft_penalty():        # P4 — sur-qualifié doux
    score = _experience_score(12, "junior")
    assert score >= 0.7                            # pénalité soft

def test_exp_no_level():
    assert _experience_score(3, None) == 1.0       # pas de contrainte


# ── Tests match() end-to-end ──────────────────────────────────────────────

COMPANY = {
    "skills_required": ["Python", "SQL"],
    "experience_level": "junior",
    "location": "Paris",
    "job_type": "Data Analyst",
}

def test_perfect_match():
    talent = {"skills": ["python", "sql"], "years_experience": 1,
              "location": "paris", "job_type": "Data Analyst"}
    result = match(talent, COMPANY)
    assert result["score"] == 1.0

def test_location_case_insensitive():              # P3
    talent = {"skills": ["Python", "SQL"], "years_experience": 1,
              "location": "PARIS", "job_type": "Data Analyst"}
    assert match(talent, COMPANY)["score"] == 1.0

def test_missing_skills_key():                     # P5 — pas de KeyError
    talent = {"years_experience": 2, "location": "Paris"}
    result = match(talent, COMPANY)
    assert "score" in result

def test_negative_experience_raises():             # P9 — validation
    talent = {"skills": [], "years_experience": -1, "location": "Paris"}
    with pytest.raises(ValueError):
        match(talent, COMPANY)

def test_skills_as_string_raises():                # P9 — mauvais type
    talent = {"skills": "Python", "years_experience": 2, "location": "Paris"}
    with pytest.raises(TypeError):
        match(talent, COMPANY)

def test_score_normalized():                       # P1 — toujours [0, 1]
    talent = {"skills": [], "years_experience": 0,
              "location": "Lyon", "job_type": "Backend"}
    result = match(talent, COMPANY)
    assert 0.0 <= result["score"] <= 1.0`;

export default function Exercice4() {
  const [activeTab, setActiveTab] = useState("problems");
  const [openProblem, setOpenProblem] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  function copyCode(key, code) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(key);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  }

  const categoryColors = {
    Logique:       { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
    Normalisation: { bg: "#FDF4FF", text: "#9B5CF6", border: "#E9D5FF" },
    Biais:         { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
    "Edge Cases":  { bg: "#F0F9FF", text: "#0EA5E9", border: "#BAE6FD" },
    Performance:   { bg: "#F0FDF4", text: "#059669", border: "#A7F3D0" },
    Lisibilité:    { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0" },
    Sécurité:      { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
  };

  const ORIGINAL_LINES = [
    { n: 1,  code: "def match(talent, company):",             problems: [] },
    { n: 2,  code: "    score = 0",                           problems: ["P1", "P8"] },
    { n: 3,  code: "    for skill in talent[\"skills\"]:",    problems: ["P5", "P9"] },
    { n: 4,  code: "        if skill in company[\"skills_required\"]:", problems: ["P6", "P5", "P7"] },
    { n: 5,  code: "            score += 1",                  problems: ["P3"] },
    { n: 6,  code: "    if talent[\"location\"] == company[\"location\"]:", problems: ["P3", "P5"] },
    { n: 7,  code: "        score += 10",                     problems: ["P2", "P8"] },
    { n: 8,  code: "    if talent[\"years_experience\"] > 5:", problems: ["P4", "P5", "P9"] },
    { n: 9,  code: "        score += 5",                      problems: ["P4", "P8"] },
    { n: 10, code: "    return score",                        problems: ["P1"] },
  ];

  const allCategories = [...new Set(PROBLEMS.map((p) => p.category))];

  const stats = {
    total: PROBLEMS.length,
    critique: PROBLEMS.filter((p) => p.impact.toLowerCase().startsWith("critique")).length,
    elevé: PROBLEMS.filter((p) => p.impact.toLowerCase().startsWith("élevé")).length,
  };

  return (
    <div className="ex-page">
      <div className="ex-hero" style={{ "--hero-color": "#DC2626" }}>
        <div className="ex-hero-badge">Exercice 4</div>
        <h1 className="ex-hero-title">Code Review &amp; Esprit Critique</h1>
        <p className="ex-hero-sub">
          Identification des problèmes · Version améliorée · Tests · Explication des décisions
        </p>
      </div>

      {/* Stats row */}
      <div className="ex4-stats-row">
        <div className="ex4-stat-card">
          <div className="ex4-stat-num">{stats.total}</div>
          <div className="ex4-stat-label">problèmes identifiés</div>
        </div>
        <div className="ex4-stat-card ex4-stat-red">
          <div className="ex4-stat-num">{stats.critique}</div>
          <div className="ex4-stat-label">impact critique</div>
        </div>
        <div className="ex4-stat-card ex4-stat-amber">
          <div className="ex4-stat-num">{stats.elevé}</div>
          <div className="ex4-stat-label">impact élevé</div>
        </div>
        <div className="ex4-stat-card ex4-stat-green">
          <div className="ex4-stat-num">{allCategories.length}</div>
          <div className="ex4-stat-label">catégories</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="ex3-tabs">
        {[
          { id: "problems",  label: "🔍 Problèmes identifiés" },
          { id: "annotated", label: "📌 Code annoté" },
          { id: "improved",  label: "✅ Version améliorée" },
          { id: "tests",     label: "🧪 Tests" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`ex3-tab-btn${activeTab === tab.id ? " ex3-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Panel 1 : Problèmes ── */}
      {activeTab === "problems" && (
        <div className="ex3-section">
          <p className="ex4-intro">
            9 problèmes ont été identifiés dans le code original, répartis en 7 catégories.
            Cliquez sur chaque card pour voir le détail, l'impact, et la correction apportée.
          </p>
          <div className="ex4-problems-list">
            {PROBLEMS.map((p) => {
              const cat = categoryColors[p.category] || categoryColors["Lisibilité"];
              const isOpen = openProblem === p.id;
              return (
                <div
                  key={p.id}
                  className={`ex4-prob-card${isOpen ? " ex4-prob-open" : ""}`}
                  style={{ "--pc": cat.text }}
                >
                  <button
                    className="ex4-prob-header"
                    onClick={() => setOpenProblem(isOpen ? null : p.id)}
                  >
                    <div className="ex4-prob-left">
                      <span className="ex4-prob-id" style={{ background: cat.bg, color: cat.text, borderColor: cat.border }}>{p.id}</span>
                      <span className="ex4-prob-icon">{p.icon}</span>
                      <span className="ex4-prob-title">{p.title}</span>
                    </div>
                    <div className="ex4-prob-right">
                      <span className="ex4-prob-cat" style={{ background: cat.bg, color: cat.text, borderColor: cat.border }}>{p.category}</span>
                      <span className="ex4-prob-chevron">{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="ex4-prob-body">
                      <div className="ex4-prob-grid">
                        <div className="ex4-prob-col">
                          <div className="ex4-prob-col-label">🔍 Problème</div>
                          <p>{p.desc}</p>
                        </div>
                        <div className="ex4-prob-col">
                          <div className="ex4-prob-col-label">💥 Impact</div>
                          <div className={`ex4-impact-chip${p.impact.startsWith("Critique") ? " impact-critical" : p.impact.startsWith("Élevé") ? " impact-high" : " impact-medium"}`}>
                            {p.impact}
                          </div>
                        </div>
                        <div className="ex4-prob-col">
                          <div className="ex4-prob-col-label">✅ Correction</div>
                          <p>{p.fix}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Panel 2 : Code annoté ── */}
      {activeTab === "annotated" && (
        <div className="ex3-section">
          <p className="ex4-intro">
            Chaque ligne du code original est annotée avec les problèmes correspondants. Survolez un badge pour voir le titre du problème.
          </p>
          <div className="ex4-annotated-block">
            <div className="ex4-annotated-header">
              <span className="ex4-file-label">🐍 match_original.py</span>
              <span className="ex4-annotated-note">⚠️ Code intentionnellement défaillant</span>
            </div>
            <div className="ex4-code-lines">
              {ORIGINAL_LINES.map((line) => (
                <div key={line.n} className={`ex4-code-line${line.problems.length > 0 ? " ex4-code-line-problem" : ""}`}>
                  <span className="ex4-line-num">{line.n}</span>
                  <code className="ex4-line-code">{line.code}</code>
                  {line.problems.length > 0 && (
                    <div className="ex4-line-badges">
                      {line.problems.map((pid) => {
                        const prob = PROBLEMS.find((p) => p.id === pid);
                        const cat = prob ? (categoryColors[prob.category] || categoryColors["Lisibilité"]) : {};
                        return (
                          <span
                            key={pid}
                            className="ex4-line-badge"
                            style={{ background: cat.bg, color: cat.text, borderColor: cat.border }}
                            title={prob?.title}
                          >
                            {pid}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="ex4-legend">
            <div className="ex4-legend-title">Légende des catégories</div>
            <div className="ex4-legend-chips">
              {allCategories.map((cat) => {
                const c = categoryColors[cat];
                return (
                  <span key={cat} className="ex4-legend-chip" style={{ background: c.bg, color: c.text, borderColor: c.border }}>
                    {cat}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Panel 3 : Version améliorée ── */}
      {activeTab === "improved" && (
        <div className="ex3-section">
          <p className="ex4-intro">
            Version réécrite corrigeant tous les problèmes identifiés. Le score est normalisé
            [0, 1], les poids sont explicites, les types validés, les edge cases gérés.
          </p>

          {/* Decision table */}
          <div className="ex4-decision-table-wrap info-card">
            <div className="info-card-head" style={{ "--c": "#4F6DFF" }}>
              <span className="info-card-icon">📐</span>
              <h2 className="info-card-title">Décisions d'architecture</h2>
            </div>
            <div className="info-card-body" style={{ padding: 0 }}>
              <table className="info-table">
                <thead>
                  <tr>
                    <th>Décision</th>
                    <th>Problème(s) résolu(s)</th>
                    <th>Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Score normalisé [0,1] avec poids explicites", "P1, P2, P8", "Comparaison cohérente entre talents"],
                    ["Fonctions privées par composante", "P2", "Testabilité unitaire, séparation des responsabilités"],
                    [".strip().lower() sur toutes les chaînes", "P3", "Robustesse sur données réelles"],
                    ["Score d'expérience continu + pénalité linéaire", "P4", "Pas de cliff edge, gradient fluide"],
                    [".get() avec valeurs par défaut", "P5", "Zéro KeyError en production"],
                    ["set() pour lookup compétences", "P6", "O(1) au lieu de O(n), scalable à 50k"],
                    ["Retour 1.0 si skills_required vide", "P7", "Pas de division par zéro"],
                    ["TypeError + ValueError explicites", "P9", "Fail-fast, debugging facilité"],
                    ["Constantes WEIGHTS et EXP_RANGES nommées", "P8", "Un seul endroit pour changer les règles métier"],
                  ].map(([d, p, i]) => (
                    <tr key={d}>
                      <td style={{ fontWeight: 500 }}>{d}</td>
                      <td>
                        {p.split(", ").map((id) => (
                          <span key={id} className="ex4-prob-id-sm">{id}</span>
                        ))}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: ".82rem" }}>{i}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Code */}
          <div className="ex4-code-card">
            <div className="ex4-code-card-header">
              <span className="ex4-file-label">🐍 matching_improved.py</span>
              <button
                className="ex4-copy-btn"
                onClick={() => copyCode("improved", IMPROVED_CODE)}
              >
                {copiedCode === "improved" ? "✅ Copié !" : "📋 Copier"}
              </button>
            </div>
            <pre className="ex4-code-pre">{IMPROVED_CODE}</pre>
          </div>
        </div>
      )}

      {/* ── Panel 4 : Tests ── */}
      {activeTab === "tests" && (
        <div className="ex3-section">
          <p className="ex4-intro">
            15 tests unitaires couvrant chaque problème identifié. Chaque test précise
            quel problème il régresse.
          </p>

          <div className="ex4-test-coverage">
            {PROBLEMS.map((p) => (
              <div key={p.id} className="ex4-cov-item">
                <span className="ex4-cov-badge" style={{
                  background: (categoryColors[p.category] || categoryColors["Lisibilité"]).bg,
                  color: (categoryColors[p.category] || categoryColors["Lisibilité"]).text,
                }}>
                  {p.id}
                </span>
                <span className="ex4-cov-check">✓</span>
                <span className="ex4-cov-title">{p.title}</span>
              </div>
            ))}
          </div>

          <div className="ex4-code-card">
            <div className="ex4-code-card-header">
              <span className="ex4-file-label">🧪 test_matching.py — 15 tests</span>
              <button
                className="ex4-copy-btn"
                onClick={() => copyCode("tests", TESTS_CODE)}
              >
                {copiedCode === "tests" ? "✅ Copié !" : "📋 Copier"}
              </button>
            </div>
            <pre className="ex4-code-pre">{TESTS_CODE}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
