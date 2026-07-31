/**
 * Shared types used by both client components and server-side API routes.
 * Keep this file free of "use client" / "use server" directives.
 */

import type { WorkEnv, OrgStructure } from "@/src/lib/formOptions";

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
