/**
 * session.ts  (server-only)
 *
 * Minimal signed-cookie session mechanism so API routes can identify which
 * account is making a request without a real database.
 *
 * Sessions live in an in-memory Map keyed by a random token, and the cookie
 * value is `${token}.${hmac(token)}` so a client can't forge a token even
 * though the lookup table itself isn't persisted. This means active sessions
 * are dropped on server restart — acceptable for a POC. When this moves to a
 * real database, replace the `sessions` Map below with a `sessions` table (or
 * a signed JWT) and keep `createSession` / `resolveSession` / `destroySession`
 * as the only functions the rest of the app calls.
 */

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "career_e_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// In dev this falls back to a fixed string so restarts don't invalidate
// sessions unexpectedly; in any real deployment set SESSION_SECRET in the
// environment.
const SECRET = process.env.SESSION_SECRET || "career-e-sandbox-dev-secret-do-not-use-in-prod";

interface SessionRecord {
  accountId: string;
  expiresAt: number;
}

const sessions = new Map<string, SessionRecord>();

function sign(token: string): string {
  return createHmac("sha256", SECRET).update(token).digest("hex");
}

/** Creates a new session for the given account and returns the cookie value. */
export function createSession(accountId: string): string {
  const token = randomBytes(24).toString("hex");
  sessions.set(token, { accountId, expiresAt: Date.now() + SESSION_TTL_MS });
  return `${token}.${sign(token)}`;
}

/** Resolves a cookie value to an account id, or null if invalid/expired. */
export function resolveSession(cookieValue: string | undefined | null): string | null {
  if (!cookieValue) return null;
  const dot = cookieValue.lastIndexOf(".");
  if (dot === -1) return null;
  const token = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  if (!token || !sig) return null;

  const expected = sign(token);
  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  const record = sessions.get(token);
  if (!record) return null;
  if (record.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return record.accountId;
}

/** Invalidates a session (used on logout / account deletion). */
export function destroySession(cookieValue: string | undefined | null): void {
  if (!cookieValue) return;
  const dot = cookieValue.lastIndexOf(".");
  const token = dot === -1 ? cookieValue : cookieValue.slice(0, dot);
  sessions.delete(token);
}

/** Invalidates every session belonging to an account (used on account deletion). */
export function destroyAllSessionsForAccount(accountId: string): void {
  for (const [token, record] of sessions.entries()) {
    if (record.accountId === accountId) sessions.delete(token);
  }
}
