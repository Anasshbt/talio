/**
 * Score gauge with Talio brand gradient + breakdown details.
 * Logic (scoring values) unchanged — only visual presentation updated.
 */
export default function ScoreDisplay({ score, breakdown }) {
  const pct = Math.round(score * 100);

  const label =
    pct >= 80 ? "Excellent" :
    pct >= 60 ? "Bon" :
    pct >= 40 ? "Moyen" :
                "Faible";

  const WEIGHT_LABELS = {
    skills:     { label: "Compétences",  weight: "40 %" },
    experience: { label: "Expérience",   weight: "30 %" },
    location:   { label: "Localisation", weight: "20 %" },
    job_type:   { label: "Type de poste",weight: "10 %" },
  };

  // Badge palette — brand-aligned, not aggressive
  function badgeStyle(val) {
    if (val >= 0.8) return { background: "#EEF2FF", color: "#4338CA" };
    if (val >= 0.5) return { background: "#FDF4FF", color: "#7C3AED" };
    return             { background: "#FFF5F5", color: "#C53030" };
  }

  return (
    <div className="score-card">

      {/* Big score — gradient text via CSS class */}
      <div className="score-value">
        {pct}<span className="score-unit">%</span>
      </div>
      <div className="score-label">{label}</div>

      {/* Gradient gauge bar — width driven by score */}
      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${pct}%` }} />
      </div>

      {breakdown && (
        <table className="breakdown-table">
          <thead>
            <tr>
              <th>Critère</th>
              <th>Poids</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(breakdown).map(([key, val]) => {
              const meta = WEIGHT_LABELS[key] ?? { label: key, weight: "—" };
              const bPct = Math.round(val * 100);
              return (
                <tr key={key}>
                  <td>{meta.label}</td>
                  <td className="td-center">{meta.weight}</td>
                  <td className="td-center">
                    <span className="badge" style={badgeStyle(val)}>
                      {bPct} %
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
