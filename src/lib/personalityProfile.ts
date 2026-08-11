/**
 * personalityProfile.ts
 *
 * In-memory personality profile for the assessment UI, synced to Supabase.
 * Populated on login via loadFromSupabase; cleared on sign-out.
 */

import { ASSESSMENT_IDS, type WorkEnv, type OrgStructure } from "@/src/lib/formOptions";
import { syncPersonalityDebounced } from "@/src/lib/syncToSupabase";

export interface PersonalityProfile {
  mbtiType: string;
  variant: "A" | "T" | "";
  primarySpark: string;
  secondarySpark: string;
  antiSpark: string;
  strengths: string[];
  bigFive: { O: number; C: number; E: number; A: number; N: number };
  enneagramType: string;
  discStyle: string;
  zodiacAnimal: string;
  zodiacElement: string;
  sunSign: string;
  workEnv: WorkEnv;
  orgStructure: OrgStructure;
  targetEduIndex: number;
  taskDislikes: string[];
  ageRange: string;
  gender: string;
  race: string;
  /**
   * Which optional preference fields the user has actually opted into (ids:
   * "workEnv", "orgStructure", "targetEdu", "taskDislikes", "demoAge",
   * "demoGender", "demoRace"). workEnv/orgStructure/targetEduIndex always
   * hold *something* so the picker UI has a starting position, but that
   * value should only be treated as a real preference — shown on the
   * Dashboard, sent to the AI agent — when its id is present here. Without
   * this, an untouched default (e.g. "Fully Remote") is indistinguishable
   * from a value the user actually chose.
   */
  optionalEnabled: string[];
  /**
   * Which assessment frameworks (mbti, spark, clifton, bigfive, ennea, disc,
   * zodiac, astro) the user has switched on, persisted the same way as
   * optionalEnabled so a user's toggles survive across sessions/windows
   * instead of resetting to "everything checked" on every load.
   */
  enabledAssessments: string[];
}

/** Empty MVP defaults — no preloaded demo personality. */
export const EMPTY_PERSONALITY_PROFILE: PersonalityProfile = {
  mbtiType: "",
  variant: "",
  primarySpark: "",
  secondarySpark: "",
  antiSpark: "",
  strengths: ["", "", "", "", ""],
  bigFive: { O: 50, C: 50, E: 50, A: 50, N: 50 },
  enneagramType: "",
  discStyle: "",
  zodiacAnimal: "",
  zodiacElement: "",
  sunSign: "",
  workEnv: "Fully Remote",
  orgStructure: "Hierarchical",
  targetEduIndex: 0,
  taskDislikes: [],
  ageRange: "",
  gender: "",
  race: "",
  optionalEnabled: [],
  enabledAssessments: [...ASSESSMENT_IDS],
};

/** @deprecated Use EMPTY_PERSONALITY_PROFILE — kept as alias for older imports. */
export const DEFAULT_PERSONALITY_PROFILE = EMPTY_PERSONALITY_PROFILE;

function cloneProfile(profile: PersonalityProfile): PersonalityProfile {
  return {
    ...profile,
    strengths: [...profile.strengths],
    bigFive: { ...profile.bigFive },
    taskDislikes: [...profile.taskDislikes],
    optionalEnabled: [...(profile.optionalEnabled ?? [])],
    // Older stored profiles (saved before this field existed) won't have it —
    // default to "everything on" so nothing regresses for them.
    enabledAssessments: [...(profile.enabledAssessments ?? ASSESSMENT_IDS)],
  };
}

let memoryProfile: PersonalityProfile = cloneProfile(EMPTY_PERSONALITY_PROFILE);

/** Read the in-memory profile (hydrated from Supabase after login). */
export function getPersonalityProfile(): PersonalityProfile {
  return cloneProfile(memoryProfile);
}

/** Persist in memory and (by default) sync to Supabase. */
export function savePersonalityProfile(
  profile: PersonalityProfile,
  options?: { sync?: boolean }
): void {
  memoryProfile = cloneProfile(profile);
  if (options?.sync !== false) {
    syncPersonalityDebounced(profile);
  }
}

/** Replace memory from hydrate. Does not re-sync. */
export function replacePersonalityProfile(profile: PersonalityProfile): void {
  memoryProfile = cloneProfile(profile);
}

/** Clear memory (sign-out). */
export function clearPersonalityProfile(): void {
  memoryProfile = cloneProfile(EMPTY_PERSONALITY_PROFILE);
}
