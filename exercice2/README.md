# Exercice 2 — DevOps & Déploiement

Containerisation complète et production-ready du système de matching (Exercice 1).

---

## Lancement en une commande

```bash
git clone <repo>
cd talio/exercice2

cp .env.example .env          # renseigner les credentials PostgreSQL
docker compose up --build     # build + migrations + démarrage
```

- Frontend : http://localhost:80
- Backend API : http://localhost:8000
- Swagger : http://localhost:8000/docs

---

## Architecture des conteneurs

```
┌─────────────────────────────────────────────────────────┐
│                    réseau interne Docker                 │
│                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ postgres │◄───│   backend    │◄───│   frontend    │  │
│  │  :5432   │    │  FastAPI     │    │  nginx:80     │  │
│  │          │    │  :8000       │    │               │  │
│  └──────────┘    └──────────────┘    └───────────────┘  │
│       ▲                                      │          │
│  volume persistant                    ← port 80 exposé  │
└─────────────────────────────────────────────────────────┘
```

- **db** : PostgreSQL 16-alpine — données persistées dans un Docker volume
- **backend** : FastAPI + uvicorn — migrations Alembic au démarrage, healthcheck sur `/health`
- **frontend** : React buildé avec Vite, servi par nginx — proxifie `/match`, `/rank`, `/health` vers le backend

---

## Variables d'environnement

| Variable | Exemple | Description |
|---|---|---|
| `POSTGRES_USER` | `talio` | Utilisateur PostgreSQL |
| `POSTGRES_PASSWORD` | `changeme` | Mot de passe PostgreSQL (**obligatoire**) |
| `POSTGRES_DB` | `matching_db` | Nom de la base |
| `DATABASE_URL` | `postgresql+asyncpg://talio:changeme@db:5432/matching_db` | URL complète (utilisée par le backend) |
| `FRONTEND_PORT` | `80` | Port exposé du frontend (défaut : 80) |
| `BACKEND_PORT` | `8000` | Port exposé du backend (défaut : 8000) |

> **Aucun secret n'est codé en dur dans le code.** Le fichier `.env` est ignoré par git (`.gitignore`).

---

## Logs structurés

Chaque ligne de log est un objet JSON exploitable par ELK, Loki, ou CloudWatch :

```json
{"timestamp":"2026-04-16T10:23:01Z","level":"INFO","logger":"app","message":"POST /match → 200  12.3ms","method":"POST","path":"/match","status_code":200,"duration_ms":12.3,"request_id":"a1b2c3d4"}
```

Pour filtrer les erreurs :
```bash
docker compose logs backend | grep '"level":"ERROR"'
```

---

## Structure du projet

```
exercice2/
├── .env.example                  ← template des variables d'environnement
├── docker-compose.yml            ← orchestration complète
├── backend/
│   ├── Dockerfile                ← image FastAPI (non-root, healthcheck)
│   └── entrypoint.sh             ← migrations Alembic + démarrage uvicorn
├── frontend/
│   ├── Dockerfile                ← build multi-stage Vite → nginx
│   └── nginx.conf                ← SPA routing + proxy API + cache statique
└── .github/
    └── workflows/
        └── ci.yml                ← pipeline CI/CD (tests + build + Docker)
```

---

## Questions DevOps

### 🔒 Sécurité

| Mesure | Implémentation |
|---|---|
| Aucun secret hardcodé | Variables d'environnement uniquement, `.env` dans `.gitignore` |
| Utilisateur non-root | `USER app` dans le Dockerfile backend |
| Réseau privé | Services `db` et `backend` sur réseau interne Docker — seul le port 80 (nginx) est exposé en prod |
| Validation des inputs | Pydantic v2 sur tous les endpoints, `TypeError`/`ValueError` → HTTP 422 |
| Headers de sécurité | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` dans nginx |
| Surface d'attaque minimale | Image `python:3.12-slim` (pas de `full`), `nginx:alpine` |
| En production | Passer à HTTPS (Traefik / Certbot), supprimer l'exposition du port 5432 et 8000 |

---

### 📊 Monitoring en production

**Détection proactive :**

| Signal | Outil | Seuil d'alerte |
|---|---|---|
| Endpoint `/health` | Uptime Robot / Datadog Synthetics | > 3 échecs consécutifs |
| Latence p95 des requêtes | Prometheus + Grafana (métriques uvicorn) | > 500 ms |
| Taux d'erreurs HTTP 5xx | Loki + Grafana | > 1 % sur 5 min |
| CPU / RAM conteneur | cAdvisor + Prometheus | > 85 % |
| Logs `"level":"ERROR"` | Loki → Alertmanager → Slack/PagerDuty | tout ERROR inattendu |

**Flux minimal pour démarrer :**
```
docker logs → Loki → Grafana → alertes Slack
```

**Métriques clés à surveiller :**
- Nombre de requêtes `/match` et `/rank` par minute (usage normal)
- Taux d'erreur 422 (données invalides côté client)
- Connexions PostgreSQL actives
- Durée des migrations Alembic au démarrage

---

### ♻️ Stratégie de rollback

**Versioning des images :**
Chaque image Docker est taguée avec le SHA Git court en plus de `latest` :
```
talio/backend:sha-a1b2c3    ← commit précis
talio/backend:v1.2.0        ← version sémantique
talio/backend:latest        ← tip de main
```

**Rollback applicatif (< 2 min) :**
```bash
# 1. Identifier la dernière image stable
docker images talio/backend --format "{{.Tag}}: {{.CreatedAt}}"

# 2. Mettre à jour le docker-compose avec le SHA voulu
# IMAGE_TAG=sha-a1b2c3 docker compose up -d backend

# 3. Vérifier la santé
docker compose ps
curl http://localhost:8000/health
```

**Rollback base de données :**
```bash
# Revenir à la migration précédente
docker compose exec backend uv run alembic downgrade -1

# Ou revenir à une révision spécifique
docker compose exec backend uv run alembic downgrade a1b2c3d4e5f6
```

**Décision de rollback :** si le healthcheck échoue ou si le taux d'erreur dépasse le seuil d'alerte dans les 5 minutes suivant un déploiement.

---

## CI/CD (GitHub Actions)

Le fichier `.github/workflows/ci.yml` (à placer à la racine du dépôt) déclenche :

1. **`test-backend`** — pytest sur chaque push/PR
2. **`build-frontend`** — `npm run build` pour détecter les erreurs de compilation
3. **`docker`** — build des images avec tags `sha-<commit>`, `latest`, `v*.*.*` (sur `main` et les tags seulement)

```
push → test → build → docker (main/tags uniquement)
PR   → test → build  (pas de docker pour les PR)
```

---

## Commandes utiles

```bash
# Voir les logs en temps réel
docker compose logs -f backend

# Accéder à la base de données
docker compose exec db psql -U talio -d matching_db

# Vérifier l'état des services
docker compose ps

# Appliquer manuellement les migrations
docker compose exec backend uv run alembic upgrade head

# Arrêter et supprimer les conteneurs (les données sont préservées dans le volume)
docker compose down

# Tout supprimer y compris les données
docker compose down -v
```
