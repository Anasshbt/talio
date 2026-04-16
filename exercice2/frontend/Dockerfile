# ──────────────────────────────────────────────────────────────────────────────
# Multi-stage build — build context = repo root (talio/)
# Stage 1 : compile React app with Vite
# Stage 2 : serve static assets with nginx
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (separate layer — cached unless package.json changes)
COPY exercice1/frontend/package.json exercice1/frontend/package-lock.json* ./
RUN npm install --silent

# Copy source and build
COPY exercice1/frontend/ ./
RUN npm run build
# Output: /app/dist/

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Our config: SPA routing + API proxy to backend
COPY exercice2/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Static assets from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx runs as non-root by default in alpine image
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
