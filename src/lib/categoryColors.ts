// ── Category accent colors ──────────────────────────────────────────────────────
// Each career domain gets a distinct, bright rainbow accent so cards are
// scannable by category at a glance. `tint` is a pale background for badges,
// `accent` is the saturated hue used for bars/borders/icons/percentages.

export interface CategoryPalette {
  accent: string;
  tint: string;
}

export const CATEGORY_COLORS: Record<string, CategoryPalette> = {
  Technology:    { accent: "#0055FF", tint: "#EAF0FF" }, // blue
  Business:      { accent: "#FF7A00", tint: "#FFF1E5" }, // orange
  Finance:       { accent: "#00A651", tint: "#E7F8EE" }, // green
  Law:           { accent: "#7B2FF7", tint: "#F3EBFE" }, // purple
  "Health/Medical": { accent: "#E63946", tint: "#FDEAEB" }, // red
  Education:     { accent: "#FFB800", tint: "#FFF7E0" }, // yellow
  "Arts/Media":  { accent: "#FF2D8A", tint: "#FFE7F2" }, // pink/magenta
  "Skilled Trades": { accent: "#8B5A2B", tint: "#F5ECE3" }, // brown
  Engineering:   { accent: "#3F51B5", tint: "#ECEEF9" }, // indigo
  "Science/Research": { accent: "#0096C7", tint: "#E5F5FA" }, // cyan
  "Social Services": { accent: "#F4845F", tint: "#FEF0EB" }, // coral
  "Environment/Agriculture": { accent: "#5A8F29", tint: "#EEF5E7" }, // olive
  "Hospitality/Tourism": { accent: "#C77D00", tint: "#FBF1E0" }, // amber
  // Old names, kept so results saved before the rename keep their colours
  Medical:       { accent: "#E63946", tint: "#FDEAEB" }, // red
  Health:        { accent: "#E63946", tint: "#FDEAEB" }, // red
  "Creative Arts": { accent: "#FF2D8A", tint: "#FFE7F2" }, // pink/magenta
};

const DEFAULT_PALETTE: CategoryPalette = { accent: "#888888", tint: "#F5F5F5" };

export function getCategoryPalette(domain: string): CategoryPalette {
  return CATEGORY_COLORS[domain] ?? DEFAULT_PALETTE;
}
