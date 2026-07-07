"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/src/components/AppNav";
import { DEFAULT_USER_EMAIL, DEFAULT_USER_NAME, useAuth } from "@/src/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState(DEFAULT_USER_EMAIL);
  const [password, setPassword] = useState("password123");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    signIn({ email });
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white">
      <AppNav active="dashboard" />
      <main className="flex items-center justify-center p-6 min-h-[calc(100vh-56px)]">
        <div className="w-full max-w-md bg-white rounded-xl border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-8">
          <h1 className="text-2xl font-bold text-[#111111] mb-1">Log In</h1>
          <p className="text-sm text-[#555555] mb-8">Access your saved career trajectories.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-widest block mb-2">
                Email Address
              </label>
              <input
                type="email"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#E8E8E8] rounded px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#FF5500]"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#FF5500] text-white font-semibold text-sm py-3 rounded hover:bg-[#DD4400] transition-colors"
            >
              Log In
            </button>
          </form>

          <p className="text-sm text-[#555555] text-center mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/create-account" className="text-[#FF5500] font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
