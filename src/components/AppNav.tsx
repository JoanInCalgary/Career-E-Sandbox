"use client";

import Link from "next/link";
import UserMenu from "@/src/components/UserMenu";
import { useAuth } from "@/src/components/AuthProvider";

export type AppNavPage = "dashboard" | "search" | "results-history" | "account";

function navLinkClass(active: boolean) {
  return active
    ? "text-sm font-semibold text-[#111111] border-b-2 border-[#000c] pb-0.5"
    : "text-sm text-[#888888] hover:text-[#000c] transition-colors";
}

/** Small always-visible search-quota indicator. Shifts to amber at 50% used
 * and red at 0 remaining, so usage stays visible without needing a toast. */
function UsagePill() {
  const { isAuthenticated, user } = useAuth();
  const usage = user?.searchUsage;
  if (!isAuthenticated || !usage) return null;

  const pctUsed = usage.limit > 0 ? usage.used / usage.limit : 0;
  const isEmpty = usage.remaining <= 0;
  const isHalf = !isEmpty && pctUsed >= 0.5;

  const styles = isEmpty
    ? { bg: "#FFEEEE", border: "#EEBBBB", text: "#CC0000" }
    : isHalf
    ? { bg: "#FFF8EE", border: "#F0DDAA", text: "#996600" }
    : { bg: "#F5F5F5", border: "#E8E8E8", text: "#888888" };

  return (
    <span
      title={`${usage.used} of ${usage.limit} searches used this period`}
      className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap"
      style={{ backgroundColor: styles.bg, borderColor: styles.border, color: styles.text }}
    >
      {usage.remaining}/{usage.limit} searches left
    </span>
  );
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
        <div className="flex items-center gap-3">
          <UsagePill />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
