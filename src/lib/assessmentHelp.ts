export interface AssessmentHelp {
  description: string;
  providerUrl: string;
  providerLabel: string;
  goodToKnow: string[];
}

export const ASSESSMENT_HELP: Record<string, AssessmentHelp> = {
  mbti: {
    description:
      "The Myers-Briggs Type Indicator maps how you perceive information and make decisions across four dichotomies: Introversion/Extraversion, Sensing/Intuition, Thinking/Feeling, and Judging/Perceiving.",
    providerUrl: "[insert link here]",
    providerLabel: "Myers & Briggs Foundation",
    goodToKnow: [
      "Assertive (-A) types tend to be more calm and self-assured; Turbulent (-T) types are more self-conscious and perfection-driven.",
      "INTJ profiles often align with analytical, systems-oriented careers requiring deep focus.",
    ],
  },
  spark: {
    description:
      "Sparketype identifies the work that makes you feel most alive. Your Primary drive, a Secondary complement, and an Anti-Sparketype that drains your energy.",
    providerUrl: "[insert link here]",
    providerLabel: "Sparketype Official",
    goodToKnow: [
      "Your Primary Sparketype reflects the work you'd do even if unpaid.",
      "Anti-Sparketypes help flag career paths that may cause chronic burnout.",
    ],
  },
  clifton: {
    description:
      "CliftonStrengths (Gallup) identifies your top talent themes from 34 strengths. The natural patterns of thinking, feeling, and behaving you do best.",
    providerUrl: "[insert link here]",
    providerLabel: "Gallup CliftonStrengths",
    goodToKnow: [
      "Rank your top 5 in order — earlier strengths carry more weight in career matching.",
      "Strengths like Analytical and Strategic often correlate with research and data roles.",
    ],
  },
  bigfive: {
    description:
      "The Big Five (OCEAN) model measures personality across five continuous traits. It is the most widely validated framework in academic psychology.",
    providerUrl: "[insert link here]",
    providerLabel: "IPIP (International Personality Item Pool)",
    goodToKnow: [
      "High Openness → creative, exploratory careers. Low Openness → structured, routine-oriented roles.",
      "High Conscientiousness → detail-oriented, process-driven work. Low → flexible, improvisational environments.",
      "High Extraversion → people-facing roles. Low → independent, low-interaction work.",
      "High Agreeableness → collaborative, service-oriented paths. Low → competitive, direct environments.",
      "High Neuroticism → may prefer stable, predictable roles. Low → high-pressure, fast-paced settings.",
    ],
  },
  ennea: {
    description:
      "The Enneagram maps nine motivational types based on core fears, desires, and growth paths. It reveals why you do what you do, not just how.",
    providerUrl: "[insert link here]",
    providerLabel: "Enneagram Institute",
    goodToKnow: [
      "Type 5 (Investigator) aligns with research-heavy, knowledge-intensive careers.",
      "Type 3 (Achiever) thrives in goal-driven, performance-measured environments.",
    ],
  },
  marketer: {
    description:
      "Conscious Marketer Archetypes draw from Jungian brand archetypes to reveal how you naturally communicate values and connect with audiences.",
    providerUrl: "[insert link here]",
    providerLabel: "Hero's Journey Archetypes",
    goodToKnow: [
      "Sage archetypes excel in education, research, and advisory roles.",
      "Creator archetypes align with design, innovation, and product development paths.",
    ],
  },
  disc: {
    description:
      "DiSC measures behavioral style across Dominance, Influence, Steadiness, and Conscientiousness. It's how you respond to workplace challenges and collaboration.",
    providerUrl: "[insert link here]",
    providerLabel: "DiSC Profile",
    goodToKnow: [
      "Dominance (D) → leadership, entrepreneurship, high-stakes decision roles.",
      "Conscientiousness (C) → quality assurance, compliance, precision-driven work.",
    ],
  },
  zodiac: {
    description:
      "The Chinese Zodiac assigns an animal and element based on birth year, used here as a supplementary cultural lens on personality tendencies.",
    providerUrl: "[insert link here]",
    providerLabel: "Chinese Zodiac Reference",
    goodToKnow: [
      "Used as a supplementary signal — weighted lower than validated psychometric frameworks.",
      "Dragon and Tiger signs are culturally associated with leadership and boldness.",
    ],
  },
  astro: {
    description:
      "Sun sign astrology provides a broad archetypal lens based on birth date.",
    providerUrl: "[insert link here]",
    providerLabel: "Astro.com",
    goodToKnow: [
      "Treated as a minor modifier in the matching engine, not a primary driver.",
      "Capricorn and Virgo signs often correlate with structured, detail-oriented preferences.",
    ],
  },
  additional: {
    description:
      "Optional inputs that enhance career path results. Enable only the fields relevant to you.",
    providerUrl: "[insert link here]",
    providerLabel: "Career-E-Sandbox Docs",
    goodToKnow: [
      "Work Environment and Organizational Structure are single-select — pick one option each.",
      "Task Dislikes are multi-select — check all that apply to filter out incompatible roles.",
      "Demographic fields are optional and used only to refine recommendations.",
    ],
  },
};
