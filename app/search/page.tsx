"use client";

import { useEffect, useRef, useState } from "react";
import AppNav from "@/src/components/AppNav";
import RequireAuth from "@/src/components/RequireAuth";
import { useAuth, type SearchUsage } from "@/src/components/AuthProvider";
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
  LeaderboardRow,
  computeLeaderboardFill,
} from "@/src/components/CareerCards";
import {
  CaretDown,
  Check,
  ClipboardText,
  Info,
  Lightning,
  MagnifyingGlass,
  ShareNetwork,
  Sparkle,
  Star,
  Stop,
  User,
  Warning,
} from "@phosphor-icons/react";
import {
  CAREER_DOMAINS,
  type CareerDomain,
  type CareerMatch,
  type ResultSet,
} from "@/src/lib/mockData";
import type { LLMProvider } from "@/src/lib/careerAgent";
import { hasMinimumAssessments } from "@/src/lib/types";
import {
  UI_PROVIDER_INFO,
  formatDuration,
  getHistoryEntry,
  providerShortLabel,
  saveHistoryEntry,
  saveModelRun,
} from "@/src/lib/modelRuns";
import { getFavouriteIds, toggleFavourite as toggleFavouriteInStore } from "@/src/lib/favourites";
import { getPersonalityProfile } from "@/src/lib/personalityProfile";

const EMPTY_RESULT_SET: ResultSet = {
  id: "empty",
  label: "No results yet",
  confidencePercent: 0,
  activeVariables: "",
  careers: [],
};

// Groq is the fastest of the enabled providers (see careerAgent.ts / .env.local
// notes), so it's the default rather than Gemini — helps keep typical search
// times down without the user having to know to switch models.
const DEFAULT_PROVIDER: LLMProvider =
  (process.env.NEXT_PUBLIC_DEFAULT_PROVIDER as LLMProvider | undefined) ?? "groq";

/** Groq on-demand TPM is tight for gpt-oss-120b; block rapid re-searches. */
const GROQ_COOLDOWN_MS = 60_000;

/** Recommended cards are capped to this many, ranked by best fit, even if the
 * provider ever returns more than the 25 the prompt asks for. */
const MAX_RECOMMENDED_SHOWN = 25;

interface CareerFetchSuccess {
  ok: true;
  provider: LLMProvider;
  careers: CareerMatch[];
  confidencePercent: number;
  activeVariables: string;
  generationTimeMs?: number;
  usage?: SearchUsage | null;
}

interface CareerFetchFailure {
  ok: false;
  /** True when the account's per-period search allowance is exhausted (HTTP 429). */
  limitReached?: boolean;
  /** True when the request was cancelled via the Stop button. */
  aborted?: boolean;
  message?: string;
}

type CareerFetchOutcome = CareerFetchSuccess | CareerFetchFailure;

/** Call the /api/careers route. */
async function fetchCareerResults(
  payload: FullAssessmentPayload,
  provider: LLMProvider,
  signal?: AbortSignal
): Promise<CareerFetchOutcome> {
  try {
    const res = await fetch("/api/careers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payload, provider }),
      signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[fetchCareerResults] API error", res.status, err);
      if (res.status === 429) {
        return { ok: false, limitReached: true, message: err.error as string | undefined };
      }
      return {
        ok: false,
        message: (err.error as string | undefined) ?? "Unable to generate career matches.",
      };
    }

    const data = await res.json();
    console.log("[fetchCareerResults] raw response", data);

    if (!Array.isArray(data.careers)) {
      console.error("[fetchCareerResults] careers field missing or not an array", data);
      return { ok: false, message: "Invalid response from career generator." };
    }

    return {
      ok: true,
      provider: (data.provider as LLMProvider) ?? provider,
      careers: data.careers as CareerMatch[],
      confidencePercent: data.confidencePercent ?? 80,
      activeVariables: data.activeVariables ?? "",
      generationTimeMs: typeof data.generationTimeMs === "number" ? data.generationTimeMs : undefined,
      usage: (data.usage as SearchUsage | null | undefined) ?? null,
    };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return { ok: false, aborted: true };
    }
    console.error("[fetchCareerResults] fetch threw", e);
    return { ok: false, message: "Network error while generating careers." };
  }
}

/** Highest matchPercent first — used to rank every recommended card by best fit. */
function sortByMatch(careers: CareerMatch[]): CareerMatch[] {
  return [...careers].sort((a, b) => b.matchPercent - a.matchPercent);
}

function StarFilledIcon({ className }: { className?: string }) {
  return <Star weight="fill" className={className} />;
}

function ChevronDown({ className = "w-4 h-4" }: { className?: string }) {
  return <CaretDown weight="bold" className={className} />;
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return <Check weight="bold" className={className} />;
}

function SparkleIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return <Sparkle weight="bold" className={className} />;
}

function StopIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return <Stop weight="fill" className={className} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

type View = "idle" | "loading" | "results";

export default function SearchPage() {
  return (
    <RequireAuth active="search">
      <SearchContent />
    </RequireAuth>
  );
}

function SearchContent() {
  const { user, refresh } = useAuth();
  const [preload, setPreload] = useState(false);
  const [view, setView] = useState<View>("idle");
  const [usageNotice, setUsageNotice] = useState<{ kind: "half" | "empty"; message: string } | null>(null);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

  const [pillOpen, setPillOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [currentValues, setCurrentValues] = useState<AssessmentValues>({
    mbtiType: "",
    variant: "",
    workEnv: "Fully Remote",
    targetEduIndex: 0,
  });
  const [activeTab, setActiveTab] = useState<"recommended" | "flagged">("recommended");
  const [domainFilter, setDomainFilter] = useState<CareerDomain>("All Domains");
  const [isCalculating, setIsCalculating] = useState(false);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [resultSet, setResultSet] = useState<ResultSet>(EMPTY_RESULT_SET);
  const [activeProvider, setActiveProvider] = useState<LLMProvider>(DEFAULT_PROVIDER);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [searchLimitMessage, setSearchLimitMessage] = useState<string | null>(null);
  const [generatedByProvider, setGeneratedByProvider] = useState<LLMProvider | null>(null);
  const [generationTimeMs, setGenerationTimeMs] = useState<number | null>(null);
  const [slowNotice, setSlowNotice] = useState(false);
  const [groqCooldownUntil, setGroqCooldownUntil] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const latestPayloadRef = useRef<FullAssessmentPayload | null>(null);
  const isCalculatingRef = useRef(false);
  const formRef = useRef<AssessmentFormHandle>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tick while a Groq cooldown is active so the button countdown updates.
  useEffect(() => {
    if (groqCooldownUntil <= Date.now()) return;
    const id = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, [groqCooldownUntil]);

  const groqCooldownRemainingSec =
    activeProvider === "groq"
      ? Math.max(0, Math.ceil((groqCooldownUntil - nowMs) / 1000))
      : 0;
  const groqOnCooldown = groqCooldownRemainingSec > 0;

  // Cancel any in-flight request and pending "slow" timer if the page unmounts.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  }, []);

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
        setGeneratedByProvider(entry.provider);
        setGenerationTimeMs(entry.generationTimeMs ?? null);
        latestPayloadRef.current = entry.payload;
        setView("results");
        return;
      }
    }
    if (params.get("restore") === "true") {
      setPreload(true);
    }
  }, []);

  // Hydrate starred state from the shared favourites store so cards that were
  // already favourited (e.g. re-opened from history) show up starred.
  useEffect(() => {
    setFavourites(getFavouriteIds());
  }, []);

  // First-time visitors land here with an empty personality profile — pop
  // the assessment panel open and surface a welcome prompt so they're guided
  // straight into filling it out, instead of staring at an empty idle state.
  useEffect(() => {
    const stored = getPersonalityProfile();
    const isEmpty =
      !stored.mbtiType &&
      !stored.primarySpark &&
      !stored.secondarySpark &&
      !stored.antiSpark &&
      stored.strengths.every((s) => !s) &&
      !stored.enneagramType &&
      !stored.discStyle &&
      !stored.zodiacAnimal &&
      !stored.zodiacElement &&
      !stored.sunSign;
    if (isEmpty) {
      setShowProfilePrompt(true);
      setPillOpen(true);
    }
  }, []);

  /** Surface a one-time banner the first time an account crosses 50% of its
   * search allowance, and again when it hits 0 remaining. Gated in
   * localStorage per period so it doesn't re-fire on every page load or
   * every subsequent search within the same period. */
  function maybeNotifyUsage(usage: SearchUsage | null | undefined) {
    if (!usage || typeof window === "undefined") return;
    const scope = `${usage.periodResetsAt}`;
    if (usage.remaining <= 0) {
      const key = `usageNotice:empty:${scope}`;
      if (!window.localStorage.getItem(key)) {
        window.localStorage.setItem(key, "1");
        setUsageNotice({
          kind: "empty",
          message: `You've used all ${usage.limit} searches for this period. It resets ${new Date(
            usage.periodResetsAt
          ).toLocaleDateString()}.`,
        });
      }
    } else if (usage.limit > 0 && usage.used / usage.limit >= 0.5) {
      const key = `usageNotice:half:${scope}`;
      if (!window.localStorage.getItem(key)) {
        window.localStorage.setItem(key, "1");
        setUsageNotice({
          kind: "half",
          message: `You've used ${usage.used} of ${usage.limit} searches this period — ${usage.remaining} remaining.`,
        });
      }
    }
  }

  // Check on mount / whenever the account's usage snapshot changes (e.g.
  // right after login) so returning users are notified even if they don't
  // run a new search this session.
  useEffect(() => {
    maybeNotifyUsage(user?.searchUsage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.searchUsage?.used, user?.searchUsage?.limit, user?.searchUsage?.periodResetsAt]);

  function selectProvider(provider: LLMProvider) {
    setActiveProvider(provider);
    setModelMenuOpen(false);
  }

  const activeProviderLabel = providerShortLabel(activeProvider);

  // ── Derived data ──
  // Ranked by best fit (highest matchPercent first), then capped so only the
  // top 25 job titles ever show up, even if a provider over-generates.
  const allRecommended = sortByMatch(
    resultSet.careers.filter(
      (c) =>
        c.status === "recommended" &&
        (domainFilter === "All Domains" || c.domain === domainFilter)
    )
  ).slice(0, MAX_RECOMMENDED_SHOWN);

  const flagged = resultSet.careers
    .filter(
      (c) =>
        c.status === "flagged" &&
        (domainFilter === "All Domains" || c.domain === domainFilter)
    )
    .sort((a, b) => a.matchPercent - b.matchPercent)
    .slice(0, 15);

  const favouriteCards = allRecommended.filter((c) => favourites.has(c.id));
  // Everything else, still ranked by best fit — rendered as leaderboard rows
  // so the ranking and relative match strength are easy to compare at a glance.
  const gridCards = allRecommended.filter((c) => !favourites.has(c.id));
  const leaderboardFill = computeLeaderboardFill(gridCards);

  /** Stars/unstars a career, persisting the full snapshot to the shared
   * favourites store so it shows up (or disappears) on the Dashboard too. */
  function toggleFavourite(id: string) {
    const career = resultSet.careers.find((c) => c.id === id);
    if (!career) return;
    const nowFavourited = toggleFavouriteInStore(career);
    setFavourites((prev) => {
      const next = new Set(prev);
      if (nowFavourited) next.add(id);
      else next.delete(id);
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

    // Log this run to Results History (+ Supabase recent_searches).
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

  /** Cancels an in-flight generation request (Stop button). */
  function stopGeneration() {
    abortControllerRef.current?.abort();
  }

  async function handleSubmit(payload?: FullAssessmentPayload) {
    if (isCalculatingRef.current) return;

    if (activeProvider === "groq") {
      const remainingMs = groqCooldownUntil - Date.now();
      if (remainingMs > 0) {
        const secs = Math.ceil(remainingMs / 1000);
        setGenerateError(
          `Groq rate limits are tight — wait ${secs}s before searching again with this model.`
        );
        return;
      }
    }

    const effectivePayload = payload ?? latestPayloadRef.current;
    const wasResults = view === "results";
    const providerForRun = activeProvider;

    isCalculatingRef.current = true;
    setIsCalculating(true);
    setSearchLimitMessage(null);
    setGenerateError(null);
    setSlowNotice(false);
    if (!wasResults) setView("loading");

    function finish() {
      isCalculatingRef.current = false;
      setIsCalculating(false);
      if (!wasResults) setView((v) => (v === "loading" ? "idle" : v));
    }

    if (!effectivePayload) {
      setGenerateError("Fill in your assessment before generating results.");
      finish();
      return;
    }

    if (!hasMinimumAssessments(effectivePayload)) {
      setGenerateError("Add at least one personality assessment before generating results.");
      finish();
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    // Surface a "still working" notice if generation runs past 10s, so a slow
    // provider doesn't read as a hang.
    slowTimerRef.current = setTimeout(() => setSlowNotice(true), 10000);

    const outcome = await fetchCareerResults(effectivePayload, providerForRun, controller.signal);

    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = null;
    setSlowNotice(false);
    abortControllerRef.current = null;

    if (outcome.ok) {
      applyLiveResult(outcome, effectivePayload);
      maybeNotifyUsage(outcome.usage);
      void refresh();
      setView("results");
      // Start cooldown when results are shown so the 60s clock begins at
      // display time, not while the request is still in flight.
      if (providerForRun === "groq") {
        setGroqCooldownUntil(Date.now() + GROQ_COOLDOWN_MS);
        setNowMs(Date.now());
      }
    } else if (outcome.aborted) {
      // Cancelled via the Stop button — return quietly, no error banner.
    } else if (outcome.limitReached) {
      setSearchLimitMessage(outcome.message ?? "You've reached your search limit for this period.");
    } else {
      setGenerateError(outcome.message ?? "Unable to generate career matches. Please try again.");
      setGeneratedByProvider(null);
      setGenerationTimeMs(null);
    }

    if (wasResults) {
      setActiveTab("recommended");
      setDomainFilter("All Domains");
    }
    finish();
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
    <div className="min-h-screen bg-cream">
      <AppNav active="search" />

      <div className="relative min-h-[calc(100vh-56px)]">

        {/* ── Results / Loading / Idle panel ─────────────────────────────── */}
        <main className="w-full p-6 md:p-8 pb-28 overflow-y-auto min-w-0">
          <div className="max-w-4xl mx-auto">

            {/* First-visit profile prompt */}
            {showProfilePrompt && view === "idle" && (
              <div className="mb-5">
                <div className="flex items-start gap-3 bg-[#FFF5F0] border border-[#FF5500]/30 rounded-xl px-5 py-4">
                  <SparkleIcon className="w-5 h-5 text-[#FF5500] shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#111111]">Welcome! Let&apos;s build your personality profile</p>
                    <p className="text-xs text-[#888888] mt-0.5">
                      We&apos;ve opened the panel below — enter results from as many or as few assessments as you
                      like, set your preferences, then hit Generate to see your matches.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProfilePrompt(false)}
                    className="text-xs font-semibold text-[#888888] hover:text-[#000c] transition-colors shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Preload banner */}
            {preload && view !== "loading" && (
              <div className="mb-5">
                <div className="flex items-start gap-3 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl px-5 py-4">
                  <Info weight="bold" className="w-5 h-5 text-[#888888] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#333333]">Previous search pre-loaded</p>
                    <p className="text-xs text-[#888888] mt-0.5">
                      We restored your inputs from your last session. Adjust in the bar below or generate as-is.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Usage threshold banner — 50% used or 0 remaining */}
            {usageNotice && (
              <div
                className="mb-5 flex items-start gap-3 rounded-xl px-5 py-3 border"
                style={
                  usageNotice.kind === "empty"
                    ? { backgroundColor: "#FFEEEE", borderColor: "rgba(238,0,0,0.3)" }
                    : { backgroundColor: "#FFF8EE", borderColor: "#F0DDAA" }
                }
              >
                <Warning
                  weight="bold"
                  className="w-4 h-4 shrink-0 mt-0.5"
                  style={{ color: usageNotice.kind === "empty" ? "#CC0000" : "#AA8800" }}
                />
                <div className="flex-1">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: usageNotice.kind === "empty" ? "#CC0000" : "#996600" }}
                  >
                    {usageNotice.kind === "empty" ? "Search limit reached" : "Halfway through your searches"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: usageNotice.kind === "empty" ? "#994444" : "#997700" }}>
                    {usageNotice.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUsageNotice(null)}
                  className="text-xs font-semibold text-[#888888] hover:text-[#000c] transition-colors shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Search limit banner */}
            {searchLimitMessage && (
              <div className="mb-5 flex items-start gap-3 bg-[#FFEEEE] border border-[#EE0000]/30 rounded-xl px-5 py-3">
                <Warning weight="bold" className="w-4 h-4 text-[#CC0000] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#CC0000]">Search limit reached</p>
                  <p className="text-xs text-[#994444] mt-0.5">{searchLimitMessage}</p>
                </div>
              </div>
            )}

            {generateError && (
              <div className="mb-5 flex items-start gap-3 bg-[#FFEEEE] border border-[#EE0000]/30 rounded-xl px-5 py-3">
                <Warning weight="bold" className="w-4 h-4 text-[#CC0000] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#CC0000]">Generation failed</p>
                  <p className="text-xs text-[#994444] mt-0.5">
                    {generateError} This is usually temporary (the server already retries once automatically) —
                    give it another shot.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={isCalculating}
                    className="mt-2 text-xs font-semibold text-[#CC0000] hover:underline disabled:opacity-60"
                  >
                    Try again →
                  </button>
                </div>
              </div>
            )}

            {view === "idle" ? (
              /* ── Idle placeholder ── */
              <div className="flex flex-col h-full">
                <div className="flex flex-col items-center justify-center flex-1 text-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mb-5">
                    <ClipboardText weight="light" className="w-8 h-8 text-[#888888]" />
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
                {slowNotice && (
                  <p className="text-xs font-semibold text-[#FF5500] mt-5">
                    Still working — results are taking a little longer than usual…
                  </p>
                )}
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="inline-flex items-center gap-2 border border-[#E8E8E8] bg-cream text-[#555555] font-semibold text-sm px-4 py-2 rounded-lg mt-6 hover:border-[#EE0000] hover:text-[#EE0000] transition-colors"
                >
                  <StopIcon className="w-3.5 h-3.5" />
                  Stop
                </button>
              </div>
            ) : (
              /* ── Results ── */
              <>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                  <div>
                    <h1 className="text-3xl md:text-4xl text-[#111111] tracking-tight leading-tight">
                      Career Path Results
                    </h1>
                    {generatedByProvider && (
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
                      className="inline-flex items-center justify-center gap-2 border border-[#E8E8E8] bg-cream text-[#888888] font-semibold text-sm px-4 py-2 rounded-lg shadow-sm hover:border-[#000c] hover:text-[#000c] transition-colors"
                    >
                      <ShareNetwork weight="bold" className="w-4 h-4" />
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
                          className="appearance-none bg-cream border border-[#E8E8E8] rounded-lg px-4 py-2 text-sm text-[#111111] pr-10 shadow-sm focus:outline-none focus:border-[#000c] min-w-[168px] cursor-pointer"
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
                          ? "text-[#111111] border-b-2 border-[#000c]"
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

                {isCalculating && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    {slowNotice && (
                      <p className="text-xs font-semibold text-[#FF5500]">
                        Still working — results are taking a little longer than usual…
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={stopGeneration}
                      className="inline-flex items-center gap-2 border border-[#E8E8E8] bg-cream text-[#555555] font-semibold text-xs px-3 py-1.5 rounded-lg hover:border-[#EE0000] hover:text-[#EE0000] transition-colors shrink-0 sm:ml-auto"
                    >
                      <StopIcon className="w-3 h-3" />
                      Stop
                    </button>
                  </div>
                )}
                <div className="transition-opacity duration-300" style={{ opacity: isCalculating ? 0 : 1 }}>
                  {isCalculating ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="bg-[#F5F5F5] rounded-xl border border-[#E8E8E8] h-14 animate-pulse" />
                      ))}
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

                        {gridCards.length > 0 && (
                          <div>
                            <h2 className="text-2xl text-[#111111] mb-1">Recommended Career Paths</h2>
                            <p className="text-sm text-[#888888] mb-4">
                              Ranked by best fit — read top to bottom, or compare bar length at a glance.
                            </p>
                            <div className="space-y-2">
                              {gridCards.map((c, i) => (
                                <LeaderboardRow
                                  key={c.id}
                                  career={c}
                                  rank={i + 1}
                                  fillPercent={leaderboardFill.get(c.id) ?? 0}
                                  favourites={favourites}
                                  onToggleFavourite={toggleFavourite}
                                />
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
              className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] transition-opacity"
              onClick={() => {
                setPillOpen(false);
                setModelMenuOpen(false);
              }}
            />
          )}

          {/* Expanded personality panel */}
          <div
            className="fixed z-40 left-1/2 -translate-x-1/2 w-[calc(100vw-32px)] max-w-sm md:max-w-md bg-cream rounded-2xl shadow-2xl border border-[#E8E8E8]"
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
                generateDisabled={groqOnCooldown}
                generateLabel={groqOnCooldown ? `Wait ${groqCooldownRemainingSec}s` : undefined}
              />
            </div>
          </div>

          {/* The pill */}
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-32px)] max-w-[360px] md:max-w-[600px]">
            <div className="flex items-stretch bg-cream border border-[#E8E8E8] rounded-full shadow-lg shadow-black/10 h-14">

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
                  <User weight="bold" className="w-3 h-3 text-[#555555]" />
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
                  <CaretDown weight="bold" className="w-3.5 h-3.5" />
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
                    className="absolute bottom-full right-0 mb-3 w-60 bg-cream border border-[#E8E8E8] rounded-xl shadow-xl overflow-hidden z-50"
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

              {/* ── Generate button — BRIGHT ORANGE. Becomes a Stop button while calculating. ── */}
              <button
                type="button"
                onClick={() => {
                  if (isCalculating) {
                    stopGeneration();
                    return;
                  }
                  if (groqOnCooldown) return;
                  const payload = formRef.current?.buildPayload() ?? latestPayloadRef.current ?? undefined;
                  if (payload) handleSubmitWithValues(payload);
                  else handleSubmit();
                  setPillOpen(false);
                  setModelMenuOpen(false);
                }}
                disabled={!isCalculating && groqOnCooldown}
                title={
                  isCalculating
                    ? "Stop generating"
                    : groqOnCooldown
                      ? `Groq cooldown — wait ${groqCooldownRemainingSec}s`
                      : undefined
                }
                className="flex items-center gap-2 px-6 rounded-r-full text-white text-sm font-bold transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ backgroundColor: isCalculating ? "#CC3300" : "#FF5500" }}
              >
                {isCalculating ? (
                  <>
                    <StopIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Stop</span>
                  </>
                ) : groqOnCooldown ? (
                  <span>Wait {groqCooldownRemainingSec}s</span>
                ) : (
                  <>
                    <Lightning weight="bold" className="w-3.5 h-3.5" />
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
        <MagnifyingGlass weight="bold" className="w-6 h-6 text-[#888888]" />
      </div>
      <p className="text-[#111111] font-semibold text-base mb-1">No results in this domain</p>
      <p className="text-sm text-[#888888]">
        No careers match <span className="font-medium text-[#111111]">{domain}</span>.
        Try a different domain or generate a new set.
      </p>
    </div>
  );
}
