/**
 * favourites.ts
 *
 * Shared, localStorage-backed store of favourited careers. Starring a
 * career on the Search page (via the star icon on any result card)
 * persists the full career snapshot here; the Dashboard's "Favourited
 * Career Paths" section reads from the same store, so what you actually
 * star is what shows up there — no more disconnected mock data.
 */

import type { CareerMatch } from "@/src/lib/mockData";

export interface FavouriteCareer {
  career: CareerMatch;
  /** When this career was (most recently) favourited. */
  savedAt: number;
}

const STORAGE_KEY = "career-e:favourites";
/** Cap how many favourites we keep so localStorage doesn't grow unbounded. */
const MAX_FAVOURITES = 100;

type FavouriteStore = Record<string, FavouriteCareer>;

function readStore(): FavouriteStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as FavouriteStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: FavouriteStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full/unavailable — favouriting just won't persist this change.
  }
}

/** All favourited careers, most recently favourited first. */
export function getFavourites(): FavouriteCareer[] {
  return Object.values(readStore()).sort((a, b) => b.savedAt - a.savedAt);
}

/** Just the ids — handy for checking "is this card starred?" without the full payload. */
export function getFavouriteIds(): Set<string> {
  return new Set(Object.keys(readStore()));
}

export function isFavourited(id: string): boolean {
  return id in readStore();
}

export function addFavourite(career: CareerMatch): void {
  const store = readStore();
  store[career.id] = { career, savedAt: Date.now() };
  const trimmed = Object.values(store)
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, MAX_FAVOURITES);
  writeStore(Object.fromEntries(trimmed.map((f) => [f.career.id, f])));
}

export function removeFavourite(id: string): void {
  const store = readStore();
  delete store[id];
  writeStore(store);
}

/** Toggle a career's favourite status. Returns the new state (true = now favourited). */
export function toggleFavourite(career: CareerMatch): boolean {
  const store = readStore();
  if (store[career.id]) {
    delete store[career.id];
    writeStore(store);
    return false;
  }
  addFavourite(career);
  return true;
}
