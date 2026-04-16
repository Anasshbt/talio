import { useState } from "react";
import { rankTalents } from "../api/client.js";
import Modal from "./Modal.jsx";
import { validateTalent, validateCompany } from "../utils/validation.js";

const DEFAULT_COMPANY = {
  skills_required: "",
  experience_level: "",
  location: "",
  job_type: "",
};

const BLANK_TALENT = {
  id: 0,
  name: "",
  skills: "",
  years_experience: "",
  location: "",
  job_type: "",
};

let nextId = 1;

function parseSkills(raw) {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Brand-gradient score bar. */
function ScoreBar({ score }) {
  const pct = Math.round(score * 100);
  return (
    <div className="mini-gauge-track">
      <div className="mini-gauge-fill" style={{ width: `${pct}%` }} />
      <span className="mini-gauge-label">{pct} %</span>
    </div>
  );
}

export default function RankTab() {
  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [talents, setTalents] = useState([
    { ...BLANK_TALENT, id: nextId++ },
    { ...BLANK_TALENT, id: nextId++ },
  ]);
  const [results, setResults] = useState(null);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Per-talent validation map { id → { errors, warnings, hasErrors } }
  const talentValidations = submitted
    ? Object.fromEntries(talents.map((t) => [t.id, validateTalent(t)]))
    : {};
  const companyVal = submitted ? validateCompany(company) : { errors: {}, warnings: {} };

  const hasBlockingErrors =
    submitted &&
    (talents.length === 0 ||
      Object.values(talentValidations).some((v) => v.hasErrors));

  function rowClass(id) {
    if (!submitted) return "talent-row";
    const v = talentValidations[id];
    if (!v) return "talent-row";
    if (v.hasErrors) return "talent-row row-error";
    const hasWarnings = Object.keys(v.warnings).length > 0;
    if (hasWarnings) return "talent-row row-warning";
    return "talent-row row-ok";
  }

  function updateCompany(field, value) {
    setCompany((prev) => ({ ...prev, [field]: value }));
  }
  function updateTalent(id, field, value) {
    setTalents((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }
  function addTalent() {
    setTalents((prev) => [...prev, { ...BLANK_TALENT, id: nextId++ }]);
  }
  function removeTalent(id) {
    setTalents((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);

    // Fresh validation — don't rely on state timing
    const freshTalentVals = talents.map((t) => validateTalent(t));
    const anyErrors = talents.length === 0 || freshTalentVals.some((v) => v.hasErrors);
    if (anyErrors) return;

    setApiError("");
    setResults(null);
    setLoading(true);

    const companyPayload = {
      skills_required: parseSkills(company.skills_required),
      experience_level: company.experience_level || null,
      location: company.location || null,
      job_type: company.job_type || null,
    };

    const talentNames = talents.map((t) => t.name);
    const talentPayloads = talents.map((t) => ({
      skills: parseSkills(t.skills),
      years_experience: Number(t.years_experience),
      location: t.location || null,
      job_type: t.job_type || null,
    }));

    try {
      const data = await rankTalents(companyPayload, talentPayloads);

      const withNames = data.map((entry) => {
        const idx = talentPayloads.findIndex(
          (p) =>
            JSON.stringify(p.skills) === JSON.stringify(entry.talent.skills) &&
            p.years_experience === entry.talent.years_experience &&
            p.location === entry.talent.location &&
            p.job_type === entry.talent.job_type
        );
        return { ...entry, name: idx >= 0 ? talentNames[idx] : "" };
      });

      setResults(withNames);
      setModalOpen(true);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* ── Blocking banner ── */}
      {hasBlockingErrors && (
        <div className="validation-banner validation-banner-error">
          <span className="vb-icon">⛔</span>
          <div>
            <strong>
              {talents.length === 0
                ? "Aucun talent à classer"
                : "Certains talents ont des données invalides"}
            </strong>
            <p>
              {talents.length === 0
                ? "Ajoutez au moins un talent avant de classer."
                : "Corrigez les lignes en rouge pour continuer."}
            </p>
          </div>
        </div>
      )}

      {/* ── Warning banner (no errors but warnings) ── */}
      {submitted && !hasBlockingErrors && Object.values(talentValidations).some(
        (v) => Object.keys(v.warnings).length > 0
      ) && (
        <div className="validation-banner validation-banner-warning">
          <span className="vb-icon">⚠</span>
          <div>
            <strong>Données incomplètes détectées</strong>
            <p>Le classement sera effectué, mais certains critères seront ignorés (lignes en orange).</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Entreprise ── */}
        <section className="form-section full-width">
          <h2 className="section-title">Entreprise</h2>
          <div className="inline-fields">
            <div className="inline-field">
              <label className="field-label">Compétences requises</label>
              <input
                className="field-input"
                value={company.skills_required}
                onChange={(e) => updateCompany("skills_required", e.target.value)}
                placeholder="Python, SQL, …"
              />
              {companyVal.warnings?.skills_required && (
                <p className="field-msg field-msg-warning">
                  ⚠ {companyVal.warnings.skills_required}
                </p>
              )}
            </div>
            <div className="inline-field">
              <label className="field-label">Niveau</label>
              <select
                className="field-input"
                value={company.experience_level}
                onChange={(e) => updateCompany("experience_level", e.target.value)}
              >
                <option value="">— Indifférent —</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="intermediate">Intermediate</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div className="inline-field">
              <label className="field-label">Localisation</label>
              <input
                className="field-input"
                value={company.location}
                onChange={(e) => updateCompany("location", e.target.value)}
                placeholder="Paris"
              />
            </div>
            <div className="inline-field">
              <label className="field-label">Type de poste</label>
              <input
                className="field-input"
                value={company.job_type}
                onChange={(e) => updateCompany("job_type", e.target.value)}
                placeholder="Data Analyst"
              />
            </div>
          </div>
        </section>

        {/* ── Talents ── */}
        <section className="form-section full-width">
          <div className="talents-header">
            <h2 className="section-title">Talents ({talents.length})</h2>
            <button type="button" className="btn-secondary" onClick={addTalent}>
              + Ajouter
            </button>
          </div>

          <div className="talents-list">
            {talents.map((t) => {
              const v = talentValidations[t.id] ?? { errors: {}, warnings: {} };
              const rowErrors = Object.values(v.errors);
              const rowWarnings = Object.values(v.warnings);

              return (
                <div key={t.id}>
                  <div className={rowClass(t.id)}>
                    {/* Row status icon */}
                    {submitted && (
                      <span className="row-status-icon">
                        {v.hasErrors ? "🔴" : Object.keys(v.warnings).length > 0 ? "🟡" : "🟢"}
                      </span>
                    )}

                    <input
                      className={`field-input name-field ${submitted && !t.name.trim() ? "input-warning" : ""}`}
                      placeholder="Nom"
                      value={t.name}
                      onChange={(e) => updateTalent(t.id, "name", e.target.value)}
                    />
                    <input
                      className={`field-input ${submitted && v.warnings?.skills ? "input-warning" : ""}`}
                      placeholder="Compétences"
                      value={t.skills}
                      onChange={(e) => updateTalent(t.id, "skills", e.target.value)}
                    />
                    <input
                      className={`field-input exp-field ${submitted && v.errors?.years_experience ? "input-error" : ""}`}
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="Exp (ans)"
                      value={t.years_experience}
                      onChange={(e) => updateTalent(t.id, "years_experience", e.target.value)}
                    />
                    <input
                      className={`field-input ${submitted && v.warnings?.location ? "input-warning" : ""}`}
                      placeholder="Localisation"
                      value={t.location}
                      onChange={(e) => updateTalent(t.id, "location", e.target.value)}
                    />
                    <input
                      className={`field-input ${submitted && v.warnings?.job_type ? "input-warning" : ""}`}
                      placeholder="Type de poste"
                      value={t.job_type}
                      onChange={(e) => updateTalent(t.id, "job_type", e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeTalent(t.id)}
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </div>

                  {/* Per-row messages — shown only after submit */}
                  {submitted && (rowErrors.length > 0 || rowWarnings.length > 0) && (
                    <div className="talent-row-msgs">
                      {rowErrors.map((msg, i) => (
                        <span key={i} className="row-msg row-msg-error">✕ {msg}</span>
                      ))}
                      {rowWarnings.map((msg, i) => (
                        <span key={i} className="row-msg row-msg-warning">⚠ {msg}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="submit-row">
          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Classement…" : "Classer les talents"}
          </button>
        </div>
      </form>

      {apiError && <div className="error-box">{apiError}</div>}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Classement — ${results?.length ?? 0} talent${results?.length !== 1 ? "s" : ""}`}
      >
        {results && (
          <table className="rank-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Score</th>
                <th>Compétences</th>
                <th>Exp.</th>
                <th>Lieu</th>
                <th>Poste</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr key={idx} className={idx === 0 ? "best-row" : ""}>
                  <td className="td-center rank-num">{idx + 1}</td>
                  <td className="td-bold">{r.name || `Talent ${idx + 1}`}</td>
                  <td style={{ minWidth: 160 }}><ScoreBar score={r.score} /></td>
                  <td>{r.talent.skills?.join(", ")}</td>
                  <td className="td-center">{r.talent.years_experience} ans</td>
                  <td>{r.talent.location ?? "—"}</td>
                  <td>{r.talent.job_type ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}
