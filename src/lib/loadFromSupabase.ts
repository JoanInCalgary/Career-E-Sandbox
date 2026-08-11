/**
 * Load the signed-in user's Supabase rows into in-memory stores so Dashboard /
 * Search match the DB (especially the seeded tester account).
 */

import { createClient } from "@/src/lib/supabase/client";
import { replaceFavourites, type FavouriteCareer } from "@/src/lib/favourites";
import { replaceHistoryEntries, type ResultsHistoryEntry } from "@/src/lib/modelRuns";
import type { LLMProvider } from "@/src/lib/careerAgent";
import {
  replacePersonalityProfile,
  type PersonalityProfile,
} from "@/src/lib/personalityProfile";
import { ASSESSMENT_IDS } from "@/src/lib/formOptions";
import type { FullAssessmentPayload } from "@/src/lib/types";
import type { CareerMatch } from "@/src/lib/mockData";

function payloadToPersonality(
  payload: FullAssessmentPayload | PersonalityProfile
): PersonalityProfile {
  return {
    mbtiType: payload.mbtiType ?? "",
    variant: (payload.variant as PersonalityProfile["variant"]) ?? "",
    primarySpark: payload.primarySpark ?? "",
    secondarySpark: payload.secondarySpark ?? "",
    antiSpark: payload.antiSpark ?? "",
    strengths: payload.strengths?.length ? payload.strengths : ["", "", "", "", ""],
    bigFive: payload.bigFive ?? { O: 50, C: 50, E: 50, A: 50, N: 50 },
    enneagramType: payload.enneagramType ?? "",
    discStyle: payload.discStyle ?? "",
    zodiacAnimal: payload.zodiacAnimal ?? "",
    zodiacElement: payload.zodiacElement ?? "",
    sunSign: payload.sunSign ?? "",
    workEnv: payload.workEnv ?? "Fully Remote",
    orgStructure: payload.orgStructure ?? "Hierarchical",
    targetEduIndex: payload.targetEduIndex ?? 0,
    taskDislikes: payload.taskDislikes ?? [],
    ageRange: payload.ageRange ?? "",
    gender: payload.gender ?? "",
    race: payload.race ?? "",
    optionalEnabled:
      "optionalEnabled" in payload
        ? payload.optionalEnabled ?? []
        : (payload as FullAssessmentPayload).enabledOptional ?? [],
    // Same field name on both FullAssessmentPayload and PersonalityProfile —
    // falls back to "everything on" for rows saved before this existed.
    enabledAssessments: payload.enabledAssessments ?? [...ASSESSMENT_IDS],
  };
}

export async function loadFromSupabase(
  profile: FullAssessmentPayload | null
): Promise<void> {
  if (typeof window === "undefined") return;

  if (profile) {
    replacePersonalityProfile(payloadToPersonality(profile));
  }

  const supabase = createClient();

  const { data: favRows } = await supabase
    .from("favourites")
    .select("career_id, career, saved_at")
    .order("saved_at", { ascending: false });

  if (favRows) {
    const entries: FavouriteCareer[] = favRows.map((row) => ({
      career: row.career as CareerMatch,
      savedAt: new Date(row.saved_at as string).getTime(),
    }));
    replaceFavourites(entries);
  } else {
    replaceFavourites([]);
  }

  const { data: searchRows } = await supabase
    .from("recent_searches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  if (searchRows) {
    const entries: ResultsHistoryEntry[] = searchRows.map((row) => ({
      id: row.id as string,
      timestamp: new Date(row.created_at as string).getTime(),
      provider: (row.provider as LLMProvider) ?? "gemini",
      generationTimeMs: row.generation_time_ms ?? undefined,
      confidencePercent: row.confidence_percent ?? 0,
      activeVariables: row.active_variables ?? "",
      careers: (row.careers as CareerMatch[]) ?? [],
      payload: (row.payload as FullAssessmentPayload) ?? ({} as FullAssessmentPayload),
    }));
    replaceHistoryEntries(entries);
  } else {
    replaceHistoryEntries([]);
  }
}
