"use client";

import { useRef, useState } from "react";
import { CaretDown, CaretLeft, CaretRight, MagnifyingGlass, ShareNetwork, Star } from "@phosphor-icons/react";
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
  return <Star weight="fill" className={className} />;
}

function ChevronDown({ className = "w-4 h-4" }: { className?: string }) {
  return <CaretDown weight="bold" className={className} />;
}
function ChevronLeft({ className = "w-4 h-4" }: { className?: string }) {
  return <CaretLeft weight="bold" className={className} />;
}
function ChevronRight({ className = "w-4 h-4" }: { className?: string }) {
  return <CaretRight weight="bold" className={className} />;
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
    <div className="min-h-screen bg-cream">
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
            className="absolute top-3 -right-3 z-10 w-6 h-6 bg-cream border border-[#E8E8E8] rounded-full shadow-sm flex items-center justify-center text-[#FF5500] hover:bg-[#FFF0E5] transition-colors"
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
                className="inline-flex items-center justify-center gap-2 border border-[#E8E8E8] bg-cream text-[#555555] font-semibold text-sm px-4 py-2 rounded-lg shadow-sm hover:border-[#FF5500] hover:text-[#FF5500] transition-colors"
              >
                <ShareNetwork weight="bold" className="w-4 h-4" />
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
                  className="appearance-none bg-cream border border-[#E8E8E8] rounded-lg px-4 py-2 text-sm text-[#111111] pr-10 shadow-sm focus:outline-none focus:border-[#FF5500] min-w-[168px] cursor-pointer"
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
                <div className="bg-cream rounded-xl border border-[#E8E8E8] h-64 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="bg-cream rounded-xl border border-[#E8E8E8] h-44 animate-pulse"
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
        <MagnifyingGlass weight="bold" className="w-6 h-6 text-[#FF5500]" />
      </div>
      <p className="text-[#111111] font-semibold text-base mb-1">No results in this domain</p>
      <p className="text-sm text-[#888888]">
        No careers match the <span className="font-medium text-[#FF5500]">{domain}</span> filter in this result set.
        Try a different domain or click Submit for a new set.
      </p>
    </div>
  );
}
