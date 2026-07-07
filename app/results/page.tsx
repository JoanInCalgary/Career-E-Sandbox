"use client";

import { useRef, useState } from "react";
import AppNav from "@/src/components/AppNav";
import AssessmentForm, { type AssessmentValues } from "@/src/components/AssessmentForm";
import {
  FlaggedCard,
  FavouriteCard,
  IconCheckCircle,
  IconWarningCircle,
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickRandom(current?: ResultSet): ResultSet {
  if (!current || ALL_RESULT_SETS.length <= 1) {
    return ALL_RESULT_SETS[Math.floor(Math.random() * ALL_RESULT_SETS.length)];
  }
  const others = ALL_RESULT_SETS.filter((s) => s.id !== current.id);
  return others[Math.floor(Math.random() * others.length)];
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
function ChevronLeft({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function ChevronRight({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const [resultSet, setResultSet] = useState<ResultSet>(() => pickRandom());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"recommended" | "flagged">("recommended");
  const [domainFilter, setDomainFilter] = useState<CareerDomain>("All Domains");
  const [isCalculating, setIsCalculating] = useState(false);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const isCalculatingRef = useRef(false);

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

  // Primary is always the first recommended card — fixed, never gets replaced
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

  function handleSubmit() {
    if (isCalculatingRef.current) return;
    isCalculatingRef.current = true;
    setIsCalculating(true);
    setTimeout(() => {
      setResultSet((prev) => pickRandom(prev));
      setActiveTab("recommended");
      setDomainFilter("All Domains");
      setFavourites(new Set());
      setIsCalculating(false);
      isCalculatingRef.current = false;
    }, 700);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleValuesChange(_next: AssessmentValues) {
    // Form values are captured but don't drive result selection in this PoC.
  }

  return (
    <div className="min-h-screen bg-white">
      <AppNav active="search" />

      <div className="flex min-h-[calc(100vh-56px)]">
        {/* ── Collapsible Sidebar ── */}
        <div className={`relative flex-shrink-0 transition-all duration-300 ${sidebarOpen ? "w-80" : "w-10"} hidden md:block`}>
          <div
            className={`absolute inset-0 overflow-hidden transition-opacity duration-200 ${
              sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            <AssessmentForm
              layout="sidebar"
              onValuesChange={handleValuesChange}
              onSubmit={handleSubmit}
              isLoading={isCalculating}
            />
          </div>

          <button
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="absolute top-3 -right-3 z-10 w-6 h-6 bg-white border border-[#E8E8E8] rounded-full shadow-sm flex items-center justify-center text-[#FF5500] hover:bg-[#FFF0E5] transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </div>

        {/* ── Main Content ── */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto min-w-0">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-[#111111] tracking-tight leading-tight">
                Career Path Results
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 border border-[#E8E8E8] bg-white text-[#555555] font-semibold text-sm px-4 py-2 rounded-lg shadow-sm hover:border-[#FF5500] hover:text-[#FF5500] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share / Export
              </button>

              {/* Domain filter */}
              <div>
                <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-1.5">
                  Filter Domain
                </p>
                <div className="relative">
                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value as CareerDomain)}
                  className="appearance-none bg-white border border-[#E8E8E8] rounded-lg px-4 py-2 text-sm text-[#111111] pr-10 shadow-sm focus:outline-none focus:border-[#FF5500] min-w-[168px] cursor-pointer"
                >
                  {CAREER_DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#555555]">
                  <ChevronDown />
                </span>
              </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-[#E8E8E8] mb-6">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab("recommended")}
                className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors whitespace-nowrap -mb-px ${
                  activeTab === "recommended"
                    ? "text-[#FF5500] border-b-2 border-[#FF5500]"
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

          {/* Cards */}
          <div
            className="transition-opacity duration-300"
            style={{ opacity: isCalculating ? 0 : 1 }}
          >
            {isCalculating ? (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-[#E8E8E8] h-64 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl border border-[#E8E8E8] h-44 animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ) : activeTab === "recommended" ? (
              allRecommended.length === 0 ? (
                <EmptyState domain={domainFilter} />
              ) : (
                <div className="space-y-6">
                  {/* Favourites section */}
                  {favouriteCards.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StarFilledIcon className="w-5 h-5 text-[#FFAA00]" />
                        <h2 className="text-base font-bold text-[#111111]">Favourites ({favouriteCards.length})</h2>
                      </div>
                      <p className="text-sm text-[#555555] mb-4">These are the favourites from your current results, and will be added to the list on your main dashboard.</p>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {favouriteCards.map((c) => (
                          <FavouriteCard key={c.id} career={c} favourites={favourites} onToggleFavourite={toggleFavourite} />
                        ))}
                      </div>
                      <div className="border-t border-[#E8E8E8] mt-6" />
                    </div>
                  )}

                  {/* Primary card — only shown when not favourited */}
                  {primaryCard && !primaryIsFavourited && (
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] mb-1">Best Match</h2>
                      <p className="text-sm text-[#555555] mb-4">This career path is the most aligned with your personality and preferences.</p>
                      <PrimaryCard career={primaryCard} favourites={favourites} onToggleFavourite={toggleFavourite} />
                    </div>
                  )}

                  {/* Grid cards — all non-primary non-favourited */}
                  {gridCards.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-[#111111] mb-1">Other Considerable Options</h2>
                      <p className="text-sm text-[#555555] mb-4">Additional career paths that match your profile well, worth exploring further.</p>
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
                <h2 className="text-2xl font-bold text-[#111111] mb-1">Careers to Avoid</h2>
                <p className="text-sm text-[#555555] mb-5">
                  These paths severely conflict with your personality profile and preferences.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flagged.map((c) => (
                    <FlaggedCard key={c.id} career={c} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function EmptyState({ domain }: { domain: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-[#FDECD8] flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-[#FF5500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="text-[#111111] font-semibold text-base mb-1">No results in this domain</p>
      <p className="text-sm text-[#888888]">
        No careers match the <span className="font-medium text-[#FF5500]">{domain}</span> filter in this result set.
        Try a different domain or click Submit for a new set.
      </p>
    </div>
  );
}
