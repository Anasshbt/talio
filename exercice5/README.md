# Exercice 5 — IA & Productivité Dev/DevOps

**🎯 Objectif** : Évaluer l'utilisation de l'IA dans le workflow de développement et de déploiement

---

## 🛠️ Partie 1 — Outils & Veille

### Stack IA quotidienne

| Outil | Usage concret |
|-------|--------------|
| **Claude (Anthropic)** | Architecture & revue de code · Rédaction de docstrings et READMEs · Analyse de stack traces complexes |
| **GitHub Copilot** | Autocomplétion contextuelle sur patterns répétitifs (models Pydantic, tests pytest) · Boilerplate Dockerfile et CI/CD |
| **Cursor** | Refactoring assisté multi-fichiers (Ctrl+K) · Chat inline pour code legacy · Génération de tests depuis signatures |
| **Perplexity AI** | Veille technologique avec sources vérifiées · Comparaison de librairies avec benchmarks récents |
| **ChatGPT / GPT-4o** | Prototypage d'algorithmes · Debugging interactif (coller une erreur, itérer) |

### Sources de veille

| Source | Fréquence |
|--------|-----------|
| The Batch (deeplearning.ai) | Hebdo |
| GitHub Trending | Quotidien |
| Twitter/X — @karpathy, @swyx, @simonw | Quotidien |
| Latent Space Podcast | Hebdo |
| Papers with Code | Bi-hebdo |
| Hacker News — section AI | Quotidien |
| Yannic Kilcher (YouTube) | Hebdo |

### 2 évolutions IA qui ont changé mon workflow

#### 1. Claude Sonnet & Projects — context long + mémoire persistante

**Ce que c'est** : Les modèles 2024-2025 (Claude 3.5+, GPT-4o) supportent 200k tokens de contexte avec des "Projects" qui maintiennent la mémoire entre sessions.

**Impact** : Je peux désormais coller l'intégralité d'un codebase dans le contexte et demander des refactorings globaux cohérents. Avant, je découpais manuellement. Gain estimé : **-60% de temps sur les reviews cross-fichiers**.

**Sur ce projet** : J'ai collé tous les fichiers backend + tests dans un Project Claude. La cohérence des noms, types Pydantic et conventions a été maintenue automatiquement entre les sessions.

---

#### 2. Cursor / Agentic coding — édition de code multi-fichiers

**Ce que c'est** : Les IDE IA de nouvelle génération (Cursor, Windsurf) peuvent modifier plusieurs fichiers simultanément avec une compréhension du codebase entier (RAG sur l'index local).

**Impact** : Un refactoring qui prenait 2h (renommer une interface, propager les changements, mettre à jour les tests) se fait en 10-15 min avec révision humaine. **Réduction du temps de refactoring de ~80%**.

**Sur ce projet** : Migration de l'API de FastAPI sync vers async (asyncpg) — Cursor a propagé les changements dans main.py, models.py, tests/ et mis à jour les fixtures en une seule passe.

---

## 🔬 Partie 2 — Usage concret sur ce projet

### 💻 Coding

**Outil** : Claude
**Prompt** : *"Implémente un algorithme de scoring Talent×Entreprise en Python pur, avec des poids paramétrables, gestion des edge cases (None, listes vides, types incorrects) et retour d'un breakdown détaillé."*
**Résultat** : Génération de la première version de `matching.py` (~80% du code final). Les cas limites étaient déjà couverts.
**Gain** : ~3h → 45 min

---

**Outil** : Cursor
**Prompt** : *"Refactor: extraire les constantes WEIGHTS et EXP_RANGES du code inline et ajouter des type hints partout."*
**Résultat** : Propagation dans tous les fichiers en 8 minutes. Zéro régression (tests verts).
**Gain** : ~1h → 8 min

---

### 🐛 Debugging & Edge Cases

**Outil** : ChatGPT
**Prompt** : *"Ma fonction de scoring retourne des valeurs > 1.0 quand le talent a plus de compétences que requises. Voici le code : [...]"*
**Résultat** : Identification immédiate — division par `len(required)` mais le numérateur pouvait dépasser le dénominateur. Fix : `min(matched, len(required)) / len(required)`.
**Gain** : Bug résolu en 4 min (vs ~45 min sans IA)

---

**Outil** : Claude
**Prompt** : *"Quels edge cases pourraient faire crasher cet endpoint FastAPI en production avec 50k users ? [code collé]"*
**Résultat** : Liste de 7 edge cases dont 3 non identifiés manuellement. Tous ajoutés aux tests.
**Gain** : 7 edge cases en 2 min

---

### 🧪 Tests

**Outil** : Cursor
**Prompt** : *"Génère des tests pytest pour matching.py couvrant : perfect match, partial match, edge cases (None, listes vides, types incorrects, négatifs)."*
**Résultat** : 28 tests générés, dont des parametric tests avec `@pytest.mark.parametrize`. 3 tests ont révélé des bugs réels.
**Gain** : ~2h de tests manuels → 20 min

---

### 🐳 DevOps

**Outil** : Claude
**Prompt** : *"Génère un Dockerfile multi-stage pour FastAPI + uv, non-root, avec healthcheck et image finale < 200MB."*
**Résultat** : Dockerfile optimisé avec builder stage, runner stage slim, USER non-root, HEALTHCHECK curl, layer caching optimal.
**Gain** : ~2h de recherche → 15 min

---

**Outil** : ChatGPT
**Prompt** : *"Écris un pipeline GitHub Actions qui: teste le backend (pytest), build le frontend (npm), pousse les images Docker avec tags sha+semver, seulement sur main et tags."*
**Résultat** : CI/CD complet en 1 passe. Seule correction manuelle : ajout du secret DOCKER_PASSWORD.
**Gain** : ~3h → 25 min

---

## 📊 Partie 3 — Impact réel chiffré

| Tâche | Avant IA | Après IA | Outil |
|-------|----------|----------|-------|
| Algorithme de scoring (matching.py) | ~3h | 45 min | Claude |
| Tests unitaires (28 tests) | ~2h | 20 min | Cursor |
| Pipeline CI/CD complet | ~3h | 25 min | ChatGPT |
| Dockerfile multi-stage non-root | ~2h | 15 min | Claude |
| Bug score > 1.0 résolu | ~45 min | 4 min | ChatGPT |
| 7 edge cases identifiés proactivement | manuel | 2 min | Claude |

> **Sur l'ensemble du projet Talio, l'IA a réduit le temps de développement estimé de ~18h à ~6h — soit un gain de ×3.**

> L'essentiel du gain est sur la génération initiale de code boilerplate (Dockerfile, CI/CD, tests) et le debugging d'edge cases.

### Note d'honnêteté

L'IA génère rarement du code parfait du premier coup. Sur ce projet : ~70% du code IA-généré a nécessité des corrections (types, logique métier, edge cases manqués). La valeur n'est pas dans la "génération magique" mais dans l'accélération des cycles itératifs : tester une idée en 5 min au lieu de 45 min, puis affiner manuellement.

---

## 🔮 Partie 4 — Vision 6 mois

### Usage #1 — Agents autonomes de code review & refactoring

**Ce que c'est** : Des agents (type Devin, SWE-agent) capables de lire un PR, identifier les problèmes, proposer des corrections et les appliquer sans supervision humaine pour les cas standards.

**Horizon** : 3-6 mois

**Comment je m'y prépare** : Formation sur LangGraph et l'architecture multi-agents. Expérimentation de workflows d'auto-review avec Claude API + GitHub webhooks.

---

### Usage #2 — IA infrastructure-aware — auto-optimisation des configs

**Ce que c'est** : Des LLM avec accès aux métriques Prometheus, logs Loki et configs K8s capables de recommander (et appliquer) des optimisations d'infra en temps réel.

**Horizon** : 4-8 mois

**Comment je m'y prépare** : Exploration de K8sGPT et intégration Claude avec outils de monitoring. Tests de prompts structurés avec dumps de métriques réelles.

---

### Ma posture face à l'IA

**Ce que je fais ✅**
- Utiliser l'IA pour accélérer, pas remplacer le raisonnement
- Toujours comprendre ce que l'IA génère avant de merger
- Itérer vite : prompt → test → correction → réutiliser

**Ce que j'évite ❌**
- Copier-coller sans lire (code zombie)
- Faire confiance aveuglément aux edge cases générés
- Ignorer les hallucinations sur les dépendances/versions

**Ce que j'apprends 🔜**
- LangGraph pour les workflows multi-agents
- Prompt engineering structuré (chain-of-thought, few-shot)
- Évaluation des LLM outputs (evals, regression tests)

---

**💡 Ce que nous évaluons** : intégration IA dans le workflow · résultats concrets · honnêteté · vision
