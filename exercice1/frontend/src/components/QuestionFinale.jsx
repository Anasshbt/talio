// Ce que fait Talio en une phrase
const TALIO_TAGLINE = "Talents internationaux juniors · testés en stage (3–6 mois) · formés en continu (Talio Academy) · augmentés par l'IA · prêts à performer rapidement.";

const WHY_TALIO = [
  {
    icon: "🌍",
    title: "Le modèle est différenciant et scalable",
    desc: "Stage → Formation continue → Collaboration long terme. Ce pipeline élimine le risque de recrutement pour les startups tout en offrant aux talents une trajectoire claire. C'est un produit à triple impact : client, talent, marché.",
    color: "#4F6DFF",
  },
  {
    icon: "🤖",
    title: "L'IA est au cœur du produit, pas un outil annexe",
    desc: "Talio Academy forme les talents à l'IA. Le matching est algorithmique. L'infra se doit d'être scalable et data-driven. C'est exactement le type de problème technique que je veux résoudre — pas du CRUD, de la vraie ingénierie produit.",
    color: "#9B5CF6",
  },
  {
    icon: "🚀",
    title: "La phase Seed → Série A est la plus formatrice",
    desc: "Passer de 100 à 50 000 talents en 6 mois, c'est une phase rare où chaque décision technique compte. Je veux construire ce scaling, pas l'hériter. C'est là où on apprend le plus vite.",
    color: "#059669",
  },
  {
    icon: "📐",
    title: "La stack est alignée avec mon expertise",
    desc: "FastAPI + Python + PostgreSQL + Docker + GitHub Actions — je suis productif dessus dès le Jour 1, sans courbe d'apprentissage sur les fondations. Je contribue immédiatement sur le fond, pas la forme.",
    color: "#D97706",
  },
];

const WEEK_PLAN = [
  {
    period: "Jours 1–3",
    color: "#4F6DFF",
    icon: "🔍",
    items: [
      "Lire tout le codebase existant, les tests, la CI/CD",
      "Installer l'environnement local, reproduire tous les bugs connus",
      "Cartographier les dépendances et la dette technique",
      "One-on-one avec chaque membre de l'équipe : comprendre les priorités et les frustrations",
    ],
  },
  {
    period: "Semaine 1",
    color: "#9B5CF6",
    icon: "⚡",
    items: [
      "Identifier la quick win avec le meilleur ratio impact/effort",
      "Merger un premier PR (petit mais utile) — montrer comment je travaille",
      "Documenter ce que j'aurais voulu savoir en arrivant (onboarding doc)",
      "Proposer un backlog technique priorisé basé sur ce que j'ai observé",
    ],
  },
  {
    period: "Semaines 2–4",
    color: "#059669",
    icon: "📈",
    items: [
      "Prendre en charge une feature complète de bout en bout (backend + tests + déploiement)",
      "Mettre en place la pagination API (amélioration #2 de l'ex3) si pas encore faite",
      "Ajouter des métriques Prometheus manquantes et alertes Grafana",
      "Code review systématique des PRs des autres — apporter valeur au-delà du code personnel",
    ],
  },
];

export default function QuestionFinale() {
  return (
    <div className="ex-page">
      <div className="ex-hero" style={{ "--hero-color": "#92400E" }}>
        <div className="ex-hero-badge">Question Finale</div>
        <h1 className="ex-hero-title">Pourquoi Talio ?</h1>
        <p className="ex-hero-sub">
          Motivation · Fit technique · Plan de contribution dès les premières semaines
        </p>
      </div>

      {/* TALIO IN BRIEF */}
      <div className="qf-talio-brief">
        <div className="qf-talio-brief-title">🏢 Talio en bref</div>
        <p className="qf-talio-tagline">{TALIO_TAGLINE}</p>
        <div className="qf-talio-steps">
          {[
            { icon: "🧪", step: "Stage 3–6 mois", desc: "Talent testé en conditions réelles chez les clients" },
            { icon: "📚", step: "Talio Academy", desc: "Formation continue, IA, pratiques métier" },
            { icon: "🚀", step: "Long terme", desc: "Montée en responsabilité, opportunités internationales" },
          ].map((s) => (
            <div className="qf-talio-step" key={s.step}>
              <span className="qf-talio-step-icon">{s.icon}</span>
              <div>
                <div className="qf-talio-step-title">{s.step}</div>
                <div className="qf-talio-step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WHY TALIO */}
      <div className="qf-section-title">🎯 Pourquoi Talio, précisément ?</div>
      <div className="qf-why-grid">
        {WHY_TALIO.map((item) => (
          <div className="qf-why-card" key={item.title} style={{ "--wc": item.color }}>
            <div className="qf-why-icon">{item.icon}</div>
            <div className="qf-why-content">
              <h3 className="qf-why-title">{item.title}</h3>
              <p className="qf-why-desc">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* HONESTY NOTE */}
      <div className="qf-honest-note">
        <span className="qf-honest-icon">💬</span>
        <div>
          <strong>Note d'honnêteté</strong>
          <p>
            Je ne mets pas "Talio" simplement parce que c'est l'entreprise qui m'a envoyé ce test.
            J'ai regardé le produit, la stack, la phase de croissance. Le matching algorithmique
            est un domaine où je peux apporter une valeur immédiate — pas juste un développeur
            généraliste qui "s'adapte". C'est une décision réfléchie, pas une formule de politesse.
          </p>
        </div>
      </div>

      {/* HOW TO RAMP UP */}
      <div className="qf-section-title">⚡ Comment devenir performant rapidement ?</div>
      <div className="qf-timeline">
        {WEEK_PLAN.map((phase, i) => (
          <div className="qf-phase" key={phase.period} style={{ "--phc": phase.color }}>
            <div className="qf-phase-marker">
              <div className="qf-phase-dot"></div>
              {i < WEEK_PLAN.length - 1 && <div className="qf-phase-line"></div>}
            </div>
            <div className="qf-phase-card">
              <div className="qf-phase-header">
                <span className="qf-phase-icon">{phase.icon}</span>
                <span className="qf-phase-period">{phase.period}</span>
              </div>
              <ul className="qf-phase-list">
                {phase.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* PRINCIPLES */}
      <div className="qf-principles">
        <div className="qf-principles-title">🧭 Mes principes pour ramper vite</div>
        <div className="qf-principles-grid">
          {[
            { emoji: "👂", title: "Écouter avant d'optimiser", desc: "Je ne réécris pas ce que je ne comprends pas encore. Les 2 premières semaines sont pour comprendre le contexte, pas pour imposer mes préférences." },
            { emoji: "📦", title: "Livrer petit, livrer souvent", desc: "Un PR par jour vaut mieux qu'une feature en 2 semaines. Chaque merge montre comment je travaille et permet au feedback de s'intégrer tôt." },
            { emoji: "📝", title: "Documenter en avançant", desc: "Ce que je découvre, je l'écris. Runbook, ADR, README — ça accélère les prochaines personnes et force à bien comprendre soi-même." },
            { emoji: "🤝", title: "Être utile au-delà de mon périmètre", desc: "Reviews de code, répondre aux questions Slack, identifier des problèmes qu'on ne m'a pas demandé de résoudre. La valeur n'est pas que dans le code mergé." },
          ].map((p) => (
            <div className="qf-principle-card" key={p.title}>
              <span className="qf-principle-emoji">{p.emoji}</span>
              <div>
                <div className="qf-principle-title">{p.title}</div>
                <p className="qf-principle-desc">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CLOSING */}
      <div className="qf-closing-card">
        <div className="qf-closing-quote">
          "Je ne cherche pas un emploi. Je cherche un endroit où mes compétences en
          algorithmique, DevOps et IA créent un impact mesurable dès les premières semaines.
          D'après ce que j'ai vu de Talio — le produit, la stack, la phase de croissance,
          et la qualité de ce test technique — c'est cet endroit."
        </div>
        <div className="qf-closing-sig">— Anass</div>
      </div>
    </div>
  );
}
