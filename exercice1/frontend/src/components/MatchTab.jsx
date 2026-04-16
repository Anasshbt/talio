import { useState } from "react";
import { matchTalent } from "../api/client.js";
import Modal from "./Modal.jsx";
import ScoreDisplay from "./ScoreDisplay.jsx";
import { validateTalent, validateCompany } from "../utils/validation.js";

const DEFAULT_TALENT = {
  skills: "",
  years_experience: "",
  location: "",
  job_type: "",
};

const DEFAULT_COMPANY = {
  skills_required: "",
  experience_level: "",
  location: "",
  job_type: "",
};

function parseSkills(raw) {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Inline message under a field — red for error, amber for warning. */
function FieldMsg({ msg, type }) {
  if (!msg) return null;
  return (
    <p className={`field-msg field-msg-${type}`}>
      {type === "error" ? "✕" : "⚠"} {msg}
    </p>
  );
}

export default function MatchTab() {
  const [talent, setTalent] = useState(DEFAULT_TALENT);
  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // validation is shown only after first submit attempt, then live
  const [submitted, setSubmitted] = useState(false);

  const tVal = submitted ? validateTalent(talent) : { errors: {}, warnings: {} };
  const cVal = submitted ? validateCompany(company) : { errors: {}, warnings: {} };
  const hasBlockingErrors = submitted && tVal.hasErrors;

  function ic(field, val) {
    if (val.errors?.[field]) return "field-input input-error";
    if (val.warnings?.[field]) return "field-input input-warning";
    return "field-input";
  }

  function updateTalent(field, value) {
    setTalent((prev) => ({ ...prev, [field]: value }));
  }
  function updateCompany(field, value) {
    setCompany((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);

    // fresh validation — not from state (avoids async timing issue)
    const freshTVal = validateTalent(talent);
    if (freshTVal.hasErrors) return; // block — show errors, don't call API

    setApiError("");
    setResult(null);
    setLoading(true);

    try {
      const data = await matchTalent(
        {
          skills: parseSkills(talent.skills),
          years_experience: Number(talent.years_experience),
          location: talent.location || null,
          job_type: talent.job_type || null,
        },
        {
          skills_required: parseSkills(company.skills_required),
          experience_level: company.experience_level || null,
          location: company.location || null,
          job_type: company.job_type || null,
        }
      );
      setResult(data);
      setModalOpen(true);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* ── Blocking error banner ── */}
      {hasBlockingErrors && (
        <div className="validation-banner validation-banner-error">
          <span className="vb-icon">⛔</span>
          <div>
            <strong>Champs requis manquants</strong>
            <p>Corrigez les champs en rouge pour pouvoir calculer le score.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">

          {/* ── Talent ── */}
          <section className="form-section">
            <h2 className="section-title">Talent</h2>

            <label className="field-label">
              Compétences <span className="hint">(séparées par des virgules)</span>
            </label>
            <input
              className={ic("skills", tVal)}
              value={talent.skills}
              onChange={(e) => updateTalent("skills", e.target.value)}
              placeholder="ex. Python, SQL, Spark"
            />
            <FieldMsg msg={tVal.warnings?.skills} type="warning" />

            <label className="field-label">Années d'expérience</label>
            <input
              className={ic("years_experience", tVal)}
              type="number"
              min="0"
              step="0.5"
              value={talent.years_experience}
              onChange={(e) => updateTalent("years_experience", e.target.value)}
              placeholder="ex. 2"
            />
            <FieldMsg msg={tVal.errors?.years_experience} type="error" />

            <label className="field-label">Localisation</label>
            <input
              className={ic("location", tVal)}
              value={talent.location}
              onChange={(e) => updateTalent("location", e.target.value)}
              placeholder="ex. Paris"
            />
            <FieldMsg msg={tVal.warnings?.location} type="warning" />

            <label className="field-label">Type de poste</label>
            <input
              className={ic("job_type", tVal)}
              value={talent.job_type}
              onChange={(e) => updateTalent("job_type", e.target.value)}
              placeholder="ex. Data Analyst"
            />
            <FieldMsg msg={tVal.warnings?.job_type} type="warning" />
          </section>

          {/* ── Entreprise ── */}
          <section className="form-section">
            <h2 className="section-title">Entreprise</h2>

            <label className="field-label">
              Compétences requises <span className="hint">(séparées par des virgules)</span>
            </label>
            <input
              className={ic("skills_required", cVal)}
              value={company.skills_required}
              onChange={(e) => updateCompany("skills_required", e.target.value)}
              placeholder="ex. Python, SQL"
            />
            <FieldMsg msg={cVal.warnings?.skills_required} type="warning" />

            <label className="field-label">Niveau d'expérience</label>
            <select
              className="field-input"
              value={company.experience_level}
              onChange={(e) => updateCompany("experience_level", e.target.value)}
            >
              <option value="">— Indifférent —</option>
              <option value="junior">Junior (0-2 ans)</option>
              <option value="mid">Mid (3-5 ans)</option>
              <option value="intermediate">Intermediate (3-5 ans)</option>
              <option value="senior">Senior (6+ ans)</option>
              <option value="lead">Lead (8+ ans)</option>
              <option value="expert">Expert (10+ ans)</option>
            </select>

            <label className="field-label">Localisation</label>
            <input
              className="field-input"
              value={company.location}
              onChange={(e) => updateCompany("location", e.target.value)}
              placeholder="ex. Paris"
            />

            <label className="field-label">Type de poste</label>
            <input
              className="field-input"
              value={company.job_type}
              onChange={(e) => updateCompany("job_type", e.target.value)}
              placeholder="ex. Data Analyst"
            />
          </section>
        </div>

        <div className="submit-row">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Calcul…" : "Calculer le score"}
          </button>
        </div>
      </form>

      {apiError && <div className="error-box">{apiError}</div>}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Résultat du matching"
      >
        {result && (
          <ScoreDisplay score={result.score} breakdown={result.breakdown} />
        )}
      </Modal>
    </div>
  );
}
