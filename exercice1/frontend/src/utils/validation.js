/**
 * Client-side validation rules — mirrors the backend constraints.
 *
 * Returns:
 *   errors   — blocking (red)  : must be fixed before submission
 *   warnings — advisory (amber): score will be affected but not blocked
 *   hasErrors — true if any blocking error exists
 */

export function validateTalent(t) {
  const errors = {};
  const warnings = {};

  // ── years_experience — BLOCKING ─────────────────────────────────────────
  const exp = t.years_experience;
  if (exp === "" || exp === null || exp === undefined) {
    errors.years_experience = "L'expérience est requise";
  } else if (Number.isNaN(Number(exp))) {
    errors.years_experience = "Doit être un nombre valide (ex. 3)";
  } else if (Number(exp) < 0) {
    errors.years_experience = "L'expérience ne peut pas être négative";
  }

  // ── skills — WARNING ─────────────────────────────────────────────────────
  if (!(t.skills || "").trim()) {
    warnings.skills = "Sans compétences, le score skills sera 0 (−40 pts)";
  }

  // ── location — WARNING ───────────────────────────────────────────────────
  if (!(t.location || "").trim()) {
    warnings.location = "Localisation manquante — critère ignoré (−20 pts potentiels)";
  }

  // ── job_type — WARNING ───────────────────────────────────────────────────
  if (!(t.job_type || "").trim()) {
    warnings.job_type = "Type de poste manquant — critère ignoré (−10 pts potentiels)";
  }

  return { errors, warnings, hasErrors: Object.keys(errors).length > 0 };
}

export function validateCompany(c) {
  const warnings = {};

  if (!(c.skills_required || "").trim()) {
    warnings.skills_required =
      "Aucune compétence requise — tous les talents seront équivalents sur ce critère";
  }

  return { errors: {}, warnings, hasErrors: false };
}
