/**
 * POST /api/careers
 *
 * Accepts the user's full assessment payload, calls the selected LLM provider,
 * and returns structured career path results.
 *
 * Phase 3 – backend / AI agent integration.
 *
 * Request body:
 *   { payload: FullAssessmentPayload; provider?: "claude" | "openai" | "gemini" }
 *
 * Response:
 *   { confidencePercent, activeVariables, careers: CareerMatch[] }
 *   or { error: string } on failure
 */

import { NextRequest, NextResponse } from "next/server";
import { runCareerAgent, type LLMProvider } from "@/src/lib/careerAgent";
import type { FullAssessmentPayload } from "@/src/lib/types";
import { accountStore } from "@/src/lib/server/accountStore";
import { getCurrentAccount } from "@/src/lib/server/currentAccount";

// Allow up to 120 seconds for the LLM to respond — generating 25 recommended +
// 15 non-recommended careers is a much larger response than the original 6+4,
// so the previous 60s ceiling left slower providers more likely to time out.
export const maxDuration = 120;

const VALID_PROVIDERS: LLMProvider[] = ["claude", "openai", "gemini", "groq", "openrouter"];

export async function POST(req: NextRequest) {
  let body: { payload?: FullAssessmentPayload; provider?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { payload, provider: rawProvider } = body;

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Missing or invalid payload" }, { status: 400 });
  }

  // Default to Groq (fastest of the enabled providers) if the client didn't
  // send one or sent something unrecognized; fall back to whatever was passed.
  const provider: LLMProvider =
    rawProvider && VALID_PROVIDERS.includes(rawProvider as LLMProvider)
      ? (rawProvider as LLMProvider)
      : "groq";

  // Search limits are enforced per account. Signed-out visitors (no session
  // cookie) aren't tracked here — this only gates logged-in usage. Quota is
  // only consumed on a successful generation (checked here, incremented
  // after the agent call succeeds below).
  //
  // This lookup was previously outside the try/catch below — any failure
  // here (Supabase misconfig, missing env vars, auth service hiccup) threw
  // uncaught, which Next.js turns into a generic HTML 500 page instead of
  // JSON. The client's res.json() then fails to parse it and logs an empty
  // {} error, hiding the real cause. Wrapping it lets us surface the actual
  // message.
  let account: Awaited<ReturnType<typeof getCurrentAccount>>;
  try {
    account = await getCurrentAccount();
    if (account) {
      const usage = await accountStore.getSearchUsage(account.id);
      if (usage && usage.remaining <= 0) {
        return NextResponse.json(
          {
            error: `You've used all ${usage.limit} searches for this period. It resets ${new Date(
              usage.periodResetsAt
            ).toLocaleDateString()}.`,
            code: "SEARCH_LIMIT_REACHED",
            usage,
          },
          { status: 429 }
        );
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/careers] Account/usage lookup failed:", message);
    return NextResponse.json({ error: `Account lookup failed: ${message}` }, { status: 500 });
  }

  try {
    const startedAt = Date.now();
    // Passing req.signal lets a client-cancelled request (Stop button,
    // navigating away, closing the tab) actually cancel the in-flight LLM
    // call — see the comment on runCareerAgent. Without this, generation
    // kept running to completion after the client gave up, and still
    // consumed one of the account's 20 searches for a result nobody saw.
    const result = await runCareerAgent(payload, provider, req.signal);
    const generationTimeMs = Date.now() - startedAt;

    const usage = account ? (await accountStore.recordSearch(account.id)).usage : null;

    return NextResponse.json(
      {
        provider: result.provider,
        confidencePercent: result.confidencePercent,
        activeVariables: result.activeVariables,
        careers: result.careers,
        // How long the provider itself took to generate this result — lets
        // the UI compare models on speed, not just quality.
        generationTimeMs,
        usage,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // req.signal fires when the client disconnects (Stop button, navigation,
    // closed tab) — that's expected cancellation, not a generation failure,
    // so it's logged at a lower severity and no quota was consumed for it
    // (recordSearch above never ran).
    if (err instanceof Error && err.name === "AbortError") {
      console.log("[/api/careers] Request cancelled by client before generation finished.");
    } else {
      console.error("[/api/careers] Error:", message);
    }

    // Return a structured error so the frontend can show a user-friendly fallback
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
