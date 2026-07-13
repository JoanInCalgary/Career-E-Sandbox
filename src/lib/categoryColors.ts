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
  Medical:       { accent: "#E63946", tint: "#FDEAEB" }, // red
  Education:     { accent: "#FFB800", tint: "#FFF7E0" }, // yellow
  "Creative Arts": { accent: "#FF2D8A", tint: "#FFE7F2" }, // pink/magenta
};

const DEFAULT_PALETTE: CategoryPalette = { accent: "#888888", tint: "#F5F5F5" };

export function getCategoryPalette(domain: string): CategoryPalette {
  return CATEGORY_COLORS[domain] ?? DEFAULT_PALETTE;
}
