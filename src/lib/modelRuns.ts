/**
 * modelRuns.ts
 *
 * Provider metadata + in-memory stores for:
 *   - latest run per AI provider (dashboard comparison)
 *   - results history (every generated run)
 *
 * History is write-through to Supabase `recent_searches`.
 * Model-run comparison map is session memory, rebuilt from history on hydrate.
 */

import type { LLMProvider } from "@/src/lib/careerAgent";
import type { CareerMatch } from "@/src/lib/mockData";
import type { FullAssessmentPayload } from "@/src/lib/types";
import { syncRecentSearchDelete, syncRecentSearchInsert } from "@/src/lib/syncToSupabase";

// ── Provider metadata ───────────────────────────────────────────────────────

export interface ProviderInfo {
  id: LLMProvider;
  /** Full name shown in the model picker dropdown */
  label: string;
  /** Short name shown in the pill / badges */
  short: string;
}

export const PROVIDER_INFO: ProviderInfo[] = [
  { id: "claude", label: "Claude (Anthropic)", short: "Claude" },
  { id: "openai", label: "OpenAI (GPT-4o mini)", short: "GPT-4o mini" },
  { id: "gemini", label: "Gemini (Google AI Studio)", short: "Gemini" },
  { id: "groq", label: "Groq Cloud", short: "Groq" },
  { id: "openrouter", label: "OpenRouter", short: "OpenRouter" },
];

/**
 * Providers that are wired up in this environment's `.env.local` and safe to
 * offer in the Search page's model picker. Claude and OpenAI are still fully
 * supported by the backend agent (see careerAgent.ts) but are commented out
 * in `.env.local` by default — selecting them without a key set causes the
 * /api/careers route to 500. Once ANTHROPIC_API_KEY / OPENAI_API_KEY are
 * uncommented and filled in, add "claude" / "openai" here to surface them.
 */
export const ENABLED_PROVIDERS: LLMProvider[] = ["gemini", "groq", "openrouter"];

/** PROVIDER_INFO filtered down to just the providers safe to show in the UI. */
export const UI_PROVIDER_INFO: ProviderInfo[] = PROVIDER_INFO.filter((p) =>
  ENABLED_PROVIDERS.includes(p.id)
);

export function providerShortLabel(provider: LLMProvider): string {
  return PROVIDER_INFO.find((p) => p.id === provider)?.short ?? provider;
}

export function providerFullLabel(provider: LLMProvider): string {
  return PROVIDER_INFO.find((p) => p.id === provider)?.label ?? provider;
}

// ── Stored run shape ─────────────────────────────────────────────────────────

export interface ModelRun {
  provider: LLMProvider;
  timestamp: number;
  confidencePercent: number;
  activeVariables: string;
  careers: CareerMatch[];
  /** Wall-clock time (ms) the provider took to generate this result, measured server-side. */
  generationTimeMs?: number;
}

/** Human-readable "how long it took" string, e.g. "820ms" or "4.3s". */
export function formatDuration(ms?: number): string {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

type ModelRunMap = Partial<Record<LLMProvider, ModelRun>>;

let memoryModelRuns: ModelRunMap = {};

/** Save (or overwrite) the most recent run for a given provider (session memory). */
export function saveModelRun(run: ModelRun): void {
  memoryModelRuns = { ...memoryModelRuns, [run.provider]: run };
}

/** Get the most recent run for every provider that has one saved. */
export function getModelRuns(): ModelRunMap {
  return { ...memoryModelRuns };
}

/** Remove a single provider's saved run from the comparison panel. */
export function clearModelRun(provider: LLMProvider): void {
  const next = { ...memoryModelRuns };
  delete next[provider];
  memoryModelRuns = next;
}

export function clearModelRuns(): void {
  memoryModelRuns = {};
}

// ── Results history ─────────────────────────────────────────────────────────

export interface ResultsHistoryEntry {
  id: string;
  timestamp: number;
  provider: LLMProvider;
  /** Wall-clock time (ms) the provider took to generate this result. */
  generationTimeMs?: number;
  confidencePercent: number;
  activeVariables: string;
  careers: CareerMatch[];
  /** Full snapshot of the assessment inputs that produced this result. */
  payload: FullAssessmentPayload;
}

const MAX_HISTORY_ENTRIES = 30;

let memoryHistory: ResultsHistoryEntry[] = [];

function rebuildModelRunsFromHistory(entries: ResultsHistoryEntry[]): void {
  const map: ModelRunMap = {};
  // Newest first — first seen per provider wins
  for (const entry of [...entries].sort((a, b) => b.timestamp - a.timestamp)) {
    if (map[entry.provider]) continue;
    map[entry.provider] = {
      provider: entry.provider,
      timestamp: entry.timestamp,
      confidencePercent: entry.confidencePercent,
      activeVariables: entry.activeVariables,
      careers: entry.careers,
      generationTimeMs: entry.generationTimeMs,
    };
  }
  memoryModelRuns = map;
}

/** Save a newly generated result set. Returns the saved entry (with its new id). */
export function saveHistoryEntry(entry: Omit<ResultsHistoryEntry, "id">): ResultsHistoryEntry {
  const saved: ResultsHistoryEntry = {
    ...entry,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `hist-${entry.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
  };
  memoryHistory = [saved, ...memoryHistory].slice(0, MAX_HISTORY_ENTRIES);
  saveModelRun({
    provider: saved.provider,
    timestamp: saved.timestamp,
    confidencePercent: saved.confidencePercent,
    activeVariables: saved.activeVariables,
    careers: saved.careers,
    generationTimeMs: saved.generationTimeMs,
  });
  void syncRecentSearchInsert(saved);
  return saved;
}

/** All saved history entries, most recent first. */
export function getHistoryEntries(): ResultsHistoryEntry[] {
  return [...memoryHistory].sort((a, b) => b.timestamp - a.timestamp);
}

/** Look up a single history entry by id (used to re-open a past result set). */
export function getHistoryEntry(id: string): ResultsHistoryEntry | undefined {
  return memoryHistory.find((e) => e.id === id);
}

/** Remove a single history entry. */
export function deleteHistoryEntry(id: string): void {
  memoryHistory = memoryHistory.filter((e) => e.id !== id);
  rebuildModelRunsFromHistory(memoryHistory);
  void syncRecentSearchDelete(id);
}

/** Replace history from Supabase hydrate. Does not re-sync. */
export function replaceHistoryEntries(entries: ResultsHistoryEntry[]): void {
  memoryHistory = entries.slice(0, MAX_HISTORY_ENTRIES);
  rebuildModelRunsFromHistory(memoryHistory);
}

/** Clear memory (sign-out). */
export function clearHistoryEntries(): void {
  memoryHistory = [];
  memoryModelRuns = {};
}

/** The top-scoring recommended career in a given entry, if any. */
export function topRecommendedCareer(entry: Pick<ResultsHistoryEntry, "careers">): CareerMatch | undefined {
  return [...entry.careers]
    .filter((c) => c.status === "recommended")
    .sort((a, b) => b.matchPercent - a.matchPercent)[0];
}
