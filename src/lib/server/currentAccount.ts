/**
 * currentAccount.ts  (server-only)
 *
 * Resolves the Supabase Auth user for the current request, then loads the
 * matching public.users + personality profile.
 */

import { getAccountForAuthUser, type Account } from "@/src/lib/server/accountStore";
import { createClient } from "@/src/lib/supabase/server";

/** Returns the account for the current Auth session, or null if unauthenticated. */
export async function getCurrentAccount(): Promise<Account | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getAccountForAuthUser(user);
}
