"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendUp,
  Minus,
  TrendDown,
  Briefcase,
  ShieldCheck,
  XCircle,
  Trash,
  MagnifyingGlass,
  Bookmark,
  User,
  Clock,
  PencilSimple,
} from "@phosphor-icons/react";
import AppNav from "@/src/components/AppNav";
import {
  StyledSelect,
  PillGroup,
  BigFiveSlider,
  FieldLabel,
} from "@/src/components/AssessmentForm";
import { useAuth } from "@/src/components/AuthProvider";
import RequireAuth from "@/src/components/RequireAuth";
import { getHistoryEntries, topRecommendedCareer, type ResultsHistoryEntry } from "@/src/lib/modelRuns";
import { mbtiOptions } from "@/src/lib/mockData";
import { getFavourites, removeFavourite, type FavouriteCareer } from "@/src/lib/favourites";
import {
  CLIFTON_STRENGTHS,
  DISC_STYLES,
  EDU_TARGET_LABELS,
  ENNEAGRAM_OPTIONS,
  ORG_OPTIONS,
  SPARKETYPE_OPTIONS,
  SUN_SIGNS,
  TASK_DISLIKE_OPTIONS,
  WORK_ENV_OPTIONS,
  ZODIAC_ANIMALS,
  ZODIAC_ELEMENTS,
} from "@/src/lib/formOptions";
import {
  DEFAULT_PERSONALITY_PROFILE,
  getPersonalityProfile,
  savePersonalityProfile,
  type PersonalityProfile,
} from "@/src/lib/personalityProfile";
import { syncPersonalityNow } from "@/src/lib/syncToSupabase";

/** Max number of entries shown in the dashboard's compact Recent History list. */
const RECENT_HISTORY_LIMIT = 3;

function formatHistoryTimestamp(ts: number): { date: string; time: string } {
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

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

/** Maps a stored favourite (full CareerMatch snapshot) to the dashboard card shape. */
function toFavItem(entry: FavouriteCareer): FavItem {
  const c = entry.career;
  return {
    id: c.id,
    careerSlug: c.id,
    title: c.title,
    sector: c.sector,
    matchPercent: c.matchPercent,
    fromSearch: formatHistoryTimestamp(entry.savedAt).date,
    marketOutlook: c.marketOutlook,
    marketLabel: c.marketOutlookLabel,
    salaryRange: c.salaryRange,
    educationRequired: c.educationRequired,
    synergy: c.keySynergy,
    pros: c.pros,
    cons: c.cons,
  };
}

/** Small "count this toward my matches" checkbox used on optional preference fields. */
function IncludeToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-3 h-3 accent-[#FF5500] cursor-pointer"
      />
      <span className="text-[9px] font-bold text-[#888888] uppercase tracking-wide">Include</span>
    </label>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconTrendUp() {
  return <TrendUp weight="bold" className="w-3.5 h-3.5 shrink-0" />;
}
function IconTrendFlat() {
  return <Minus weight="bold" className="w-3.5 h-3.5 shrink-0" />;
}
function IconTrendDown() {
  return <TrendDown weight="bold" className="w-3.5 h-3.5 shrink-0" />;
}
function IconBriefcase() {
  return <Briefcase weight="bold" className="w-3.5 h-3.5 shrink-0" />;
}
function IconShield() {
  return <ShieldCheck weight="bold" className="w-3 h-3 shrink-0" />;
}
function IconXCircle() {
  return <XCircle weight="bold" className="w-3 h-3 shrink-0" />;
}
function IconTrash() {
  return <Trash weight="bold" className="w-3.5 h-3.5" />;
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

/**
 * Maps a match % to a blue shade — deep blue at the top of the scale,
 * progressively lighter as the score drops, with the most noticeable
 * shift happening through the 80s.
 */
function matchColor(pct: number): string {
  const p = Math.max(0, Math.min(100, pct));
  let lightness: number;
  if (p >= 90) {
    // 90–100 → 42%–50%: stays close to the deep "top match" blue
    lightness = 50 - ((p - 90) / 10) * 8;
  } else if (p >= 80) {
    // 80–90 → 50%–72%: the steepest, most noticeable step
    lightness = 72 - ((p - 80) / 10) * 22;
  } else if (p >= 60) {
    // 60–80 → 72%–90%
    lightness = 90 - ((p - 60) / 20) * 18;
  } else {
    lightness = 90;
  }
  return `hsl(220, 100%, ${lightness}%)`;
}

function MatchBadge({ pct }: { pct: number }) {
  return (
    <span
      className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
      style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)", backgroundColor: matchColor(pct) }}
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
    <div className="bg-cream rounded-xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col h-full overflow-hidden">
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
            className="flex-1 text-left px-4 pb-4 flex flex-col"
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
  return (
    <RequireAuth active="dashboard">
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const name = user!.name;
  const email = user!.email;

  const [favourites, setFavourites] = useState<FavItem[]>([]);
  const [favouritesHydrated, setFavouritesHydrated] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<ResultsHistoryEntry[]>([]);
  const [historyHydrated, setHistoryHydrated] = useState(false);

  // ── Personality profile — shared with the Search page's generate bar ──
  const [profile, setProfile] = useState<PersonalityProfile>(DEFAULT_PERSONALITY_PROFILE);
  const [draftProfile, setDraftProfile] = useState<PersonalityProfile>(DEFAULT_PERSONALITY_PROFILE);
  const [profileHydrated, setProfileHydrated] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    setFavourites(getFavourites().map(toFavItem));
    setFavouritesHydrated(true);

    setHistoryEntries(getHistoryEntries());
    setHistoryHydrated(true);

    const stored = getPersonalityProfile();
    setProfile(stored);
    setDraftProfile(stored);
    setProfileHydrated(true);
  }, []);

  function handleDelete(id: string) {
    removeFavourite(id);
    setFavourites((prev) => prev.filter((f) => f.id !== id));
  }

  function startEditingProfile() {
    setDraftProfile(profile);
    setEditingProfile(true);
  }

  function cancelEditingProfile() {
    setDraftProfile(profile);
    setEditingProfile(false);
  }

  function saveEditingProfile() {
    savePersonalityProfile(draftProfile, { sync: false });
    void syncPersonalityNow(draftProfile);
    setProfile(draftProfile);
    setEditingProfile(false);
  }

  function updateDraft<K extends keyof PersonalityProfile>(key: K, value: PersonalityProfile[K]) {
    setDraftProfile((prev) => ({ ...prev, [key]: value }));
  }

  function updateDraftStrength(i: number, v: string) {
    setDraftProfile((prev) => {
      const next = [...prev.strengths];
      next[i] = v;
      return { ...prev, strengths: next };
    });
  }

  function updateDraftBigFive(trait: keyof PersonalityProfile["bigFive"], v: number) {
    setDraftProfile((prev) => ({ ...prev, bigFive: { ...prev.bigFive, [trait]: v } }));
  }

  function toggleDraftOptional(id: string) {
    setDraftProfile((prev) => {
      const enabled = new Set(prev.optionalEnabled ?? []);
      enabled.has(id) ? enabled.delete(id) : enabled.add(id);
      return { ...prev, optionalEnabled: Array.from(enabled) };
    });
  }

  function toggleDraftTaskDislike(task: string) {
    setDraftProfile((prev) => {
      const has = prev.taskDislikes.includes(task);
      return {
        ...prev,
        taskDislikes: has ? prev.taskDislikes.filter((t) => t !== task) : [...prev.taskDislikes, task],
      };
    });
  }

  const hasCompletedSearch = historyHydrated && historyEntries.length > 0;
  const profileReady = profileHydrated && historyHydrated;
  const showProfileEmptyState = profileReady && !hasCompletedSearch;

  const mbtiDisplay = `${profile.mbtiType}${profile.variant ? `-${profile.variant}` : ""}`;
  const sparkDisplay = `${profile.primarySpark || "—"} · ${profile.secondarySpark || "—"} · Anti: ${
    profile.antiSpark || "—"
  }`;
  const bigFiveDisplay = `O:${profile.bigFive.O} C:${profile.bigFive.C} E:${profile.bigFive.E} A:${profile.bigFive.A} N:${profile.bigFive.N}`;
  const cliftonDisplay = profile.strengths.filter(Boolean).join(" · ") || "—";
  const zodiacDisplay = `${profile.zodiacAnimal || "—"} — ${profile.zodiacElement || "—"}`;
  const optionalEnabled = new Set(profile.optionalEnabled ?? []);
  const workEnvDisplay = optionalEnabled.has("workEnv") ? profile.workEnv : "Not set";
  const orgStructureDisplay = optionalEnabled.has("orgStructure") ? profile.orgStructure : "Not set";
  const targetEduDisplay = optionalEnabled.has("targetEdu")
    ? EDU_TARGET_LABELS[profile.targetEduIndex]
    : "Not set";
  const taskDislikesDisplay =
    optionalEnabled.has("taskDislikes") && profile.taskDislikes.length > 0
      ? profile.taskDislikes.join(" · ")
      : "Not set";

  return (
    <div className="min-h-screen bg-cream">
      <AppNav active="dashboard" />

      <main className="px-6 md:px-8 py-6 md:py-8">
        {/* ── Welcome header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 mb-8">
          <div>
            <p className="text-sm font-semibold text-[#FF5500] uppercase tracking-widest mb-1">
              {historyHydrated && !hasCompletedSearch ? "Welcome" : "Welcome back"}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#111111] tracking-tight leading-tight">
              {name}
            </h1>
            <p className="text-sm text-[#888888] mt-1">{email}</p>
          </div>

          <Link
            href={hasCompletedSearch ? "/search?restore=true" : "/search"}
            className="inline-flex items-center gap-2 self-start bg-[#FF5500] hover:bg-[#DD4400] transition-colors text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
          >
            <MagnifyingGlass weight="bold" className="w-4 h-4" />
            {historyHydrated && !hasCompletedSearch ? "Start Searching" : "Search Again"}
          </Link>
        </div>

        {/* ── Personality Profile — full width so editing doesn't cramp a narrow column ── */}
        <section className="bg-cream rounded-2xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 mb-6">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <User weight="bold" className="w-4 h-4 text-[#FF5500]" />
              <h2 className="text-sm font-bold text-[#111111]">Your Personality Profile</h2>
            </div>
            {profileReady && !editingProfile && hasCompletedSearch && (
              <button
                type="button"
                onClick={startEditingProfile}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#FF5500] hover:underline shrink-0"
              >
                <PencilSimple weight="bold" className="w-3 h-3" />
                Edit
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#888888] mb-4">
            {editingProfile
              ? "Changes here also update the Search page's generate bar."
              : "Powers your career matches — synced with the Search page's generate bar."}
          </p>

          {!profileReady ? null : showProfileEmptyState ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl border border-dashed border-[#E8E8E8] bg-[#F5F5F5]">
              <div className="w-10 h-10 rounded-full bg-cream border border-[#E8E8E8] flex items-center justify-center mb-3">
                <MagnifyingGlass weight="bold" className="w-5 h-5 text-[#FF5500]" />
              </div>
              <p className="text-sm font-semibold text-[#111111] mb-1">You haven&apos;t run a search yet</p>
              <p className="text-xs text-[#555555] max-w-sm mb-4">
                Your personality profile will show up here after you complete a career search.
                Head to Search to enter your assessments and generate matches.
              </p>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 bg-[#FF5500] hover:bg-[#DD4400] transition-colors text-white font-semibold text-sm px-5 py-2.5 rounded-lg"
              >
                <MagnifyingGlass weight="bold" className="w-4 h-4" />
                Go to Search
              </Link>
            </div>
          ) : !editingProfile ? (
            <div className="grid grid-cols-1 sm:grid-cols-1">
              <div>
                <p className="text-[9px] font-bold text-[#FF5500] uppercase tracking-widest mb-2">Assessments</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {[
                    { label: "MBTI", value: mbtiDisplay },
                    { label: "Sparketype", value: sparkDisplay },
                    { label: "Enneagram", value: profile.enneagramType || "—" },
                    { label: "DiSC", value: profile.discStyle || "—" },
                    { label: "Big Five", value: bigFiveDisplay },
                    { label: "CliftonStrengths", value: cliftonDisplay },
                    { label: "Chinese Zodiac", value: zodiacDisplay },
                    { label: "Astrology", value: profile.sunSign || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg border border-[#E8E8E8] bg-[#F5F5F5] px-2.5 py-1.5">
                      <p className="text-[8px] font-bold text-[#888888] uppercase tracking-widest mb-0.5">{label}</p>
                      <p className="text-[10px] font-semibold text-[#111111] leading-snug">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold text-[#FF5500] uppercase tracking-widest mb-2">Preferences</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Work Environment", value: workEnvDisplay },
                    { label: "Target Education", value: targetEduDisplay },
                    { label: "Task Dislikes", value: taskDislikesDisplay },
                    { label: "Org Structure", value: orgStructureDisplay },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg border border-[#E8E8E8] bg-[#F5F5F5] px-2.5 py-1.5">
                      <p className="text-[8px] font-bold text-[#888888] uppercase tracking-widest mb-0.5">{label}</p>
                      <p
                        className={`text-[10px] font-semibold leading-snug ${
                          value === "Not set" ? "text-[#AAAAAA] italic" : "text-[#111111]"
                        }`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Assessments */}
              <div>
                <p className="text-[9px] font-bold text-[#FF5500] uppercase tracking-widest mb-2">Assessments</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <FieldLabel>MBTI Type</FieldLabel>
                    <StyledSelect
                      value={draftProfile.mbtiType}
                      onChange={(v) => updateDraft("mbtiType", v)}
                      options={mbtiOptions.map((o) => ({ value: o.type, label: o.label }))}
                      placeholder="Clear selection"
                    />
                  </div>
                  <div>
                    <FieldLabel>Primary Sparketype</FieldLabel>
                    <StyledSelect
                      value={draftProfile.primarySpark}
                      onChange={(v) => updateDraft("primarySpark", v)}
                      options={SPARKETYPE_OPTIONS}
                      placeholder="Select..."
                    />
                  </div>
                  <div>
                    <FieldLabel>Secondary Sparketype</FieldLabel>
                    <StyledSelect
                      value={draftProfile.secondarySpark}
                      onChange={(v) => updateDraft("secondarySpark", v)}
                      options={SPARKETYPE_OPTIONS}
                      placeholder="Select..."
                    />
                  </div>
                  <div>
                    <FieldLabel>Anti-Sparketype</FieldLabel>
                    <StyledSelect
                      value={draftProfile.antiSpark}
                      onChange={(v) => updateDraft("antiSpark", v)}
                      options={SPARKETYPE_OPTIONS}
                      placeholder="Select..."
                    />
                  </div>
                  <div>
                    <FieldLabel>Enneagram</FieldLabel>
                    <StyledSelect
                      value={draftProfile.enneagramType}
                      onChange={(v) => updateDraft("enneagramType", v)}
                      options={ENNEAGRAM_OPTIONS}
                      placeholder="Select..."
                    />
                  </div>
                  <div>
                    <FieldLabel>DiSC Style</FieldLabel>
                    <StyledSelect
                      value={draftProfile.discStyle}
                      onChange={(v) => updateDraft("discStyle", v)}
                      options={DISC_STYLES}
                      placeholder="Select..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Zodiac Animal</FieldLabel>
                      <StyledSelect
                        value={draftProfile.zodiacAnimal}
                        onChange={(v) => updateDraft("zodiacAnimal", v)}
                        options={ZODIAC_ANIMALS}
                        placeholder="Select..."
                      />
                    </div>
                    <div>
                      <FieldLabel>Zodiac Element</FieldLabel>
                      <StyledSelect
                        value={draftProfile.zodiacElement}
                        onChange={(v) => updateDraft("zodiacElement", v)}
                        options={ZODIAC_ELEMENTS}
                        placeholder="Select..."
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Sun Sign</FieldLabel>
                    <StyledSelect
                      value={draftProfile.sunSign}
                      onChange={(v) => updateDraft("sunSign", v)}
                      options={SUN_SIGNS}
                      placeholder="Select..."
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <FieldLabel>CliftonStrengths (Top 5)</FieldLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <StyledSelect
                        key={i}
                        value={draftProfile.strengths[i] ?? ""}
                        onChange={(v) => updateDraftStrength(i, v)}
                        options={CLIFTON_STRENGTHS}
                        placeholder={`Strength ${i + 1}...`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <FieldLabel>Big Five Model</FieldLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    <BigFiveSlider
                      label="Openness"
                      traitKey="Openness"
                      value={draftProfile.bigFive.O}
                      onChange={(v) => updateDraftBigFive("O", v)}
                    />
                    <BigFiveSlider
                      label="Conscientiousness"
                      traitKey="Conscientiousness"
                      value={draftProfile.bigFive.C}
                      onChange={(v) => updateDraftBigFive("C", v)}
                    />
                    <BigFiveSlider
                      label="Extraversion"
                      traitKey="Extraversion"
                      value={draftProfile.bigFive.E}
                      onChange={(v) => updateDraftBigFive("E", v)}
                    />
                    <BigFiveSlider
                      label="Agreeableness"
                      traitKey="Agreeableness"
                      value={draftProfile.bigFive.A}
                      onChange={(v) => updateDraftBigFive("A", v)}
                    />
                    <BigFiveSlider
                      label="Neuroticism"
                      traitKey="Neuroticism"
                      value={draftProfile.bigFive.N}
                      onChange={(v) => updateDraftBigFive("N", v)}
                    />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div>
                <p className="text-[9px] font-bold text-[#FF5500] uppercase tracking-widest mb-2">Preferences</p>
                <p className="text-[10px] text-[#888888] -mt-1 mb-3">
                  Check &quot;Include&quot; to have a preference count toward your matches — otherwise it&apos;s
                  ignored, even if a value is set below.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <FieldLabel>Work Environment</FieldLabel>
                      <IncludeToggle
                        checked={(draftProfile.optionalEnabled ?? []).includes("workEnv")}
                        onChange={() => toggleDraftOptional("workEnv")}
                      />
                    </div>
                    <PillGroup
                      options={WORK_ENV_OPTIONS}
                      value={draftProfile.workEnv}
                      onChange={(v) => updateDraft("workEnv", v)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <FieldLabel>Organizational Structure</FieldLabel>
                      <IncludeToggle
                        checked={(draftProfile.optionalEnabled ?? []).includes("orgStructure")}
                        onChange={() => toggleDraftOptional("orgStructure")}
                      />
                    </div>
                    <PillGroup
                      options={ORG_OPTIONS}
                      value={draftProfile.orgStructure}
                      onChange={(v) => updateDraft("orgStructure", v)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <FieldLabel>Target Education</FieldLabel>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#FF5500]">
                          {EDU_TARGET_LABELS[draftProfile.targetEduIndex]}
                        </span>
                        <IncludeToggle
                          checked={(draftProfile.optionalEnabled ?? []).includes("targetEdu")}
                          onChange={() => toggleDraftOptional("targetEdu")}
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={EDU_TARGET_LABELS.length - 1}
                      value={draftProfile.targetEduIndex}
                      onChange={(e) => updateDraft("targetEduIndex", Number(e.target.value))}
                      className="w-full accent-[#FF5500] cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <FieldLabel>Task Dislikes</FieldLabel>
                      <IncludeToggle
                        checked={(draftProfile.optionalEnabled ?? []).includes("taskDislikes")}
                        onChange={() => toggleDraftOptional("taskDislikes")}
                      />
                    </div>
                    <div className="max-h-28 overflow-y-auto space-y-1.5 rounded-lg border border-[#E8E8E8] bg-cream p-2.5">
                      {TASK_DISLIKE_OPTIONS.map((task) => (
                        <label key={task} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={draftProfile.taskDislikes.includes(task)}
                            onChange={() => toggleDraftTaskDislike(task)}
                            className="w-3.5 h-3.5 accent-[#FF5500] cursor-pointer shrink-0"
                          />
                          <span className="text-xs text-[#555555] group-hover:text-[#000c] transition-colors">
                            {task}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelEditingProfile}
                  className="px-4 py-1.5 text-xs font-semibold border border-[#E8E8E8] rounded-lg text-[#555555] hover:bg-[#F5F5F5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEditingProfile}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#FF5500] text-white rounded-lg hover:bg-[#DD4400] transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── Main two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Favourited Career Paths (2/3 width) — stretches to match right column ── */}
          <section className="lg:col-span-2 bg-cream rounded-2xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Bookmark weight="bold" className="w-5 h-5 text-[#FF5500]" />
              <h2 className="text-lg font-bold text-[#111111]">
                Favourited Career Paths
                {favourites.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-[#888888]">({favourites.length})</span>
                )}
              </h2>
            </div>
            <p className="text-sm text-[#555555] mb-5">All the career paths you have bookmarked across your searches.</p>

            {!favouritesHydrated ? null : favourites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-3">
                  <Bookmark weight="bold" className="w-5 h-5 text-[#888888]" />
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

          {/* ── RIGHT: Recent History (1/3 width) ── */}
          <div className="lg:col-span-1">
            <section className="bg-cream rounded-2xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5">
              <div className="flex items-center justify-between mb-0.5 flex-wrap gap-y-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#FF5500] bg-[#FFF3EC]">
                  <Clock weight="bold" className="w-3.5 h-3.5" />
                  Recent History
                </div>
                <Link href="/results-history" className="text-[11px] font-semibold text-[#FF5500] hover:underline shrink-0">
                  View All →
                </Link>
              </div>
              <p className="text-[11px] text-[#888888] mb-4">Your last few career searches.</p>

              {!historyHydrated ? null : historyEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-xs font-semibold text-[#111111] mb-1">No searches yet</p>
                  <p className="text-[11px] text-[#888888]">Run a search to see it show up here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyEntries.slice(0, RECENT_HISTORY_LIMIT).map((entry) => {
                    const { date, time } = formatHistoryTimestamp(entry.timestamp);
                    const top = topRecommendedCareer(entry);
                    const mbti = entry.payload.mbtiType
                      ? `${entry.payload.mbtiType}${entry.payload.variant ? `-${entry.payload.variant}` : ""}`
                      : "—";
                    return (
                      <Link
                        key={entry.id}
                        href={`/search?historyId=${entry.id}`}
                        className="block rounded-xl border border-[#E8E8E8] px-4 py-3 hover:border-[#FF5500]/40 hover:bg-[#F5F5F5] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] text-[#888888]">{date} · {time}</p>
                            <p className="text-[10px] font-semibold text-[#FF5500] uppercase tracking-wide mt-0.5">
                              {mbti} · {entry.payload.workEnv || "—"}
                            </p>
                            <p className="text-xs font-semibold text-[#111111] mt-1 truncate">
                              {top ? top.title : "No recommended careers"}
                            </p>
                          </div>
                          {top && <MatchBadge pct={top.matchPercent} />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
