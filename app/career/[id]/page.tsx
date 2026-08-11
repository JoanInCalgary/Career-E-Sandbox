"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppNav from "@/src/components/AppNav";
import {
  ArrowLeft,
  TrendUp,
  TrendDown,
  Minus,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  XCircle,
  Warning,
  Brain,
  Lightning,
  Star,
  Users,
  CaretDown,
  ChartBar,
} from "@phosphor-icons/react";
import type { CareerMatch } from "@/src/lib/mockData";
import { getEnabledAssessmentIds, type FullAssessmentPayload } from "@/src/lib/types";
import { EDU_TARGET_LABELS } from "@/src/lib/formOptions";
import { getHistoryEntries } from "@/src/lib/modelRuns";
import { getFavourites } from "@/src/lib/favourites";
import {
  getTypeRankings,
  getQuartile,
  QUARTILE_META,
  RANKING_FRAMEWORK_OPTIONS,
  type RankingFramework,
  type Quartile,
  type TypeRanking,
} from "@/src/lib/typeRankings";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ResolvedCareer {
  career: CareerMatch;
  /** The assessment inputs that produced this result, if we found it via history. */
  payload?: FullAssessmentPayload;
}

// ── Lookup ────────────────────────────────────────────────────────────────────

/**
 * Finds the real generated career matching `id` by searching the user's saved
 * results history first (most recent search first, so a freshly generated
 * result is found immediately), then favourites as a fallback for careers
 * whose originating search has aged out of history.
 */
function resolveCareer(id: string): ResolvedCareer | null {
  for (const entry of getHistoryEntries()) {
    const match = entry.careers.find((c) => c.id === id);
    if (match) return { career: match, payload: entry.payload };
  }
  const fav = getFavourites().find((f) => f.career.id === id);
  if (fav) return { career: fav.career };
  return null;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return <ArrowLeft weight="bold" className="w-4 h-4" />;
}
function IconBriefcase() {
  return <Briefcase weight="bold" className="w-4 h-4 shrink-0" />;
}
function IconGradCap() {
  return <GraduationCap weight="bold" className="w-4 h-4 shrink-0" />;
}
function IconShield() {
  return <ShieldCheck weight="bold" className="w-3.5 h-3.5 shrink-0" />;
}
function IconX() {
  return <XCircle weight="bold" className="w-3.5 h-3.5 shrink-0" />;
}
function MarketIcon({ outlook }: { outlook: CareerMatch["marketOutlook"] }) {
  if (outlook === "up") return <TrendUp weight="bold" className="w-4 h-4 shrink-0 text-[#00BB00]" />;
  if (outlook === "down") return <TrendDown weight="bold" className="w-4 h-4 shrink-0 text-[#EE0000]" />;
  return <Minus weight="bold" className="w-4 h-4 shrink-0 text-[#888888]" />;
}
function ChevronDown() {
  return <CaretDown weight="bold" className="w-4 h-4" />;
}

// ── Quartile view sub-components ────────────────────────────────────────────

function QuartileFilter({ value, onChange }: { value: Quartile; onChange: (v: Quartile) => void }) {
  const options: { value: Quartile; label: string }[] = [
    { value: "all", label: "All types" },
    { value: "q1", label: "Top Quartile — best fit" },
    { value: "q2", label: "2nd Quartile" },
    { value: "q3", label: "3rd Quartile" },
    { value: "q4", label: "Bottom Quartile — worst fit" },
  ];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Quartile)}
        className="appearance-none bg-cream border border-[#E8E8E8] rounded-lg px-3 py-1.5 text-xs text-[#111111] pr-8 focus:outline-none focus:border-[#FF5500] cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#555555]">
        <ChevronDown />
      </span>
    </div>
  );
}

function RankingRow({ rank, item, quartile }: { rank: number; item: TypeRanking; quartile: 1 | 2 | 3 | 4 }) {
  const meta = QUARTILE_META[quartile];
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[#E8E8E8] bg-cream hover:bg-[#F5F5F5] transition-colors">
      <span className="text-sm font-bold w-6 shrink-0 text-center mt-0.5 text-[#888888]">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-bold text-[#111111]">{item.type}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto ${meta.badge}`}>{meta.label}</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${item.fitScore}%` }} />
          </div>
          <span className={`text-[11px] font-bold w-8 text-right shrink-0 ${meta.text}`}>{item.fitScore}%</span>
        </div>
        <p className="text-[11px] text-[#555555] leading-snug">{item.label}</p>
      </div>
    </div>
  );
}

function RankingPanel({
  items,
  filter,
  onFilterChange,
}: {
  items: TypeRanking[];
  filter: Quartile;
  onFilterChange: (v: Quartile) => void;
}) {
  const sorted = [...items].sort((a, b) => b.fitScore - a.fitScore);
  const filtered =
    filter === "all"
      ? sorted
      : sorted.filter((_, i) => getQuartile(i + 1, sorted.length) === parseInt(filter[1], 10));

  return (
    <div>
      <div className="flex items-center justify-end mb-3">
        <QuartileFilter value={filter} onChange={onFilterChange} />
      </div>

      {filter === "all" && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {([1, 2, 3, 4] as const).map((q) => (
            <span key={q} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${QUARTILE_META[q].badge}`}>
              Q{q}: {QUARTILE_META[q].label}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((item, i) => {
          const globalRank = sorted.findIndex((s) => s.type === item.type) + 1;
          const quartile = getQuartile(globalRank, sorted.length);
          return (
            <RankingRow key={item.type} rank={filter === "all" ? i + 1 : globalRank} item={item} quartile={quartile} />
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-[#888888] text-center py-6">No types in this quartile.</p>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CareerDetailPage() {
  const params = useParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");
  const id = decodeURIComponent(rawId);

  const [resolved, setResolved] = useState<ResolvedCareer | null | undefined>(undefined);
  const [activeFramework, setActiveFramework] = useState<RankingFramework>("mbti");
  const [quartileFilter, setQuartileFilter] = useState<Quartile>("all");

  useEffect(() => {
    setResolved(resolveCareer(id));
  }, [id]);

  function handleFrameworkChange(fw: RankingFramework) {
    setActiveFramework(fw);
    setQuartileFilter("all");
  }

  // Hydrating from the in-memory store — avoid a flash of "not found".
  if (resolved === undefined) {
    return (
      <div className="min-h-screen bg-cream">
        <AppNav active="search" />
        <main className="px-6 md:px-8 py-16 text-center text-sm text-[#888888]">Loading career…</main>
      </div>
    );
  }

  if (!resolved) {
    return (
      <div className="min-h-screen bg-cream">
        <AppNav active="search" />
        <main className="px-6 md:px-8 py-16 text-center">
          <p className="text-lg font-bold text-[#111111] mb-2">We couldn&apos;t find that career.</p>
          <p className="text-sm text-[#888888] mb-6 max-w-sm mx-auto">
            This can happen if the result is from an older search that&apos;s no longer saved on this device.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-[#FF5500] hover:bg-[#DD4400] transition-colors text-white font-semibold text-sm px-5 py-2.5 rounded-lg"
          >
            Run a new search
          </Link>
        </main>
      </div>
    );
  }

  const { career, payload } = resolved;
  const isFlagged = career.status === "flagged";

  return (
    <div className="min-h-screen bg-cream">
      <AppNav active="search" />

      <main className="px-6 md:px-8 py-6 md:py-8">
        <Link href="/search" className="inline-flex items-center gap-1.5 text-sm text-[#FF5500] font-semibold hover:underline mb-6">
          <IconArrowLeft />
          Back to Results
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ── LEFT: Career detail (sticky) ── */}
          <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-20">
            <section className="bg-cream rounded-2xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[11px] font-bold text-[#888888] uppercase tracking-widest">{career.domain}</p>
                <span className="text-[11px] text-[#CCCCCC]">·</span>
                <p className="text-[11px] font-bold text-[#888888] uppercase tracking-widest">{career.sector}</p>
              </div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <h1 className="text-xl md:text-2xl font-bold text-[#111111] tracking-tight leading-snug">
                  {career.title}
                </h1>
                <span
                  className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full text-white ${
                    isFlagged ? "bg-[#EE0000]" : "bg-[#0055FF]"
                  }`}
                  style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
                >
                  {career.matchPercent}% fit
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <MarketIcon outlook={career.marketOutlook} />
                  <span className="font-medium text-[#111111]">{career.marketOutlookLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#0055FF]">
                  <IconBriefcase />
                  <span className="text-[#555555]">{career.salaryRange}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${!career.educationMatchesAnchor ? "text-[#EE0000]" : "text-[#888888]"}`}>
                  <IconGradCap />
                  <span>{career.educationRequired}</span>
                  {!career.educationMatchesAnchor && (
                    <span className="text-[10px] font-bold text-[#EE0000]">ABOVE ANCHOR</span>
                  )}
                </div>
              </div>

              <div className="border-t border-[#E8E8E8] pt-4 space-y-3">
                {isFlagged && career.flagReason && (
                  <div className="flex items-start gap-2 text-sm text-[#9f1239] bg-[#fef2f2] rounded-lg px-3 py-2.5">
                    <Warning weight="bold" className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{career.flagReason}</span>
                  </div>
                )}
                <p className="text-sm text-[#555555] leading-relaxed">{career.keySynergy}</p>
                {career.keyFriction && (
                  <p className="text-sm text-[#888888] leading-relaxed pl-3 border-l-2 border-[#E8E8E8] italic">
                    {career.keyFriction}
                  </p>
                )}
              </div>
            </section>

            {(career.pros.length > 0 || career.cons.length > 0) && (
              <section className="bg-cream rounded-2xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
                  {career.pros.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-3">
                        <IconShield />
                        <span className="text-[10px] font-bold text-[#00BB00] uppercase tracking-widest">Pros</span>
                      </div>
                      <ul className="space-y-2">
                        {career.pros.map((p) => (
                          <li key={p} className="flex items-start gap-2 text-sm text-[#111111]">
                            <span className="text-[#00BB00] mt-0.5 font-bold shrink-0">•</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {career.cons.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-3 mt-1">
                        <IconX />
                        <span className="text-[10px] font-bold text-[#EE0000] uppercase tracking-widest">Cons</span>
                      </div>
                      <ul className="space-y-2">
                        {career.cons.map((c) => (
                          <li key={c} className="flex items-start gap-2 text-sm text-[#111111]">
                            <span className="text-[#EE0000] mt-0.5 font-bold shrink-0">•</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT: What actually drove this match ── */}
          <div className="lg:col-span-2">
            <div className="bg-cream rounded-2xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
              <div className="flex items-center gap-2 mb-1">
                <Brain weight="bold" className="w-4 h-4 text-[#FF5500]" />
                <h2 className="text-sm font-bold text-[#111111]">Matched Against Your Profile</h2>
              </div>
              <p className="text-[11px] text-[#888888] mb-5">
                This match was generated from the personality inputs you submitted with this search.
              </p>

              {payload ? (
                <div className="space-y-5">
                  {(() => {
                    const enabledAssessments = getEnabledAssessmentIds(payload);
                    const assessmentChips = [
                      { id: "mbti", label: "MBTI", value: payload.mbtiType ? `${payload.mbtiType}${payload.variant ? `-${payload.variant}` : ""}` : "—" },
                      { id: "spark", label: "Primary Sparketype", value: payload.primarySpark || "—" },
                      { id: "ennea", label: "Enneagram", value: payload.enneagramType || "—" },
                      { id: "disc", label: "DiSC", value: payload.discStyle || "—" },
                      { id: "astro", label: "Sun Sign", value: payload.sunSign || "—" },
                      { id: "zodiac", label: "Chinese Zodiac", value: [payload.zodiacAnimal, payload.zodiacElement].filter(Boolean).join(" / ") || "—" },
                      {
                        id: "bigfive",
                        label: "Big Five",
                        value: `O:${payload.bigFive.O} C:${payload.bigFive.C} E:${payload.bigFive.E} A:${payload.bigFive.A} N:${payload.bigFive.N}`,
                      },
                      { id: "clifton", label: "CliftonStrengths", value: payload.strengths.filter(Boolean).join(", ") || "—" },
                    ].filter((chip) => enabledAssessments.has(chip.id));

                    if (assessmentChips.length === 0) return null;
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {assessmentChips.map(({ label, value }) => (
                          <div key={label} className="rounded-lg border border-[#E8E8E8] bg-[#F5F5F5] px-3 py-2">
                            <p className="text-[8px] font-bold text-[#888888] uppercase tracking-widest mb-0.5">{label}</p>
                            <p className="text-[11px] font-semibold text-[#111111] leading-snug">{value}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {(() => {
                    const optionals = new Set(payload.enabledOptional ?? []);
                    const prefs = [
                      optionals.has("workEnv") && { label: "Work Environment", value: payload.workEnv },
                      optionals.has("orgStructure") && { label: "Org Structure", value: payload.orgStructure },
                      optionals.has("targetEdu") && { label: "Target Education", value: EDU_TARGET_LABELS[payload.targetEduIndex] },
                      optionals.has("taskDislikes") && payload.taskDislikes.length > 0 && {
                        label: "Task Dislikes",
                        value: payload.taskDislikes.join(", "),
                      },
                      optionals.has("demoAge") && payload.ageRange && { label: "Age Range", value: payload.ageRange },
                      optionals.has("demoGender") && payload.gender && { label: "Gender", value: payload.gender },
                      optionals.has("demoRace") && payload.race && { label: "Race / Ethnicity", value: payload.race },
                    ].filter(Boolean) as { label: string; value: string }[];

                    if (prefs.length === 0) return null;
                    return (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Users weight="bold" className="w-3.5 h-3.5 text-[#888888]" />
                          <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">
                            Preferences included in this search
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {prefs.map((p) => (
                            <span
                              key={p.label}
                              className="text-[11px] font-semibold text-[#555555] bg-[#F5F5F5] border border-[#E8E8E8] rounded-full px-3 py-1"
                            >
                              {p.label}: {p.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex items-start gap-2 text-sm text-[#555555] bg-[#F5F5F5] rounded-lg px-3 py-3">
                  <Lightning weight="bold" className="w-4 h-4 shrink-0 mt-0.5 text-[#888888]" />
                  <span>
                    This career was found via your favourites — the original search inputs are no longer saved on
                    this device, so we can&apos;t show what drove the match. The summary above is still the real result.
                  </span>
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-[#E8E8E8] flex items-center gap-2 text-[11px] text-[#888888]">
                <Star weight="bold" className="w-3.5 h-3.5 text-[#FFAA00]" />
                Match percentage and every field above come directly from this search&apos;s generated result — not
                a generic template.
              </div>
            </div>

            {/* ── Quartile view: how every type in a framework would fit this career ── */}
            <div className="bg-cream rounded-2xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 mt-6">
              <div className="flex items-center gap-2 mb-1">
                <ChartBar weight="bold" className="w-4 h-4 text-[#FF5500]" />
                <h2 className="text-sm font-bold text-[#111111]">Fit Rankings by Type</h2>
              </div>
              <p className="text-[11px] text-[#888888] mb-4 leading-relaxed">
                Exploratory only — shows how every type within a framework would rank against this specific career,
                split into quartiles. Not based on your submitted profile above, and not a validated psychometric
                result — use it to see the range of fits this role could have.
              </p>

              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <p className="text-[11px] font-bold text-[#888888] uppercase tracking-widest shrink-0">View rankings by</p>
                <div className="relative">
                  <select
                    value={activeFramework}
                    onChange={(e) => handleFrameworkChange(e.target.value as RankingFramework)}
                    className="appearance-none bg-cream border border-[#E8E8E8] rounded-lg px-3 py-1.5 text-sm font-semibold text-[#111111] pr-8 focus:outline-none focus:border-[#FF5500] cursor-pointer"
                  >
                    {RANKING_FRAMEWORK_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#555555]">
                    <ChevronDown />
                  </span>
                </div>
              </div>

              <RankingPanel
                items={getTypeRankings(career, activeFramework)}
                filter={quartileFilter}
                onFilterChange={setQuartileFilter}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
