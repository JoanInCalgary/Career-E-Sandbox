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

// Allow up to 60 seconds for the LLM to respond
export const maxDuration = 60;

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

  // Default to Claude; fall back if an unknown provider is passed
  const provider: LLMProvider =
    rawProvider && VALID_PROVIDERS.includes(rawProvider as LLMProvider)
      ? (rawProvider as LLMProvider)
      : "claude";

  try {
    const startedAt = Date.now();
    const result = await runCareerAgent(payload, provider);
    const generationTimeMs = Date.now() - startedAt;

    return NextResponse.json(
      {
        provider: result.provider,
        confidencePercent: result.confidencePercent,
        activeVariables: result.activeVariables,
        careers: result.careers,
        // How long the provider itself took to generate this result — lets
        // the UI compare models on speed, not just quality.
        generationTimeMs,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/careers] Error:", message);

    // Return a structured error so the frontend can show a user-friendly fallback
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
