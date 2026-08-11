import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/src/lib/supabase/env";

/**
 * Refreshes the Auth session cookie on each matched request.
 * Must run in middleware so Server Components can read a valid session.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // This middleware runs on almost every request (see middleware.ts's
  // matcher), including API routes like /api/careers. A transient failure
  // talking to Supabase here (network hiccup, DNS blip, Supabase outage)
  // used to throw uncaught, which Next.js turns into a generic HTML error
  // page instead of a JSON response. Downstream, fetchCareerResults()'s
  // res.json() then fails to parse that HTML and silently falls back to
  // `{}`, which is why the console shows "[fetchCareerResults] API error
  // 500 {}" with no real error message. Same class of bug already fixed
  // once for the account/usage lookup in app/api/careers/route.ts — this
  // mirrors that fix so a Supabase blip here degrades gracefully (request
  // proceeds with whatever session it already had) instead of taking down
  // every route on the site.
  try {
    const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Validates JWT / refreshes tokens. Do not remove.
    await supabase.auth.getUser();
  } catch (err) {
    console.error(
      "[updateSession] Supabase auth refresh failed:",
      err instanceof Error ? err.message : err
    );
  }

  return supabaseResponse;
}
