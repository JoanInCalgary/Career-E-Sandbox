/**
 * typeRankings.ts
 *
 * Powers the "quartile view" on the career detail page — a fit ranking of
 * every type within a framework (MBTI, Sparketype, Astrology/Sun Sign)
 * against one specific generated career, split into quartiles (best fit →
 * worst fit).
 *
 * There's no live signal for "how would every possible type fit this
 * specific generated career" — the AI agent only ever scores the user's
 * actual submitted type against each career. Rather than claim that as real
 * per-type analysis, rankings here are generated deterministically from a
 * seeded PRNG keyed on (career id + framework + type), softly centered
 * around the career's own matchPercent. The same career always produces the
 * same rankings on every reload, but different careers produce different
 * spreads — this is an exploratory/illustrative lens, same framing already
 * used for Sparketype/Astrology elsewhere in the app (supplementary, not a
 * validated psychometric result).
 */

import type { CareerMatch } from "@/src/lib/mockData";
import { mbtiOptions } from "@/src/lib/mockData";
import { SPARKETYPE_OPTIONS, SUN_SIGNS } from "@/src/lib/formOptions";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Quartile = "all" | "q1" | "q2" | "q3" | "q4";
export type RankingFramework = "mbti" | "sparketype" | "astrology";

export interface TypeRanking {
  type: string;
  fitScore: number;
  label: string;
}

// ── Seeded PRNG ───────────────────────────────────────────────────────────────

function hashString(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Trait descriptors (used to build a readable rationale per type) ───────────

const MBTI_TRAITS: Record<string, string> = {
  INTJ: "independent, systems-level strategic thinking",
  INTP: "theoretical curiosity and precise analysis",
  ENTJ: "decisive, big-picture leadership",
  ENTP: "fast, unconventional idea generation",
  INFJ: "purpose-driven, empathetic foresight",
  INFP: "values-led creativity and reflection",
  ENFJ: "natural facilitation and people development",
  ENFP: "enthusiastic, exploratory idea-connecting",
  ISTJ: "methodical reliability and structure",
  ISFJ: "conscientious, detail-oriented care",
  ESTJ: "organized execution and process discipline",
  ESFJ: "collaborative coordination and warmth",
  ISTP: "hands-on problem-solving and troubleshooting",
  ISFP: "quiet, hands-on aesthetic sensitivity",
  ESTP: "fast-paced, action-oriented pragmatism",
  ESFP: "spontaneous, socially energetic engagement",
};

const SPARK_TRAITS: Record<string, string> = {
  Maker: "building and creating tangible things",
  Performer: "energizing others through performance",
  Warrior: "competitive, goal-driven execution",
  Sage: "teaching and translating complex ideas",
  Advisor: "guiding others' decisions with expertise",
  Nurturer: "supporting and developing people",
  Investigator: "digging into problems for answers",
  Maven: "acquiring and mastering knowledge",
  Scientist: "structured hypothesis-testing and inquiry",
  Essentialist: "refining ideas down to their core",
};

const SUN_SIGN_TRAITS: Record<string, string> = {
  Aries: "initiative and fast decision-making",
  Taurus: "steady persistence and practical follow-through",
  Gemini: "intellectual agility and multi-domain curiosity",
  Cancer: "emotional intelligence and team care",
  Leo: "confident presentation and creative leadership",
  Virgo: "methodical precision and attention to detail",
  Libra: "balanced, stakeholder-aware judgement",
  Scorpio: "investigative depth and comfort with complexity",
  Sagittarius: "broad exploratory curiosity",
  Capricorn: "disciplined, long-horizon planning",
  Aquarius: "systems thinking and unconventional framing",
  Pisces: "intuitive, imaginative pattern-spotting",
};

const FRAMEWORK_TYPES: Record<RankingFramework, { type: string; trait: string }[]> = {
  mbti: mbtiOptions.map((o) => ({ type: o.type, trait: MBTI_TRAITS[o.type] ?? "distinct working style" })),
  sparketype: SPARKETYPE_OPTIONS.map((o) => ({
    type: o.value,
    trait: SPARK_TRAITS[o.value] ?? "distinct motivational drive",
  })),
  astrology: SUN_SIGNS.map((o) => ({ type: o.value, trait: SUN_SIGN_TRAITS[o.value] ?? "distinct dispositional lens" })),
};

// ── Ranking generation ──────────────────────────────────────────────────────

/**
 * Generates a stable fit ranking for every type in `framework` against
 * `career`. Same career + framework always returns the same list, sorted
 * best fit first.
 */
export function getTypeRankings(career: CareerMatch, framework: RankingFramework): TypeRanking[] {
  const types = FRAMEWORK_TYPES[framework];
  const center = career.matchPercent;

  const rankings = types.map(({ type, trait }) => {
    const rng = mulberry32(hashString(`${career.id}::${framework}::${type}`));
    // Soft-center the spread around the career's own matchPercent so a
    // strong overall career tends to have a higher ceiling, while still
    // varying meaningfully from type to type.
    const raw = center - 27.5 + rng() * 55 + (rng() - 0.5) * 20;
    const fitScore = Math.max(5, Math.min(99, Math.round(raw)));
    const verb = fitScore >= 60 ? "aligns well with" : fitScore >= 35 ? "partially suits" : "sits in tension with";
    return {
      type,
      fitScore,
      label: `${type}'s ${trait} ${verb} ${career.title}.`,
    };
  });

  return rankings.sort((a, b) => b.fitScore - a.fitScore);
}

// ── Quartile helpers ──────────────────────────────────────────────────────────

export function getQuartile(rank: number, total: number): 1 | 2 | 3 | 4 {
  const pct = rank / total;
  if (pct <= 0.25) return 1;
  if (pct <= 0.5) return 2;
  if (pct <= 0.75) return 3;
  return 4;
}

export const QUARTILE_META: Record<number, { label: string; bar: string; badge: string; text: string }> = {
  1: { label: "Top Quartile", bar: "bg-[#1a56db]", badge: "bg-[#dbeafe] text-[#1e40af]", text: "text-[#1a56db]" },
  2: { label: "2nd Quartile", bar: "bg-[#16a34a]", badge: "bg-[#dcfce7] text-[#15803d]", text: "text-[#15803d]" },
  3: { label: "3rd Quartile", bar: "bg-[#d97706]", badge: "bg-[#fef3c7] text-[#92400e]", text: "text-[#92400e]" },
  4: { label: "Bottom Quartile", bar: "bg-[#ba1a1a]", badge: "bg-[#fef2f2] text-[#9f1239]", text: "text-[#9f1239]" },
};

export const RANKING_FRAMEWORK_OPTIONS: { value: RankingFramework; label: string }[] = [
  { value: "mbti", label: "Myers-Briggs (MBTI)" },
  { value: "sparketype", label: "Sparketype" },
  { value: "astrology", label: "Sun Sign (Astrology)" },
];
