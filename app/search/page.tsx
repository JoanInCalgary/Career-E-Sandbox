"use client";

import { useEffect, useRef, useState } from "react";
import AppNav from "@/src/components/AppNav";
import AssessmentForm, {
  type AssessmentFormHandle,
  type AssessmentValues,
  type FullAssessmentPayload,
} from "@/src/components/AssessmentForm";
import {
  FlaggedCard,
  FavouriteCard,
  IconCheckCircle,
  IconXCircle,
  PrimaryCard,
  SecondaryCard,
} from "@/src/components/CareerCards";
import {
  ALL_RESULT_SETS,
  CAREER_DOMAINS,
  type CareerDomain,
  type CareerMatch,
  type ResultSet,
} from "@/src/lib/mockData";
import type { LLMProvider } from "@/src/lib/careerAgent";
import {
  UI_PROVIDER_INFO,
  formatDuration,
  getHistoryEntry,
  providerShortLabel,
  saveHistoryEntry,
  saveModelRun,
} from "@/src/lib/modelRuns";

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickRandom(current?: ResultSet): ResultSet {
  if (!current || ALL_RESULT_SETS.length <= 1) {
    return ALL_RESULT_SETS[Math.floor(Math.random() * ALL_RESULT_SETS.length)];
  }
  const others = ALL_RESULT_SETS.filter((s) => s.id !== current.id);
  return others[Math.floor(Math.random() * others.length)];
}

const DEFAULT_PROVIDER: LLMProvider =
  (process.env.NEXT_PUBLIC_DEFAULT_PROVIDER as LLMProvider | undefined) ?? "gemini";

/** Call the /api/careers route. Returns null on failure (triggers mock fallback). */
async function fetchCareerResults(
  payload: FullAssessmentPayload,
  provider: LLMProvider
): Promise<{
  provider: LLMProvider;
  careers: CareerMatch[];
  confidencePercent: number;
  activeVariables: string;
  generationTimeMs?: number;
} | null> {
  try {
    const res = await fetch("/api/careers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payload, provider }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[fetchCareerResults] API error", res.status, err);
      return null;
    }

    const data = await res.json();
    console.log("[fetchCareerResults] raw response", data);

    if (!Array.isArray(data.careers)) {
      console.error("[fetchCareerResults] careers field missing or not an array", data);
      return null;
    }

    return {
      provider: (data.provider as LLMProvider) ?? provider,
      careers: data.careers as CareerMatch[],
      confidencePercent: data.confidencePercent ?? 80,
      activeVariables: data.activeVariables ?? "",
      generationTimeMs: typeof data.generationTimeMs === "number" ? data.generationTimeMs : undefined,
    };
  } catch (e) {
    console.error("[fetchCareerResults] fetch threw", e);
    return null;
  }
}

function sortAlpha(careers: CareerMatch[]): CareerMatch[] {
  return [...careers].sort((a, b) => a.title.localeCompare(b.title));
}

function StarFilledIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function ChevronDown({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SparkleIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 10l-5.714 2.143L13 19l-2.286-6.857L5 10l5.714-2.143L13 1z" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type View = "idle" | "loading" | "results";

export default function SearchPage() {
  const [preload, setPreload] = useState(false);
  const [view, setView] = useState<View>("idle");

  const [pillOpen, setPillOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [currentValues, setCurrentValues] = useState<AssessmentValues>({
    mbtiType: "INTJ",
    variant: "",
    workEnv: "Fully Remote",
    targetEduIndex: 3,
  });
  const [activeTab, setActiveTab] = useState<"recommended" | "flagged">("recommended");
  const [domainFilter, setDomainFilter] = useState<CareerDomain>("All Domains");
  const [isCalculating, setIsCalculating] = useState(false);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [resultSet, setResultSet] = useState<ResultSet>(() => pickRandom());
  const [activeProvider, setActiveProvider] = useState<LLMProvider>(DEFAULT_PROVIDER);
  const [usingMockData, setUsingMockData] = useState(false);
  const [generatedByProvider, setGeneratedByProvider] = useState<LLMProvider | null>(null);
  const [generationTimeMs, setGenerationTimeMs] = useState<number | null>(null);
  const latestPayloadRef = useRef<FullAssessmentPayload | null>(null);
  const isCalculatingRef = useRef(false);
  const formRef = useRef<AssessmentFormHandle>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const historyId = params.get("historyId");
    if (historyId) {
      const entry = getHistoryEntry(historyId);
      if (entry) {
        setResultSet({
          id: `history-${entry.id}`,
          label: "AI Results",
          confidencePercent: entry.confidencePercent,
          activeVariables: entry.activeVariables,
          careers: entry.careers,
        });
        setUsingMockData(false);
        setGeneratedByProvider(entry.provider);
        setGenerationTimeMs(entry.generationTimeMs ?? null);
        latestPayloadRef.current = entry.payload;
        setView("results");
        return;
      }
    }
    if (params.get("autorun") === "true") {
      setView("results");
    } else if (params.get("restore") === "true") {
      setPreload(true);
    }
  }, []);

  function selectProvider(provider: LLMProvider) {
    setActiveProvider(provider);
    setModelMenuOpen(false);
  }

  const activeProviderLabel = providerShortLabel(activeProvider);

  // ── Derived data ──
  const allRecommended = sortAlpha(
    resultSet.careers.filter(
      (c) =>
        c.status === "recommended" &&
        (domainFilter === "All Domains" || c.domain === domainFilter)
    )
  );

  const flagged = resultSet.careers
    .filter(
      (c) =>
        c.status === "flagged" &&
        (domainFilter === "All Domains" || c.domain === domainFilter)
    )
    .sort((a, b) => a.matchPercent - b.matchPercent)
    .slice(0, 10);

  const primaryCard = allRecommended.length > 0 ? allRecommended[0] : undefined;
  const primaryIsFavourited = primaryCard ? favourites.has(primaryCard.id) : false;
  const favouriteCards = allRecommended.filter((c) => favourites.has(c.id));
  const gridCards = allRecommended.slice(1).filter((c) => !favourites.has(c.id));

  function toggleFavourite(id: string) {
    setFavourites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Submit ──

  /** Persist + apply a freshly generated live result set (model runs + results history). */
  function applyLiveResult(
    result: {
      provider: LLMProvider;
      careers: CareerMatch[];
      confidencePercent: number;
      activeVariables: string;
      generationTimeMs?: number;
    },
    payload: FullAssessmentPayload
  ) {
    const timestamp = Date.now();
    setResultSet({
      id: `live-${timestamp}`,
      label: "AI Results",
      confidencePercent: result.confidencePercent,
      activeVariables: result.activeVariables,
      careers: result.careers,
    });
    setUsingMockData(false);
    setGeneratedByProvider(result.provider);
    setGenerationTimeMs(result.generationTimeMs ?? null);

    saveModelRun({
      provider: result.provider,
      timestamp,
      confidencePercent: result.confidencePercent,
      activeVariables: result.activeVariables,
      careers: result.careers,
      generationTimeMs: result.generationTimeMs,
    });

    // Log this run to the Results History page too, snapshotting the exact
    // inputs that produced it so it can be reopened later.
    saveHistoryEntry({
      timestamp,
      provider: result.provider,
      generationTimeMs: result.generationTimeMs,
      confidencePercent: result.confidencePercent,
      activeVariables: result.activeVariables,
      careers: result.careers,
      payload,
    });
  }

  async function handleSubmit(payload?: FullAssessmentPayload) {
    const effectivePayload = payload ?? latestPayloadRef.current;

    if (view === "results") {
      if (isCalculatingRef.current) return;
      isCalculatingRef.current = true;
      setIsCalculating(true);

      if (effectivePayload) {
        const result = await fetchCareerResults(effectivePayload, activeProvider);
        if (result) {
          applyLiveResult(result, effectivePayload);
        } else {
          setResultSet((prev) => pickRandom(prev));
          setUsingMockData(true);
          setGeneratedByProvider(null);
          setGenerationTimeMs(null);
        }
      } else {
        setResultSet((prev) => pickRandom(prev));
        setUsingMockData(true);
        setGeneratedByProvider(null);
        setGenerationTimeMs(null);
      }

      setActiveTab("recommended");
      setDomainFilter("All Domains");
      setFavourites(new Set());
      setIsCalculating(false);
      isCalculatingRef.current = false;
    } else {
      setView("loading");

      if (effectivePayload) {
        const result = await fetchCareerResults(effectivePayload, activeProvider);
        if (result) {
          applyLiveResult(result, effectivePayload);
        } else {
          setResultSet(pickRandom());
          setUsingMockData(true);
          setGeneratedByProvider(null);
          setGenerationTimeMs(null);
        }
      } else {
        setResultSet(pickRandom());
        setUsingMockData(true);
        setGeneratedByProvider(null);
        setGenerationTimeMs(null);
      }

      setView("results");
    }
  }

  function handleValuesChange(next: AssessmentValues) {
    setCurrentValues(next);
  }

  function handleSubmitWithValues(payload: FullAssessmentPayload) {
    latestPayloadRef.current = payload;
    handleSubmit(payload);
  }

  const showResults = view === "results";
  void showResults; // suppress unused warning

  return (
    <div className="min-h-screen bg-white">
      <AppNav active="search" />

      <div className="relative min-h-[calc(100vh-56px)]">

        {/* ── Results / Loading / Idle panel ─────────────────────────────── */}
        <main className="w-full p-6 md:p-8 pb-28 overflow-y-auto min-w-0">
          <div className="max-w-4xl mx-auto">

            {/* Preload banner */}
            {preload && view !== "loading" && (
              <div className="mb-5">
                <div className="flex items-start gap-3 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl px-5 py-4">
                  <svg className="w-5 h-5 text-[#888888] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-[#333333]">Previous search pre-loaded</p>
                    <p className="text-xs text-[#888888] mt-0.5">
                      We restored your inputs from your last session. Adjust in the bar below or generate as-is.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {view === "idle" ? (
              /* ── Idle placeholder ── */
              <div className="flex flex-col h-full">
                <div className="flex flex-col items-center justify-center flex-1 text-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mb-5">
                    <svg className="w-8 h-8 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h2 className="text-2xl text-[#111111] mb-2">Career Path Results</h2>
                  <p className="text-sm text-[#888888] max-w-sm leading-relaxed">
                    Enter your personality assessment information using the bar below and hit Generate.
                  </p>
                </div>
              </div>
            ) : view === "loading" ? (
              /* ── Loading screen ── */
              <div className="flex flex-col items-center justify-center py-32">
                <div className="w-12 h-12 border-4 border-[#E8E8E8] border-t-[#FF5500] rounded-full animate-spin mb-6" />
                <h2 className="text-2xl text-[#111111] mb-2">Calculating Career Path Results</h2>
                <p className="text-sm text-[#888888] text-center max-w-md">
                  Cross-referencing your personality profile against market data and environmental variables…
                </p>
                <div className="w-64 h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden mt-8">
                  <div className="h-full rounded-full animate-pulse w-full" style={{ backgroundColor: "#FF5500" }} />
                </div>
              </div>
            ) : (
              /* ── Results ── */
              <>
                {usingMockData && (
                  <div className="mb-4 flex items-start gap-3 bg-[#FFFBEE] border border-[#FFE57A] rounded-xl px-5 py-3">
                    <svg className="w-4 h-4 text-[#AA8800] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <p className="text-xs text-[#775500]">
                      <span className="font-semibold">Preview mode —</span> AI provider unavailable or API key not set. Showing sample data. Add your key to{" "}
                      <code
                        className="bg-[#FFF3CC] px-1 rounded"
                        style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
                      >
                        .env.local
                      </code>{" "}
                      to enable live results.
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                  <div>
                    <h1 className="text-3xl md:text-4xl text-[#111111] tracking-tight leading-tight">
                      Career Path Results
                    </h1>
                    {!usingMockData && generatedByProvider && (
                      <span
                        title="This result set was generated live by this AI model"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#555555] bg-[#F5F5F5] border border-[#E8E8E8] rounded-full px-3 py-1 mt-2"
                      >
                        <SparkleIcon className="w-3 h-3 text-[#FF5500]" />
                        Generated by {providerShortLabel(generatedByProvider)}
                        {generationTimeMs != null && (
                          <>
                            <span className="text-[#CCCCCC]">·</span>
                            {formatDuration(generationTimeMs)}
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 border border-[#E8E8E8] bg-white text-[#888888] font-semibold text-sm px-4 py-2 rounded-lg shadow-sm hover:border-[#111111] hover:text-[#111111] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share / Export
                    </button>
                    <div>
                      <p
                        className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-1.5"
                        style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
                      >
                        Filter Domain
                      </p>
                      <div className="relative">
                        <select
                          value={domainFilter}
                          onChange={(e) => setDomainFilter(e.target.value as CareerDomain)}
                          className="appearance-none bg-white border border-[#E8E8E8] rounded-lg px-4 py-2 text-sm text-[#111111] pr-10 shadow-sm focus:outline-none focus:border-[#111111] min-w-[168px] cursor-pointer"
                        >
                          {CAREER_DOMAINS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#888888]">
                          <ChevronDown />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-[#E8E8E8] mb-6">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => setActiveTab("recommended")}
                      className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors whitespace-nowrap -mb-px ${
                        activeTab === "recommended"
                          ? "text-[#111111] border-b-2 border-[#111111]"
                          : "text-[#888888] hover:text-[#555555]"
                      }`}
                    >
                      <IconCheckCircle className="w-4 h-4" />
                      Recommended Paths ({allRecommended.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("flagged")}
                      className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors whitespace-nowrap -mb-px ${
                        activeTab === "flagged"
                          ? "text-[#EE0000] border-b-2 border-[#EE0000]"
                          : "text-[#888888] hover:text-[#555555]"
                      }`}
                    >
                      <IconXCircle className="w-4 h-4" />
                      Non-Recommended ({flagged.length})
                    </button>
                  </div>
                  {activeTab === "recommended" && (
                    <p className="text-[11px] text-[#888888] pb-3 hidden sm:flex items-center gap-1 shrink-0">
                      <StarFilledIcon className="w-3 h-3 text-[#FFAA00]" />
                      Star a result to save it to your favourites
                    </p>
                  )}
                </div>

                <div className="transition-opacity duration-300" style={{ opacity: isCalculating ? 0 : 1 }}>
                  {isCalculating ? (
                    <div className="space-y-4">
                      <div className="bg-[#F5F5F5] rounded-xl border border-[#E8E8E8] h-64 animate-pulse" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="bg-[#F5F5F5] rounded-xl border border-[#E8E8E8] h-44 animate-pulse" />
                        ))}
                      </div>
                    </div>
                  ) : activeTab === "recommended" ? (
                    allRecommended.length === 0 ? (
                      <EmptyState domain={domainFilter} />
                    ) : (
                      <div className="space-y-6">
                        {favouriteCards.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <StarFilledIcon className="w-5 h-5 text-[#FFAA00]" />
                              <h2 className="text-base font-bold text-[#111111]">Favourites ({favouriteCards.length})</h2>
                            </div>
                            <p className="text-sm text-[#888888] mb-4">
                              These will be added to your main dashboard.
                            </p>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                              {favouriteCards.map((c) => (
                                <FavouriteCard key={c.id} career={c} favourites={favourites} onToggleFavourite={toggleFavourite} />
                              ))}
                            </div>
                            <div className="border-t border-[#E8E8E8] mt-6" />
                          </div>
                        )}

                        {primaryCard && !primaryIsFavourited && (
                          <div>
                            <h2 className="text-2xl text-[#111111] mb-1">Best Match</h2>
                            <p className="text-sm text-[#888888] mb-4">
                              Most aligned with your personality and preferences.
                            </p>
                            <PrimaryCard career={primaryCard} favourites={favourites} onToggleFavourite={toggleFavourite} />
                          </div>
                        )}

                        {gridCards.length > 0 && (
                          <div>
                            <h3 className="text-lg font-bold text-[#111111] mb-1">Other Considerable Options</h3>
                            <p className="text-sm text-[#888888] mb-4">
                              Additional career paths worth exploring.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {gridCards.map((c) => (
                                <SecondaryCard key={c.id} career={c} favourites={favourites} onToggleFavourite={toggleFavourite} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ) : flagged.length === 0 ? (
                    <EmptyState domain={domainFilter} />
                  ) : (
                    <div>
                      <h2 className="text-2xl text-[#111111] mb-1">Careers to Avoid</h2>
                      <p className="text-sm text-[#888888] mb-5">
                        These paths severely conflict with your personality profile.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {flagged.map((c) => (
                          <FlaggedCard key={c.id} career={c} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>

        {/* ── Floating Pill Bar ─────────────────────────────────────────── */}
        <>
          {/* Backdrop */}
          {(pillOpen || modelMenuOpen) && (
            <div
              className="fixed inset-0 z-30"
              onClick={() => {
                setPillOpen(false);
                setModelMenuOpen(false);
              }}
            />
          )}

          {/* Expanded personality panel */}
          <div
            className="fixed z-40 left-1/2 -translate-x-1/2 w-[calc(100vw-32px)] max-w-sm md:max-w-md bg-white rounded-2xl shadow-2xl border border-[#E8E8E8]"
            style={{
              bottom: "80px",
              maxHeight: pillOpen ? "72vh" : "0px",
              opacity: pillOpen ? 1 : 0,
              pointerEvents: pillOpen ? "auto" : "none",
              transition: "max-height 380ms cubic-bezier(0.4,0,0.2,1), opacity 250ms ease",
              overflow: "hidden",
            }}
          >
            <div style={{ maxHeight: "72vh", overflowY: "auto" }}>
              <AssessmentForm
                ref={formRef}
                layout="sidebar"
                preload={preload}
                onValuesChange={handleValuesChange}
                onSubmit={() => { handleSubmit(); setPillOpen(false); }}
                onSubmitWithValues={(p) => { handleSubmitWithValues(p); setPillOpen(false); }}
                isLoading={isCalculating}
              />
            </div>
          </div>

          {/* The pill */}
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-32px)] max-w-[360px] md:max-w-[600px]">
            <div className="flex items-stretch bg-white border border-[#E8E8E8] rounded-full shadow-lg shadow-black/10 h-14">

              {/* ── Personality tab ── */}
              <button
                type="button"
                onClick={() => {
                  setPillOpen((o) => !o);
                  setModelMenuOpen(false);
                }}
                className="flex flex-1 items-center gap-3 pl-5 pr-4 rounded-l-full hover:bg-[#F5F5F5] transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[#F0F0F0] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-[#555555]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-left min-w-0">
                  <p
                    className="text-[9px] font-bold text-[#888888] uppercase tracking-widest leading-none mb-0.5"
                    style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
                  >
                    Personality
                  </p>
                  <p
                    className="text-sm font-bold text-[#111111] leading-none"
                    style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
                  >
                    {currentValues.mbtiType}{currentValues.variant ? `-${currentValues.variant}` : ""}
                  </p>
                </div>
                <span
                  className="text-[#888888] ml-auto shrink-0"
                  style={{
                    transform: pillOpen ? "none" : "rotate(180deg)",
                    display: "inline-flex",
                    transition: "transform 300ms",
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>

              {/* Divider */}
              <div className="w-px bg-[#E8E8E8] self-stretch" />

              {/* ── Model tab (dropdown) ── */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setModelMenuOpen((o) => !o);
                    setPillOpen(false);
                  }}
                  title="Select AI model"
                  aria-haspopup="listbox"
                  aria-expanded={modelMenuOpen}
                  className="flex items-center gap-2 px-4 h-full hover:bg-[#F5F5F5] transition-colors"
                >
                  <div className="text-left">
                    <p
                      className="text-[9px] font-bold text-[#888888] uppercase tracking-widest leading-none mb-0.5"
                      style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
                    >
                      Model
                    </p>
                    <p
                      className="text-sm font-bold text-[#111111] leading-none"
                      style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
                    >
                      {activeProviderLabel}
                    </p>
                  </div>
                  <span
                    className="text-[#888888]"
                    style={{
                      display: "inline-flex",
                      transform: modelMenuOpen ? "rotate(180deg)" : "none",
                      transition: "transform 200ms",
                    }}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </button>

                {modelMenuOpen && (
                  <div
                    role="listbox"
                    className="absolute bottom-full right-0 mb-3 w-60 bg-white border border-[#E8E8E8] rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    <p className="text-[9px] font-bold text-[#888888] uppercase tracking-widest px-4 pt-3 pb-1">
                      AI Model
                    </p>
                    {UI_PROVIDER_INFO.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        role="option"
                        aria-selected={p.id === activeProvider}
                        onClick={() => selectProvider(p.id)}
                        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                          p.id === activeProvider
                            ? "bg-[#FFF3EC] text-[#FF5500] font-semibold"
                            : "text-[#333333] hover:bg-[#F5F5F5]"
                        }`}
                      >
                        <span>{p.label}</span>
                        {p.id === activeProvider && <CheckIcon className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-px bg-[#E8E8E8] self-stretch" />

              {/* ── Generate button — BRIGHT ORANGE ── */}
              <button
                type="button"
                disabled={isCalculating}
                onClick={() => {
                  const payload = formRef.current?.buildPayload() ?? latestPayloadRef.current ?? undefined;
                  if (payload) handleSubmitWithValues(payload);
                  else handleSubmit();
                  setPillOpen(false);
                  setModelMenuOpen(false);
                }}
                className="flex items-center gap-2 px-6 rounded-r-full text-white text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                style={{ backgroundColor: isCalculating ? "#FF5500" : "#FF5500" }}
              >
                {isCalculating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">Calculating…</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{view === "results" ? "Recalculate" : "Generate"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      </div>
    </div>
  );
}

function EmptyState({ domain }: { domain: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="text-[#111111] font-semibold text-base mb-1">No results in this domain</p>
      <p className="text-sm text-[#888888]">
        No careers match <span className="font-medium text-[#111111]">{domain}</span>.
        Try a different domain or generate a new set.
      </p>
    </div>
  );
}
