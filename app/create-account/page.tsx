"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/src/components/AppNav";
import { useAuth } from "@/src/components/AuthProvider";

const ENGAGEMENT_OPTIONS = [
  {
    id: "newsletter",
    label: "Subscribe to email updates",
    description: "Receive announcements about new features and application progress.",
  },
  {
    id: "focusGroup",
    label: "Participate in focus groups or surveys",
    description: "Help shape the product by sharing feedback through occasional surveys.",
  },
  {
    id: "demo",
    label: "Book a demo appointment",
    description: "Schedule a one-on-one session to explore the platform and provide direct feedback.",
  },
];

export default function CreateAccountPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [engagement, setEngagement] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleEngagement(id: string) {
    setEngagement((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    const result = await signUp({ name, email, password, confirmPassword, engagement: Array.from(engagement) });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Unable to create account.");
      return;
    }
    router.push("/search");
  }

  return (
    <div className="min-h-screen bg-cream">
      <AppNav active="dashboard" />
      <main className="flex items-center justify-center p-6 min-h-[calc(100vh-56px)]">
        <div className="w-full max-w-md bg-cream rounded-xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-8">
          <h1 className="text-2xl font-bold text-[#111111] mb-1">Create Account</h1>
          <p className="text-sm text-[#555555] mb-8">Start building your career sandbox profile.</p>

          {error && (
            <div className="mb-5 rounded-lg border border-[#EE0000]/30 bg-[#FFEEEE] px-3 py-2.5 text-sm text-[#CC0000]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-widest block mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full border border-[#E8E8E8] rounded px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#FF5500]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-widest block mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full border border-[#E8E8E8] rounded px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#FF5500]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-widest block mb-2">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full border border-[#E8E8E8] rounded px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#FF5500]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-widest block mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#E8E8E8] rounded px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#FF5500]"
              />
            </div>

            {/* Engagement & Feedback */}
            <div className="border border-[#E8E8E8] rounded-lg p-4 space-y-3">
              <div className="mb-1">
                <p className="text-[11px] font-bold text-[#888888] uppercase tracking-widest">
                  Stay Involved <span className="text-[#888888] font-normal normal-case tracking-normal">(optional)</span>
                </p>
                <p className="text-xs text-[#555555] mt-1">
                  Help us build a better product. All options are completely optional.
                </p>
              </div>
              {ENGAGEMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors ${
                    engagement.has(opt.id)
                      ? "border-[#FF5500]/30 bg-[#F5F5F5]"
                      : "border-[#E8E8E8] hover:border-[#FF5500]/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={engagement.has(opt.id)}
                    onChange={() => toggleEngagement(opt.id)}
                    className="w-4 h-4 mt-0.5 accent-[#FF5500] cursor-pointer shrink-0"
                  />
                  <div>
                    <span className="text-sm font-semibold text-[#111111] block">{opt.label}</span>
                    <span className="text-xs text-[#555555]">{opt.description}</span>
                  </div>
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#FF5500] text-white font-semibold text-sm py-3 rounded hover:bg-[#DD4400] transition-colors disabled:opacity-60"
            >
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-sm text-[#555555] text-center mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#FF5500] font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
