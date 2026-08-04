/**
 * Shared types used by both client components and server-side API routes.
 * Keep this file free of "use client" / "use server" directives.
 */

import { ASSESSMENT_IDS, type WorkEnv, type OrgStructure } from "@/src/lib/formOptions";

/** Full payload sent to the AI agent on submit. */
export interface FullAssessmentPayload {
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
  // Additional optional fields
  workEnv: WorkEnv;
  orgStructure: OrgStructure;
  targetEduIndex: number;
  taskDislikes: string[];
  ageRange: string;
  gender: string;
  race: string;
  /** Which optional field blocks are enabled by the user */
  enabledOptional: string[];
  /**
   * Which assessment frameworks (mbti, spark, clifton, bigfive, ennea, disc,
   * zodiac, astro) the user wants factored into their matches. Lets users
   * freely toggle individual assessments on/off without clearing their
   * answers — part of the sandbox "freedom to enable/disable" design.
   */
  enabledAssessments: string[];
}

/**
 * Resolves which assessment framework ids are enabled for a given payload.
 * Only falls back to "everything enabled" when the field is missing
 * entirely (`undefined`/`null` — payloads saved before this field existed).
 * An explicitly empty array means the user deliberately switched every
 * assessment off and must be respected as "zero enabled" — treating it the
 * same as "field never existed" would silently re-enable everything and
 * defeat the "at least one assessment enabled" requirement. Shared by
 * countFilledAssessments and careerAgent.ts's buildUserPrompt so the
 * generation gate and the prompt always agree on what's enabled.
 */
export function getEnabledAssessmentIds(payload: FullAssessmentPayload): Set<string> {
  return new Set(payload.enabledAssessments != null ? payload.enabledAssessments : ASSESSMENT_IDS);
}

/**
 * Counts how many enabled assessment frameworks actually have data filled
 * in. Mirrors the "is this framework included in the prompt" logic in
 * careerAgent.ts's buildUserPrompt, so the client-side gate and the
 * server-side prompt agree on what counts as "filled". Big Five always
 * counts once enabled since its sliders never have an empty state.
 */
export function countFilledAssessments(payload: FullAssessmentPayload): number {
  const enabled = getEnabledAssessmentIds(payload);

  let count = 0;
  if (enabled.has("mbti") && payload.mbtiType) count++;
  if (
    enabled.has("spark") &&
    (payload.primarySpark || payload.secondarySpark || payload.antiSpark)
  ) {
    count++;
  }
  if (enabled.has("clifton") && payload.strengths.some(Boolean)) count++;
  if (enabled.has("bigfive")) count++;
  if (enabled.has("ennea") && payload.enneagramType) count++;
  if (enabled.has("disc") && payload.discStyle) count++;
  if (enabled.has("zodiac") && (payload.zodiacAnimal || payload.zodiacElement)) count++;
  if (enabled.has("astro") && payload.sunSign) count++;

  return count;
}

/** True once the user has at least one enabled, filled-in assessment framework. */
export function hasMinimumAssessments(payload: FullAssessmentPayload): boolean {
  return countFilledAssessments(payload) >= 1;
}
