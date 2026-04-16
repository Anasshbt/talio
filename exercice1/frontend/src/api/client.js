const BASE = "";  // proxied by Vite to http://localhost:8000

async function request(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Unexpected error");
  }

  return res.json();
}

/**
 * POST /match
 * @param {{ skills: string[], years_experience: number, location: string, job_type: string }} talent
 * @param {{ skills_required: string[], experience_level: string, location: string, job_type: string }} company
 * @returns {Promise<{ score: number, breakdown: Record<string, number> }>}
 */
export function matchTalent(talent, company) {
  return request("/match", { talent, company });
}

/**
 * POST /rank
 * @param {{ skills_required: string[], experience_level: string, location: string, job_type: string }} company
 * @param {Array} talents
 * @returns {Promise<Array<{ talent: object, score: number }>>}
 */
export function rankTalents(company, talents) {
  return request("/rank", { company, talents });
}
