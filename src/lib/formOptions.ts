export const SPARKETYPE_OPTIONS = [
  "Maker", "Performer", "Warrior", "Sage", "Advisor",
  "Nurturer", "Investigator", "Maven", "Scientist",
].map((s) => ({ value: s, label: s }));

export const CLIFTON_STRENGTHS = [
  "Achiever", "Activator", "Adaptability", "Analytical", "Arranger",
  "Belief", "Command", "Communication", "Competition", "Connectedness",
  "Consistency", "Context", "Deliberative", "Developer", "Discipline",
  "Empathy", "Focus", "Futuristic", "Harmony", "Ideation",
  "Includer", "Individualization", "Input", "Intellection", "Learner",
  "Maximizer", "Positivity", "Relator", "Responsibility", "Restorative",
  "Self-Assurance", "Significance", "Strategic", "Woo",
].map((s) => ({ value: s, label: s }));

export const ENNEAGRAM_OPTIONS = [
  { value: "1", label: "Type 1 — Reformer" },
  { value: "2", label: "Type 2 — Helper" },
  { value: "3", label: "Type 3 — Achiever" },
  { value: "4", label: "Type 4 — Individualist" },
  { value: "5", label: "Type 5 — Investigator" },
  { value: "6", label: "Type 6 — Loyalist" },
  { value: "7", label: "Type 7 — Enthusiast" },
  { value: "8", label: "Type 8 — Challenger" },
  { value: "9", label: "Type 9 — Peacemaker" },
];

export const MARKETER_ARCHETYPES = [
  "Hero", "Sage", "Magician", "Ruler", "Innocent",
  "Explorer", "Creator", "Caregiver", "Jester", "Lover", "Outlaw", "Everyman",
].map((s) => ({ value: s, label: s }));

export const DISC_STYLES = [
  { value: "D", label: "Dominance (D)" },
  { value: "I", label: "Influence (I)" },
  { value: "S", label: "Steadiness (S)" },
  { value: "C", label: "Conscientiousness (C)" },
];

export const ZODIAC_ANIMALS = [
  "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake",
  "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig",
].map((s) => ({ value: s, label: s }));

export const ZODIAC_ELEMENTS = ["Wood", "Fire", "Earth", "Metal", "Water"].map((s) => ({
  value: s,
  label: s,
}));

export const SUN_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
].map((s) => ({ value: s, label: s }));

export const TASK_DISLIKE_OPTIONS = [
  "Cold Outreach / Sales",
  "Repetitive Manual Tasks",
  "Public Speaking / Presentations",
  "Client-Facing / Customer Service",
  "Team Management / People Leadership",
  "Administrative Paperwork",
  "Data Entry",
  "Tight / Unpredictable Deadlines",
  "On-Call or Shift Work",
  "Heavy Travel Requirements",
  "Networking Events / Social Functions",
  "Deep Independent Research",
  "Detailed Technical Writing",
  "Financial Reporting / Accounting",
  "Legal / Compliance Work",
  "Creative Work (Design / Writing)",
  "Physical Labour",
  "Outdoors / Field Work",
  "Science Labs / Lab Bench Work",
  "Teaching / Training Others",
  "Event Planning / Logistics",
  "Cross-Functional Collaboration (no solo work)",
] as const;

export const AGE_RANGES = [
  "18–24", "25–34", "35–44", "45–54", "55–64", "65+",
].map((s) => ({ value: s, label: s }));

export const GENDER_OPTIONS = [
  "Man", "Woman", "Non-binary", "Prefer not to say",
].map((s) => ({ value: s, label: s }));

export const RACE_OPTIONS = [
  "Asian",
  "Black / African American",
  "Hispanic / Latino",
  "Indigenous / Native American",
  "Middle Eastern / North African",
  "Pacific Islander",
  "White",
  "Multiracial",
  "Prefer not to say",
].map((s) => ({ value: s, label: s }));

export const WORK_ENV_OPTIONS = ["Fully Remote", "Hybrid", "In-Office"] as const;
export type WorkEnv = (typeof WORK_ENV_OPTIONS)[number];

export const ORG_OPTIONS = ["Hierarchical", "Flat / Collaborative"] as const;
export type OrgStructure = (typeof ORG_OPTIONS)[number];

export const EDU_TARGET_LABELS = [
  "High School",
  "Associate's",
  "Bachelor's",
  "Master's",
  "PhD",
] as const;
