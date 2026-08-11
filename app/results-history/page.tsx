"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ClockCounterClockwise, ShareNetwork, Trash } from "@phosphor-icons/react";
import AppNav from "@/src/components/AppNav";
import RequireAuth from "@/src/components/RequireAuth";
import { LeaderboardRow, computeLeaderboardFill } from "@/src/components/CareerCards";
import { EDU_TARGET_LABELS } from "@/src/lib/formOptions";
import { getEnabledAssessmentIds } from "@/src/lib/types";
import {
  deleteHistoryEntry,
  formatDuration,
  getHistoryEntries,
  providerFullLabel,
  topRecommendedCareers,
  type ResultsHistoryEntry,
} from "@/src/lib/modelRuns";
import type { CareerMatch } from "@/src/lib/mockData";
import { getFavouriteIds, toggleFavourite as toggleFavouriteInStore } from "@/src/lib/favourites";

/** Most recent entries always shown; older entries only surface if they
 * contain a career the user has favourited. */
const RECENT_ENTRIES_LIMIT = 5;

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconTrash({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return <Trash weight="bold" className={className} />;
}

function IconClock({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return <Clock weight="bold" className={className} />;
}

function IconHistory() {
  return <ClockCounterClockwise weight="light" className="w-5 h-5 text-[#888888]" />;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimestamp(ts: number): { date: string; time: string } {
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ResultsHistoryPage() {
  return (
    <RequireAuth active="results-history">
      <ResultsHistoryContent />
    </RequireAuth>
  );
}

function ResultsHistoryContent() {
  const [entries, setEntries] = useState<ResultsHistoryEntry[]>([]);
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(getHistoryEntries());
    setFavouriteIds(getFavouriteIds());
    setHydrated(true);
  }, []);

  function handleDelete(id: string) {
    deleteHistoryEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setConfirmingId(null);
  }

  /** Stars/unstars a career shown in one entry's Top 5 list, persisting to
   * the shared favourites store (so it shows up on the Dashboard too). */
  function toggleFavourite(careers: CareerMatch[], id: string) {
    const career = careers.find((c) => c.id === id);
    if (!career) return;
    const nowFavourited = toggleFavouriteInStore(career);
    setFavouriteIds((prev) => {
      const next = new Set(prev);
      if (nowFavourited) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  // Most recent 10 always show; older entries only stick around here if one
  // of their careers was favourited (so a saved result is never orphaned
  // from the search that produced it).
  const recentIds = new Set(entries.slice(0, RECENT_ENTRIES_LIMIT).map((e) => e.id));
  const visibleEntries = entries.filter(
    (e) => recentIds.has(e.id) || e.careers.some((c) => favouriteIds.has(c.id))
  );
  const hasOlderFavouritedEntries = visibleEntries.length > entries.slice(0, RECENT_ENTRIES_LIMIT).length;

  return (
    <div className="min-h-screen bg-cream">
      <AppNav active="results-history" />
      <main className="max-w-4xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#111111] tracking-tight">Results History</h1>
          <p className="text-sm md:text-base text-[#555555] mt-2">
            Review your previous career trajectory calculations, including which AI model generated each one and
            how long it took.
          </p>
          {hydrated && entries.length > 0 && (
            <p className="text-xs text-[#888888] mt-1">
              Showing your {Math.min(entries.length, RECENT_ENTRIES_LIMIT)} most recent searches
              {hasOlderFavouritedEntries ? ", plus older ones with a favourited result." : "."}
            </p>
          )}
        </div>

        {!hydrated ? null : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-cream rounded-xl border border-[#E8E8E8]">
            <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-3">
              <IconHistory />
            </div>
            <p className="text-sm font-semibold text-[#111111] mb-1">No searches yet</p>
            <p className="text-xs text-[#888888] mb-5 max-w-xs">
              Generate results on the Search page and they will show up here, so you can look back and compare
              runs across models.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-[#FF5500] hover:bg-[#DD4400] transition-colors text-white font-semibold text-sm px-5 py-2.5 rounded-lg"
            >
              Run New Search
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {visibleEntries.map((entry) => {
              const { date, time } = formatTimestamp(entry.timestamp);
              const topFive = topRecommendedCareers(entry, 5);
              const topFiveFill = computeLeaderboardFill(topFive);
              const eduLabel = EDU_TARGET_LABELS[entry.payload.targetEduIndex] ?? "—";
              const isConfirming = confirmingId === entry.id;
              // Only show assessment frameworks / preferences the user had
              // actually switched on for this search — not every field the
              // payload happens to carry a value for.
              const enabledAssessments = getEnabledAssessmentIds(entry.payload);
              const enabledOptional = new Set(entry.payload.enabledOptional ?? []);
              const sparkSummary =
                entry.payload.primarySpark || entry.payload.secondarySpark || entry.payload.antiSpark
                  ? `${entry.payload.primarySpark || "—"} · ${entry.payload.secondarySpark || "—"} · Anti: ${
                      entry.payload.antiSpark || "—"
                    }`
                  : "—";
              const cliftonSummary = entry.payload.strengths.filter(Boolean).join(", ") || "—";
              const bigFiveSummary = entry.payload.bigFive
                ? `O:${entry.payload.bigFive.O} C:${entry.payload.bigFive.C} E:${entry.payload.bigFive.E} A:${entry.payload.bigFive.A} N:${entry.payload.bigFive.N}`
                : "—";
              const zodiacSummary =
                entry.payload.zodiacAnimal || entry.payload.zodiacElement
                  ? `${entry.payload.zodiacAnimal || "—"} — ${entry.payload.zodiacElement || "—"}`
                  : "—";

              return (
                <div
                  key={entry.id}
                  className="bg-cream rounded-xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 hover:shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow"
                >
                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-bold text-[#888888] uppercase tracking-widest">
                        {date} · {time}
                      </span>
                      {topFive[0] && (
                        <span className="px-2.5 py-1 rounded-full bg-[#FDECD8] text-[#FF5500] text-xs font-bold">
                          {topFive[0].matchPercent}% Top Match
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full bg-[#fdf9f8] border border-[#E8E8E8] text-[#555555] text-xs font-semibold">
                        {entry.confidencePercent}% confidence
                      </span>
                      <span
                        title="How long this model took to generate this result set"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F5F5F5] border border-[#E8E8E8] text-[#555555] text-xs font-semibold"
                      >
                        <IconClock className="w-3 h-3" />
                        {formatDuration(entry.generationTimeMs)}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-[#EFF4FF] text-[#0055FF] text-xs font-semibold">
                        {providerFullLabel(entry.provider)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {isConfirming ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            className="inline-flex items-center justify-center border border-[#E8E8E8] bg-cream text-[#555555] font-semibold text-sm px-4 py-2 rounded hover:bg-[#F5F5F5] transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            className="inline-flex items-center justify-center gap-2 bg-[#EE0000] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#CC0000] transition-colors"
                          >
                            <IconTrash />
                            Confirm Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(entry.id)}
                            title="Remove this entry"
                            className="w-9 h-9 flex items-center justify-center rounded border border-[#E8E8E8] text-[#888888] hover:border-[#EE0000] hover:text-[#EE0000] hover:bg-[#FFEEEE] transition-colors shrink-0"
                          >
                            <IconTrash />
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 border border-[#E8E8E8] bg-cream text-[#555555] font-semibold text-sm px-4 py-2 rounded hover:border-[#FF5500] hover:text-[#FF5500] transition-colors"
                          >
                            <ShareNetwork weight="bold" className="w-4 h-4" />
                            Share / Export
                          </button>
                          <Link
                            href={`/search?historyId=${entry.id}`}
                            className="inline-flex items-center justify-center border-2 border-[#FF5500] text-[#FF5500] font-semibold text-sm px-5 py-2 rounded hover:bg-[#FF5500]/5 transition-colors"
                          >
                            View Results
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Top 5 recommended careers from this run */}
                  <div className="border-t border-[#E8E8E8] pt-4 mb-4">
                    <p className="text-[10px] font-bold text-[#FF5500] uppercase tracking-widest mb-3">
                      Top 5 Matches
                    </p>
                    {topFive.length === 0 ? (
                      <p className="text-sm text-[#888888]">No recommended careers in this result set.</p>
                    ) : (
                      <div className="space-y-2">
                        {topFive.map((c, i) => (
                          <LeaderboardRow
                            key={c.id}
                            career={c}
                            rank={i + 1}
                            fillPercent={topFiveFill.get(c.id) ?? 0}
                            favourites={favouriteIds}
                            onToggleFavourite={(id) => toggleFavourite(entry.careers, id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inputs — assessments and preferences kept in separate groups.
                      Only the frameworks/preferences the user had switched on for
                      this search are shown; anything toggled off is omitted rather
                      than shown as "—". */}
                  <div className="border-t border-[#E8E8E8] pt-4 space-y-4">
                    {enabledAssessments.size > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-[#FF5500] uppercase tracking-widest mb-3">Assessments</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
                          {enabledAssessments.has("mbti") && (
                            <InputChip
                              label="MBTI"
                              value={
                                entry.payload.mbtiType
                                  ? `${entry.payload.mbtiType}${entry.payload.variant ? `-${entry.payload.variant}` : ""}`
                                  : "—"
                              }
                            />
                          )}
                          {enabledAssessments.has("spark") && <InputChip label="Sparketype" value={sparkSummary} />}
                          {enabledAssessments.has("ennea") && <InputChip label="Enneagram" value={entry.payload.enneagramType || "—"} />}
                          {enabledAssessments.has("disc") && <InputChip label="DiSC" value={entry.payload.discStyle || "—"} />}
                          {enabledAssessments.has("bigfive") && <InputChip label="Big Five" value={bigFiveSummary} />}
                          {enabledAssessments.has("clifton") && <InputChip label="CliftonStrengths" value={cliftonSummary} />}
                          {enabledAssessments.has("zodiac") && <InputChip label="Chinese Zodiac" value={zodiacSummary} />}
                          {enabledAssessments.has("astro") && <InputChip label="Astrology" value={entry.payload.sunSign || "—"} />}
                        </div>
                      </div>
                    )}

                    {enabledOptional.size > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-[#FF5500] uppercase tracking-widest mb-3">Preferences</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                          {enabledOptional.has("workEnv") && <InputChip label="Work Environment" value={entry.payload.workEnv || "—"} />}
                          {enabledOptional.has("orgStructure") && <InputChip label="Organization" value={entry.payload.orgStructure || "—"} />}
                          {enabledOptional.has("targetEdu") && <InputChip label="Education Target" value={eduLabel} />}
                          {enabledOptional.has("taskDislikes") && entry.payload.taskDislikes.length > 0 && (
                            <div className="col-span-2 sm:col-span-3">
                              <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-1">Task Dislikes</p>
                              <p className="text-sm text-[#111111]">{entry.payload.taskDislikes.join(", ")}</p>
                            </div>
                          )}
                          {enabledOptional.has("demoAge") && entry.payload.ageRange && (
                            <InputChip label="Age Range" value={entry.payload.ageRange} />
                          )}
                          {enabledOptional.has("demoGender") && entry.payload.gender && (
                            <InputChip label="Gender" value={entry.payload.gender} />
                          )}
                          {enabledOptional.has("demoRace") && entry.payload.race && (
                            <InputChip label="Race / Ethnicity" value={entry.payload.race} />
                          )}
                        </div>
                      </div>
                    )}

                    {entry.activeVariables && (
                      <div>
                        <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-1">
                          What {providerFullLabel(entry.provider)} weighted most
                        </p>
                        <p className="text-sm text-[#111111]">{entry.activeVariables}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-[#FF5500] text-white font-semibold text-sm px-6 py-3 rounded hover:bg-[#DD4400] transition-colors"
          >
            Run New Search
          </Link>
        </div>
      </main>
    </div>
  );
}

function InputChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm text-[#111111] font-medium">{value}</p>
    </div>
  );
}
