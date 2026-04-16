import { useState } from "react";

const TOOLS = [
  {
    name: "Claude (Anthropic)",
    icon: "🤖",
    color: "#9B5CF6",
    uses: [
      "Architecture & revue de code — génération de structures complètes avec contraintes métier",
      "Rédaction de docstrings et READMEs techniques",
      "Analyse de stack traces complexes et suggestion de fixes",
    ],
  },
  {
    name: "GitHub Copilot",
    icon: "🐙",
    color: "#0F172A",
    uses: [
      "Autocomplétion contextuelle dans VSCode — particulièrement efficace sur les patterns répétitifs (models Pydantic, tests pytest)",
      "Génération de boilerplate Dockerfile et CI/CD",
    ],
  },
  {
    name: "Cursor",
    icon: "⚡",
    color: "#4F6DFF",
    uses: [
      "Refactoring assisté avec contexte du codebase entier (Ctrl+K)",
      "Chat inline pour expliquer du code legacy avant de le modifier",
      "Génération de tests unitaires à partir des signatures de fonctions",
    ],
  },
  {
    name: "Perplexity AI",
    icon: "🔍",
    color: "#0EA5E9",
    uses: [
      "Veille technologique avec sources vérifiées (pas d'hallucinations)",
      "Comparaison rapide de librairies (ex: asyncpg vs psycopg3) avec benchmarks récents",
    ],
  },
  {
    name: "ChatGPT / GPT-4o",
    icon: "💬",
    color: "#059669",
    uses: [
      "Prototypage d'algorithmes (ex: première version du scoring de matching)",
      "Debugging interactif : coller une erreur, expliquer le contexte, itérer",
    ],
  },
];

const WATCH_SOURCES = [
  { icon: "📰", label: "The Batch (deeplearning.ai)", freq: "hebdo" },
  { icon: "⭐", label: "GitHub Trending", freq: "quotidien" },
  { icon: "🐦", label: "Twitter/X — @karpathy, @swyx, @simonw", freq: "quotidien" },
  { icon: "📻", label: "Latent Space Podcast", freq: "hebdo" },
  { icon: "📚", label: "Papers with Code", freq: "bi-hebdo" },
  { icon: "💬", label: "Hacker News — section AI", freq: "quotidien" },
  { icon: "🎬", label: "Yannic Kilcher (YouTube)", freq: "hebdo" },
];

const AI_EVOLUTIONS = [
  {
    title: "Claude Sonnet & Projects — context long + mémoire persistante",
    color: "#9B5CF6",
    what: "Les modèles 2024-2025 (Claude 3.5+, GPT-4o) supportent 200k tokens de contexte avec des 'Projects' qui maintiennent la mémoire entre sessions.",
    when: "Intégré dans mon workflow fin 2024",
    impact: "Je peux désormais coller l'intégralité d'un codebase dans le contexte et demander des refactorings globaux cohérents. Avant, je découpais manuellement. Gain estimé : -60% de temps sur les reviews cross-fichiers.",
    concrete: "Sur ce projet Talio : j'ai collé tous les fichiers backend + tests dans un Project Claude. La cohérence des noms, types Pydantic et conventions a été maintenue automatiquement entre les sessions.",
  },
  {
    title: "Cursor / Agentic coding — édit de code multi-fichiers",
    color: "#4F6DFF",
    what: "Les IDE IA de nouvelle génération (Cursor, Windsurf) peuvent modifier plusieurs fichiers simultanément avec une compréhension du codebase entier (RAG sur l'index local).",
    when: "Adopté mi-2024, usage intensif depuis Q4 2024",
    impact: "Un refactoring qui prenait 2h (renommer une interface, propager les changements, mettre à jour les tests) se fait en 10-15 min avec révision humaine. J'ai réduit le temps de refactoring de ~80%.",
    concrete: "Migration de l'API de FastAPI sync vers async (asyncpg) : Cursor a propagé les changements dans main.py, models.py, tests/ et mis à jour les fixtures — en une seule passe.",
  },
];

const PROJECT_USAGE = [
  {
    category: "🧑‍💻 Coding",
    icon: "💻",
    color: "#4F6DFF",
    examples: [
      {
        tool: "Claude",
        prompt: "Implémente un algorithme de scoring Talent×Entreprise en Python pur, avec des poids paramétrables, gestion des edge cases (None, listes vides, types incorrects) et retour d'un breakdown détaillé.",
        result: "Génération de la première version de matching.py (~80% du code final). Les cas limites étaient déjà couverts. J'ai ajusté les poids et la pénalité d'expérience manuellement.",
        gain: "~3h → 45min",
      },
      {
        tool: "Cursor",
        prompt: "Refactor: extraire les constantes WEIGHTS et EXP_RANGES du code inline et ajouter des type hints partout.",
        result: "Propagation dans tous les fichiers en 8 minutes. Zéro régression (tests verts).",
        gain: "~1h → 8min",
      },
    ],
  },
  {
    category: "🐛 Debugging & Edge Cases",
    icon: "🔍",
    color: "#DC2626",
    examples: [
      {
        tool: "ChatGPT",
        prompt: "Ma fonction de scoring retourne des valeurs > 1.0 quand le talent a plus de compétences que requises. Voici le code : [...]",
        result: "Identification immédiate : division par len(required) mais le numérateur pouvait dépasser le dénominateur si le talent a des compétences supplémentaires. Fix : min(matched, len(required)) / len(required).",
        gain: "Bug résolu en 4 min (vs ~45 min sans IA)",
      },
      {
        tool: "Claude",
        prompt: "Quels edge cases pourraient faire crasher cet endpoint FastAPI en production avec 50k users ? [code collé]",
        result: "Liste de 7 edge cases dont 3 non identifiés : cold start Alembic sous charge, connexions PostgreSQL starvation, et JSON body trop large sans limite. Tous ajoutés aux tests.",
        gain: "7 edge cases en 2 min",
      },
    ],
  },
  {
    category: "🧪 Tests",
    icon: "🧪",
    color: "#059669",
    examples: [
      {
        tool: "Cursor",
        prompt: "Génère des tests pytest pour matching.py couvrant : perfect match, partial match, edge cases (None, listes vides, types incorrects, négatifs).",
        result: "28 tests générés, dont des paramétric tests avec @pytest.mark.parametrize. 3 tests ont révélé des bugs réels dans le code.",
        gain: "~2h de tests manuels → 20 min",
      },
    ],
  },
  {
    category: "🐳 DevOps",
    icon: "🚀",
    color: "#9B5CF6",
    examples: [
      {
        tool: "Claude",
        prompt: "Génère un Dockerfile multi-stage pour FastAPI + uv, non-root, avec healthcheck et image finale < 200MB.",
        result: "Dockerfile optimisé avec: builder stage (uv sync), runner stage (slim), USER non-root, HEALTHCHECK curl, layer caching optimal.",
        gain: "~2h de recherche → 15 min",
      },
      {
        tool: "ChatGPT",
        prompt: "Écris un pipeline GitHub Actions qui: teste le backend (pytest), build le frontend (npm), pousse les images Docker avec tags sha+semver, seulement sur main et tags.",
        result: "CI/CD complet en 1 passe, avec matrix strategy et conditions correctes. Seule correction manuelle : ajout du secret DOCKER_PASSWORD.",
        gain: "~3h → 25 min",
      },
    ],
  },
];

const VISION = [
  {
    num: "01",
    title: "Agents autonomes de code review & refactoring",
    color: "#4F6DFF",
    desc: "Des agents (type Devin, SWE-agent) capables de lire un PR, identifier les problèmes, proposer des corrections et les appliquer sans supervision humaine pour les cas standards.",
    prep: "Je me forme sur LangGraph et l'architecture multi-agents. J'expérimente des workflows d'auto-review avec Claude API + GitHub webhooks.",
    horizon: "3-6 mois",
  },
  {
    num: "02",
    title: "IA infrastructure-aware — auto-optimisation des configs",
    color: "#9B5CF6",
    desc: "Des LLM avec accès aux métriques Prometheus, logs Loki et configs K8s capables de recommander (et appliquer) des optimisations d'infra en temps réel.",
    prep: "J'explore Kubernetes AI tools (K8sGPT) et l'intégration de Claude avec des outils de monitoring. Je teste des prompts structurés avec des dumps de métriques réelles.",
    horizon: "4-8 mois",
  },
];

export default function Exercice5() {
  const [activeTab, setActiveTab] = useState("tools");
  const [openCard, setOpenCard] = useState(null);

  return (
    <div className="ex-page">
      <div className="ex-hero" style={{ "--hero-color": "#EC4899" }}>
        <div className="ex-hero-badge">Exercice 5</div>
        <h1 className="ex-hero-title">IA &amp; Productivité Dev/DevOps</h1>
        <p className="ex-hero-sub">
          Outils · Veille · Usage concret sur ce projet · Impact chiffré · Vision 6 mois
        </p>
      </div>

      {/* Tabs */}
      <div className="ex3-tabs">
        {[
          { id: "tools",   label: "🛠️ Outils & Veille" },
          { id: "project", label: "🔬 Usage sur ce projet" },
          { id: "impact",  label: "📊 Impact chiffré" },
          { id: "vision",  label: "🔮 Vision 6 mois" },
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

      {/* ── PANEL 1 — Outils & Veille ── */}
      {activeTab === "tools" && (
        <div className="ex3-section">

          {/* Tools grid */}
          <div className="ex5-section-label">🛠️ Stack IA quotidienne</div>
          <div className="ex5-tools-grid">
            {TOOLS.map((tool) => (
              <div className="ex5-tool-card" key={tool.name} style={{ "--tc": tool.color }}>
                <div className="ex5-tool-header">
                  <span className="ex5-tool-icon">{tool.icon}</span>
                  <span className="ex5-tool-name">{tool.name}</span>
                </div>
                <ul className="ex5-tool-uses">
                  {tool.uses.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Watch */}
          <div className="ex5-section-label">📡 Sources de veille</div>
          <div className="ex5-watch-grid">
            {WATCH_SOURCES.map((s) => (
              <div className="ex5-watch-item" key={s.label}>
                <span className="ex5-watch-icon">{s.icon}</span>
                <div className="ex5-watch-info">
                  <span className="ex5-watch-name">{s.label}</span>
                  <span className="ex5-watch-freq">{s.freq}</span>
                </div>
              </div>
            ))}
          </div>

          {/* AI evolutions */}
          <div className="ex5-section-label">🚀 2 évolutions IA qui ont changé mon workflow</div>
          <div className="ex5-evol-list">
            {AI_EVOLUTIONS.map((ev, i) => (
              <div className="ex5-evol-card" key={i} style={{ "--ec": ev.color }}>
                <div className="ex5-evol-num">{String(i + 1).padStart(2, "0")}</div>
                <div className="ex5-evol-content">
                  <h3 className="ex5-evol-title">{ev.title}</h3>
                  <div className="ex5-evol-grid">
                    <div>
                      <div className="ex5-evol-label">💡 Ce que c'est</div>
                      <p>{ev.what}</p>
                    </div>
                    <div>
                      <div className="ex5-evol-label">📅 Depuis</div>
                      <p>{ev.when}</p>
                    </div>
                    <div>
                      <div className="ex5-evol-label">📈 Impact</div>
                      <p>{ev.impact}</p>
                    </div>
                    <div>
                      <div className="ex5-evol-label">🎯 Sur ce projet</div>
                      <p>{ev.concrete}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PANEL 2 — Usage sur le projet ── */}
      {activeTab === "project" && (
        <div className="ex3-section">
          <p className="ex4-intro">
            Utilisation concrète de l'IA à chaque étape du développement de ce projet.
            Outil, prompt exact, résultat obtenu, gain mesuré.
          </p>
          {PROJECT_USAGE.map((section) => (
            <div key={section.category} className="ex5-proj-section">
              <div className="ex5-proj-section-header" style={{ "--sc": section.color }}>
                <span className="ex5-proj-section-icon">{section.icon}</span>
                <span className="ex5-proj-section-title">{section.category}</span>
              </div>
              <div className="ex5-proj-cards">
                {section.examples.map((ex, i) => (
                  <div className="ex5-proj-card" key={i} style={{ "--sc": section.color }}>
                    <div className="ex5-proj-tool-badge">{ex.tool}</div>
                    <div className="ex5-proj-row">
                      <div className="ex5-proj-col">
                        <div className="ex5-proj-col-label">💬 Prompt</div>
                        <p className="ex5-proj-prompt">"{ex.prompt}"</p>
                      </div>
                      <div className="ex5-proj-col">
                        <div className="ex5-proj-col-label">✅ Résultat</div>
                        <p>{ex.result}</p>
                      </div>
                      <div className="ex5-proj-gain-chip">
                        ⏱ {ex.gain}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PANEL 3 — Impact chiffré ── */}
      {activeTab === "impact" && (
        <div className="ex3-section">
          <p className="ex4-intro">
            Exemples concrets et chiffrés de l'impact de l'IA sur ce projet.
          </p>

          {/* Big impact numbers */}
          <div className="ex5-impact-grid">
            {[
              { before: "~3h", after: "45 min", label: "Algorithme de scoring (matching.py)", tool: "Claude", emoji: "🧮" },
              { before: "~2h", after: "20 min", label: "Tests unitaires (28 tests)", tool: "Cursor", emoji: "🧪" },
              { before: "~3h", after: "25 min", label: "Pipeline CI/CD complet", tool: "ChatGPT", emoji: "🔄" },
              { before: "~2h", after: "15 min", label: "Dockerfile multi-stage non-root", tool: "Claude", emoji: "🐳" },
              { before: "~45 min", after: "4 min", label: "Bug score > 1.0 résolu", tool: "ChatGPT", emoji: "🐛" },
              { before: "manual", after: "7 cas", label: "Edge cases identifiés proactivement", tool: "Claude", emoji: "⚠️" },
            ].map((item) => (
              <div className="ex5-impact-card" key={item.label}>
                <div className="ex5-impact-emoji">{item.emoji}</div>
                <div className="ex5-impact-times">
                  <span className="ex5-impact-before">{item.before}</span>
                  <span className="ex5-impact-arrow">→</span>
                  <span className="ex5-impact-after">{item.after}</span>
                </div>
                <div className="ex5-impact-label">{item.label}</div>
                <div className="ex5-impact-tool">{item.tool}</div>
              </div>
            ))}
          </div>

          {/* Summary quote */}
          <div className="ex5-quote-card">
            <div className="ex5-quote-icon">💬</div>
            <blockquote className="ex5-quote-text">
              "Sur l'ensemble du projet Talio (ex1 + ex2 + ex4 + ex5), l'IA a réduit le temps de développement
              estimé de <strong>~18h à ~6h</strong> — soit un gain de <strong>×3</strong>.
              L'essentiel du gain est sur la génération initiale de code boilerplate (Dockerfile, CI/CD, tests)
              et le debugging d'edge cases. La valeur ajoutée humaine reste sur les décisions d'architecture,
              les poids métier du scoring, et la validation des outputs."
            </blockquote>
          </div>

          {/* Honesty note */}
          <div className="ex5-honest-banner">
            <span className="ex5-honest-icon">🔍</span>
            <div>
              <strong>Note d'honnêteté</strong>
              <p>
                L'IA génère rarement du code parfait du premier coup. Sur ce projet : ~70% du code IA-généré
                a nécessité des corrections (types, logique métier, edge cases manqués). La valeur n'est pas
                dans la "génération magique" mais dans l'accélération des cycles itératifs : tester une idée
                en 5 min au lieu de 45 min, puis affiner manuellement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── PANEL 4 — Vision ── */}
      {activeTab === "vision" && (
        <div className="ex3-section">
          <p className="ex4-intro">
            Les 2 évolutions IA qui auront le plus d'impact pour un Dev/DevOps dans les 6 prochains mois,
            et comment je m'y prépare dès maintenant.
          </p>

          <div className="ex5-vision-list">
            {VISION.map((v) => (
              <div className="ex5-vision-card" key={v.num} style={{ "--vc": v.color }}>
                <div className="ex5-vision-num">{v.num}</div>
                <div className="ex5-vision-content">
                  <h3 className="ex5-vision-title">{v.title}</h3>
                  <div className="ex5-vision-horizon">
                    <span>🗓 Horizon : {v.horizon}</span>
                  </div>
                  <div className="ex5-vision-grid">
                    <div>
                      <div className="ex5-evol-label">📖 Ce que c'est</div>
                      <p>{v.desc}</p>
                    </div>
                    <div>
                      <div className="ex5-evol-label">🏋️ Comment je m'y prépare</div>
                      <p>{v.prep}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Personal posture */}
          <div className="ex5-posture-card">
            <div className="ex5-posture-title">🧭 Ma posture face à l'IA</div>
            <div className="ex5-posture-grid">
              {[
                { emoji: "✅", label: "Ce que je fais", items: ["Utiliser l'IA pour accélérer, pas remplacer le raisonnement", "Toujours comprendre ce que l'IA génère avant de merger", "Itérer vite : prompt → test → correction → réutiliser"] },
                { emoji: "❌", label: "Ce que j'évite", items: ["Copier-coller sans lire (code zombie)", "Faire confiance aveuglément aux edge cases générés", "Ignorer les hallucinations sur les dépendances/versions"] },
                { emoji: "🔜", label: "Ce que j'apprends", items: ["LangGraph pour les workflows multi-agents", "Prompt engineering structuré (chain-of-thought, few-shot)", "Évaluation des LLM outputs (evals, regression tests)"] },
              ].map((col) => (
                <div className="ex5-posture-col" key={col.label}>
                  <div className="ex5-posture-col-header">{col.emoji} {col.label}</div>
                  <ul>
                    {col.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
