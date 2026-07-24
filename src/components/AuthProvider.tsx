"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { FullAssessmentPayload } from "@/src/lib/types";
import { loadFromSupabase } from "@/src/lib/loadFromSupabase";
import { clearFavourites } from "@/src/lib/favourites";
import { clearHistoryEntries } from "@/src/lib/modelRuns";
import { clearPersonalityProfile } from "@/src/lib/personalityProfile";

export const DEFAULT_USER_NAME = "John Doe";
export const DEFAULT_USER_EMAIL = "name@email.com";

export interface SearchUsage {
  used: number;
  limit: number;
  remaining: number;
  periodResetsAt: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  profile: FullAssessmentPayload | null;
  engagement: string[];
  searchUsage: SearchUsage | null;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  code?: string;
  /** Account created but must confirm email before a session exists. */
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True until the initial session check (GET /api/account/me) resolves. */
  loading: boolean;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    engagement?: string[];
  }) => Promise<AuthResult>;
  signIn: (input: { email: string; password: string }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  updateAccount: (patch: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    profile?: FullAssessmentPayload | null;
    engagement?: string[];
  }) => Promise<AuthResult>;
  deleteAccount: (currentPassword?: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface PublicAccountDto {
  id: string;
  name: string;
  email: string;
  profile: FullAssessmentPayload | null;
  engagement: string[];
}

function toAuthUser(account: PublicAccountDto, usage: SearchUsage | null): AuthUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    profile: account.profile,
    engagement: account.engagement,
    searchUsage: usage,
  };
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/account/me", { credentials: "same-origin" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { account: PublicAccountDto; usage: SearchUsage | null };
      setUser(toAuthUser(data.account, data.usage));
      await loadFromSupabase(data.account.profile);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const signUp = useCallback<AuthContextValue["signUp"]>(async (input) => {
    const res = await fetch("/api/account", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await parseJson(res);
    if (!res.ok) {
      return {
        ok: false,
        error: (data.error as string) ?? "Unable to create account.",
        code: data.code as string,
      };
    }
    if (data.needsEmailConfirmation) {
      return {
        ok: true,
        needsEmailConfirmation: true,
        error: (data.message as string) ?? "Check your email to confirm your account.",
      };
    }
    setUser(toAuthUser(data.account as PublicAccountDto, data.usage as SearchUsage | null));
    await loadFromSupabase(
      (data.account as PublicAccountDto | undefined)?.profile ?? null
    );
    return { ok: true };
  }, []);

  const signIn = useCallback<AuthContextValue["signIn"]>(async (input) => {
    const res = await fetch("/api/account/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await parseJson(res);
    if (!res.ok) {
      return {
        ok: false,
        error: (data.error as string) ?? "Unable to log in.",
        code: data.code as string,
      };
    }
    setUser(toAuthUser(data.account as PublicAccountDto, data.usage as SearchUsage | null));
    await loadFromSupabase(
      (data.account as PublicAccountDto | undefined)?.profile ?? null
    );
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/account/session", { method: "DELETE" });
    clearFavourites();
    clearHistoryEntries();
    clearPersonalityProfile();
    setUser(null);
  }, []);

  const updateAccount = useCallback<AuthContextValue["updateAccount"]>(async (patch) => {
    const res = await fetch("/api/account/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await parseJson(res);
    if (!res.ok) {
      return {
        ok: false,
        error: (data.error as string) ?? "Unable to update account.",
        code: data.code as string,
      };
    }
    setUser(toAuthUser(data.account as PublicAccountDto, data.usage as SearchUsage | null));
    return { ok: true };
  }, []);

  const deleteAccount = useCallback<AuthContextValue["deleteAccount"]>(async (currentPassword) => {
    const res = await fetch("/api/account/me", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword }),
    });
    const data = await parseJson(res);
    if (!res.ok) {
      return {
        ok: false,
        error: (data.error as string) ?? "Unable to delete account.",
        code: data.code as string,
      };
    }
    clearFavourites();
    clearHistoryEntries();
    clearPersonalityProfile();
    setUser(null);
    return { ok: true };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        signUp,
        signIn,
        signOut,
        refresh,
        updateAccount,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
