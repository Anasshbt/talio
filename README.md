# Talio — Test Technique

Bienvenue dans le dépôt du test technique Talio. Ce projet contient une plateforme de matching talent×entreprise, ainsi que les réponses aux exercices de DevOps, Product Thinking, Code Review et IA.

## 📂 Structure du projet

La plateforme dispose d'une application React unifiée pour naviguer à travers tous les exercices :

```text
talio/
├── exercice1/          # Code source de l'application (Backend FastAPI + Frontend React)
├── exercice2/          # Config DevOps (Docker Compose, nginx.conf, CI/CD)
├── exercice3/          # Product Thinking & Scalabilité (README_EX3.md repris dans l'UI)
├── exercice4/          # Code Review & Tests (README_EX4.md repris dans l'UI)
└── exercice5/          # IA & Productivité Dev/DevOps (README_EX5.md repris dans l'UI)
```

Toutes les réponses théoriques (Exercices 3, 4, 5 et la Question Finale) sont intégrées sous forme d'interfaces interactives directement dans l'application web.

---

## 🚀 Comment lancer le projet (Local ou Serveur distant)

Tout a été conteneurisé avec `docker-compose` pour garantir un lancement minimaliste et reproductible sur n'importe quelle machine.

### Prérequis
- **Git**
- **Docker** (version 24.0+ recommandée)
- **Docker Compose**

### Étape 1 : Cloner le projet
```bash
git clone https://github.com/Anasshbt/talio.git
cd talio
```

### Étape 2 : Préparer l'environnement
L'application a besoin d'un fichier `.env` pour la base de données. Allez dans le dossier `exercice2` et utilisez l'exemple fourni :

```bash
cd exercice2
cp .env.example .env
```
*(Les valeurs par défaut du `.env.example` sont prêtes à l'emploi et sécurisées en local)*

### Étape 3 : Lancer via Docker Compose
Toujours dans le dossier `exercice2`, lancez l'application :

```bash
docker-compose up -d --build
```
Cette commande va :
1. Démarrer PostgreSQL.
2. Construire l'image du backend FastAPI (géré avec `uv` pour des temps d'installation ultra rapides).
3. Appliquer automatiquement les migrations de base de données (Alembic) via un entrypoint.
4. Compiler le frontend React (Vite) via un build multi-stage.
5. Lancer un serveur `nginx` pour exposer le frontend sur le port `80` et faire proxy vers l'API.

### Étape 4 : Accéder à l'application

- 🌐 **Interface Web (React)** : Ouvrez votre navigateur sur `http://localhost` (ou l'IP de votre serveur distant).
- ⚙️ **API (FastAPI Swagger)** : Accessible sur `http://localhost:8000/docs`.

---

## 🛑 Arrêt et nettoyage

Pour arrêter les conteneurs :
```bash
docker compose down
```

Pour supprimer complètement les données (base de données) et repartir à zéro :
```bash
docker compose down -v
```

> **Astuce** : Si vous mettez à jour votre code (via `git pull`), n'oubliez pas de relancer `docker compose up -d --build` pour reconstruire les images Docker.
