"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppNav from "@/src/components/AppNav";
import ModelComparisonPanel from "@/src/components/ModelComparisonPanel";
import { DEFAULT_USER_EMAIL, DEFAULT_USER_NAME, useAuth } from "@/src/components/AuthProvider";

// ── Mock data ─────────────────────────────────────────────────────────────────

const LAST_SEARCH_DATE = "Jun 12, 2026";

const ASSESSMENT_SNAPSHOT = [
  { label: "MBTI", value: "INTJ-A" },
  { label: "Sparketype", value: "Maven · Sage · Anti: Advisor" },
  { label: "Enneagram", value: "Type 5 — Investigator" },
  { label: "DiSC", value: "Conscientiousness (C)" },
  { label: "Big Five", value: "O:65 C:70 E:30 A:55 N:40" },
  { label: "CliftonStrengths", value: "Strategic · Learner · Analytical · Ideation" },
  { label: "Chinese Zodiac", value: "Dragon — Water" },
  { label: "Astrology", value: "Scorpio" },
];

const PREFERENCE_SNAPSHOT = [
  { label: "Work Environment", value: "Fully Remote" },
  { label: "Target Education", value: "Master's Degree" },
  { label: "Task Dislikes", value: "Cold Outreach / Sales · Repetitive Manual Tasks" },
  { label: "Org Structure", value: "Hierarchical" },
];

const RECENT_HISTORY = [
  {
    id: "run-001",
    date: "Jun 12, 2026",
    time: "2:34 PM",
    mbti: "INTJ-A",
    workEnv: "Fully Remote",
    topMatch: "Data Scientist / Systems Architect",
    matchPercent: 94,
  },
  {
    id: "run-002",
    date: "Jun 8, 2026",
    time: "10:15 AM",
    mbti: "ENFP-A",
    workEnv: "Hybrid",
    topMatch: "UX Research Lead / Design Strategist",
    matchPercent: 93,
  },
  {
    id: "run-003",
    date: "May 29, 2026",
    time: "4:52 PM",
    mbti: "INFJ-T",
    workEnv: "Fully Remote",
    topMatch: "Data Scientist / Systems Architect",
    matchPercent: 91,
  },
];

type FavItem = {
  id: string;
  careerSlug: string;
  title: string;
  sector: string;
  matchPercent: number;
  fromSearch: string;
  marketOutlook: "up" | "flat" | "down";
  marketLabel: string;
  salaryRange: string;
  educationRequired: string;
  synergy: string;
  pros: string[];
  cons: string[];
};

const INITIAL_FAVOURITES: FavItem[] = [
  {
    id: "fav-1",
    careerSlug: "data-scientist",
    title: "Data Scientist / Systems Architect",
    sector: "TECHNOLOGY",
    matchPercent: 94,
    fromSearch: "Jun 12, 2026",
    marketOutlook: "up",
    marketLabel: "High Growth (18% YoY)",
    salaryRange: "$110k – $180k",
    educationRequired: "MS / PhD Preferred",
    synergy: "Analytical systems thinking maps perfectly to ML pipeline and data architecture roles.",
    pros: [
      "Direct application of deep analytical and systems thinking",
      "Strong remote-first culture across the field",
      "Exceptional long-term salary trajectory",
    ],
    cons: [
      "Requires continuous learning of rapidly evolving tools",
      "Senior roles demand team leadership and communication",
    ],
  },
  {
    id: "fav-2",
    careerSlug: "research-scientist",
    title: "Research Scientist",
    sector: "ACADEMIA / RESEARCH",
    matchPercent: 88,
    fromSearch: "Jun 12, 2026",
    marketOutlook: "flat",
    marketLabel: "Stable (3% YoY)",
    salaryRange: "$80k – $130k",
    educationRequired: "PhD Required",
    synergy: "Independent deep-focus research aligns strongly with introverted, hypothesis-driven profiles.",
    pros: [
      "Deep intellectual autonomy with minimal external interruption",
      "Publishing record builds lasting career equity",
      "High alignment with values-driven work",
    ],
    cons: [
      "Grant writing creates significant administrative overhead",
      "Academic job market remains highly competitive",
    ],
  },
  {
    id: "fav-3",
    careerSlug: "ux-research-lead",
    title: "UX Research Lead / Design Strategist",
    sector: "DESIGN / CREATIVE",
    matchPercent: 93,
    fromSearch: "Jun 8, 2026",
    marketOutlook: "up",
    marketLabel: "Growing (15% YoY)",
    salaryRange: "$95k – $155k",
    educationRequired: "BS / MS Preferred",
    synergy: "Strategic pattern recognition and user empathy translate directly to research-led design.",
    pros: [
      "Blends analytical rigor with creative problem-solving",
      "Cross-industry demand creates strong job security",
      "Remote-compatible across most organisations",
    ],
    cons: [
      "Requires regular stakeholder presentations",
      "Tight deadlines in agency settings can be high pressure",
    ],
  },
  {
    id: "fav-4",
    careerSlug: "management-consultant",
    title: "Management Consultant",
    sector: "BUSINESS / CONSULTING",
    matchPercent: 81,
    fromSearch: "May 29, 2026",
    marketOutlook: "up",
    marketLabel: "Growing (8% YoY)",
    salaryRange: "$90k – $160k",
    educationRequired: "MBA Preferred",
    synergy: "Strategic systems thinking and structured problem-solving are core consulting competencies.",
    pros: [
      "Exposure to diverse industries accelerates strategic growth",
      "Strong compensation and advancement trajectory",
      "High intellectual variety across engagements",
    ],
    cons: [
      "Extensive client travel and irregular hours",
      "Significant interpersonal and presentation demands",
    ],
  },
];

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconTrendUp() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
function IconTrendFlat() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}
function IconTrendDown() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17H5m8 0l-8-8 4 4 6-6" />
    </svg>
  );
}
function IconBriefcase() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="2" y="7" width="20" height="14" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
function IconXCircle() {
  return (
    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9l-6 6M9 9l6 6" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function MarketTrend({ outlook, label }: { outlook: FavItem["marketOutlook"]; label: string }) {
  const color = outlook === "up" ? "text-[#00BB00]" : outlook === "down" ? "text-[#EE0000]" : "text-[#888888]";
  const Icon = outlook === "up" ? IconTrendUp : outlook === "down" ? IconTrendDown : IconTrendFlat;
  return (
    <span className={`flex items-center gap-1 ${color}`}>
      <Icon />
      <span>{label}</span>
    </span>
  );
}

function MatchBadge({ pct }: { pct: number }) {
  return (
    <span
      className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white bg-[#0055FF]"
      style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
    >
      {pct}% match
    </span>
  );
}

// ── Favourite card (dashboard version) ───────────────────────────────────────

function DashFavCard({ fav, onDelete }: { fav: FavItem; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition-shadow flex flex-col h-full overflow-hidden">
      {confirming ? (
        /* ── Confirmation state ── */
        <div className="flex flex-col items-center justify-center flex-1 min-h-[140px] text-center gap-3 p-4 py-6">
          <div className="w-9 h-9 rounded-full bg-[#FFEEEE] flex items-center justify-center mb-1">
            <IconTrash />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111111] mb-0.5">Remove this career path?</p>
            <p className="text-xs text-[#888888]">This is permanent and cannot be undone.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="px-4 py-1.5 text-xs font-semibold border border-[#E8E8E8] rounded-lg text-[#555555] hover:bg-[#F5F5F5] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(fav.id)}
              className="px-4 py-1.5 text-xs font-semibold bg-[#EE0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* ── Normal card content ── */
        <>
          {/* Header row — not part of the clickable link */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-2 flex-wrap">
            <MatchBadge pct={fav.matchPercent} />
            <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">{fav.sector}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
              title="Remove from favourites"
              className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg border border-[#E8E8E8] text-[#888888] hover:border-[#EE0000] hover:text-[#EE0000] hover:bg-[#FFEEEE] transition-colors shrink-0"
            >
              <IconTrash />
            </button>
          </div>

          {/* Clickable body — navigates to career detail */}
          <button
            type="button"
            onClick={() => router.push(`/career/${fav.careerSlug}`)}
            className="flex-1 text-left px-4 pb-4 flex flex-col hover:bg-[#F5F5F5] transition-colors"
          >
            <h3 className="text-base font-bold text-[#111111] mb-3 leading-snug hover:text-[#FF5500] transition-colors">{fav.title}</h3>

            <div className="space-y-1 mb-3 text-sm">
              <MarketTrend outlook={fav.marketOutlook} label={fav.marketLabel} />
              <span className="flex items-center gap-1 text-[#555555]">
                <IconBriefcase />
                <span>{fav.salaryRange}</span>
              </span>
            </div>

            <p className="text-xs text-[#555555] leading-relaxed mb-3">{fav.synergy}</p>

            <div className="border-t border-[#E8E8E8] pt-3 mt-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1 mb-1.5">
                    <IconShield />
                    <span className="text-[10px] font-bold text-[#555555] uppercase tracking-widest">Pros</span>
                  </div>
                  <ul className="space-y-1">
                    {fav.pros.slice(0, 3).map((p) => (
                      <li key={p} className="flex items-start gap-1.5 text-xs text-[#111111] leading-snug">
                        <span className="text-[#FF5500] font-bold shrink-0 mt-px">•</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1.5">
                    <IconXCircle />
                    <span className="text-[10px] font-bold text-[#EE0000] uppercase tracking-widest">Cons</span>
                  </div>
                  <ul className="space-y-1">
                    {fav.cons.slice(0, 3).map((c) => (
                      <li key={c} className="flex items-start gap-1.5 text-xs text-[#111111] leading-snug">
                        <span className="text-[#EE0000] font-bold shrink-0 mt-px">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-[11px] text-[#888888] mt-3">Saved from search on {fav.fromSearch}</p>
            </div>
          </button>
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const name = user?.name ?? DEFAULT_USER_NAME;
  const email = user?.email ?? DEFAULT_USER_EMAIL;

  const [favourites, setFavourites] = useState<FavItem[]>(INITIAL_FAVOURITES);

  function handleDelete(id: string) {
    setFavourites((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="min-h-screen bg-white">
      <AppNav active="dashboard" />

      <main className="px-6 md:px-8 py-6 md:py-8">
        {/* ── Welcome header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 mb-8">
          <div>
            <p className="text-sm font-semibold text-[#FF5500] uppercase tracking-widest mb-1">
              Welcome back
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#111111] tracking-tight leading-tight">
              {name}
            </h1>
            <p className="text-sm text-[#888888] mt-1">{email}</p>
          </div>

          <Link
            href="/search?restore=true"
            className="inline-flex items-center gap-2 self-start bg-[#FF5500] hover:bg-[#DD4400] transition-colors text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Again
          </Link>
        </div>

        {/* ── Main two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Favourited Career Paths (2/3 width) — stretches to match right column ── */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 text-[#FF5500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <h2 className="text-lg font-bold text-[#111111]">
                Favourited Career Paths
                {favourites.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-[#888888]">({favourites.length})</span>
                )}
              </h2>
            </div>
            <p className="text-sm text-[#555555] mb-5">All the career paths you have bookmarked across your searches.</p>

            {favourites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#111111] mb-1">No saved career paths yet</p>
                <p className="text-xs text-[#888888]">Star results on the Search page to save them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1" style={{ gridAutoRows: "1fr" }}>
                {favourites.map((fav) => (
                  <DashFavCard key={fav.id} fav={fav} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </section>

          {/* ── RIGHT: Personality Profile + Recent History (1/3 width) ── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Personality Profile — compact mini box */}
            <section className="bg-white rounded-2xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5">
              <div className="flex items-center gap-2 mb-0.5">
                <svg className="w-4 h-4 text-[#FF5500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h2 className="text-sm font-bold text-[#111111]">Your Personality Profile</h2>
              </div>
              <p className="text-[11px] text-[#888888] mb-4">Most recent search — {LAST_SEARCH_DATE}</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Assessments column */}
                <div>
                  <p className="text-[9px] font-bold text-[#FF5500] uppercase tracking-widest mb-2">Assessments</p>
                  <div className="space-y-1.5">
                    {ASSESSMENT_SNAPSHOT.map(({ label, value }) => (
                      <div key={label} className="rounded-lg border border-[#E8E8E8] bg-[#F5F5F5] px-2.5 py-1.5">
                        <p className="text-[8px] font-bold text-[#888888] uppercase tracking-widest mb-0.5">{label}</p>
                        <p className="text-[10px] font-semibold text-[#111111] leading-snug">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Preferences column */}
                <div>
                  <p className="text-[9px] font-bold text-[#FF5500] uppercase tracking-widest mb-2">Preferences</p>
                  <div className="space-y-1.5">
                    {PREFERENCE_SNAPSHOT.map(({ label, value }) => (
                      <div key={label} className="rounded-lg border border-[#E8E8E8] bg-[#F5F5F5] px-2.5 py-1.5">
                        <p className="text-[8px] font-bold text-[#888888] uppercase tracking-widest mb-0.5">{label}</p>
                        <p className="text-[10px] font-semibold text-[#111111] leading-snug">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Recent History — compact */}
            <section className="bg-white rounded-2xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#FF5500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-sm font-bold text-[#111111]">Recent History</h2>
                </div>
                <Link href="/results-history" className="text-[11px] font-semibold text-[#FF5500] hover:underline shrink-0">
                  View All →
                </Link>
              </div>
              <p className="text-[11px] text-[#888888] mb-4">Your last few career searches.</p>

              <div className="space-y-2">
                {RECENT_HISTORY.map((entry) => (
                  <Link
                    key={entry.id}
                    href="/search?autorun=true"
                    className="block rounded-xl border border-[#E8E8E8] px-4 py-3 hover:border-[#FF5500]/40 hover:bg-[#F5F5F5] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-[#888888]">{entry.date} · {entry.time}</p>
                        <p className="text-[10px] font-semibold text-[#FF5500] uppercase tracking-wide mt-0.5">
                          {entry.mbti} · {entry.workEnv}
                        </p>
                        <p className="text-xs font-semibold text-[#111111] mt-1 truncate">{entry.topMatch}</p>
                      </div>
                      <MatchBadge pct={entry.matchPercent} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>

          </div>
        </div>

        {/* ── Model Comparison ── */}
        <div className="mt-6">
          <ModelComparisonPanel />
        </div>
      </main>
    </div>
  );
}
