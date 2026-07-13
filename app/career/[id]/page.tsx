"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppNav from "@/src/components/AppNav";
import {
  ArrowLeft,
  TrendUp,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  XCircle,
  CaretDown,
  ChartBar,
  Lightning,
  Star,
} from "@phosphor-icons/react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Quartile = "all" | "q1" | "q2" | "q3" | "q4";

interface TypeRanking {
  type: string;
  fitScore: number;
  label: string;
}

interface CareerDetail {
  title: string;
  sector: string;
  salaryRange: string;
  salaryTier: string;
  marketOutlook: "up" | "flat" | "down";
  marketLabel: string;
  educationRequired: string;
  educationAboveAnchor: boolean;
  description: string;
  synergy: string;
  friction: string;
  pros: string[];
  cons: string[];
  userType: string;
  userSparketype: string;
  userSunSign: string;
  mbtiRankings: TypeRanking[];
  sparketypeRankings: TypeRanking[];
  astrologyRankings: TypeRanking[];
}

// ── Mock rankings data ────────────────────────────────────────────────────────

const MBTI_RANKINGS_DATA_SCIENTIST: TypeRanking[] = [
  { type: "INTJ", fitScore: 97, label: "Systems thinker with strong independent drive — ideal for ML architecture." },
  { type: "INTP", fitScore: 94, label: "Theoretical precision and curiosity underpin strong data modelling instincts." },
  { type: "ENTJ", fitScore: 89, label: "Strategic vision and decisiveness suit senior data leadership roles." },
  { type: "ISTJ", fitScore: 85, label: "Methodical rigour and reliability are core assets for data pipeline work." },
  { type: "ENTP", fitScore: 80, label: "Innovative problem-framing works well for research-adjacent roles." },
  { type: "INFJ", fitScore: 76, label: "Purpose-driven focus supports long-arc research projects." },
  { type: "ISTP", fitScore: 74, label: "Hands-on logical analysis suits engineering-side data roles." },
  { type: "ESTJ", fitScore: 71, label: "Process discipline is valuable but may find open-ended research less engaging." },
  { type: "INFP", fitScore: 64, label: "Creative insight is useful but may struggle with repetitive model tuning." },
  { type: "ENFP", fitScore: 61, label: "Broad curiosity supports exploration phases; deep implementation can feel constraining." },
  { type: "ENFJ", fitScore: 57, label: "Strong communicator — best suited to data storytelling or team-lead tracks." },
  { type: "ISFJ", fitScore: 52, label: "Detail-oriented reliability is an asset; limited appetite for ambiguous research." },
  { type: "ESFJ", fitScore: 44, label: "Collaborative strength fits team coordination more than independent analysis." },
  { type: "ISFP", fitScore: 39, label: "Artistic sensibility and data-heavy work rarely align well." },
  { type: "ESFP", fitScore: 31, label: "High social energy conflicts with the isolated depth data work demands." },
  { type: "ESTP", fitScore: 27, label: "Action-oriented style is better matched to fast-feedback sales or ops roles." },
];

const MBTI_RANKINGS_UX: TypeRanking[] = [
  { type: "INFJ", fitScore: 96, label: "Deep empathy and pattern recognition are core UX research superpowers." },
  { type: "ENFP", fitScore: 93, label: "User empathy and creative synthesis drive strong research insights." },
  { type: "INFP", fitScore: 89, label: "Values-driven curiosity fuels user advocacy and qualitative depth." },
  { type: "INTP", fitScore: 84, label: "Analytical frameworks translate well to systematic usability evaluation." },
  { type: "ENFJ", fitScore: 81, label: "Natural facilitation skills make workshop and interview-led research feel effortless." },
  { type: "INTJ", fitScore: 77, label: "Strategic design thinking suits systems-level UX architecture." },
  { type: "ENTP", fitScore: 73, label: "Rapid ideation energises generative design sprints." },
  { type: "ISFP", fitScore: 69, label: "Aesthetic sensitivity and hands-on making suit interaction design tracks." },
  { type: "ISFJ", fitScore: 64, label: "Empathy and thoroughness support user-testing and accessibility work." },
  { type: "ESFJ", fitScore: 60, label: "Strong collaboration fits cross-functional product teams." },
  { type: "ISTP", fitScore: 55, label: "Prototyping and technical depth suit engineering-adjacent UX roles." },
  { type: "ESTJ", fitScore: 49, label: "Project discipline is useful but may under-prioritise user empathy." },
  { type: "ENTJ", fitScore: 46, label: "Leadership drive suits UX management more than hands-on research." },
  { type: "ISTJ", fitScore: 41, label: "Rigour is valuable; comfort with ambiguity in design may be limited." },
  { type: "ESTP", fitScore: 35, label: "Fast-paced action orientation sits awkwardly with reflective UX practice." },
  { type: "ESFP", fitScore: 30, label: "Social spontaneity is an asset in facilitation but not in deep analysis." },
];

const SPARKETYPE_RANKINGS: TypeRanking[] = [
  { type: "Maven", fitScore: 98, label: "Driven to acquire and master knowledge — perfectly aligned with research depth." },
  { type: "Sage", fitScore: 91, label: "Teaching and translating complex ideas suits data communication roles." },
  { type: "Advisor", fitScore: 83, label: "Guiding decisions with expertise is core to senior roles in this field." },
  { type: "Maker", fitScore: 75, label: "Building and engineering systems satisfies the Maker's creation drive." },
  { type: "Scientist", fitScore: 72, label: "Hypothesis-testing and structured inquiry are natural fits." },
  { type: "Performer", fitScore: 41, label: "Performance energy is better channelled in client-facing or demo contexts." },
  { type: "Warrior", fitScore: 38, label: "Goal-oriented drive can conflict with the exploratory nature of research." },
  { type: "Nurturer", fitScore: 31, label: "Relationship focus is a secondary asset; not a primary driver in this field." },
  { type: "Essentialist", fitScore: 27, label: "Minimalist approach can conflict with the breadth required." },
];

const ASTROLOGY_RANKINGS: TypeRanking[] = [
  { type: "Scorpio", fitScore: 93, label: "Investigative depth and comfort with complexity are defining traits." },
  { type: "Virgo", fitScore: 89, label: "Methodical precision and analytical attention to detail." },
  { type: "Capricorn", fitScore: 85, label: "Disciplined long-term thinking and structured problem-solving." },
  { type: "Aquarius", fitScore: 80, label: "Systems thinking and unconventional pattern recognition." },
  { type: "Gemini", fitScore: 74, label: "Intellectual agility suits multi-domain exploration." },
  { type: "Aries", fitScore: 65, label: "Drive and initiative can accelerate project phases." },
  { type: "Taurus", fitScore: 61, label: "Steady persistence suits long data collection and modelling cycles." },
  { type: "Sagittarius", fitScore: 58, label: "Broad curiosity suits research breadth but may resist deep specialisation." },
  { type: "Libra", fitScore: 52, label: "Balanced perspective helps in stakeholder-facing analysis roles." },
  { type: "Pisces", fitScore: 47, label: "Intuitive insight can spark novel hypotheses." },
  { type: "Cancer", fitScore: 43, label: "Emotional intelligence supports team-based projects." },
  { type: "Leo", fitScore: 38, label: "Presentation confidence suits storytelling but not solitary analysis." },
];

// ── Career data lookup ────────────────────────────────────────────────────────

function getCareerDetail(id: string): CareerDetail {
  const isUX = id.toLowerCase().includes("ux") || id.toLowerCase().includes("design");
  return isUX
    ? {
        title: "UX Research Lead / Design Strategist",
        sector: "DESIGN / CREATIVE",
        salaryRange: "$95k – $155k",
        salaryTier: "$$$",
        marketOutlook: "up",
        marketLabel: "Growing (15% YoY)",
        educationRequired: "BS / MS Preferred",
        educationAboveAnchor: false,
        description:
          "UX Research Leads blend empathetic user investigation with strategic design thinking to shape products that truly serve their audiences. The role demands both analytical rigour and creative synthesis.",
        synergy: "Strategic pattern recognition and user empathy translate directly to research-led design, which fits your strengths well.",
        friction: "Regular stakeholder presentations and client-facing workshops may challenge more introverted profiles.",
        pros: [
          "Blends analytical rigour with creative problem-solving",
          "Cross-industry demand creates strong job security",
          "Remote-compatible across most organisations",
          "High intellectual variety across projects",
        ],
        cons: [
          "Requires regular stakeholder presentations",
          "Tight deadlines in agency settings can be high pressure",
        ],
        userType: "INTJ",
        userSparketype: "Maven",
        userSunSign: "Scorpio",
        mbtiRankings: MBTI_RANKINGS_UX,
        sparketypeRankings: SPARKETYPE_RANKINGS,
        astrologyRankings: ASTROLOGY_RANKINGS,
      }
    : {
        title: "Data Scientist / Systems Architect",
        sector: "TECHNOLOGY",
        salaryRange: "$110k – $180k",
        salaryTier: "$$$$",
        marketOutlook: "up",
        marketLabel: "High Growth (18% YoY)",
        educationRequired: "MS / PhD Preferred",
        educationAboveAnchor: true,
        description:
          "Data Scientists and Systems Architects design and build the analytical infrastructure that powers modern organisations. The role requires deep technical expertise, systems thinking, and the ability to translate complex findings into actionable insights.",
        synergy: "Analytical systems thinking maps perfectly to ML pipeline and data architecture roles, which fits your strengths well.",
        friction: "Senior roles increasingly demand team leadership and stakeholder communication.",
        pros: [
          "Direct application of deep analytical and systems thinking",
          "Strong remote-first culture across the field",
          "Exceptional long-term salary trajectory",
          "High demand across virtually every sector",
        ],
        cons: [
          "Requires continuous learning of rapidly evolving tools",
          "Senior roles demand team leadership and communication",
          "PhD increasingly expected for senior research positions",
        ],
        userType: "INTJ",
        userSparketype: "Maven",
        userSunSign: "Scorpio",
        mbtiRankings: MBTI_RANKINGS_DATA_SCIENTIST,
        sparketypeRankings: SPARKETYPE_RANKINGS,
        astrologyRankings: ASTROLOGY_RANKINGS,
      };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getQuartile(rank: number, total: number): 1 | 2 | 3 | 4 {
  const pct = rank / total;
  if (pct <= 0.25) return 1;
  if (pct <= 0.5) return 2;
  if (pct <= 0.75) return 3;
  return 4;
}

const QUARTILE_META: Record<number, { label: string; bar: string; badge: string; text: string }> = {
  1: { label: "Top Quartile",    bar: "bg-[#1a56db]", badge: "bg-[#dbeafe] text-[#1e40af]",  text: "text-[#1a56db]" },
  2: { label: "2nd Quartile",    bar: "bg-[#16a34a]", badge: "bg-[#dcfce7] text-[#15803d]",  text: "text-[#15803d]" },
  3: { label: "3rd Quartile",    bar: "bg-[#d97706]", badge: "bg-[#fef3c7] text-[#92400e]",  text: "text-[#92400e]" },
  4: { label: "Bottom Quartile", bar: "bg-[#ba1a1a]", badge: "bg-[#fef2f2] text-[#9f1239]",  text: "text-[#9f1239]" },
};

// ── Shared icons ──────────────────────────────────────────────────────────────

function IconTrendUp() {
  return <TrendUp weight="bold" className="w-4 h-4 shrink-0" />;
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
function ChevronDown() {
  return <CaretDown weight="bold" className="w-4 h-4" />;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function QuartileFilter({ value, onChange }: { value: Quartile; onChange: (v: Quartile) => void }) {
  const options: { value: Quartile; label: string }[] = [
    { value: "all",  label: "All types" },
    { value: "q1",   label: "Top Quartile — best fit" },
    { value: "q2",   label: "2nd Quartile" },
    { value: "q3",   label: "3rd Quartile" },
    { value: "q4",   label: "Bottom Quartile — worst fit" },
  ];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Quartile)}
        className="appearance-none bg-cream border border-[#E8E8E8] rounded-lg px-3 py-1.5 text-xs text-[#111111] pr-8 focus:outline-none focus:border-[#FF5500] cursor-pointer"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
  title, icon, items, filter, onFilterChange, note,
}: {
  title: string;
  icon: React.ReactNode;
  items: TypeRanking[];
  filter: Quartile;
  onFilterChange: (v: Quartile) => void;
  note?: string;
}) {
  const sorted = [...items].sort((a, b) => b.fitScore - a.fitScore);
  const filtered = filter === "all"
    ? sorted
    : sorted.filter((_, i) => getQuartile(i + 1, sorted.length) === parseInt(filter[1]));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-[#111111]">{title}</h3>
        </div>
        <QuartileFilter value={filter} onChange={onFilterChange} />
      </div>

      {note && (
        <p className="text-[11px] text-[#888888] italic mb-3 leading-relaxed">{note}</p>
      )}

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
            <RankingRow
              key={item.type}
              rank={filter === "all" ? i + 1 : globalRank}
              item={item}
              quartile={quartile}
            />
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

type Framework = "mbti" | "sparketype" | "astrology";

const FRAMEWORK_OPTIONS: { value: Framework; label: string }[] = [
  { value: "mbti", label: "Myers-Briggs (MBTI)" },
  { value: "sparketype", label: "Sparketype" },
  { value: "astrology", label: "Sun Sign (Astrology)" },
];

export default function CareerDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");
  const career = getCareerDetail(id);

  const [activeFramework, setActiveFramework] = useState<Framework>("mbti");
  const [quartileFilter, setQuartileFilter] = useState<Quartile>("all");

  function handleFrameworkChange(fw: Framework) {
    setActiveFramework(fw);
    setQuartileFilter("all");
  }

  const frameworkConfig = {
    mbti: {
      title: "Myers-Briggs (MBTI) Fit Rankings",
      items: career.mbtiRankings,
      note: undefined,
      icon: <ChartBar weight="bold" className="w-4 h-4 text-[#FF5500]" />,
    },
    sparketype: {
      title: "Sparketype Fit Rankings",
      items: career.sparketypeRankings,
      note: "Supplementary signal — lower weight than validated psychometric frameworks. Use as directional guidance only.",
      icon: <Lightning weight="bold" className="w-4 h-4 text-[#FFAA00]" />,
    },
    astrology: {
      title: "Sun Sign (Astrology) Fit Rankings",
      items: career.astrologyRankings,
      note: "Exploratory only — not based on validated psychometric research. Included as a cultural supplementary lens.",
      icon: <Star weight="bold" className="w-4 h-4 text-[#888888]" />,
    },
  };

  const current = frameworkConfig[activeFramework];

  return (
    <div className="min-h-screen bg-cream">
      <AppNav active="search" />

      <main className="px-6 md:px-8 py-6 md:py-8">
        {/* Back link */}
        <Link href="/search" className="inline-flex items-center gap-1.5 text-sm text-[#FF5500] font-semibold hover:underline mb-6">
          <ArrowLeft weight="bold" className="w-4 h-4" />
          Back to Results
        </Link>

        {/* ── Two-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── LEFT: Career detail (sticky) ── */}
          <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-20">

            {/* Career header card */}
            <section className="bg-cream rounded-2xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
              <p className="text-[11px] font-bold text-[#888888] uppercase tracking-widest mb-1">{career.sector}</p>
              <h1 className="text-xl md:text-2xl font-bold text-[#111111] tracking-tight mb-4 leading-snug">
                {career.title}
              </h1>

              {/* Market stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-[#00BB00]">
                  <IconTrendUp />
                  <span className="font-medium">{career.marketLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#0055FF]">
                  <IconBriefcase />
                  <span className="font-bold">{career.salaryTier}</span>
                  <span className="text-[#555555]">{career.salaryRange}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${career.educationAboveAnchor ? "text-[#EE0000]" : "text-[#888888]"}`}>
                  <IconGradCap />
                  <span>{career.educationRequired}</span>
                  {career.educationAboveAnchor && <span className="text-[10px] font-bold text-[#EE0000]">ABOVE ANCHOR</span>}
                </div>
              </div>

              <div className="border-t border-[#E8E8E8] pt-4">
                <p className="text-sm text-[#555555] leading-relaxed mb-4">{career.description}</p>
                <p className="text-sm text-[#555555] leading-relaxed">
                  This career aligns with your profile because {career.synergy.charAt(0).toLowerCase() + career.synergy.slice(1).replace(/\.$/, "")}
                  {career.friction ? `. That said, ${career.friction.charAt(0).toLowerCase() + career.friction.slice(1).replace(/\.$/, "")}.` : "."}
                </p>
              </div>
            </section>

            {/* Pros / Cons card */}
            <section className="bg-cream rounded-2xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
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
              </div>
            </section>

          </div>

          {/* ── RIGHT: Rankings (2/3 width) ── */}
          <div className="lg:col-span-2">

            {/* Framework selector + panel */}
            <div className="bg-cream rounded-2xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5">
              {/* Dropdown selector */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <p className="text-[11px] font-bold text-[#888888] uppercase tracking-widest shrink-0">View rankings by</p>
                <div className="relative">
                  <select
                    value={activeFramework}
                    onChange={(e) => handleFrameworkChange(e.target.value as Framework)}
                    className="appearance-none bg-cream border border-[#E8E8E8] rounded-lg px-3 py-1.5 text-sm font-semibold text-[#111111] pr-8 focus:outline-none focus:border-[#FF5500] cursor-pointer"
                  >
                    {FRAMEWORK_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#555555]">
                    <ChevronDown />
                  </span>
                </div>
              </div>

              <RankingPanel
                title={current.title}
                icon={current.icon}
                items={current.items}
                filter={quartileFilter}
                onFilterChange={setQuartileFilter}
                note={current.note}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
