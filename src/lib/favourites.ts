/**
 * favourites.ts
 *
 * In-memory favourites store with Supabase write-through.
 * Populated on login via loadFromSupabase; cleared on sign-out.
 */

import type { CareerMatch } from "@/src/lib/mockData";
import { syncFavouriteDelete, syncFavouriteUpsert } from "@/src/lib/syncToSupabase";

export interface FavouriteCareer {
  career: CareerMatch;
  /** When this career was (most recently) favourited. */
  savedAt: number;
}

const MAX_FAVOURITES = 100;

type FavouriteStore = Record<string, FavouriteCareer>;

let memoryStore: FavouriteStore = {};

function trimStore(store: FavouriteStore): FavouriteStore {
  const trimmed = Object.values(store)
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, MAX_FAVOURITES);
  return Object.fromEntries(trimmed.map((f) => [f.career.id, f]));
}

/** All favourited careers, most recently favourited first. */
export function getFavourites(): FavouriteCareer[] {
  return Object.values(memoryStore).sort((a, b) => b.savedAt - a.savedAt);
}

/** Just the ids — handy for checking "is this card starred?" without the full payload. */
export function getFavouriteIds(): Set<string> {
  return new Set(Object.keys(memoryStore));
}

export function isFavourited(id: string): boolean {
  return id in memoryStore;
}

export function addFavourite(career: CareerMatch): void {
  const savedAt = Date.now();
  memoryStore = trimStore({
    ...memoryStore,
    [career.id]: { career, savedAt },
  });
  void syncFavouriteUpsert(career, savedAt);
}

export function removeFavourite(id: string): void {
  const next = { ...memoryStore };
  delete next[id];
  memoryStore = next;
  void syncFavouriteDelete(id);
}

/** Toggle a career's favourite status. Returns the new state (true = now favourited). */
export function toggleFavourite(career: CareerMatch): boolean {
  if (memoryStore[career.id]) {
    removeFavourite(career.id);
    return false;
  }
  addFavourite(career);
  return true;
}

/** Replace the entire store (hydrate from Supabase). Does not re-sync. */
export function replaceFavourites(entries: FavouriteCareer[]): void {
  memoryStore = trimStore(
    Object.fromEntries(entries.map((f) => [f.career.id, f]))
  );
}

/** Clear memory (sign-out). */
export function clearFavourites(): void {
  memoryStore = {};
}
