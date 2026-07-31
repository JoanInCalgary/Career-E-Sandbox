"use client";

import LandingNav from "@/src/components/LandingNav";

const LAST_UPDATED = "July 26, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <LandingNav />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <p
          className="text-xs font-bold uppercase tracking-widest text-[#888888] mb-3"
          style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
        >
          Legal
        </p>
        <h1 className="text-3xl md:text-4xl text-[#111111] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#888888] mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="rounded-xl border border-[#E8E8E8] bg-[#F5F5F5] px-5 py-4 mb-10">
          <p className="text-sm text-[#555555] leading-relaxed">
            Career-E-Sandbox by Myrimaven Publishing is an education prototype. This is a
            plain-language draft describing our current data practices; it is not a substitute for
            advice from a licensed attorney and should be reviewed by one, along with your
            institution&apos;s data governance policy, before any public or institutional launch.
          </p>
        </div>

        <div className="space-y-9 text-sm text-[#333333] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">1. Overview</h2>
            <p>
              This Privacy Policy explains what information Career-E-Sandbox (the &quot;Platform&quot;)
              collects, how it is used, and the choices available to you. The Platform is built for
              education purposes and is not intended to monetize or sell personal data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <span className="font-semibold text-[#111111]">Account information:</span> name, email
                address, and password, managed via Supabase Authentication.
              </li>
              <li>
                <span className="font-semibold text-[#111111]">Personality &amp; preference data:</span>{" "}
                the assessment results and preferences you voluntarily enter (e.g. MBTI type, Big Five
                scores, Sparketype, work environment preference, education level, task dislikes) and, if
                you choose to provide them, optional demographic fields such as age range, gender, or
                race.
              </li>
              <li>
                <span className="font-semibold text-[#111111]">Usage data:</span> your saved career
                searches, favourited results, and search-quota usage (used/remaining count per period).
              </li>
              <li>
                <span className="font-semibold text-[#111111]">Engagement preferences:</span> whether you
                opted in to email updates, focus groups, or a product demo at signup.
              </li>
              <li>
                <span className="font-semibold text-[#111111]">Technical data:</span> session cookies
                required for authentication, managed by Supabase.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">3. How We Use Information</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To generate your personality-to-career match results.</li>
              <li>To maintain your account, personality profile, favourites, and search history across sessions.</li>
              <li>To enforce per-account search limits and prevent abuse.</li>
              <li>To improve the Platform and support the educational goals of the project.</li>
              <li>To contact you about product updates, surveys, or a demo — only if you opted in.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">4. AI Processing &amp; Third Parties</h2>
            <p>
              When you generate results, your personality trait data (not your name, email, or other
              direct identifiers) is sent to a third-party AI provider you or the Platform selects, which
              may include Anthropic, OpenAI, Google, Groq, or OpenRouter, to produce career
              recommendations. These providers process the data under their own terms and privacy
              policies. Account data itself is stored with Supabase, our database and authentication
              provider.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">5. Data Storage &amp; Security</h2>
            <p>
              Data is stored in a Supabase-hosted Postgres database with row-level security scoped to
              your account. We use reasonable administrative and technical safeguards, but no method of
              storage or transmission is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">6. Data Retention</h2>
            <p>
              We retain your account and profile data for as long as your account remains active. If you
              delete your account, your profile, favourites, and search history are removed; some
              anonymized or aggregated data may be retained for the educational purposes of the
              project.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">7. Your Rights &amp; Choices</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You can view and edit your personality profile at any time from your Dashboard.</li>
              <li>You can update your name, email, or password from Account Settings.</li>
              <li>You can opt out of email updates, focus groups, or demo outreach at any time.</li>
              <li>You can permanently delete your account and associated data from Account Settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">8. Children&apos;s Privacy</h2>
            <p>
              The Platform is intended for post-secondary students and is not directed to children under
              13. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">9. Cookies</h2>
            <p>
              We use cookies only as required for authentication and session management via Supabase. We
              do not currently use third-party advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy as the project develops. Material changes will be
              reflected by updating the &quot;Last updated&quot; date above.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">11. Contact</h2>
            <p>
              Questions about this Privacy Policy or your data can be directed to Myrimaven Publishing at{" "}
              <a
                href="https://myrimavenpublishing.com/contact/"
                className="underline text-[#111111]"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://myrimavenpublishing.com/contact/
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
