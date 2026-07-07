"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppNav from "@/src/components/AppNav";
import { EDU_TARGET_LABELS } from "@/src/lib/formOptions";
import {
  deleteHistoryEntry,
  formatDuration,
  getHistoryEntries,
  providerFullLabel,
  topRecommendedCareer,
  type ResultsHistoryEntry,
} from "@/src/lib/modelRuns";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconTrash({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconClock({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg className="w-5 h-5 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
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
  const [entries, setEntries] = useState<ResultsHistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(getHistoryEntries());
    setHydrated(true);
  }, []);

  function handleDelete(id: string) {
    deleteHistoryEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setConfirmingId(null);
  }

  return (
    <div className="min-h-screen bg-white">
      <AppNav active="results-history" />
      <main className="max-w-4xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#111111] tracking-tight">Results History</h1>
          <p className="text-sm md:text-base text-[#555555] mt-2">
            Review your previous career trajectory calculations, including which AI model generated each one and
            how long it took.
          </p>
        </div>

        {!hydrated ? null : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-[#E8E8E8]">
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
            {entries.map((entry) => {
              const { date, time } = formatTimestamp(entry.timestamp);
              const top = topRecommendedCareer(entry);
              const eduLabel = EDU_TARGET_LABELS[entry.payload.targetEduIndex] ?? "—";
              const isConfirming = confirmingId === entry.id;

              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 hover:shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow"
                >
                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className="text-xs font-bold text-[#888888] uppercase tracking-widest">
                          {date} · {time}
                        </span>
                        {top && (
                          <span className="px-2.5 py-1 rounded-full bg-[#FDECD8] text-[#FF5500] text-xs font-bold">
                            {top.matchPercent}% Match
                          </span>
                        )}
                        <span className="px-2.5 py-1 rounded-full bg-[#FFFFFF] border border-[#E8E8E8] text-[#555555] text-xs font-semibold">
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
                      {/* Top Match label + career title */}
                      {top ? (
                        <>
                          <p className="text-[10px] font-bold text-[#FF5500] uppercase tracking-widest mb-0.5">
                            Top Match
                          </p>
                          <h2 className="text-lg font-bold text-[#111111]">{top.title}</h2>
                        </>
                      ) : (
                        <p className="text-sm text-[#888888]">No recommended careers in this result set.</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {isConfirming ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            className="inline-flex items-center justify-center border border-[#E8E8E8] bg-white text-[#555555] font-semibold text-sm px-4 py-2 rounded hover:bg-[#F5F5F5] transition-colors"
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
                            className="inline-flex items-center justify-center gap-2 border border-[#E8E8E8] bg-white text-[#555555] font-semibold text-sm px-4 py-2 rounded hover:border-[#FF5500] hover:text-[#FF5500] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
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

                  {/* Inputs grid */}
                  <div className="border-t border-[#E8E8E8] pt-4">
                    <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-3">Your Inputs</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                      <InputChip
                        label="MBTI"
                        value={
                          entry.payload.mbtiType
                            ? `${entry.payload.mbtiType}${entry.payload.variant ? `-${entry.payload.variant}` : ""}`
                            : "—"
                        }
                      />
                      <InputChip label="Work Environment" value={entry.payload.workEnv || "—"} />
                      <InputChip label="Organization" value={entry.payload.orgStructure || "—"} />
                      <InputChip label="Education Target" value={eduLabel} />
                      <InputChip label="Enneagram" value={entry.payload.enneagramType || "—"} />
                      <InputChip label="DiSC" value={entry.payload.discStyle || "—"} />
                      {(entry.payload.primarySpark || entry.payload.secondarySpark || entry.payload.antiSpark) && (
                        <div className="col-span-2 sm:col-span-3">
                          <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-1">Sparketype</p>
                          <p className="text-sm text-[#111111]">
                            Primary: <span className="font-semibold">{entry.payload.primarySpark || "—"}</span>
                            {" · "}Secondary: <span className="font-semibold">{entry.payload.secondarySpark || "—"}</span>
                            {" · "}Anti: <span className="font-semibold">{entry.payload.antiSpark || "—"}</span>
                          </p>
                        </div>
                      )}
                      {entry.payload.taskDislikes.length > 0 && (
                        <div className="col-span-2 sm:col-span-3">
                          <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-1">Task Dislikes</p>
                          <p className="text-sm text-[#111111]">{entry.payload.taskDislikes.join(", ")}</p>
                        </div>
                      )}
                      {entry.activeVariables && (
                        <div className="col-span-2 sm:col-span-3">
                          <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-1">
                            What {providerFullLabel(entry.provider)} weighted most
                          </p>
                          <p className="text-sm text-[#111111]">{entry.activeVariables}</p>
                        </div>
                      )}
                    </div>
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
