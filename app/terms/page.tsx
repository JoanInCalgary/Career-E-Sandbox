"use client";

import LandingNav from "@/src/components/LandingNav";

const LAST_UPDATED = "July 26, 2026";

export default function TermsPage() {
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
        <h1 className="text-3xl md:text-4xl text-[#111111] mb-2">Terms of Use</h1>
        <p className="text-sm text-[#888888] mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="rounded-xl border border-[#E8E8E8] bg-[#F5F5F5] px-5 py-4 mb-10">
          <p className="text-sm text-[#555555] leading-relaxed">
            Career-E-Sandbox by Myrimaven Publishing is an education prototype, not a commercial
            product. These Terms are a plain-language draft covering how the platform is meant to be
            used while it remains in this phase; they are not a substitute for advice from a licensed
            attorney, and should be reviewed by one before any public or institutional launch.
          </p>
        </div>

        <div className="space-y-9 text-sm text-[#333333] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">1. Acceptance of these Terms</h2>
            <p>
              By creating an account or otherwise using Career-E-Sandbox (the &quot;Platform&quot;), you agree
              to these Terms of Use. If you do not agree, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">2. What the Platform Is</h2>
            <p>
              Career-E-Sandbox is an educational tool that combines inputs from personality and
              preference frameworks, including MBTI, Big Five, Sparketype, CliftonStrengths, Enneagram,
              DiSC, Chinese Zodiac, and Astrology, to generate exploratory career path suggestions. It is
              built primarily for post-secondary students exploring career or program decisions, and
              educators supporting that exploration.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">3. Not Professional Advice</h2>
            <p>
              Results are generated algorithmically, in part by third-party AI models, and are intended
              for exploratory and educational purposes only. They are <span className="font-semibold">not</span>{" "}
              professional career counseling, academic advising, psychological assessment, or a
              substitute for a licensed practitioner or advisor. These models are not validated
              psychometric instruments. Always use independent judgment, and do not rely on these
              results for consequential education or career decisions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">4. Accounts</h2>
            <p>
              You must provide accurate information when creating an account and are responsible for
              maintaining the confidentiality of your login credentials and for all activity under your
              account. Notify us promptly if you suspect unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Use the Platform for any unlawful purpose or in violation of any applicable regulation.</li>
              <li>Attempt to reverse-engineer, scrape, or overload the Platform or its underlying AI services.</li>
              <li>Submit personal data belonging to someone else without their consent.</li>
              <li>Misrepresent generated results as certified professional advice to a third party.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">6. AI-Generated Content</h2>
            <p>
              Career matches are produced by large language models (which may include providers such as
              Anthropic, OpenAI, Google, Groq, or OpenRouter, depending on your selection) based on the
              personality and preference data you provide. AI-generated content can be inaccurate,
              incomplete, or reflect biases in the underlying model. Titles, salary ranges, and market
              statistics are provided for illustrative purposes and should be independently verified.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">7. Search Limits</h2>
            <p>
              Accounts are subject to a periodic limit on the number of career searches they can
              generate, shown in-app. Limits exist to manage the cost of the underlying AI services and
              may change as the project evolves.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">8. Intellectual Property</h2>
            <p>
              The Platform&apos;s design, code, and content (excluding data you submit and third-party
              framework names, which remain the property of their respective owners) belong to 14675576
              Canada Ltd. doing business as Myrimaven Publishing. You retain ownership of the personality
              and preference data you enter.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">9. Third-Party Services</h2>
            <p>
              The Platform relies on third-party infrastructure, including Supabase for authentication
              and data storage and one or more third-party AI providers for generating results. Your use
              of the Platform is also subject to the availability and terms of those providers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">10. Termination</h2>
            <p>
              You may stop using the Platform and delete your account at any time from Account Settings.
              We may suspend or terminate access for conduct that violates these Terms or that we
              reasonably believe puts the Platform or other users at risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">11. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any kind,
              express or implied, including accuracy, reliability, or fitness for a particular purpose.
              As an educational prototype, features may change, break, or be discontinued without notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">12. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, 14675576 Canada Ltd. is not liable for any
              indirect, incidental, or consequential damages arising from your use of the Platform or
              reliance on its results, including career, academic, or financial decisions made based on
              generated content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">13. Changes</h2>
            <p>
              We may update these Terms as the project develops. Material changes will be reflected by
              updating the &quot;Last updated&quot; date above. Continued use of the Platform after changes take
              effect constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#111111] mb-2">14. Contact</h2>
            <p>
              Questions about these Terms can be directed to Myrimaven Publishing at{" "}
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
