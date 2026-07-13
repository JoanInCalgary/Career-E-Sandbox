/**
 * currentAccount.ts  (server-only)
 *
 * Shared helper for route handlers: reads the session cookie, resolves it to
 * an account id, and looks the account up in the store. Centralized here so
 * every account-aware API route (careers, account/me, ...) resolves "who is
 * making this request" the same way.
 */

import { cookies } from "next/headers";
import { accountStore, type Account } from "@/src/lib/server/accountStore";
import { resolveSession, SESSION_COOKIE } from "@/src/lib/server/session";

/** Returns the account tied to the current request's session cookie, or null if unauthenticated. */
export async function getCurrentAccount(): Promise<Account | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE)?.value;
  const accountId = resolveSession(cookieValue);
  if (!accountId) return null;
  return accountStore.findById(accountId);
}
