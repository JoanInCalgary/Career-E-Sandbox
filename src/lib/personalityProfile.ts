/**
 * personalityProfile.ts
 *
 * Shared, localStorage-backed personality profile. This is the single
 * source of truth for the "core" assessment fields that appear in both:
 *   - the Search page's floating generate bar (AssessmentForm, sidebar layout)
 *   - the Dashboard's "Your Personality Profile" box (editable in place)
 *
 * Editing the profile from either surface persists here, so the other
 * surface picks up the change the next time it mounts.
 */

import type { WorkEnv, OrgStructure } from "@/src/lib/formOptions";

export interface PersonalityProfile {
  // MBTI
  mbtiType: string;
  variant: "A" | "T" | "";
  // Sparketype
  primarySpark: string;
  secondarySpark: string;
  antiSpark: string;
  // CliftonStrengths (top 5, may contain empty strings)
  strengths: string[];
  // Big Five (0-100 each)
  bigFive: { O: number; C: number; E: number; A: number; N: number };
  // Enneagram
  enneagramType: string;
  // DiSC
  discStyle: string;
  // Chinese Zodiac
  zodiacAnimal: string;
  zodiacElement: string;
  // Astrology
  sunSign: string;
  // Preferences
  workEnv: WorkEnv;
  orgStructure: OrgStructure;
  targetEduIndex: number;
  taskDislikes: string[];
}

/** First-run defaults — mirrors the values previously hardcoded as mock data. */
export const DEFAULT_PERSONALITY_PROFILE: PersonalityProfile = {
  mbtiType: "INTJ",
  variant: "A",
  primarySpark: "Maven",
  secondarySpark: "Sage",
  antiSpark: "Advisor",
  strengths: ["Strategic", "Learner", "Analytical", "Ideation", ""],
  bigFive: { O: 65, C: 70, E: 30, A: 55, N: 40 },
  enneagramType: "Type 5 — Investigator",
  discStyle: "Conscientiousness (C)",
  zodiacAnimal: "Dragon",
  zodiacElement: "Water",
  sunSign: "Scorpio",
  workEnv: "Fully Remote",
  orgStructure: "Hierarchical",
  targetEduIndex: 3,
  taskDislikes: ["Cold Outreach / Sales", "Repetitive Manual Tasks"],
};

const STORAGE_KEY = "career-e:personality-profile";

/** Read the persisted profile, falling back to defaults for missing/invalid fields. */
export function getPersonalityProfile(): PersonalityProfile {
  if (typeof window === "undefined") return DEFAULT_PERSONALITY_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PERSONALITY_PROFILE;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_PERSONALITY_PROFILE;
    return {
      ...DEFAULT_PERSONALITY_PROFILE,
      ...parsed,
      bigFive: { ...DEFAULT_PERSONALITY_PROFILE.bigFive, ...(parsed.bigFive ?? {}) },
    };
  } catch {
    return DEFAULT_PERSONALITY_PROFILE;
  }
}

/** Persist the full profile. Called whenever either surface edits it. */
export function savePersonalityProfile(profile: PersonalityProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage full/unavailable — edits just won't persist across sessions.
  }
}
