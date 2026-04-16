export default function Exercice2() {
  return (
    <div className="ex-page">
      <div className="ex-hero" style={{ "--hero-color": "#9B5CF6" }}>
        <div className="ex-hero-badge">Exercice 2</div>
        <h1 className="ex-hero-title">DevOps &amp; Déploiement</h1>
        <p className="ex-hero-sub">
          Containerisation complète et production-ready du système de matching.
        </p>
      </div>

      <div className="ex2-grid">

        {/* CARD 1 — Lancement */}
        <div className="info-card">
          <div className="info-card-head" style={{ "--c": "#4F6DFF" }}>
            <span className="info-card-icon">🚀</span>
            <h2 className="info-card-title">Lancement en une commande</h2>
          </div>
          <div className="info-card-body">
            <div className="code-block">
              <span className="code-label">Setup</span>
              <pre>{`git clone <repo>
cd talio/exercice2
cp .env.example .env
docker compose up --build`}</pre>
            </div>
            <div className="chip-row">
              <span className="chip chip-blue">🌐 Frontend :80</span>
              <span className="chip chip-purple">⚡ Backend :8000</span>
              <span className="chip chip-green">📚 Swagger /docs</span>
            </div>
          </div>
        </div>

        {/* CARD 2 — Architecture */}
        <div className="info-card">
          <div className="info-card-head" style={{ "--c": "#9B5CF6" }}>
            <span className="info-card-icon">🏗️</span>
            <h2 className="info-card-title">Architecture des conteneurs</h2>
          </div>
          <div className="info-card-body">
            <div className="arch-diagram">
              <div className="arch-net-label">réseau interne Docker</div>
              <div className="arch-services">
                <div className="service-box service-db">
                  <div className="service-icon">🐘</div>
                  <div className="service-name">postgres</div>
                  <div className="service-port">:5432</div>
                  <div className="service-note">volume persistant</div>
                </div>
                <div className="arch-arrow">◄──►</div>
                <div className="service-box service-backend">
                  <div className="service-icon">⚡</div>
                  <div className="service-name">backend</div>
                  <div className="service-port">FastAPI :8000</div>
                  <div className="service-note">Alembic + healthcheck</div>
                </div>
                <div className="arch-arrow">◄──►</div>
                <div className="service-box service-frontend">
                  <div className="service-icon">🌐</div>
                  <div className="service-name">frontend</div>
                  <div className="service-port">nginx :80</div>
                  <div className="service-note">port 80 exposé ↑</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3 — Sécurité */}
        <div className="info-card">
          <div className="info-card-head" style={{ "--c": "#059669" }}>
            <span className="info-card-icon">🔒</span>
            <h2 className="info-card-title">Sécurité</h2>
          </div>
          <div className="info-card-body">
            <table className="info-table">
              <thead><tr><th>Mesure</th><th>Implémentation</th></tr></thead>
              <tbody>
                {[
                  ["Aucun secret hardcodé", ".env dans .gitignore"],
                  ["Utilisateur non-root", "USER app dans Dockerfile"],
                  ["Réseau privé", "Seul port 80 (nginx) exposé"],
                  ["Validation inputs", "Pydantic v2 → HTTP 422"],
                  ["Headers sécurité", "X-Frame-Options, X-Content-Type-Options"],
                  ["Image minimale", "python:3.12-slim + nginx:alpine"],
                ].map(([m, i]) => (
                  <tr key={m}><td>{m}</td><td>{i}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CARD 4 — Monitoring */}
        <div className="info-card">
          <div className="info-card-head" style={{ "--c": "#D97706" }}>
            <span className="info-card-icon">📊</span>
            <h2 className="info-card-title">Monitoring en production</h2>
          </div>
          <div className="info-card-body">
            <div className="monitor-stack">
              {[
                { color: "#10B981", title: "/health endpoint", desc: "Uptime Robot / Datadog — alerte si >3 échecs consécutifs" },
                { color: "#4F6DFF", title: "Latence p95", desc: "Prometheus + Grafana — alerte si >500ms" },
                { color: "#DC2626", title: "Taux d'erreurs 5xx", desc: "Loki + Grafana — alerte si >1% sur 5 min" },
                { color: "#9B5CF6", title: "CPU / RAM", desc: "cAdvisor + Prometheus — alerte si >85%" },
              ].map((item) => (
                <div className="monitor-item" key={item.title}>
                  <span className="monitor-dot" style={{ background: item.color }}></span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="code-block" style={{ marginTop: "1rem" }}>
              <span className="code-label">Flux minimal</span>
              <pre>docker logs → Loki → Grafana → alertes Slack</pre>
            </div>
          </div>
        </div>

        {/* CARD 5 — Rollback */}
        <div className="info-card">
          <div className="info-card-head" style={{ "--c": "#DC2626" }}>
            <span className="info-card-icon">♻️</span>
            <h2 className="info-card-title">Stratégie de Rollback</h2>
          </div>
          <div className="info-card-body">
            <div className="chip-row" style={{ marginBottom: "1rem" }}>
              <span className="chip" style={{ background: "#FEF2F2", color: "#DC2626" }}>sha-a1b2c3</span>
              <span className="chip" style={{ background: "#F0FDF4", color: "#059669" }}>v1.2.0</span>
              <span className="chip" style={{ background: "#EFF6FF", color: "#3B82F6" }}>latest</span>
            </div>
            <div className="code-block">
              <span className="code-label">Rollback applicatif (&lt;2 min)</span>
              <pre>{`IMAGE_TAG=sha-a1b2c3 docker compose up -d backend
docker compose ps
curl http://localhost:8000/health`}</pre>
            </div>
            <div className="code-block">
              <span className="code-label">Rollback BDD</span>
              <pre>docker compose exec backend uv run alembic downgrade -1</pre>
            </div>
          </div>
        </div>

        {/* CARD 6 — CI/CD */}
        <div className="info-card">
          <div className="info-card-head" style={{ "--c": "#0EA5E9" }}>
            <span className="info-card-icon">🔄</span>
            <h2 className="info-card-title">CI/CD — GitHub Actions</h2>
          </div>
          <div className="info-card-body">
            <div className="pipeline-row">
              {[
                { icon: "🧪", bg: "#EFF6FF", color: "#3B82F6", label: "test-backend", sub: "pytest" },
                { icon: "🏗", bg: "#F0FDF4", color: "#059669", label: "build-frontend", sub: "npm run build" },
                { icon: "🐳", bg: "#FDF4FF", color: "#9B5CF6", label: "docker", sub: "build + push" },
              ].map((step, i, arr) => (
                <div key={step.label} style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                  <div className="pipeline-step">
                    <div className="pipeline-icon" style={{ background: step.bg, color: step.color }}>{step.icon}</div>
                    <div className="pipeline-label">{step.label}</div>
                    <div className="pipeline-sub">{step.sub}</div>
                  </div>
                  {i < arr.length - 1 && <span className="pipeline-arrow">→</span>}
                </div>
              ))}
            </div>
            <div className="code-block" style={{ marginTop: "1rem" }}>
              <pre>{`push → test → build → docker  (main / tags)
PR   → test → build           (pas de docker)`}</pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
