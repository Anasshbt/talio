# Exercice 1 — Système de Matching Talent × Entreprise

Implémentation complète d'un système de scoring et classement de talents :

- **Backend** : FastAPI + Python 3.11, géré par `uv`
- **Frontend** : Vite + React 19, requêtes via `fetch` natif

---

## Lancement en moins de 5 minutes

### Prérequis

| Outil | Version min. |
|-------|-------------|
| Python | 3.11 |
| [uv](https://docs.astral.sh/uv/getting-started/installation/) | 0.4+ |
| Node.js | 18+ |

### 1 — Backend

```bash
cd backend
uv sync                              # installe les dépendances
uv run uvicorn app.main:app --reload # démarre sur http://localhost:8000
```

Swagger UI : http://localhost:8000/docs

### 2 — Frontend (dans un second terminal)

```bash
cd frontend
npm install
npm run dev   # démarre sur http://localhost:5173
```

### 3 — Tests

```bash
cd backend
uv run pytest tests/ -v
```

---

## Algorithme de scoring

### Formule

```
score = 0.40 × skills_score
      + 0.30 × experience_score
      + 0.20 × location_score
      + 0.10 × job_type_score
```

### Détail des composantes

| Composante | Poids | Calcul |
|---|---|---|
| **Compétences** | 40 % | `|talent_skills ∩ required_skills| / |required_skills|` — 1.0 si aucune compétence requise |
| **Expérience** | 30 % | 1.0 si les années tombent dans la plage du niveau demandé ; pénalité linéaire sinon (plus sévère en sous-qualification) |
| **Localisation** | 20 % | 1.0 si correspondance exacte (insensible à la casse), 0.0 sinon ; 1.0 si l'entreprise n'a pas de contrainte |
| **Type de poste** | 10 % | idem localisation |

### Plages d'expérience

| Niveau | Plage |
|--------|-------|
| junior | 0–2 ans |
| mid / intermediate | 3–5 ans |
| senior | 6+ ans |
| lead | 8+ ans |
| expert | 10+ ans |

### Choix de conception

- **Poids asymétriques** : les compétences et l'expérience sont les critères les plus discriminants pour un recruteur ; la localisation et le type de poste viennent en second.
- **Sous-qualification > sur-qualification** : un candidat trop junior est plus risqué qu'un candidat sur-qualifié → pénalité plus forte.
- **Robustesse** : `None`, champs absents et listes vides sont gérés gracieusement sans lever d'exception (sauf types incompatibles).

---

## API

### `POST /match`

Calcule le score entre un talent et une offre.

**Request**
```json
{
  "talent": {
    "skills": ["Python", "SQL", "Machine Learning"],
    "years_experience": 2,
    "location": "Paris",
    "job_type": "Data Analyst"
  },
  "company": {
    "skills_required": ["Python", "SQL"],
    "experience_level": "junior",
    "location": "Paris",
    "job_type": "Data Analyst"
  }
}
```

**Response**
```json
{
  "score": 1.0,
  "breakdown": {
    "skills": 1.0,
    "experience": 1.0,
    "location": 1.0,
    "job_type": 1.0
  }
}
```

---

### `POST /rank`

Classe une liste de talents du meilleur au moins bon.

**Request**
```json
{
  "company": {
    "skills_required": ["Python", "SQL"],
    "experience_level": "junior",
    "location": "Paris",
    "job_type": "Data Analyst"
  },
  "talents": [
    { "skills": ["Python", "SQL"], "years_experience": 2, "location": "Paris", "job_type": "Data Analyst" },
    { "skills": ["Java"],          "years_experience": 5, "location": "Lyon",  "job_type": "Backend Developer" }
  ]
}
```

**Response**
```json
[
  { "talent": { "skills": ["Python", "SQL"], "years_experience": 2, "location": "Paris", "job_type": "Data Analyst" }, "score": 1.0 },
  { "talent": { "skills": ["Java"],          "years_experience": 5, "location": "Lyon",  "job_type": "Backend Developer" }, "score": 0.15 }
]
```

---

## Gestion des erreurs

| Cas | Comportement |
|-----|-------------|
| Champ manquant (`skills`, `location`, `job_type`) | Valeur par défaut silencieuse (liste vide / chaîne vide) |
| `years_experience` absent ou `null` | Traité comme 0 an |
| `years_experience` négatif | `ValueError` → HTTP 422 |
| Type incorrect (ex. `skills: "Python"` au lieu de liste) | `TypeError` → HTTP 422 |
| Niveau d'expérience inconnu | Aucune contrainte → score = 1.0 |
| `talent` ou `company` pas un dict | `TypeError` → HTTP 422 |

---

## Structure du projet

```
exercice1/
├── README.md
├── backend/
│   ├── pyproject.toml
│   ├── app/
│   │   ├── main.py       # FastAPI — endpoints /match et /rank
│   │   ├── matching.py   # logique de scoring (pur Python, sans dépendances)
│   │   └── models.py     # schémas Pydantic v2
│   └── tests/
│       └── test_matching.py  # ~30 tests unitaires
└── frontend/
    ├── package.json
    ├── vite.config.js    # proxy → backend
    └── src/
        ├── App.jsx
        ├── App.css
        ├── api/client.js          # fetch wrapper
        └── components/
            ├── MatchTab.jsx       # onglet match unique
            ├── RankTab.jsx        # onglet classement
            └── ScoreDisplay.jsx   # jauge de score
```
