"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";
import { useAuth } from "@/src/components/AuthProvider";

export default function UserMenu() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await signOut();
    setOpen(false);
    router.push("/");
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-sm font-semibold text-[#FF5500] border-2 border-[#FF5500] px-4 py-1.5 rounded hover:bg-[#FF5500]/5 transition-colors hidden sm:inline-flex"
        >
          Log In
        </Link>
        <Link
          href="/create-account"
          className="bg-[#FF5500] text-white text-sm font-semibold px-4 py-1.5 rounded hover:bg-[#DD4400] transition-colors"
        >
          Create Account
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 text-sm font-semibold text-[#111111] hover:text-[#FF5500] transition-colors"
      >
        <span>{user.name}</span>
        <CaretDown weight="bold" className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-cream border border-[#E8E8E8] rounded-lg shadow-[0_4px_20px_rgba(15,23,42,0.08)] py-1 z-30">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-4 py-2.5 text-sm text-[#555555] hover:bg-[#F5F5F5] hover:text-[#000c] transition-colors"
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2.5 text-sm text-[#555555] hover:bg-[#F5F5F5] hover:text-[#000c] transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
