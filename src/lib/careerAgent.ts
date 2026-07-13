/**
 * careerAgent.ts
 *
 * Builds the AI prompt and calls the chosen LLM provider (Claude, OpenAI, or
 * Gemini) to generate structured career path results.
 *
 * Phase 3 – backend server / AI agent integration.
 */

import type { FullAssessmentPayload } from "@/src/lib/types";
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
2. Generate exactly 6 recommended careers and 4 non-recommended careers.
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

  // Core frameworks
  lines.push(
    `\n### Myers-Briggs (MBTI)\n- Type: ${payload.mbtiType}${payload.variant ? `-${payload.variant}` : ""}`
  );

  if (payload.primarySpark || payload.secondarySpark || payload.antiSpark) {
    lines.push(`\n### Sparketype`);
    if (payload.primarySpark) lines.push(`- Primary: ${payload.primarySpark}`);
    if (payload.secondarySpark) lines.push(`- Secondary: ${payload.secondarySpark}`);
    if (payload.antiSpark) lines.push(`- Anti-Sparketype: ${payload.antiSpark}`);
  }

  if (filledStrengths.length > 0) {
    lines.push(`\n### CliftonStrengths (Top ${filledStrengths.length})`);
    filledStrengths.forEach((s, i) => lines.push(`- ${i + 1}. ${s}`));
  }

  const { O, C, E, A, N } = payload.bigFive;
  lines.push(
    `\n### Big Five Model (0–100 scale)\n- Openness: ${O}\n- Conscientiousness: ${C}\n- Extraversion: ${E}\n- Agreeableness: ${A}\n- Neuroticism: ${N}`
  );

  if (payload.enneagramType) {
    lines.push(`\n### Enneagram\n- Type: ${payload.enneagramType}`);
  }

  if (payload.discStyle) {
    lines.push(`\n### DiSC\n- Primary Style: ${payload.discStyle}`);
  }

  if (payload.zodiacAnimal || payload.zodiacElement) {
    lines.push(`\n### Chinese Zodiac (Educational)`);
    if (payload.zodiacAnimal) lines.push(`- Animal: ${payload.zodiacAnimal}`);
    if (payload.zodiacElement) lines.push(`- Element: ${payload.zodiacElement}`);
  }

  if (payload.sunSign) {
    lines.push(`\n### Astrology (Educational)\n- Sun Sign: ${payload.sunSign}`);
  }

  // Optional fields
  const optionals = new Set(payload.enabledOptional);

  lines.push(`\n### Preferences`);
  if (optionals.has("workEnv")) lines.push(`- Work Environment: ${payload.workEnv}`);
  if (optionals.has("orgStructure")) lines.push(`- Org Structure: ${payload.orgStructure}`);
  lines.push(`- Target Education Level: ${eduLabel}`);

  if (optionals.has("taskDislikes") && filledDislikes.length > 0) {
    lines.push(`- Task Dislikes: ${filledDislikes.join(", ")}`);
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
      max_tokens: 8000,
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
      max_tokens: 8000,
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
  return data.choices?.[0]?.message?.content ?? "";
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
          maxOutputTokens: 8000,
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

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
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
  return data.choices?.[0]?.message?.content ?? "";
}

async function callOpenRouter(system: string, user: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const model = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "X-Title": "Career-E Sandbox",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      response_format: { type: "json_object" },
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
  return data.choices?.[0]?.message?.content ?? "";
}

// Response parser

function extractJson(raw: string): string {
  // 1. Strip markdown fences
  let text = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();

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

// Public entry point

export async function runCareerAgent(
  payload: FullAssessmentPayload,
  provider: LLMProvider = "claude"
): Promise<AgentResult> {
  const system = buildSystemPrompt();
  const user = buildUserPrompt(payload);

  let raw: string;

  switch (provider) {
    case "claude":
      raw = await callClaude(system, user);
      break;
    case "openai":
      raw = await callOpenAI(system, user);
      break;
    case "gemini":
      raw = await callGemini(system, user);
      break;
    case "groq":
      raw = await callGroq(system, user);
      break;
    case "openrouter":
      raw = await callOpenRouter(system, user);
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  const parsed = parseResponse(raw);

  return {
    provider,
    rawText: raw,
    ...parsed,
  };
}
