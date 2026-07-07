import Link from "next/link";
import LandingNav from "@/src/components/LandingNav";

// ── Icons ──────────────────────────────────────────────────────────────────────

function IconBrain() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-3.22-3.22A2.25 2.25 0 0015 10.22V3.104M19.8 15a2.25 2.25 0 01.45 2.247A10.5 10.5 0 0112 21a10.5 10.5 0 01-8.25-3.753 2.25 2.25 0 01.45-2.247L7.5 13.5m4.5 0l-1.5 1.5m4.5-1.5l1.5 1.5" />
    </svg>
  );
}

function IconSliders() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
    </svg>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: <IconBrain />,
    title: "Input Your Results",
    body: "Plug in your scores from personality tests you've already taken — MBTI, Big Five, Enneagram, and more. No need to redo them.",
  },
  {
    step: "02",
    icon: <IconSliders />,
    title: "Explore the Sandbox",
    body: "Tweak your sliders. Toggle your preferences. See how small shifts in your personality settings change which careers rise to the top.",
  },
  {
    step: "03",
    icon: <IconSparkle />,
    title: "Discover Your Matches",
    body: "Get a ranked list of careers tailored to your traits — with clear explanations of why each one fits (or doesn't), and real market data.",
  },
];

const FRAMEWORKS = [
  { name: "Astrology",          category: "Celestial Influence", descriptor: "Sun-sign archetypes as a supplementary lens.",           index: "01" },
  { name: "Big Five Model",     category: "Trait Psychology",    descriptor: "OCEAN: the gold standard in personality science.",        index: "02" },
  { name: "Chinese Zodiac",     category: "Eastern Framework",   descriptor: "12-animal cycle with 5-element elemental modifiers.",    index: "03" },
  { name: "CliftonStrengths",   category: "Talent Profile",      descriptor: "34-theme strengths inventory from Gallup research.",     index: "04" },
  { name: "DiSC Assessment",    category: "Behavioral Style",    descriptor: "Dominance, Influence, Steadiness, Conscientiousness.",   index: "05" },
  { name: "Enneagram",          category: "Motivational Type",   descriptor: "9 types mapping core fears, desires, and growth paths.", index: "06" },
  { name: "Myers-Briggs (MBTI)",category: "Personality Type",    descriptor: "16 cognitive preference types across 4 dichotomies.",    index: "07" },
  { name: "Sparketype",         category: "Energy & Purpose",    descriptor: "Identifies the work that makes you feel most alive.",    index: "08" },
];

const RESULTS_CALLOUTS = [
  { title: "Personality-first explanations",      body: "Every match explains how your specific traits connect to the role — not generic job descriptions." },
  { title: "Pros & cons that actually mean something", body: "What will feel natural for you and what might drain you — tied directly to your personality type." },
  { title: "Real job market data",               body: "Salary ranges, growth outlook, and education requirements — secondary, but there when you need them." },
  { title: "Sandbox controls",                   body: "Adjust any metric and regenerate instantly. Explore without ever restarting from scratch." },
];

// ── Results Preview Mock ───────────────────────────────────────────────────────

function ResultsPreviewMock() {
  return (
    <div className="rounded-2xl border border-[#E8E8E8] overflow-hidden bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F5F5F5] border-b border-[#E8E8E8]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FFAAAA]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FFDD88]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#AADDAA]" />
        <span className="ml-2 text-[10px] text-[#888888] font-medium">Career Path Results</span>
      </div>

      <div className="p-3 sm:p-4 relative pb-14 min-h-[340px] bg-[#FAFAFA]">
        <h3 className="text-sm font-bold text-[#111111] mb-3">Your Career Matches</h3>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#E8E8E8] mb-3 text-[9px] sm:text-[10px] font-semibold">
          <span className="text-[#0055FF] border-b-2 border-[#0055FF] pb-1.5">Best Fits (5)</span>
          <span className="text-[#888888] pb-1.5">Worth Avoiding (5)</span>
        </div>

        {/* Primary card */}
        <div className="rounded-xl border border-[#E8E8E8] overflow-hidden mb-2 bg-white">
          <div className="h-1 bg-[#111111]" />
          <div className="p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: "#0055FF", fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
              >
                96% fit
              </span>
              <span className="text-[8px] font-semibold text-[#888888] uppercase tracking-wide">Technology</span>
            </div>
            <p className="text-xs font-bold text-[#111111] mb-1.5">Data Scientist / ML Engineer</p>
            <p className="text-[9px] text-[#555555] leading-snug">
              Your systems thinking and comfort with ambiguity make this a natural fit.
            </p>
            <div className="flex gap-3 mt-2">
              <span className="text-[8px] font-bold" style={{ color: "#00BB00" }}>+ Remote-friendly</span>
              <span className="text-[8px] font-bold" style={{ color: "#EE0000" }}>– Stakeholder load</span>
            </div>
          </div>
        </div>

        {/* Secondary cards */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { pct: "89%", title: "UX Researcher" },
            { pct: "85%", title: "Curriculum Designer" },
          ].map((card) => (
            <div key={card.title} className="rounded-xl border border-[#E8E8E8] overflow-hidden bg-white">
              <div className="h-0.5 bg-[#111111]" />
              <div className="p-2">
                <span
                  className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "#0055FF", fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
                >
                  {card.pct}
                </span>
                <p className="text-[9px] font-bold text-[#111111] mt-1 leading-tight">{card.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Floating pill mockup */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white border border-[#E8E8E8] rounded-full shadow-md flex items-center gap-0 overflow-hidden h-9">
          <span className="text-[8px] text-[#555555] font-medium px-3 whitespace-nowrap">INFJ · Explorer</span>
          <span className="w-px h-full bg-[#E8E8E8]" />
          <span className="text-[8px] text-[#555555] font-medium px-3 whitespace-nowrap">Gemini</span>
          <span className="w-px h-full bg-[#E8E8E8]" />
          <span
            className="text-[8px] font-bold text-white px-3 h-full flex items-center"
            style={{ backgroundColor: "#FF5500" }}
          >
            Generate ↯
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Landing Page ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      {/* ══ Hero ════════════════════════════════════════════════════════════════ */}
      <section className="pt-24 pb-28 px-6 border-b border-[#E8E8E8]">
        <div className="max-w-3xl mx-auto text-center">
          {/* Eyebrow */}
          <p
            className="text-xs font-bold uppercase tracking-widest text-[#888888] mb-8"
            style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
          >
            Personality → Career Match
          </p>

          {/* Hero heading — Instrument Serif via h1 global rule */}
          <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] text-[#111111] mb-6">
            What kind of work<br />
            actually lights you up?
          </h1>

          <p className="text-lg md:text-xl text-[#555555] leading-relaxed max-w-xl mx-auto mb-10">
            Tell us your personality. We&apos;ll show you where you fit — then let you play with the
            results until something clicks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/create-account"
              className="inline-flex items-center gap-2 font-bold text-base px-8 py-4 rounded-full text-white transition-colors"
              style={{ backgroundColor: "#FF5500" }}
            >
              Start exploring
              <IconArrowRight />
            </Link>
            <Link
              href="/login"
              className="text-sm text-[#888888] hover:text-[#111111] transition-colors underline underline-offset-4"
            >
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </section>

      {/* ══ How It Works ════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 px-6 bg-[#FAFAFA] border-b border-[#E8E8E8]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs font-bold uppercase tracking-widest text-[#888888] mb-3"
              style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
            >
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl text-[#111111]">Three steps to your sandbox</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.step}
                className="bg-white rounded-2xl border border-[#E8E8E8] p-7 hover:shadow-md hover:border-[#111111] transition-all"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#333333]">
                    {step.icon}
                  </div>
                  <span
                    className="text-3xl font-bold leading-none select-none text-[#E8E8E8]"
                    style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
                  >
                    {step.step}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#111111] mb-2">{step.title}</h3>
                <p className="text-sm text-[#555555] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8 Frameworks ════════════════════════════════════════════════════════ */}
      <section id="frameworks" className="py-20 px-6 border-b border-[#E8E8E8]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs font-bold uppercase tracking-widest text-[#888888] mb-3"
              style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
            >
              Supported frameworks
            </p>
            <h2 className="text-3xl md:text-4xl text-[#111111] mb-4">
              8 ways to understand yourself
            </h2>
            <p className="text-base text-[#555555] max-w-xl mx-auto">
              Already have results from one of these? Plug them in. Use as many or as few as you like.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FRAMEWORKS.map((fw) => (
              <div
                key={fw.name}
                className="bg-white rounded-2xl border border-[#E8E8E8] p-4 hover:border-[#111111] hover:shadow-sm transition-all"
              >
                <p
                  className="text-[9px] font-bold uppercase tracking-widest text-[#888888] mb-1"
                  style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
                >
                  {fw.category}
                </p>
                <p className="text-sm font-bold text-[#111111] mb-1">{fw.name}</p>
                <p className="text-xs text-[#555555] leading-relaxed">{fw.descriptor}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Results Preview ════════════════════════════════════════════════════ */}
      <section id="your-results" className="py-20 px-6 bg-[#FAFAFA] border-b border-[#E8E8E8]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest text-[#888888] mb-3"
                style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
              >
                What you get
              </p>
              <h2 className="text-3xl md:text-4xl text-[#111111] mb-4">
                Results that actually feel like you
              </h2>
              <p className="text-base text-[#555555] leading-relaxed mb-8">
                Your career matches come with personality-first explanations — not generic job
                descriptions. We tell you exactly how your traits connect to each role.
              </p>

              <div className="space-y-5 mb-8">
                {RESULTS_CALLOUTS.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#111111] shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-[#111111] mb-0.5">{item.title}</p>
                      <p className="text-sm text-[#555555] leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/create-account"
                className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-full text-white transition-colors"
                style={{ backgroundColor: "#FF5500" }}
              >
                Start exploring
                <IconArrowRight />
              </Link>
            </div>

            <ResultsPreviewMock />
          </div>
        </div>
      </section>

      {/* ══ Footer ══════════════════════════════════════════════════════════════ */}
      <footer className="py-12 px-6 bg-[#111111]">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <p className="text-base font-bold text-white tracking-tight">Career-E-Sandbox</p>
          <p className="text-xs leading-relaxed max-w-md mx-auto text-[#666666]">
            <span className="font-semibold text-[#AAAAAA]">Research Beta Disclaimer:</span>{" "}
            Career-E-Sandbox is a research prototype. Results are generated algorithmically and are
            intended for exploratory purposes only — not professional career counseling or academic
            advising.
          </p>
          <div className="flex items-center justify-center gap-5">
            <a href="#" className="text-xs text-[#666666] hover:text-white transition-colors underline underline-offset-2">
              Terms of Use
            </a>
            <span className="text-xs text-[#333333]">•</span>
            <a href="#" className="text-xs text-[#666666] hover:text-white transition-colors underline underline-offset-2">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
