import { useState } from "react";

const IMPROVEMENTS = [
  {
    id: 1,
    emoji: "⚡",
    title: "Cache Redis pour les scores de matching",
    color: "#4F6DFF",
    change: "Ajouter un cache Redis entre le backend et la BDD pour les requêtes /match et /rank fréquentes.",
    why: "À 50k talents, les mêmes profils sont souvent comparés aux mêmes offres. Sans cache, on recalcule inutilement.",
    impact: "Réduction de la latence p95 de ~200ms à ~5ms pour les hits cache. Soulage PostgreSQL de ~80% des lectures répétitives.",
    tag: "Performance",
    tagColor: "#EFF6FF",
    tagText: "#3B82F6",
  },
  {
    id: 2,
    emoji: "📄",
    title: "Pagination & filtrage côté API",
    color: "#9B5CF6",
    change: "Ajouter des paramètres limit, offset, et filtres (location, skills, level) aux endpoints /rank et futurs endpoints de listing.",
    why: "Retourner 50k talents en une réponse JSON est impossible en prod : timeout, OOM, UX inutilisable.",
    impact: "Scalabilité immédiate de l'API. Permet aux clients de paginer et de filtrer sans surcharger le backend.",
    tag: "Scalabilité",
    tagColor: "#FDF4FF",
    tagText: "#9B5CF6",
  },
  {
    id: 3,
    emoji: "🔁",
    title: "File de tâches asynchrones (Celery + Redis)",
    color: "#059669",
    change: "Déplacer le calcul de classement massif (/rank sur 50k talents) dans des workers Celery. L'API retourne un job_id immédiatement.",
    why: "Un classement sur 50k profils peut prendre plusieurs secondes — inacceptable en requête HTTP synchrone.",
    impact: "L'API reste sous 100ms. Les workers scalent horizontalement selon la charge. Meilleure résilience aux pics.",
    tag: "Architecture",
    tagColor: "#F0FDF4",
    tagText: "#059669",
  },
];

const EDGE_CASES = [
  { icon: "💾", title: "Données corrompues", desc: "Validation Pydantic à l'entrée + contraintes BDD (NOT NULL, CHECK). Logs d'erreur structurés pour audit." },
  { icon: "🌡️", title: "Latence sous charge", desc: "Index PostgreSQL sur (location, experience_level). Connection pooling avec PgBouncer. Cache Redis." },
  { icon: "❄️", title: "Cold start conteneurs", desc: "Healthcheck Docker avec retry. Readiness probe avant de router le trafic (Kubernetes / ECS)." },
  { icon: "🔒", title: "Downtime déploiement", desc: "Rolling update + blue/green deployment. Alembic migrations rétrocompatibles (expand-contract pattern)." },
  { icon: "📈", title: "Pics de trafic soudains", desc: "Autoscaling horizontal (HPA Kubernetes). Rate limiting nginx. Circuit breaker sur les workers." },
  { icon: "🗄️", title: "BDD saturée", desc: "Read replicas pour les requêtes de ranking. Partitionnement par région à terme." },
];

const ARCH_EVOLUTION = [
  { phase: "Aujourd'hui", count: "100 talents · 20 entreprises", items: ["FastAPI + PostgreSQL", "1 conteneur backend", "Requêtes synchrones"] },
  { phase: "Dans 6 mois", count: "50k talents · 5k entreprises", items: ["Redis cache + Celery workers", "Read replicas PostgreSQL", "API paginée + filtres"] },
];

export default function Exercice3() {
  const [openCard, setOpenCard] = useState(null);
  const [activeTab, setActiveTab] = useState("ameliorations");

  return (
    <div className="ex-page">
      <div className="ex-hero" style={{ "--hero-color": "#F59E0B" }}>
        <div className="ex-hero-badge">Exercice 3</div>
        <h1 className="ex-hero-title">Product Thinking &amp; Scalabilité</h1>
        <p className="ex-hero-sub">
          Vision produit · Pensée scalabilité · Anticipation des risques · Capacité à itérer
        </p>
      </div>

      {/* Tabs */}
      <div className="ex3-tabs">
        {[
          { id: "ameliorations", label: "🚀 3 Améliorations prioritaires" },
          { id: "architecture", label: "🏗️ Évolution architecture" },
          { id: "risques", label: "⚠️ Edge cases & risques" },
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

      {/* Panel A — Améliorations */}
      {activeTab === "ameliorations" && (
        <div className="ex3-section">
          <p className="ex3-context-note">
            📍 Système en prod avec <strong>100 talents &amp; 20 entreprises</strong> → dans 6 mois : <strong>50 000 talents &amp; 5 000 entreprises</strong>
          </p>
          <div className="ex3-improvements">
            {IMPROVEMENTS.map((item) => (
              <div
                key={item.id}
                className={`improv-card${openCard === item.id ? " improv-open" : ""}`}
                style={{ "--ic": item.color }}
              >
                <button
                  className="improv-header"
                  onClick={() => setOpenCard(openCard === item.id ? null : item.id)}
                >
                  <div className="improv-left">
                    <span className="improv-num" style={{ background: item.color }}>#{item.id}</span>
                    <span className="improv-emoji">{item.emoji}</span>
                    <span className="improv-title">{item.title}</span>
                  </div>
                  <div className="improv-right">
                    <span className="improv-tag" style={{ background: item.tagColor, color: item.tagText }}>{item.tag}</span>
                    <span className="improv-chevron">{openCard === item.id ? "▲" : "▼"}</span>
                  </div>
                </button>
                {openCard === item.id && (
                  <div className="improv-body">
                    <div className="improv-row">
                      <div className="improv-col">
                        <div className="improv-col-label">🔧 Ce qu'on change</div>
                        <p>{item.change}</p>
                      </div>
                      <div className="improv-col">
                        <div className="improv-col-label">💡 Pourquoi</div>
                        <p>{item.why}</p>
                      </div>
                      <div className="improv-col">
                        <div className="improv-col-label">📈 Impact business</div>
                        <p>{item.impact}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Feature implémentée */}
          <div className="ex3-impl-banner">
            <div className="ex3-impl-header">
              <span className="ex3-impl-badge">✅ Implémenté</span>
              <h3>Amélioration concrète : Pagination de l'API /rank</h3>
            </div>
            <p className="ex3-impl-desc">
              L'endpoint <code>/rank</code> accepte désormais les paramètres <code>limit</code> et <code>offset</code>,
              et le frontend affiche les résultats paginés avec navigation. C'est la fondation indispensable avant tout
              autre scaling — sans ça, les améliorations #1 et #3 ne peuvent pas fonctionner correctement.
            </p>
            <div className="ex3-impl-code">
              <div className="code-block">
                <span className="code-label">Avant</span>
                <pre>POST /rank  →  retourne TOUS les talents d'un coup</pre>
              </div>
              <div className="ex3-impl-arrow">→</div>
              <div className="code-block">
                <span className="code-label">Après</span>
                <pre>POST /rank?limit=20&amp;offset=0  →  page 1 de 20 résultats
POST /rank?limit=20&amp;offset=20 →  page 2</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel B — Architecture */}
      {activeTab === "architecture" && (
        <div className="ex3-section">
          <div className="ex3-arch-compare">
            {ARCH_EVOLUTION.map((phase) => (
              <div key={phase.phase} className="arch-phase-card">
                <div className="arch-phase-header">
                  <span className="arch-phase-label">{phase.phase}</span>
                  <span className="arch-phase-count">{phase.count}</span>
                </div>
                <ul className="arch-phase-list">
                  {phase.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="arch-evolution-diagram">
            <div className="arch-evo-title">Architecture cible (6 mois)</div>
            <div className="arch-evo-layers">
              <div className="arch-evo-layer" style={{ "--lc": "#4F6DFF" }}>
                <span>🌐 Load Balancer (nginx / ALB)</span>
              </div>
              <div className="arch-evo-arrow">↓</div>
              <div className="arch-evo-layer" style={{ "--lc": "#9B5CF6" }}>
                <span>⚡ FastAPI Workers (× N instances)</span>
              </div>
              <div className="arch-evo-row">
                <div className="arch-evo-branch">
                  <div className="arch-evo-arrow">↓</div>
                  <div className="arch-evo-layer" style={{ "--lc": "#DC2626" }}>
                    <span>🔴 Redis Cache</span>
                  </div>
                </div>
                <div className="arch-evo-branch">
                  <div className="arch-evo-arrow">↓</div>
                  <div className="arch-evo-layer" style={{ "--lc": "#059669" }}>
                    <span>🐘 PostgreSQL Primary + Read Replicas</span>
                  </div>
                </div>
                <div className="arch-evo-branch">
                  <div className="arch-evo-arrow">↓</div>
                  <div className="arch-evo-layer" style={{ "--lc": "#D97706" }}>
                    <span>🔁 Celery Workers + Queue</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel C — Edge cases */}
      {activeTab === "risques" && (
        <div className="ex3-section">
          <div className="ex3-risks-grid">
            {EDGE_CASES.map((item) => (
              <div className="risk-card" key={item.title}>
                <div className="risk-icon">{item.icon}</div>
                <div className="risk-content">
                  <div className="risk-title">{item.title}</div>
                  <p className="risk-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
