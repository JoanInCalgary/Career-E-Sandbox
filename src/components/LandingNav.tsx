"use client";

import Link from "next/link";

export default function LandingNav() {
  return (
    <nav className="bg-cream border-b border-[#E8E8E8] sticky top-0 z-20 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-7">
          <Link
            href="/"
            className="text-lg font-bold text-[#111111] tracking-tight"
            style={{ fontFamily: "var(--font-display, 'Fraunces', serif)" }}
          >
            Career-E-Sandbox
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-[#888888] hover:text-[#000c] transition-colors">
              How It Works
            </a>
            <a href="#frameworks" className="text-sm text-[#888888] hover:text-[#000c] transition-colors">
              Frameworks
            </a>
            <a href="#your-results" className="text-sm text-[#888888] hover:text-[#000c] transition-colors">
              Your Results
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-[#111111] border border-[#E8E8E8] px-4 py-1.5 rounded-full hover:border-[#000c] transition-colors hidden sm:inline-flex"
          >
            Log In
          </Link>
          <Link
            href="/create-account"
            className="text-sm font-semibold text-white bg-[#FF5500] px-4 py-1.5 rounded-full hover:bg-[#DD4400] transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
