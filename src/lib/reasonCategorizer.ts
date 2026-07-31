/**
 * reasonCategorizer.ts
 *
 * Splits a career card's free-text pros/cons into two buckets so the UI can
 * show users which reasons trace back to their personality *assessments*
 * (MBTI, Big Five, Sparketype, etc.) versus their *preferences* (work
 * environment, education anchor, task dislikes, compensation, schedule).
 *
 * This is a lightweight keyword heuristic rather than a structured field on
 * CareerMatch, so it works for both the static mock data and any live AI
 * provider response without requiring a schema change or hand-tagging every
 * mock entry.
 */

const PREFERENCE_KEYWORDS = [
  "remote",
  "hybrid",
  "in-person",
  "in-office",
  "on-site",
  "onsite",
  "in-store",
  "office",
  "salary",
  "compensation",
  "income",
  " pay",
  "commission",
  "wage",
  "education",
  "degree",
  "phd",
  " ms ",
  "bachelor",
  "master",
  "credential",
  "certificat",
  "license",
  "licens",
  "diploma",
  "schedule",
  "shift",
  "travel",
  "hours",
  "deadline",
  "on-call",
  "overtime",
  "outdoor",
  "physical",
];

export interface CategorizedReasons {
  assessment: string[];
  preference: string[];
}

export function categorizeReasons(items: string[]): CategorizedReasons {
  const assessment: string[] = [];
  const preference: string[] = [];
  for (const item of items) {
    const lower = ` ${item.toLowerCase()} `;
    const isPreference = PREFERENCE_KEYWORDS.some((kw) => lower.includes(kw));
    (isPreference ? preference : assessment).push(item);
  }
  return { assessment, preference };
}
