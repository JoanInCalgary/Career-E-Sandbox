"use client";

import Link from "next/link";
import UserMenu from "@/src/components/UserMenu";

export type AppNavPage = "dashboard" | "search" | "results-history" | "account";

function navLinkClass(active: boolean) {
  return active
    ? "text-sm font-semibold text-[#111111] border-b-2 border-[#000c] pb-0.5"
    : "text-sm text-[#888888] hover:text-[#000c] transition-colors";
}

export default function AppNav({ active }: { active: AppNavPage }) {
  return (
    <nav className="bg-cream border-b border-[#E8E8E8] sticky top-0 z-20 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between relative">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className={navLinkClass(active === "dashboard")}>Home</Link>
          <Link href="/search" className={navLinkClass(active === "search")}>Search</Link>
          <Link href="/results-history" className={navLinkClass(active === "results-history")}>
            Results History
          </Link>
        </div>
        <Link
          href="/dashboard"
          className="absolute left-1/2 -translate-x-1/2 hidden md:block text-lg font-bold text-[#111111] tracking-tight"
          style={{ fontFamily: "var(--font-display, 'Fraunces', serif)" }}
        >
          Career-E-Sandbox
        </Link>
        <UserMenu />
      </div>
    </nav>
  );
}
