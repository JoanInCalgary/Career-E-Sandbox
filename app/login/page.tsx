"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppNav from "@/src/components/AppNav";
import { useAuth } from "@/src/components/AuthProvider";
import { getHistoryEntries } from "@/src/lib/modelRuns";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("confirm") === "1") {
      setInfo("Account created. Check your email for a confirmation link, then sign in here.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signIn({ email, password });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Unable to log in.");
      return;
    }
    // New accounts (no searches yet) land on Search first; returning users go Home.
    router.push(getHistoryEntries().length > 0 ? "/dashboard" : "/search");
  }

  return (
    <div className="w-full max-w-md bg-cream rounded-xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-8">
      <h1 className="text-2xl font-bold text-[#111111] mb-1">Log In</h1>
      <p className="text-sm text-[#555555] mb-8">Access your saved career trajectories.</p>

      {info && (
        <div className="mb-5 rounded-lg border border-[#FF5500]/30 bg-[#FFF5F0] px-3 py-2.5 text-sm text-[#884422]">
          {info}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg border border-[#EE0000]/30 bg-[#FFEEEE] px-3 py-2.5 text-sm text-[#CC0000]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-[#E8E8E8] rounded px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#FF5500]"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#FF5500] text-white font-semibold text-sm py-3 rounded hover:bg-[#DD4400] transition-colors disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Log In"}
        </button>
      </form>

      <p className="text-sm text-[#555555] text-center mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/create-account" className="text-[#FF5500] font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-cream">
      <AppNav active="dashboard" />
      <main className="flex items-center justify-center p-6 min-h-[calc(100vh-56px)]">
        <Suspense fallback={<div className="text-sm text-[#888888]">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
