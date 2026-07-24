/**
 * Push UI mutations to Supabase (RLS-scoped to the signed-in user).
 * In-memory stores are updated by the callers; these keep the DB in sync.
 */

import { createClient } from "@/src/lib/supabase/client";
import type { CareerMatch } from "@/src/lib/mockData";
import type { PersonalityProfile } from "@/src/lib/personalityProfile";
import type { ResultsHistoryEntry } from "@/src/lib/modelRuns";

async function currentUserId(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function syncFavouriteUpsert(career: CareerMatch, savedAt: number): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const supabase = createClient();
  const { error } = await supabase.from("favourites").upsert(
    {
      user_id: userId,
      career_id: career.id,
      career,
      saved_at: new Date(savedAt).toISOString(),
    },
    { onConflict: "user_id,career_id" }
  );
  if (error) console.error("[sync] favourite upsert:", error.message);
}

export async function syncFavouriteDelete(careerId: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const supabase = createClient();
  const { error } = await supabase
    .from("favourites")
    .delete()
    .eq("user_id", userId)
    .eq("career_id", careerId);
  if (error) console.error("[sync] favourite delete:", error.message);
}

export async function syncRecentSearchInsert(entry: ResultsHistoryEntry): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const supabase = createClient();
  const { error } = await supabase.from("recent_searches").upsert({
    id: entry.id,
    user_id: userId,
    created_at: new Date(entry.timestamp).toISOString(),
    provider: entry.provider,
    confidence_percent: entry.confidencePercent,
    active_variables: entry.activeVariables,
    generation_time_ms: entry.generationTimeMs ?? null,
    careers: entry.careers,
    payload: entry.payload,
  });
  if (error) console.error("[sync] recent_searches insert:", error.message);
}

export async function syncRecentSearchDelete(id: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const supabase = createClient();
  const { error } = await supabase.from("recent_searches").delete().eq("id", id).eq("user_id", userId);
  if (error) console.error("[sync] recent_searches delete:", error.message);
}

let personalityTimer: ReturnType<typeof setTimeout> | null = null;

export async function syncPersonalityNow(profile: PersonalityProfile): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const supabase = createClient();
  const { error } = await supabase.from("personality").upsert({
    user_id: userId,
    profile,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("[sync] personality upsert:", error.message);
}

/** Debounce rapid AssessmentForm / dashboard edits. */
export function syncPersonalityDebounced(profile: PersonalityProfile, delayMs = 600): void {
  if (typeof window === "undefined") return;
  if (personalityTimer) clearTimeout(personalityTimer);
  personalityTimer = setTimeout(() => {
    void syncPersonalityNow(profile);
  }, delayMs);
}
