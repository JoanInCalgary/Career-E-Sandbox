/**
 * accountStore.ts  (server-only)
 *
 * Account persistence for user accounts + profiles. This is intentionally
 * written as a small interface (`AccountStore`) plus one concrete
 * implementation (`FileAccountStore`) so the rest of the app never talks to
 * storage directly — only to the interface.
 *
 * ── Swapping in a real database later ──────────────────────────────────────
 * When this project moves off the sandbox and onto e.g. Postgres/Prisma,
 * Supabase, or similar:
 *   1. Write a new class that implements `AccountStore` against the real DB
 *      (e.g. `PrismaAccountStore`).
 *   2. Change the `accountStore` export at the bottom of this file to a new
 *      instance of that class.
 * No other file in the app imports `FileAccountStore` directly — everything
 * (API routes) imports the `accountStore` singleton and the `Account` /
 * `AccountStore` types, so the swap is a one-file change.
 *
 * For now, `FileAccountStore` keeps accounts in memory and mirrors them to a
 * JSON file under `.data/accounts.json` (gitignored) so accounts survive a
 * dev server restart. This is a POC-grade persistence layer, not a database.
 *
 * Do not import this file from a "use client" component — it uses Node's
 * `fs` and `crypto` modules and must only be reached from route handlers /
 * other server-only code.
 */

import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import type { FullAssessmentPayload } from "@/src/lib/types";

// ── Search limit policy ──────────────────────────────────────────────────────
//
// Every account gets a rolling search allowance. Once `SEARCH_LIMIT_PER_PERIOD`
// searches have been used within `SEARCH_PERIOD_MS`, further searches are
// blocked until the period rolls over. This is deliberately simple (no
// tiers/plans yet) but each account stores its own `searchLimit`, so a future
// subscription/tier system can vary the limit per account without changing
// the enforcement logic.

export const SEARCH_LIMIT_PER_PERIOD = 20;
export const SEARCH_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Account {
  id: string;
  name: string;
  /** Always stored lowercase/trimmed; treated as the unique login identifier. */
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: number;
  updatedAt: number;
  /** Latest saved personality/preference assessment, if any. */
  profile: FullAssessmentPayload | null;
  /** Optional engagement opt-ins collected at signup (newsletter, focus group, demo). */
  engagement: string[];
  searchCount: number;
  searchPeriodStart: number;
  searchLimit: number;
}

/** Account shape safe to send to the client (never leaks password material). */
export type PublicAccount = Omit<Account, "passwordHash" | "passwordSalt">;

export function toPublicAccount(account: Account): PublicAccount {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    profile: account.profile,
    engagement: account.engagement,
    searchCount: account.searchCount,
    searchPeriodStart: account.searchPeriodStart,
    searchLimit: account.searchLimit,
  };
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
  /** New password. Callers must have already verified the current password. */
  password?: string;
  profile?: FullAssessmentPayload | null;
  engagement?: string[];
}

export class AccountError extends Error {
  code: "EMAIL_TAKEN" | "NOT_FOUND" | "INVALID_CREDENTIALS" | "WEAK_PASSWORD" | "INVALID_EMAIL";
  constructor(code: AccountError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "AccountError";
  }
}

export interface AccountStore {
  create(input: CreateAccountInput): Promise<Account>;
  findByEmail(email: string): Promise<Account | null>;
  findById(id: string): Promise<Account | null>;
  update(id: string, patch: UpdateAccountInput): Promise<Account>;
  delete(id: string): Promise<boolean>;
  verifyPassword(email: string, password: string): Promise<Account | null>;
  /** Attempts to record one search against the account's rolling allowance. */
  recordSearch(id: string): Promise<{ ok: boolean; usage: SearchUsage }>;
  getSearchUsage(id: string): Promise<SearchUsage | null>;
}

// ── Password hashing (scrypt, no external deps) ─────────────────────────────

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

function verifyPasswordHash(password: string, salt: string, expectedHash: string): boolean {
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── File-backed in-memory implementation ─────────────────────────────────────

const DATA_FILE = join(process.cwd(), ".data", "accounts.json");

function loadFromDisk(): Map<string, Account> {
  try {
    const raw = readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Account[];
    return new Map(parsed.map((a) => [a.id, a]));
  } catch {
    return new Map();
  }
}

function saveToDisk(accounts: Map<string, Account>): void {
  try {
    mkdirSync(dirname(DATA_FILE), { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(Array.from(accounts.values()), null, 2), "utf-8");
  } catch (err) {
    // POC-grade persistence — if the disk write fails we keep serving from
    // memory rather than crashing the request. Swap to a real DB to remove
    // this limitation.
    console.error("[accountStore] failed to persist accounts to disk:", err);
  }
}

class FileAccountStore implements AccountStore {
  private accounts: Map<string, Account>;

  constructor() {
    this.accounts = loadFromDisk();
  }

  private persist() {
    saveToDisk(this.accounts);
  }

  private byEmail(email: string): Account | undefined {
    const normalized = normalizeEmail(email);
    for (const account of this.accounts.values()) {
      if (account.email === normalized) return account;
    }
    return undefined;
  }

  async create(input: CreateAccountInput): Promise<Account> {
    const email = normalizeEmail(input.email);
    if (!EMAIL_RE.test(email)) {
      throw new AccountError("INVALID_EMAIL", "Please enter a valid email address.");
    }
    if (input.password.length < 8) {
      throw new AccountError("WEAK_PASSWORD", "Password must be at least 8 characters.");
    }
    if (this.byEmail(email)) {
      throw new AccountError("EMAIL_TAKEN", "An account with that email already exists.");
    }

    const { hash, salt } = hashPassword(input.password);
    const now = Date.now();
    const account: Account = {
      id: randomUUID(),
      name: input.name.trim() || "New User",
      email,
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: now,
      updatedAt: now,
      profile: null,
      engagement: input.engagement ?? [],
      searchCount: 0,
      searchPeriodStart: now,
      searchLimit: SEARCH_LIMIT_PER_PERIOD,
    };
    this.accounts.set(account.id, account);
    this.persist();
    return account;
  }

  async findByEmail(email: string): Promise<Account | null> {
    return this.byEmail(email) ?? null;
  }

  async findById(id: string): Promise<Account | null> {
    return this.accounts.get(id) ?? null;
  }

  async update(id: string, patch: UpdateAccountInput): Promise<Account> {
    const existing = this.accounts.get(id);
    if (!existing) throw new AccountError("NOT_FOUND", "Account not found.");

    let email = existing.email;
    if (patch.email !== undefined) {
      email = normalizeEmail(patch.email);
      if (!EMAIL_RE.test(email)) {
        throw new AccountError("INVALID_EMAIL", "Please enter a valid email address.");
      }
      const clash = this.byEmail(email);
      if (clash && clash.id !== id) {
        throw new AccountError("EMAIL_TAKEN", "An account with that email already exists.");
      }
    }

    let passwordHash = existing.passwordHash;
    let passwordSalt = existing.passwordSalt;
    if (patch.password !== undefined) {
      if (patch.password.length < 8) {
        throw new AccountError("WEAK_PASSWORD", "Password must be at least 8 characters.");
      }
      const { hash, salt } = hashPassword(patch.password);
      passwordHash = hash;
      passwordSalt = salt;
    }

    const updated: Account = {
      ...existing,
      name: patch.name !== undefined ? patch.name.trim() || existing.name : existing.name,
      email,
      passwordHash,
      passwordSalt,
      profile: patch.profile !== undefined ? patch.profile : existing.profile,
      engagement: patch.engagement !== undefined ? patch.engagement : existing.engagement,
      updatedAt: Date.now(),
    };
    this.accounts.set(id, updated);
    this.persist();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existed = this.accounts.delete(id);
    if (existed) this.persist();
    return existed;
  }

  async verifyPassword(email: string, password: string): Promise<Account | null> {
    const account = this.byEmail(email);
    if (!account) return null;
    const ok = verifyPasswordHash(password, account.passwordSalt, account.passwordHash);
    return ok ? account : null;
  }

  private usageFor(account: Account): SearchUsage {
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

  async getSearchUsage(id: string): Promise<SearchUsage | null> {
    const account = this.accounts.get(id);
    if (!account) return null;
    return this.usageFor(account);
  }

  async recordSearch(id: string): Promise<{ ok: boolean; usage: SearchUsage }> {
    const account = this.accounts.get(id);
    if (!account) throw new AccountError("NOT_FOUND", "Account not found.");

    const now = Date.now();
    if (now - account.searchPeriodStart >= SEARCH_PERIOD_MS) {
      account.searchPeriodStart = now;
      account.searchCount = 0;
    }

    if (account.searchCount >= account.searchLimit) {
      return { ok: false, usage: this.usageFor(account) };
    }

    account.searchCount += 1;
    account.updatedAt = now;
    this.accounts.set(id, account);
    this.persist();
    return { ok: true, usage: this.usageFor(account) };
  }
}

// Swap this line to point at a real DB-backed implementation later.
export const accountStore: AccountStore = new FileAccountStore();
