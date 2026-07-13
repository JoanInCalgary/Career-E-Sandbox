"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scales, Check, Clock, Trash } from "@phosphor-icons/react";
import type { LLMProvider } from "@/src/lib/careerAgent";
import {
  PROVIDER_INFO,
  clearModelRun,
  formatDuration,
  getModelRuns,
  providerFullLabel,
  providerShortLabel,
  type ModelRun,
} from "@/src/lib/modelRuns";

const MAX_COMPARE = 4;

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconScale() {
  return <Scales weight="bold" className="w-5 h-5 text-[#FF5500]" />;
}
function IconCheck() {
  return <Check weight="bold" className="w-3.5 h-3.5" />;
}
function IconClock() {
  return <Clock weight="bold" className="w-3 h-3" />;
}
function IconTrash() {
  return <Trash weight="bold" className="w-3.5 h-3.5" />;
}

function formatTimestamp(ts: number): string {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function topRecommended(run: ModelRun, count: number) {
  return [...run.careers]
    .filter((c) => c.status === "recommended")
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, count);
}

// ── Comparison card ──────────────────────────────────────────────────────────

function ComparisonCard({ run, onClear }: { run: ModelRun; onClear: () => void }) {
  const recommendedCount = run.careers.filter((c) => c.status === "recommended").length;
  const flaggedCount = run.careers.filter((c) => c.status === "flagged").length;
  const top = topRecommended(run, 3);

  return (
    <div className="bg-[#FAFAFA] rounded-xl border border-[#E8E8E8] p-4 flex flex-col h-full min-w-[220px]">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#111111] truncate">{providerFullLabel(run.provider)}</p>
          <p className="text-[10px] text-[#888888]">Generated {formatTimestamp(run.timestamp)}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          title="Remove this saved run"
          className="w-6 h-6 flex items-center justify-center rounded-lg border border-[#E8E8E8] text-[#888888] hover:border-[#EE0000] hover:text-[#EE0000] hover:bg-[#FFEEEE] transition-colors shrink-0"
        >
          <IconTrash />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white bg-[#0055FF]"
          style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
        >
          {run.confidencePercent}% confidence
        </span>
        <span
          title="How long this model took to generate this result set"
          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full text-[#555555] bg-[#F0F0F0]"
        >
          <IconClock />
          {formatDuration(run.generationTimeMs)}
        </span>
      </div>

      <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-1">Active Variables</p>
      <p className="text-xs text-[#555555] leading-relaxed mb-3">{run.activeVariables || "—"}</p>

      <div className="flex items-center gap-3 text-xs text-[#555555] mb-3">
        <span>
          <span className="font-bold text-[#00AA00]">{recommendedCount}</span> recommended
        </span>
        <span>
          <span className="font-bold text-[#EE0000]">{flaggedCount}</span> flagged
        </span>
      </div>

      <div className="border-t border-[#E8E8E8] pt-3 mt-auto">
        <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-2">Top Matches</p>
        {top.length === 0 ? (
          <p className="text-xs text-[#888888]">No recommended careers saved.</p>
        ) : (
          <ul className="space-y-1.5">
            {top.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-[#111111] truncate">{c.title}</span>
                <span className="text-[#FF5500] font-bold shrink-0">{c.matchPercent}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export default function ModelComparisonPanel({ embedded = false }: { embedded?: boolean } = {}) {
  const [runs, setRuns] = useState<Partial<Record<LLMProvider, ModelRun>>>({});
  const [selected, setSelected] = useState<LLMProvider[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = getModelRuns();
    setRuns(stored);
    const available = PROVIDER_INFO.map((p) => p.id).filter((id) => stored[id]);
    setSelected(available.slice(0, 2));
    setHydrated(true);
  }, []);

  function toggleProvider(id: LLMProvider) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }

  function handleClear(id: LLMProvider) {
    clearModelRun(id);
    setRuns((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSelected((prev) => prev.filter((p) => p !== id));
  }

  const availableProviders = PROVIDER_INFO.filter((p) => runs[p.id]);

  const content = (
    <>
      {!hydrated ? null : availableProviders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-3">
            <IconScale />
          </div>
          <p className="text-sm font-semibold text-[#111111] mb-1">No model results saved yet</p>
          <p className="text-xs text-[#888888] mb-4">
            Run a search with any AI model to start building a comparison.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-[#FF5500] hover:bg-[#DD4400] transition-colors text-white font-semibold text-xs px-4 py-2 rounded-lg"
          >
            Go to Search
          </Link>
        </div>
      ) : (
        <>
          {/* Model toggle chips */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {availableProviders.map((p) => {
              const isSelected = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProvider(p.id)}
                  disabled={!isSelected && selected.length >= MAX_COMPARE}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    isSelected
                      ? "bg-[#FFF3EC] border-[#FF5500] text-[#FF5500]"
                      : "bg-cream border-[#E8E8E8] text-[#555555] hover:border-[#000c]"
                  }`}
                >
                  {isSelected && <IconCheck />}
                  {providerShortLabel(p.id)}
                </button>
              );
            })}
          </div>

          {selected.length === 0 ? (
            <p className="text-sm text-[#888888]">Select one or more models above to see their results.</p>
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${Math.min(selected.length, MAX_COMPARE)}, minmax(220px, 260px))` }}
              >
                {selected.map((id) => {
                  const run = runs[id];
                  if (!run) return null;
                  return <ComparisonCard key={id} run={run} onClear={() => handleClear(id)} />;
                })}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <section className="bg-cream rounded-2xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
      <div className="flex items-center gap-2 mb-1">
        <IconScale />
        <h2 className="text-lg font-bold text-[#111111]">Compare Model Results</h2>
      </div>
      <p className="text-sm text-[#555555] mb-5">
        See how different AI models score the same personality profile. Generate results with a model on the
        Search page and it will show up here automatically.
      </p>
      {content}
    </section>
  );
}
