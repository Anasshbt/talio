# Exercice 3 — Product Thinking & Scalabilité

**🎯 Objectif** : Vision produit · Pensée scalabilité · Anticipation des risques · Capacité à itérer

---

## 📍 Contexte

Système en prod avec **100 talents & 20 entreprises** → dans 6 mois : **50 000 talents & 5 000 entreprises**.

---

## 🚀 Partie A — 3 Améliorations prioritaires

### #1 ⚡ Cache Redis pour les scores de matching

**Ce qu'on change**
Ajouter un cache Redis entre le backend et la BDD pour les requêtes `/match` et `/rank` fréquentes.

**Pourquoi**
À 50k talents, les mêmes profils sont souvent comparés aux mêmes offres. Sans cache, on recalcule inutilement à chaque requête.

**Impact business**
Réduction de la latence p95 de ~200ms à ~5ms pour les hits cache. Soulage PostgreSQL de ~80% des lectures répétitives. Permet à l'API de tenir la charge sans scale horizontal immédiat.

**Tag** : Performance

---

### #2 📄 Pagination & filtrage côté API

**Ce qu'on change**
Ajouter des paramètres `limit`, `offset`, et filtres (`location`, `skills`, `level`) aux endpoints `/rank` et futurs endpoints de listing.

**Pourquoi**
Retourner 50k talents en une réponse JSON est impossible en prod : timeout client, OOM backend, UX inutilisable.

**Impact business**
Scalabilité immédiate de l'API. Permet aux clients de paginer et filtrer sans surcharger le backend. Fondation pour le futur dashboard temps réel.

**Tag** : Scalabilité

---

### #3 🔁 File de tâches asynchrones (Celery + Redis)

**Ce qu'on change**
Déplacer le calcul de classement massif (`/rank` sur 50k talents) dans des workers Celery. L'API retourne un `job_id` immédiatement, le client poll le résultat.

**Pourquoi**
Un classement sur 50k profils peut prendre plusieurs secondes — inacceptable en requête HTTP synchrone.

**Impact business**
L'API reste sous 100ms. Les workers scalent horizontalement selon la charge. Meilleure résilience aux pics de trafic.

**Tag** : Architecture

---

## ✅ Amélioration concrète implémentée — Pagination de l'API /rank

L'endpoint `/rank` accepte désormais les paramètres `limit` et `offset`.

```
# Avant
POST /rank  →  retourne TOUS les talents d'un coup

# Après
POST /rank?limit=20&offset=0   →  page 1 de 20 résultats
POST /rank?limit=20&offset=20  →  page 2
```

C'est la fondation indispensable avant tout autre scaling — sans ça, les améliorations #1 et #3 ne fonctionnent pas correctement.

---

## 🏗️ Partie B — Évolution de l'architecture

### Aujourd'hui (100 talents · 20 entreprises)
- FastAPI + PostgreSQL
- 1 conteneur backend
- Requêtes synchrones

### Dans 6 mois (50k talents · 5k entreprises)
- Redis cache + Celery workers
- Read replicas PostgreSQL
- API paginée + filtres

### Architecture cible

```
🌐 Load Balancer (nginx / ALB)
          ↓
⚡ FastAPI Workers (× N instances)
     ↓              ↓              ↓
🔴 Redis Cache   🐘 PostgreSQL   🔁 Celery Workers
                  Primary +          + Queue
                  Read Replicas
```

---

## ⚠️ Partie C — Edge cases & risques techniques

| Risque | Mitigation |
|--------|-----------|
| 💾 **Données corrompues** | Validation Pydantic à l'entrée + contraintes BDD (NOT NULL, CHECK). Logs structurés pour audit. |
| 🌡️ **Latence sous charge** | Index PostgreSQL sur (location, experience_level). Connection pooling PgBouncer. Cache Redis. |
| ❄️ **Cold start conteneurs** | Healthcheck Docker avec retry. Readiness probe avant de router le trafic. |
| 🔒 **Downtime déploiement** | Rolling update + blue/green. Alembic migrations rétrocompatibles (expand-contract). |
| 📈 **Pics de trafic** | Autoscaling horizontal (HPA Kubernetes). Rate limiting nginx. Circuit breaker workers. |
| 🗄️ **BDD saturée** | Read replicas pour le ranking. Partitionnement par région à terme. |

---

**💡 Ce que nous évaluons** : vision produit · pensée scalabilité · anticipation des risques · capacité à itérer
