"use client";

import Link from "next/link";
import {
  TrendUp as IconTrendUp,
  TrendDown as IconTrendDown,
  Minus as IconTrendFlat,
  GraduationCap as IconGradCap,
  Star as StarIconBase,
  CheckCircle as PhosphorCheckCircle,
  XCircle as PhosphorXCircle,
  WarningCircle as PhosphorWarningCircle,
} from "@phosphor-icons/react";
import { type CareerMatch } from "@/src/lib/mockData";
import { getCategoryPalette } from "@/src/lib/categoryColors";

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

        {/* Pros / Cons with max-saturation green / red */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          {career.pros.length > 0 && (
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-2.5"
                style={{ color: GREEN }}
              >
                Works in your favour
              </p>
              <ul className="space-y-2">
                {career.pros.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-[#333333] leading-snug">
                    <span className="font-bold shrink-0 mt-px" style={{ color: GREEN }}>+</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {career.cons.length > 0 && (
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-2.5"
                style={{ color: RED }}
              >
                Worth being aware of
              </p>
              <ul className="space-y-2">
                {career.cons.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-[#333333] leading-snug">
                    <span className="font-bold shrink-0 mt-px" style={{ color: RED }}>–</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
      <div className="h-0.5" style={{ backgroundColor: palette.accent }} />
      <div className="p-6 flex flex-col h-full">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-4">
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

        {/* Pros with green */}
        {career.pros.length > 0 && (
          <ul className="space-y-1.5 mb-5">
            {career.pros.map((p) => (
              <li key={p} className="flex items-start gap-2 text-xs text-[#333333] leading-snug">
                <span className="font-bold shrink-0 mt-px" style={{ color: GREEN }}>+</span>
                {p}
              </li>
            ))}
          </ul>
        )}

        {/* Stats footer */}
        <div className="pt-3 border-t border-[#F0F0F0] mt-auto">
          <StatsFooter career={career} />
        </div>
      </div>
    </Link>
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

        {/* Cons with red */}
        {career.cons.length > 0 && (
          <ul className="space-y-1.5">
            {career.cons.map((c) => (
              <li key={c} className="flex items-start gap-2 text-xs text-[#555555] leading-snug">
                <span className="font-bold shrink-0 mt-px" style={{ color: RED }}>–</span>
                {c}
              </li>
            ))}
          </ul>
        )}

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
