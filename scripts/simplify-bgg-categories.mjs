/**
 * Collapse BoardGameGeek category + mechanic strings into display buckets
 * (1–2 per game): Coop, Deduction, Family, Party, Strategy.
 */

/** Canonical labels; keep in sync with UI expectations */
export const SIMPLIFIED_CATEGORY_ORDER = [
  "Coop",
  "Deduction",
  "Family",
  "Party",
  "Strategy",
];

/** BGG category value → buckets (theme-only BGG tags are omitted) */
const EXACT = {
  "Abstract Strategy": ["Family"],
  Puzzle: ["Family"],
  Number: ["Family"],
  Maze: ["Family"],
  Math: ["Family"],

  "Children's Game": ["Family"],
  Animals: ["Family"],
  Educational: ["Family"],
  "Action / Dexterity": ["Family"],
  Dice: ["Family"],
  Memory: ["Family"],
  "Food / Cooking": ["Family"],
  Music: ["Family"],
  "Real-time": ["Family"],

  "Party Game": ["Party"],
  "Word Game": ["Party"],
  Trivia: ["Party"],
  Singing: ["Party"],
  Humor: ["Party"],

  Deduction: ["Deduction"],
  Bluffing: ["Deduction"],
  "Murder / Mystery": ["Deduction"],
  "Spies / Secret Agents": ["Deduction"],

  Economic: ["Strategy"],
  Ancient: ["Strategy"],
  Civilization: ["Strategy"],
  "Industry / Manufacturing": ["Strategy"],
  Trains: ["Strategy"],
  "Age of Steam": ["Strategy"],
  "Post-Napoleonic": ["Strategy"],
  Transportation: ["Strategy"],
  "Territory Building": ["Strategy"],
  "City Building": ["Strategy"],
  Political: ["Strategy"],
  Farming: ["Strategy"],
  Negotiation: ["Strategy"],
  Industry: ["Strategy"],
  Exploration: ["Strategy"],
};

function bucketsForCategory(cat) {
  if (!cat || typeof cat !== "string") return [];
  const direct = EXACT[cat];
  if (direct) return direct;
  const lower = cat.toLowerCase();
  if (lower.includes("wargame") || lower === "wargames") return ["Strategy"];
  if (lower.includes("abstract")) return ["Family"];
  if (lower.includes("party") || lower.includes("word game"))
    return ["Party"];
  if (lower.includes("deduction") || lower.includes("bluffing"))
    return ["Deduction"];
  if (lower.includes("mystery") || lower.includes("secret agent"))
    return ["Deduction"];
  return [];
}

function coopFromMechanics(mechanics) {
  if (!Array.isArray(mechanics)) return false;
  for (const m of mechanics) {
    if (typeof m !== "string") continue;
    const lower = m.toLowerCase();
    if (lower.includes("cooperative")) return true;
  }
  return false;
}

/**
 * @param {string[]} rawCategories from BGG
 * @param {{ averageWeight?: number | null, mechanics?: string[] }} [opts]
 * @returns {string[]} 1–2 items from SIMPLIFIED_CATEGORY_ORDER set
 */
export function simplifyBggCategories(rawCategories, opts = {}) {
  const counts = {
    Coop: 0,
    Deduction: 0,
    Strategy: 0,
    Family: 0,
    Party: 0,
  };
  for (const c of rawCategories || []) {
    for (const b of bucketsForCategory(c)) {
      counts[b]++;
    }
  }
  if (coopFromMechanics(opts.mechanics)) {
    counts.Coop++;
  }

  const active = SIMPLIFIED_CATEGORY_ORDER.filter((b) => counts[b] > 0);
  if (active.length === 0) {
    const w = opts.averageWeight;
    if (w != null && Number.isFinite(w) && w >= 3.2) return ["Strategy"];
    if (w != null && Number.isFinite(w) && w <= 2) return ["Family"];
    return ["Strategy"];
  }

  active.sort((a, b) => {
    const diff = counts[b] - counts[a];
    if (diff !== 0) return diff;
    return SIMPLIFIED_CATEGORY_ORDER.indexOf(a) - SIMPLIFIED_CATEGORY_ORDER.indexOf(b);
  });

  return active.slice(0, 2);
}
