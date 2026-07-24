"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppNav, { type AppNavPage } from "@/src/components/AppNav";
import { useAuth } from "@/src/components/AuthProvider";

/**
 * Redirects signed-out visitors to /login. Renders nothing useful until auth
 * has resolved so protected pages don't flash placeholder "guest" content.
 */
export default function RequireAuth({
  active,
  children,
}: {
  active: AppNavPage;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream">
        <AppNav active={active} />
        <div className="flex items-center justify-center py-24 text-sm text-[#888888]">
          {loading ? "Loading…" : "Redirecting to log in…"}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
