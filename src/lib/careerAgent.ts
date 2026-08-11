/**
 * careerAgent.ts
 *
 * Builds the AI prompt and calls the chosen LLM provider (Claude, OpenAI, or
 * Gemini) to generate structured career path results.
 *
 * Phase 3 – backend server / AI agent integration.
 */

import { getEnabledAssessmentIds, type FullAssessmentPayload } from "@/src/lib/types";
import type { CareerMatch, CareerDomain } from "@/src/lib/mockData";
import { EDU_TARGET_LABELS } from "@/src/lib/formOptions";

// Provider type 

export type LLMProvider = "claude" | "openai" | "gemini" | "groq" | "openrouter";

// Agent response wrapper

export interface AgentResult {
  provider: LLMProvider;
  confidencePercent: number;
  activeVariables: string;
  careers: CareerMatch[];
  rawText?: string; // kept for debugging
}

// Prompt builder

const VALID_DOMAINS: CareerDomain[] = [
  "Technology",
  "Finance",
  "Health",
  "Medical",
  "Law",
  "Business",
  "Creative Arts",
  "Education",
];

function buildSystemPrompt(): string {
  return `You are an expert career counsellor and personality researcher powering a career exploration platform for post-secondary students. Your task is to analyse a user's personality profile and generate highly personalised career path recommendations.

## Rules
1. Return ONLY a valid JSON object — no markdown, no preamble, no trailing text.
2. Generate exactly 25 recommended careers and 15 non-recommended careers. Spread the recommended careers across as many of the valid domains as make sense for this profile — do not cluster them all into one or two domains — so that filtering by any single domain still returns a meaningful set of results.
3. Every field listed in the schema below is required (no nulls, no omissions).
4. All career titles, salary ranges, and market statistics must be accurate, real, and current — do not hallucinate roles or figures.
5. The "domain" field must be exactly one of: ${VALID_DOMAINS.join(", ")}.
6. "salaryTier" must be an integer 1–4: 1 = entry/low, 2 = mid, 3 = above-average, 4 = high.
7. "marketOutlook" must be exactly "up", "flat", or "down".
8. "pros" and "cons" arrays must each contain exactly 2 items. Keep each item under 15 words.
9. "keySynergy" and "keyFriction" must each be one sentence under 20 words.
10. Recommended careers must have matchPercent 70–99 (highest first).
11. Non-recommended careers must have matchPercent 5–45 (lowest first).
12. "educationMatchesAnchor" should be true if the career's typical education requirement ≤ the user's target education level.
13. The "activeVariables" summary string should list the key inputs you weighted most heavily (under 20 words).
14. Career results must NOT include any personal identifiers — only personality trait markers are considered.
15. This is for educational and informational purposes only. Do not provide certified career counselling.

## Output Schema
{
  "confidencePercent": <integer 60-98>,
  "activeVariables": "<short summary of key inputs used, e.g. MBTI: INTJ-A, Sparketype: Maven, Big Five: High-O/Low-E>",
  "recommended": [
    {
      "id": "<slug string, e.g. rec-1>",
      "title": "<job title>",
      "sector": "<industry sector>",
      "domain": "<one of the valid domains>",
      "matchPercent": <integer>,
      "status": "recommended",
      "marketOutlookLabel": "<e.g. High Growth (14% YoY)>",
      "marketOutlook": "<up|flat|down>",
      "salaryRange": "<e.g. $85k – $130k>",
      "salaryTier": <1|2|3|4>,
      "educationRequired": "<e.g. Bachelor's Required>",
      "educationMatchesAnchor": <true|false>,
      "keySynergy": "<one sentence: why this career fits the user's personality>",
      "keyFriction": "<one sentence: the main personality tension for this career>",
      "pros": ["<string>", ...],
      "cons": ["<string>", ...]
    }
  ],
  "flagged": [
    {
      "id": "<slug string, e.g. flag-1>",
      "title": "<job title>",
      "sector": "<industry sector>",
      "domain": "<one of the valid domains>",
      "matchPercent": <integer>,
      "status": "flagged",
      "marketOutlookLabel": "<e.g. Stable (2% YoY)>",
      "marketOutlook": "<up|flat|down>",
      "salaryRange": "<e.g. $45k – $65k>",
      "salaryTier": <1|2|3|4>,
      "educationRequired": "<e.g. Bachelor's Required>",
      "educationMatchesAnchor": <true|false>,
      "keySynergy": "<any minor alignment, or 'Minimal alignment'>",
      "keyFriction": "<primary reason this career conflicts with the user's personality>",
      "pros": ["<string>", ...],
      "cons": ["<string>", ...],
      "flagReason": "<one sentence summary of why this career is a poor fit>"
    }
  ]
}`;
}

function buildUserPrompt(payload: FullAssessmentPayload): string {
  const eduLabel = EDU_TARGET_LABELS[payload.targetEduIndex] ?? "Bachelor's";
  const filledStrengths = payload.strengths.filter(Boolean);
  const filledDislikes = payload.taskDislikes;

  const lines: string[] = ["## User Personality Profile"];

  // Which assessment frameworks the user has switched on. Older cached
  // payloads (e.g. from results history saved before this field existed)
  // won't have this array — treat that as "everything enabled" so nothing
  // regresses for them. An explicitly empty array (user switched everything
  // off) is respected as-is instead of falling back.
  const enabledAssessments = getEnabledAssessmentIds(payload);

  // Core frameworks — each only included if the user both filled it in AND
  // left it switched on, so disabled assessments never influence matching.
  if (enabledAssessments.has("mbti") && payload.mbtiType) {
    lines.push(
      `\n### Myers-Briggs (MBTI)\n- Type: ${payload.mbtiType}${payload.variant ? `-${payload.variant}` : ""}`
    );
  }

  if (
    enabledAssessments.has("spark") &&
    (payload.primarySpark || payload.secondarySpark || payload.antiSpark)
  ) {
    lines.push(`\n### Sparketype`);
    if (payload.primarySpark) lines.push(`- Primary: ${payload.primarySpark}`);
    if (payload.secondarySpark) lines.push(`- Secondary: ${payload.secondarySpark}`);
    if (payload.antiSpark) lines.push(`- Anti-Sparketype: ${payload.antiSpark}`);
  }

  if (enabledAssessments.has("clifton") && filledStrengths.length > 0) {
    lines.push(`\n### CliftonStrengths (Top ${filledStrengths.length})`);
    filledStrengths.forEach((s, i) => lines.push(`- ${i + 1}. ${s}`));
  }

  if (enabledAssessments.has("bigfive")) {
    const { O, C, E, A, N } = payload.bigFive;
    lines.push(
      `\n### Big Five Model (0–100 scale)\n- Openness: ${O}\n- Conscientiousness: ${C}\n- Extraversion: ${E}\n- Agreeableness: ${A}\n- Neuroticism: ${N}`
    );
  }

  if (enabledAssessments.has("ennea") && payload.enneagramType) {
    lines.push(`\n### Enneagram\n- Type: ${payload.enneagramType}`);
  }

  if (enabledAssessments.has("disc") && payload.discStyle) {
    lines.push(`\n### DiSC\n- Primary Style: ${payload.discStyle}`);
  }

  if (enabledAssessments.has("zodiac") && (payload.zodiacAnimal || payload.zodiacElement)) {
    lines.push(`\n### Chinese Zodiac (Educational)`);
    if (payload.zodiacAnimal) lines.push(`- Animal: ${payload.zodiacAnimal}`);
    if (payload.zodiacElement) lines.push(`- Element: ${payload.zodiacElement}`);
  }

  if (enabledAssessments.has("astro") && payload.sunSign) {
    lines.push(`\n### Astrology (Educational)\n- Sun Sign: ${payload.sunSign}`);
  }

  // Optional fields
  const optionals = new Set(payload.enabledOptional);

  const hasPreferences =
    optionals.has("workEnv") ||
    optionals.has("orgStructure") ||
    optionals.has("targetEdu") ||
    (optionals.has("taskDislikes") && filledDislikes.length > 0) ||
    (optionals.has("demoAge") && !!payload.ageRange) ||
    (optionals.has("demoGender") && !!payload.gender) ||
    (optionals.has("demoRace") && !!payload.race);

  if (hasPreferences) {
    lines.push(`\n### Preferences`);
    if (optionals.has("workEnv")) lines.push(`- Work Environment: ${payload.workEnv}`);
    if (optionals.has("orgStructure")) lines.push(`- Org Structure: ${payload.orgStructure}`);
    if (optionals.has("targetEdu")) lines.push(`- Target Education Level: ${eduLabel}`);
    if (optionals.has("taskDislikes") && filledDislikes.length > 0) {
      lines.push(`- Task Dislikes: ${filledDislikes.join(", ")}`);
    }
    // Demographics — only sent when the user has both filled these in AND
    // explicitly opted them into matching via the optional toggles above.
    if (optionals.has("demoAge") && payload.ageRange) lines.push(`- Age Range: ${payload.ageRange}`);
    if (optionals.has("demoGender") && payload.gender) lines.push(`- Gender: ${payload.gender}`);
    if (optionals.has("demoRace") && payload.race) lines.push(`- Race / Ethnicity: ${payload.race}`);
  }

  lines.push(
    `\n## Task\nGenerate career path recommendations for this user following the schema in your system prompt exactly.`
  );

  return lines.join("\n");
}

// Provider clients

async function callClaude(system: string, user: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 16000,
      system,
      messages: [
        { role: "user", content: user },
        // Prefill forces the model to emit raw JSON immediately, no preamble
        { role: "assistant", content: "{" },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  // Prepend the prefilled "{" that the API strips from the response text
  return "{" + (data.content?.[0]?.text ?? "");
}

async function callOpenAI(system: string, user: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 16000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  // OpenAI-compatible APIs (this one included) sometimes return HTTP 200 with
  // no `choices` and an `error` object in the body instead (moderation
  // refusal, content filter, etc.) — surface that instead of silently
  // returning an empty string, which would otherwise fail JSON parsing later
  // with a confusing "Failed to parse AI response" error.
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`OpenAI returned no content: ${JSON.stringify(data.error ?? data).slice(0, 300)}`);
  }
  return content;
}

async function callGemini(system: string, user: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 16000,
          // Gemini 2.5 Flash defaults to dynamic "thinking" — it spends an
          // unbounded chunk of the token budget reasoning before it writes
          // any output, which is what was driving ~160s responses for a
          // large structured JSON task like this. Thinking adds negligible
          // quality here (the schema is rigid and the task is extraction/
          // formatting, not multi-step reasoning), so disable it entirely.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callGroq(system: string, user: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  // Groq's on-demand tier caps this org at 12000 tokens/minute (TPM), and that
  // limit is checked against prompt tokens + max_tokens combined. The other
  // providers request max_tokens: 16000, which alone exceeds Groq's TPM cap
  // and 413s every call regardless of how small the actual prompt is. ~40
  // career objects fit comfortably in ~8000 output tokens, leaving headroom
  // for the ~1-1.5k token system+user prompt under the 12000 limit.
  const maxTokens = Number(process.env.GROQ_MAX_TOKENS ?? 8000);

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`Groq returned no content: ${JSON.stringify(data.error ?? data).slice(0, 300)}`);
  }
  return content;
}

async function callOpenRouter(system: string, user: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const model = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct";

  // Pin routing to SambaNova. Left to auto-routing, OpenRouter can land this
  // model on much slower backends (Together/DeepInfra-class, tens of
  // tokens/sec). Benchmarks (artificialanalysis.ai) put Groq's
  // llama-3.3-70b-versatile at ~276-299 tok/s and SambaNova's hosting of this
  // same model at ~283 tok/s — the closest speed match available on
  // OpenRouter, so side-by-side model comparisons aren't skewed by
  // infrastructure differences. (Cerebras is also on OpenRouter but runs
  // ~1,800-2,100 tok/s — much faster, not a like-for-like comparison.)
  // Previously pinned to `order: ["SambaNova"]` on the assumption (from
  // artificialanalysis.ai benchmarks) that it matched Groq's ~283 tok/s.
  // Checking OpenRouter's live endpoint list
  // (GET /api/v1/models/meta-llama/llama-3.3-70b-instruct/endpoints) shows
  // that assumption no longer holds: both SambaNova endpoints there cap out
  // at max_completion_tokens: 3072, far below the max_tokens: 16000 this
  // app requests. No SambaNova endpoint can actually serve this request —
  // that's why disabling fallbacks produced a 404 ("No endpoints found"),
  // and why leaving fallbacks on before that silently rerouted to whatever
  // slower backend was left (the likely source of the 120s+ responses).
  // Switching to `sort: "throughput"` didn't reliably fix it either — most
  // endpoints report null throughput/latency stats, so ranking has little
  // real signal to work with (one run took 307s).
  //
  // The same endpoint list has a direct Groq entry for this model
  // (tag "groq", 32,768 max completion tokens, supports response_format) —
  // OpenRouter can proxy straight to Groq's own infrastructure. Pinning to
  // it is the reliable way to get OpenRouter responses close to native
  // Groq speed. Note this means the OpenRouter and Groq entries in the
  // model picker now largely test the same backend rather than different
  // infrastructure — set OPENROUTER_PROVIDER to a different verified slug
  // (see the endpoints call above for current options and their token
  // limits) if distinct infra matters more than speed for a given run.
  const explicitProviderOrder = process.env.OPENROUTER_PROVIDER
    ? process.env.OPENROUTER_PROVIDER.split(",").map((p) => p.trim())
    : ["groq"];

  const providerPreferences = {
    order: explicitProviderOrder,
    allow_fallbacks: process.env.OPENROUTER_ALLOW_FALLBACKS !== "false",
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "X-Title": "Career-E Sandbox",
    },
    body: JSON.stringify({
      model,
      max_tokens: 16000,
      response_format: { type: "json_object" },
      provider: providerPreferences,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  // OpenRouter proxies many different backend models. A backend hiccup,
  // rate limit, or moderation refusal frequently surfaces as HTTP 200 with
  // an `error` field and no `choices` rather than a non-2xx status — this
  // was silently swallowed before (empty string -> a confusing downstream
  // JSON parse failure). Fail loudly instead so it's clear what happened
  // and the retry in runCareerAgent gets a chance to recover.
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`OpenRouter returned no content: ${JSON.stringify(data.error ?? data).slice(0, 300)}`);
  }
  // Surfaces which backend actually served the request (e.g. "SambaNova")
  // so a slow response can be diagnosed instead of guessed at.
  console.log(`[callOpenRouter] served by: ${data.provider ?? "unknown"}`);
  return content;
}

// Response parser

function extractJson(raw: string): string {
  // 1. Strip markdown fences
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();

  // 2. If it already starts with { we're done
  if (text.startsWith("{")) return text;

  // 3. Try to find the first { … last } block (handles any leading prose)
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) return text.slice(start, end + 1);

  return text;
}

function parseResponse(
  raw: string
): Pick<AgentResult, "confidencePercent" | "activeVariables" | "careers"> {
  const cleaned = extractJson(raw);

  let parsed: {
    confidencePercent?: number;
    activeVariables?: string;
    recommended?: Partial<CareerMatch>[];
    flagged?: Partial<CareerMatch>[];
  };

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse AI response as JSON. Raw: ${raw.slice(0, 300)}`);
  }

  const recommended = (parsed.recommended ?? []).map(
    (c, i): CareerMatch => ({
      id: c.id ?? `rec-${i + 1}`,
      title: c.title ?? "Unknown",
      sector: c.sector ?? "",
      domain: VALID_DOMAINS.includes(c.domain as CareerDomain)
        ? (c.domain as CareerDomain)
        : "Business",
      matchPercent: typeof c.matchPercent === "number" ? c.matchPercent : 70,
      status: "recommended",
      marketOutlookLabel: c.marketOutlookLabel ?? "",
      marketOutlook:
        c.marketOutlook === "up" || c.marketOutlook === "flat" || c.marketOutlook === "down"
          ? c.marketOutlook
          : "flat",
      salaryRange: c.salaryRange ?? "",
      salaryTier:
        c.salaryTier === 1 || c.salaryTier === 2 || c.salaryTier === 3 || c.salaryTier === 4
          ? c.salaryTier
          : 2,
      educationRequired: c.educationRequired ?? "",
      educationMatchesAnchor: c.educationMatchesAnchor ?? true,
      keySynergy: c.keySynergy ?? "",
      keyFriction: c.keyFriction ?? "",
      pros: Array.isArray(c.pros) ? (c.pros as string[]) : [],
      cons: Array.isArray(c.cons) ? (c.cons as string[]) : [],
    })
  );

  const flagged = (parsed.flagged ?? []).map(
    (c, i): CareerMatch => ({
      id: c.id ?? `flag-${i + 1}`,
      title: c.title ?? "Unknown",
      sector: c.sector ?? "",
      domain: VALID_DOMAINS.includes(c.domain as CareerDomain)
        ? (c.domain as CareerDomain)
        : "Business",
      matchPercent: typeof c.matchPercent === "number" ? c.matchPercent : 20,
      status: "flagged",
      marketOutlookLabel: c.marketOutlookLabel ?? "",
      marketOutlook:
        c.marketOutlook === "up" || c.marketOutlook === "flat" || c.marketOutlook === "down"
          ? c.marketOutlook
          : "flat",
      salaryRange: c.salaryRange ?? "",
      salaryTier:
        c.salaryTier === 1 || c.salaryTier === 2 || c.salaryTier === 3 || c.salaryTier === 4
          ? c.salaryTier
          : 2,
      educationRequired: c.educationRequired ?? "",
      educationMatchesAnchor: c.educationMatchesAnchor ?? false,
      keySynergy: c.keySynergy ?? "",
      keyFriction: c.keyFriction ?? "",
      pros: Array.isArray(c.pros) ? (c.pros as string[]) : [],
      cons: Array.isArray(c.cons) ? (c.cons as string[]) : [],
      flagReason: c.flagReason,
    })
  );

  return {
    confidencePercent:
      typeof parsed.confidencePercent === "number" ? parsed.confidencePercent : 80,
    activeVariables: parsed.activeVariables ?? "",
    careers: [...recommended, ...flagged],
  };
}

async function callProvider(provider: LLMProvider, system: string, user: string): Promise<string> {
  switch (provider) {
    case "claude":
      return callClaude(system, user);
    case "openai":
      return callOpenAI(system, user);
    case "gemini":
      return callGemini(system, user);
    case "groq":
      return callGroq(system, user);
    case "openrouter":
      return callOpenRouter(system, user);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Public entry point

/**
 * Number of attempts (including the first) for a single provider call +
 * parse. Providers — OpenRouter especially, since it proxies many different
 * backend models — occasionally return a transient error, a truncated
 * response, or malformed JSON. A one-shot retry absorbs most of these
 * without the user ever seeing a failed search fall back to sample data.
 */
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1200;

export async function runCareerAgent(
  payload: FullAssessmentPayload,
  provider: LLMProvider = "claude"
): Promise<AgentResult> {
  const system = buildSystemPrompt();
  const user = buildUserPrompt(payload);

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const raw = await callProvider(provider, system, user);
      const parsed = parseResponse(raw);
      return {
        provider,
        rawText: raw,
        ...parsed,
      };
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[runCareerAgent] ${provider} attempt ${attempt}/${MAX_ATTEMPTS} failed:`, message);
      if (attempt < MAX_ATTEMPTS) {
        await wait(RETRY_DELAY_MS);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${provider} failed after ${MAX_ATTEMPTS} attempts`);
}
