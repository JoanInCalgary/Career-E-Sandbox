"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendUp as IconTrendUp,
  TrendDown as IconTrendDown,
  Minus as IconTrendFlat,
  GraduationCap as IconGradCap,
  Star as StarIconBase,
  CaretDown as IconCaretDown,
  CheckCircle as PhosphorCheckCircle,
  XCircle as PhosphorXCircle,
  WarningCircle as PhosphorWarningCircle,
} from "@phosphor-icons/react";
import { type CareerMatch } from "@/src/lib/mockData";
import { getCategoryPalette } from "@/src/lib/categoryColors";
import { categorizeReasons } from "@/src/lib/reasonCategorizer";

// ── Analytical color tokens ────────────────────────────────────────────────────
// Max-saturation: these are the ONLY colors that aren't monochrome (plus the
// per-category rainbow accents applied to each card, see categoryColors.ts).
const GREEN = "#00BB00";   // pros, growth, positive
const RED   = "#EE0000";   // cons, decline, flagged, negative
const BLUE  = "#0055FF";   // match %, neutral data

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return <StarIconBase className={className} weight={filled ? "fill" : "regular"} />;
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function MarketIcon({ outlook }: { outlook: CareerMatch["marketOutlook"] }) {
  if (outlook === "up")   return <span style={{ color: GREEN,    display: "inline-flex" }}><IconTrendUp   weight="bold" className="w-3.5 h-3.5 shrink-0" /></span>;
  if (outlook === "down") return <span style={{ color: RED,     display: "inline-flex" }}><IconTrendDown weight="bold" className="w-3.5 h-3.5 shrink-0" /></span>;
  return <span style={{ color: "#888888", display: "inline-flex" }}><IconTrendFlat weight="bold" className="w-3.5 h-3.5 shrink-0" /></span>;
}

function FavouriteButton({
  careerId,
  favourites,
  onToggle,
}: {
  careerId: string;
  favourites: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isFav = favourites.has(careerId);
  return (
    <button
      type="button"
      onClick={() => onToggle(careerId)}
      title={isFav ? "Remove from favourites" : "Save to favourites"}
      className={`w-8 h-8 flex items-center justify-center rounded-full border transition-colors ${
        isFav
          ? "border-[#FFAA00] text-[#FFAA00] bg-[#FFFBEE]"
          : "border-[#E8E8E8] text-[#CCCCCC] hover:border-[#FFAA00] hover:text-[#FFAA00]"
      }`}
    >
      <StarIcon filled={isFav} className="w-4 h-4" />
    </button>
  );
}

/**
 * Renders one pros/cons column, split into "Personality & Assessments" vs
 * "Preferences" sub-groups so users can see at a glance which of their inputs
 * drove each reason (task: separate assessment and preference signal).
 */
function CategorizedReasonColumn({
  title,
  color,
  sign,
  items,
  textSize = "text-sm",
  textColor = "#333333",
  showTitle = true,
}: {
  title: string;
  color: string;
  sign: "+" | "–";
  items: string[];
  textSize?: string;
  textColor?: string;
  showTitle?: boolean;
}) {
  if (items.length === 0) return null;
  const { assessment, preference } = categorizeReasons(items);

  const renderList = (list: string[]) => (
    <ul className="space-y-2">
      {list.map((item) => (
        <li key={item} className={`flex items-start gap-2 ${textSize} leading-snug`} style={{ color: textColor }}>
          <span className="font-bold shrink-0 mt-px" style={{ color }}>{sign}</span>
          {item}
        </li>
      ))}
    </ul>
  );

  return (
    <div>
      {showTitle && (
        <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color }}>
          {title}
        </p>
      )}
      {assessment.length > 0 && (
        <div className={preference.length > 0 ? "mb-3" : undefined}>
          <p className="text-[9px] font-semibold uppercase tracking-wide text-[#AAAAAA] mb-1.5">
            Personality &amp; Assessments
          </p>
          {renderList(assessment)}
        </div>
      )}
      {preference.length > 0 && (
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wide text-[#AAAAAA] mb-1.5">
            Preferences
          </p>
          {renderList(preference)}
        </div>
      )}
    </div>
  );
}

/** Stats footer: salary + market + education — all in Geist Mono for data feel */
function StatsFooter({ career }: { career: CareerMatch }) {
  const marketColor =
    career.marketOutlook === "up"   ? GREEN :
    career.marketOutlook === "down" ? RED   : "#888888";

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#888888]"
      style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
    >
      <span>{career.salaryRange}</span>
      <span className="flex items-center gap-1" style={{ color: marketColor }}>
        <MarketIcon outlook={career.marketOutlook} />
        {career.marketOutlookLabel}
      </span>
      <span className={`flex items-center gap-1 ${career.educationMatchesAnchor ? "" : "font-semibold"}`}
        style={{ color: career.educationMatchesAnchor ? "#888888" : RED }}>
        <IconGradCap weight="bold" className="w-3.5 h-3.5 shrink-0" />
        {career.educationRequired}
        {!career.educationMatchesAnchor && <span className="ml-0.5">↑</span>}
      </span>
    </div>
  );
}

// ── Card variants ──────────────────────────────────────────────────────────────

export function PrimaryCard({
  career,
  favourites,
  onToggleFavourite,
}: {
  career: CareerMatch;
  favourites: Set<string>;
  onToggleFavourite: (id: string) => void;
}) {
  const href = `/career/${encodeURIComponent(career.id)}`;
  const palette = getCategoryPalette(career.domain);
  return (
    <Link
      href={href}
      className="block bg-cream rounded-2xl border border-[#E8E8E8] shadow-sm hover:shadow-md hover:border-[#000c] transition-all group overflow-hidden"
    >
      {/* Top accent bar — category color */}
      <div className="h-1" style={{ backgroundColor: palette.accent }} />

      <div className="p-7">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-5">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: palette.tint, color: palette.accent }}
          >
            {career.domain}
          </span>
          <span className="text-xs text-[#888888]">{career.sector}</span>
          <div className="ml-auto flex items-center gap-2.5" onClick={(e) => e.preventDefault()}>
            {/* Match % in BLUE, Geist Mono */}
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{
                color: "#FFFFFF",
                backgroundColor: BLUE,
                fontFamily: "var(--font-mono, 'Geist Mono', monospace)",
              }}
            >
              {career.matchPercent}% fit
            </span>
            <FavouriteButton careerId={career.id} favourites={favourites} onToggle={onToggleFavourite} />
          </div>
        </div>

        {/* Title — Forum (h2 in globals) */}
        <h2 className="text-2xl md:text-3xl text-[#111111] mb-5 group-hover:text-[#FF5500] transition-colors leading-tight">
          {career.title}
        </h2>

        {/* Key synergy — hero paragraph */}
        <p className="text-base text-[#333333] leading-relaxed mb-4">
          {career.keySynergy}
        </p>

        {/* Friction — quiet, indented */}
        {career.keyFriction && (
          <p className="text-sm text-[#888888] leading-relaxed mb-6 pl-4 border-l-2 border-[#E8E8E8] italic">
            Something to keep in mind: {career.keyFriction.charAt(0).toLowerCase() + career.keyFriction.slice(1).replace(/\.$/, "")}.
          </p>
        )}

        {/* Pros / Cons with max-saturation green / red, each split by assessment vs preference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <CategorizedReasonColumn title="Works in your favour" color={GREEN} sign="+" items={career.pros} />
          <CategorizedReasonColumn title="Worth being aware of" color={RED} sign="–" items={career.cons} />
        </div>

        {/* Stats footer */}
        <div className="pt-4 border-t border-[#F0F0F0]">
          <StatsFooter career={career} />
        </div>

        <p className="text-xs font-semibold mt-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#FF5500" }}>
          View full personality breakdown →
        </p>
      </div>
    </Link>
  );
}

export function SecondaryCard({
  career,
  favourites,
  onToggleFavourite,
  isBestMatch = false,
}: {
  career: CareerMatch;
  favourites: Set<string>;
  onToggleFavourite: (id: string) => void;
  /** When true, shows a small "Best Match" badge instead of a separate oversized card. */
  isBestMatch?: boolean;
}) {
  const href = `/career/${encodeURIComponent(career.id)}`;
  const palette = getCategoryPalette(career.domain);
  return (
    <Link
      href={href}
      className={`block bg-cream rounded-2xl border shadow-sm hover:shadow-md transition-all group overflow-hidden ${
        isBestMatch ? "border-[#FF5500]" : "border-[#E8E8E8] hover:border-[#000c]"
      }`}
    >
      <div className="h-0.5" style={{ backgroundColor: isBestMatch ? "#FF5500" : palette.accent }} />
      <div className="p-6 flex flex-col h-full">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {isBestMatch && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: "#FF5500" }}
            >
              <StarIcon filled className="w-2.5 h-2.5" />
              Best Match
            </span>
          )}
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: palette.tint, color: palette.accent }}
          >
            {career.domain}
          </span>
          {/* Match % BLUE mono */}
          <span
            className="text-xs font-bold"
            style={{
              color: BLUE,
              fontFamily: "var(--font-mono, 'Geist Mono', monospace)",
            }}
          >
            {career.matchPercent}%
          </span>
          <div className="ml-auto shrink-0" onClick={(e) => e.preventDefault()}>
            <FavouriteButton careerId={career.id} favourites={favourites} onToggle={onToggleFavourite} />
          </div>
        </div>

        {/* Title — h3 stays in Geist bold per globals */}
        <h3 className="text-lg text-[#111111] mb-3 leading-snug group-hover:text-[#FF5500] transition-colors">
          {career.title}
        </h3>

        {/* Key synergy */}
        <p className="text-sm text-[#333333] leading-relaxed mb-3">{career.keySynergy}</p>

        {/* Friction */}
        {career.keyFriction && (
          <p className="text-xs text-[#888888] italic leading-relaxed mb-4">{career.keyFriction}</p>
        )}

        {/* Pros, split by assessment vs preference */}
        {career.pros.length > 0 && (
          <div className="mb-5">
            <CategorizedReasonColumn
              title="Works in your favour"
              color={GREEN}
              sign="+"
              items={career.pros}
              textSize="text-xs"
              showTitle={false}
            />
          </div>
        )}

        {/* Stats footer */}
        <div className="pt-3 border-t border-[#F0F0F0] mt-auto">
          <StatsFooter career={career} />
        </div>
      </div>
    </Link>
  );
}

// Gold / silver / bronze for the top 3 ranks, then a distinct dark slate for
// everyone else — previously ranks 2 (silver) and 4+ (plain gray) both read
// as "the same shade of gray" at a glance, so silver is pushed toward a cool
// steel-blue and the 4+ default is pushed dark, putting real contrast
// between the two instead of two near-identical grays.
const RANK_MEDAL_COLORS: Record<number, string> = {
  1: "#E5A400", // gold
  2: "#8CA3C4", // steel-blue silver
  3: "#B5651D", // bronze
};
const RANK_DEFAULT_COLOR = "#5B6472"; // dark slate for rank 4+

function ChevronIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return <IconCaretDown weight="bold" className={className} />;
}

/**
 * Leaderboard fill-bar widths, min/max-normalized across the given list
 * (rather than a raw 0-100% of matchPercent) so the bars actually read as a
 * ranking — recommended scores tend to cluster tightly (e.g. 70s-90s), so a
 * raw percentage would make every bar look nearly identical. Shared by any
 * page that renders a set of LeaderboardRows (Search results, Results
 * History) so the same list always scales consistently.
 */
export function computeLeaderboardFill(careers: CareerMatch[]): Map<string, number> {
  const fills = new Map<string, number>();
  if (careers.length === 0) return fills;
  const scores = careers.map((c) => c.matchPercent);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const spread = max - min;
  for (const c of careers) {
    const fill = spread === 0 ? 100 : 25 + ((c.matchPercent - min) / spread) * 75;
    fills.set(c.id, fill);
  }
  return fills;
}

/**
 * A single full-width ranked row for the "Top 25" leaderboard view. Rows
 * stack vertically instead of wrapping into a grid; each row's fill bar is
 * scaled (via `fillPercent`, pre-computed by the caller across the whole
 * list) so relative match strength is visible at a glance. Clicking a row
 * expands it in place to reveal the rest of the result's detail (pros,
 * cons, friction) without leaving the leaderboard; a link inside the
 * expanded panel still goes to the full career detail page.
 */
export function LeaderboardRow({
  career,
  rank,
  fillPercent,
  favourites,
  onToggleFavourite,
}: {
  career: CareerMatch;
  rank: number;
  /** 0-100 width for the background fill bar, scaled across the visible list. */
  fillPercent: number;
  favourites: Set<string>;
  onToggleFavourite: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const href = `/career/${encodeURIComponent(career.id)}`;
  const medal = RANK_MEDAL_COLORS[rank];
  const isTopRank = rank === 1;
  const marketColor =
    career.marketOutlook === "up" ? GREEN : career.marketOutlook === "down" ? RED : "#999999";

  return (
    <div
      className={`rounded-xl border bg-cream overflow-hidden transition-all ${
        isTopRank ? "border-[#FF5500]" : "border-[#E8E8E8]"
      } ${expanded ? "shadow-md" : "hover:shadow-md"}`}
    >
      {/* Header — the only part with the match-strength fill bar behind it, so
          expanding the row doesn't stretch the fill down through the detail panel. */}
      <div className="relative">
        <div
          className="absolute inset-y-0 left-0 bg-[#F4F4F4] transition-all duration-500"
          style={{ width: `${fillPercent}%` }}
        />

        {/* Not a <button>: FavouriteButton below renders its own <button>, and
            <button> cannot contain another <button> in valid HTML (it also
            breaks React hydration). A div with role="button" + keyboard
            support gets the same toggle behavior without that nesting. */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded((e) => !e)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setExpanded((x) => !x);
            }
          }}
          aria-expanded={expanded}
          className="group relative z-10 flex items-center gap-3 sm:gap-4 py-3 pl-4 pr-3 sm:pr-4 w-full min-w-0 text-left cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF5500] focus-visible:-outline-offset-2"
        >
          {/* Rank badge */}
          <span
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{
              backgroundColor: medal ?? RANK_DEFAULT_COLOR,
              fontFamily: "var(--font-mono, 'Geist Mono', monospace)",
            }}
          >
            {rank}
          </span>

          {/* Title, domain/sector, and a one-line "why it fits" so the row still
              carries result-specific info, not just a title and a score. */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-sm sm:text-base font-bold text-[#111111] truncate group-hover:text-[#FF5500] transition-colors">
                {career.title}
              </p>
              <span className="text-[11px] text-[#999999] shrink-0">
                {career.domain} · {career.sector}
              </span>
            </div>
            {career.keySynergy && (
              <p className="text-xs text-[#777777] truncate mt-0.5">{career.keySynergy}</p>
            )}
          </div>

          {/* Compact stats — collapse on narrow screens so the row stays scannable */}
          <div
            className="hidden md:flex items-center gap-4 shrink-0 text-xs text-[#555555]"
            style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
          >
            <span>{career.salaryRange}</span>
            <span
              className={`flex items-center gap-1 ${career.educationMatchesAnchor ? "" : "font-semibold"}`}
              style={{ color: career.educationMatchesAnchor ? "#888888" : RED }}
            >
              <IconGradCap className="w-3.5 h-3.5 shrink-0" />
              {career.educationRequired}
            </span>
            <span className="flex items-center gap-1" style={{ color: marketColor }}>
              <MarketIcon outlook={career.marketOutlook} />
            </span>
          </div>

          {/* Match % */}
          <span
            className="shrink-0 text-xs sm:text-sm font-bold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: BLUE, fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
          >
            {career.matchPercent}%
          </span>

          {/* Favourite — stop propagation so starring doesn't also toggle the row */}
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <FavouriteButton careerId={career.id} favourites={favourites} onToggle={onToggleFavourite} />
          </div>

          {/* Expand/collapse indicator */}
          <span className="shrink-0 text-[#999999]">
            <ChevronIcon className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </span>
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t border-[#EFEFEF] px-4 sm:pl-[4.25rem] py-4 space-y-4">
          {/* Stats repeated here for narrow screens, where the header row hides them */}
          <div
            className="md:hidden flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#555555]"
            style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
          >
            <span>{career.salaryRange}</span>
            <span
              className={`flex items-center gap-1 ${career.educationMatchesAnchor ? "" : "font-semibold"}`}
              style={{ color: career.educationMatchesAnchor ? "#888888" : RED }}
            >
              <IconGradCap className="w-3.5 h-3.5 shrink-0" />
              {career.educationRequired}
            </span>
            <span className="flex items-center gap-1" style={{ color: marketColor }}>
              <MarketIcon outlook={career.marketOutlook} />
              {career.marketOutlookLabel}
            </span>
          </div>

          {career.keyFriction && (
            <p className="text-sm text-[#888888] leading-relaxed pl-3 border-l-2 border-[#E8E8E8] italic">
              {career.keyFriction}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <CategorizedReasonColumn title="Works in your favour" color={GREEN} sign="+" items={career.pros} textSize="text-sm" />
            <CategorizedReasonColumn title="Worth being aware of" color={RED} sign="–" items={career.cons} textSize="text-sm" />
          </div>

          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF5500] hover:underline"
          >
            View full personality breakdown →
          </Link>
        </div>
      )}
    </div>
  );
}

export function FavouriteCard({
  career,
  favourites,
  onToggleFavourite,
}: {
  career: CareerMatch;
  favourites: Set<string>;
  onToggleFavourite: (id: string) => void;
}) {
  return (
    <div className="bg-cream rounded-2xl border border-[#E8E8E8] shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
      <div className="h-0.5 bg-[#FFAA00]" />
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              color: "#FFFFFF",
              backgroundColor: BLUE,
              fontFamily: "var(--font-mono, 'Geist Mono', monospace)",
            }}
          >
            {career.matchPercent}%
          </span>
          <FavouriteButton careerId={career.id} favourites={favourites} onToggle={onToggleFavourite} />
        </div>
        <h3 className="text-sm text-[#111111] mb-2 leading-snug">{career.title}</h3>
        <p className="text-xs text-[#555555] leading-relaxed mb-3 flex-1">{career.keySynergy}</p>
        <div className="pt-2.5 border-t border-[#F0F0F0]">
          <StatsFooter career={career} />
        </div>
      </div>
    </div>
  );
}

export function FlaggedCard({ career }: { career: CareerMatch }) {
  const palette = getCategoryPalette(career.domain);
  return (
    <div className="bg-cream rounded-2xl border border-[#E8E8E8] shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
      {/* Red accent bar — flagged status always reads as red regardless of category */}
      <div className="h-1" style={{ backgroundColor: RED }} />
      <div className="p-5 flex flex-col gap-3">
        {/* Meta */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              color: "#FFFFFF",
              backgroundColor: RED,
              fontFamily: "var(--font-mono, 'Geist Mono', monospace)",
            }}
          >
            {career.matchPercent}% fit
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: palette.tint, color: palette.accent }}
          >
            {career.domain}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base text-[#111111] leading-snug">{career.title}</h3>

        {/* Why it doesn't fit */}
        {career.flagReason && (
          <p className="text-sm text-[#555555] leading-relaxed">{career.flagReason}</p>
        )}

        {/* Key friction — red left border */}
        {career.keyFriction && (
          <p
            className="text-sm leading-relaxed pl-3 border-l-2 italic"
            style={{ color: RED, borderColor: RED }}
          >
            {career.keyFriction}
          </p>
        )}

        {/* Cons, split by assessment vs preference */}
        <CategorizedReasonColumn
          title="Worth being aware of"
          color={RED}
          sign="–"
          items={career.cons}
          textSize="text-xs"
          textColor="#555555"
          showTitle={false}
        />

        {/* Stats */}
        <div className="pt-2.5 border-t border-[#F0F0F0]">
          <StatsFooter career={career} />
        </div>
      </div>
    </div>
  );
}

// ── Utility icon exports used by search/page.tsx ───────────────────────────────

export function IconCheckCircle({ className }: { className?: string }) {
  return <PhosphorCheckCircle className={className} weight="bold" />;
}

export function IconXCircle({ className }: { className?: string }) {
  return <PhosphorXCircle className={className} weight="bold" />;
}

export function IconWarningCircle({ className }: { className?: string }) {
  return <PhosphorWarningCircle className={className} weight="bold" />;
}
