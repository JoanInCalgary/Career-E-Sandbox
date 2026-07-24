/**
 * accountStore.ts  (server-only)
 *
 * Account / profile persistence against Supabase Auth + public.users /
 * public.personality. Passwords and sessions are owned by Supabase Auth.
 */

import { createAdminClient, hasServiceRoleKey } from "@/src/lib/supabase/admin";
import { createClient } from "@/src/lib/supabase/server";
import type { FullAssessmentPayload } from "@/src/lib/types";

export const SEARCH_LIMIT_PER_PERIOD = 20;
export const SEARCH_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface Account {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  updatedAt: number;
  profile: FullAssessmentPayload | null;
  engagement: string[];
  searchCount: number;
  searchPeriodStart: number;
  searchLimit: number;
}

export type PublicAccount = Account;

export function toPublicAccount(account: Account): PublicAccount {
  return { ...account };
}

export interface SearchUsage {
  used: number;
  limit: number;
  remaining: number;
  periodResetsAt: number;
}

export interface CreateAccountInput {
  name: string;
  email: string;
  password: string;
  engagement?: string[];
}

export interface UpdateAccountInput {
  name?: string;
  email?: string;
  password?: string;
  profile?: FullAssessmentPayload | null;
  engagement?: string[];
}

export class AccountError extends Error {
  code:
    | "EMAIL_TAKEN"
    | "NOT_FOUND"
    | "INVALID_CREDENTIALS"
    | "WEAK_PASSWORD"
    | "INVALID_EMAIL"
    | "EMAIL_NOT_CONFIRMED"
    | "SERVICE_ROLE_REQUIRED";
  constructor(code: AccountError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "AccountError";
  }
}

export interface SignUpResult {
  account: Account | null;
  usage: SearchUsage | null;
  /** True when Auth created the user but email confirmation is required before a session exists. */
  needsEmailConfirmation: boolean;
}

type UserRow = {
  id: string;
  name: string;
  search_count: number;
  search_period_start: string;
  search_limit: number;
  created_at: string;
  updated_at: string;
};

type PersonalityRow = {
  profile: FullAssessmentPayload | Record<string, unknown> | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmptyProfile(profile: FullAssessmentPayload | Record<string, unknown> | null): boolean {
  if (!profile || typeof profile !== "object") return true;
  return Object.keys(profile).length === 0;
}

function toAccount(
  row: UserRow,
  email: string,
  personality: PersonalityRow | null,
  engagement: string[]
): Account {
  const profile = personality?.profile ?? null;
  return {
    id: row.id,
    name: row.name,
    email,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    profile: isEmptyProfile(profile) ? null : (profile as FullAssessmentPayload),
    engagement,
    searchCount: row.search_count,
    searchPeriodStart: new Date(row.search_period_start).getTime(),
    searchLimit: row.search_limit,
  };
}

function usageFor(account: Account): SearchUsage {
  const now = Date.now();
  const periodExpired = now - account.searchPeriodStart >= SEARCH_PERIOD_MS;
  const used = periodExpired ? 0 : account.searchCount;
  const periodStart = periodExpired ? now : account.searchPeriodStart;
  return {
    used,
    limit: account.searchLimit,
    remaining: Math.max(0, account.searchLimit - used),
    periodResetsAt: periodStart + SEARCH_PERIOD_MS,
  };
}

async function loadEngagementKinds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("engagement")
    .select("kind")
    .eq("user_id", userId)
    .eq("opted_in", true);
  if (error) throw error;
  return (data ?? []).map((row) => row.kind as string);
}

async function replaceEngagementKinds(userId: string, kinds: string[]): Promise<void> {
  const supabase = await createClient();
  const { error: delError } = await supabase.from("engagement").delete().eq("user_id", userId);
  if (delError) throw delError;

  const unique = [...new Set(kinds.filter((k) => typeof k === "string" && k.trim()))];
  if (unique.length === 0) return;

  const { error: insError } = await supabase.from("engagement").insert(
    unique.map((kind) => ({
      user_id: userId,
      kind,
      opted_in: true,
    }))
  );
  if (insError) throw insError;
}

async function loadAccountById(id: string, email: string): Promise<Account | null> {
  const supabase = await createClient();
  const { data: row, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const { data: personality } = await supabase
    .from("personality")
    .select("profile")
    .eq("user_id", id)
    .maybeSingle();

  const engagement = await loadEngagementKinds(id);
  return toAccount(row as UserRow, email, personality as PersonalityRow | null, engagement);
}

/** Load the signed-in user's account (Auth user + profile + personality). */
export async function getAccountForAuthUser(user: {
  id: string;
  email?: string | null;
}): Promise<Account | null> {
  return loadAccountById(user.id, user.email ?? "");
}

export async function signUpAccount(input: CreateAccountInput): Promise<SignUpResult> {
  const email = normalizeEmail(input.email);
  if (!EMAIL_RE.test(email)) {
    throw new AccountError("INVALID_EMAIL", "Please enter a valid email address.");
  }
  if (input.password.length < 8) {
    throw new AccountError("WEAK_PASSWORD", "Password must be at least 8 characters.");
  }

  const supabase = await createClient();
  const name = input.name.trim() || "New User";
  const engagement = input.engagement ?? [];

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: { name, engagement },
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      throw new AccountError("EMAIL_TAKEN", "An account with that email already exists.");
    }
    throw new AccountError("INVALID_EMAIL", error.message);
  }

  const needsEmailConfirmation = !data.session;
  if (!data.user) {
    return { account: null, usage: null, needsEmailConfirmation: true };
  }

  // Trigger creates users + personality + engagement rows from metadata.
  // If we already have a session, refresh name on the profile row.
  if (data.session) {
    await supabase
      .from("users")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", data.user.id);
  }

  const account = await loadAccountById(data.user.id, email);
  return {
    account,
    usage: account ? usageFor(account) : null,
    needsEmailConfirmation,
  };
}

export async function signInAccount(email: string, password: string): Promise<Account> {
  const normalized = normalizeEmail(email);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });

  if (error || !data.user) {
    const msg = (error?.message ?? "").toLowerCase();
    if (msg.includes("confirm") || msg.includes("not confirmed")) {
      throw new AccountError(
        "EMAIL_NOT_CONFIRMED",
        "Please confirm your email before signing in. Check your inbox for the verification link."
      );
    }
    throw new AccountError("INVALID_CREDENTIALS", "Incorrect email or password.");
  }

  const account = await loadAccountById(data.user.id, data.user.email ?? normalized);
  if (!account) {
    throw new AccountError("NOT_FOUND", "Account profile not found. Try signing up again.");
  }
  return account;
}

export async function signOutAccount(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function findAccountById(id: string, email: string): Promise<Account | null> {
  return loadAccountById(id, email);
}

export async function updateAccount(id: string, patch: UpdateAccountInput): Promise<Account> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== id) {
    throw new AccountError("NOT_FOUND", "Account not found.");
  }

  if (patch.email !== undefined) {
    const email = normalizeEmail(patch.email);
    if (!EMAIL_RE.test(email)) {
      throw new AccountError("INVALID_EMAIL", "Please enter a valid email address.");
    }
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      throw new AccountError("EMAIL_TAKEN", error.message);
    }
  }

  if (patch.password !== undefined) {
    if (patch.password.length < 8) {
      throw new AccountError("WEAK_PASSWORD", "Password must be at least 8 characters.");
    }
    const { error } = await supabase.auth.updateUser({ password: patch.password });
    if (error) {
      throw new AccountError("WEAK_PASSWORD", error.message);
    }
  }

  const userUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) {
    userUpdates.name = patch.name.trim() || "New User";
    const { error } = await supabase.from("users").update(userUpdates).eq("id", id);
    if (error) throw error;
  }

  if (patch.engagement !== undefined) {
    await replaceEngagementKinds(id, patch.engagement);
  }

  if (patch.profile !== undefined) {
    const { error } = await supabase.from("personality").upsert({
      user_id: id,
      profile: patch.profile ?? {},
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  const account = await loadAccountById(id, patch.email ? normalizeEmail(patch.email) : user.email ?? "");
  if (!account) throw new AccountError("NOT_FOUND", "Account not found.");
  return account;
}

export async function deleteAccount(id: string): Promise<void> {
  if (!hasServiceRoleKey()) {
    throw new AccountError(
      "SERVICE_ROLE_REQUIRED",
      "Account deletion requires SUPABASE_SERVICE_ROLE_KEY in the server environment."
    );
  }
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw error;
}

export async function verifyCurrentPassword(email: string, password: string): Promise<boolean> {
  // Use a throwaway client so we don't overwrite the current session cookies.
  // Re-auth via password grant against the Auth API.
  const { createClient: createSb } = await import("@supabase/supabase-js");
  const { getSupabaseAnonKey, getSupabaseUrl } = await import("@/src/lib/supabase/env");
  const client = createSb(getSupabaseUrl(), getSupabaseAnonKey());
  const { error } = await client.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });
  return !error;
}

export async function getSearchUsage(id: string): Promise<SearchUsage | null> {
  const supabase = await createClient();
  const { data: row, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!row) return null;
  const account = toAccount(row as UserRow, "", null, []);
  return usageFor(account);
}

export async function recordSearch(id: string): Promise<{ ok: boolean; usage: SearchUsage }> {
  const supabase = await createClient();
  const { data: row, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!row) throw new AccountError("NOT_FOUND", "Account not found.");

  const account = toAccount(row as UserRow, "", null, []);
  const now = Date.now();
  let searchCount = account.searchCount;
  let searchPeriodStart = account.searchPeriodStart;

  if (now - searchPeriodStart >= SEARCH_PERIOD_MS) {
    searchPeriodStart = now;
    searchCount = 0;
  }

  const provisional = { ...account, searchCount, searchPeriodStart };
  if (searchCount >= account.searchLimit) {
    return { ok: false, usage: usageFor(provisional) };
  }

  searchCount += 1;
  const { error: updateError } = await supabase
    .from("users")
    .update({
      search_count: searchCount,
      search_period_start: new Date(searchPeriodStart).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) throw updateError;

  return {
    ok: true,
    usage: usageFor({ ...account, searchCount, searchPeriodStart }),
  };
}

/** @deprecated Prefer named exports; kept for gradual migration of call sites. */
export const accountStore = {
  getSearchUsage,
  recordSearch,
  update: updateAccount,
  delete: deleteAccount,
};
