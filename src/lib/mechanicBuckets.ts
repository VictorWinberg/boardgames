import { decodeHtmlEntities } from "@/lib/decodeHtmlEntities";
import type { BggGame } from "@/types/bgg";

/** Eight high-level play-style buckets; every listed BGG mechanic maps to exactly one. */
export type MechanicBucketId =
  | "area"
  | "auction"
  | "cards"
  | "coop"
  | "social"
  | "dice"
  | "deduction"
  | "conflict";

export const MECHANIC_BUCKET_ORDER: MechanicBucketId[] = [
  "area",
  "auction",
  "cards",
  "coop",
  "social",
  "dice",
  "deduction",
  "conflict",
];

export const MECHANIC_BUCKET_LABELS: Record<MechanicBucketId, string> = {
  area: "Area",
  auction: "Auction",
  cards: "Cards",
  coop: "Co-op",
  social: "Social",
  dice: "Dice",
  deduction: "Deduction",
  conflict: "Conflict",
};

const RAW_TO_BUCKET: Record<string, MechanicBucketId> = {
  Acting: "social",
  "Action / Event": "area",
  "Action Drafting": "cards",
  "Action Points": "area",
  "Action Queue": "area",
  "Action Retrieval": "area",
  "Action Timer": "social",
  "Advantage Token": "conflict",
  Alliances: "coop",
  "Area Majority / Influence": "area",
  "Area Movement": "area",
  "Area-Impulse": "area",
  "Auction / Bidding": "auction",
  "Auction Compensation": "auction",
  "Auction: Dexterity": "auction",
  "Auction: Dutch": "auction",
  "Auction: Dutch Priority": "auction",
  "Auction: English": "auction",
  "Auction: Fixed Placement": "auction",
  "Auction: Multiple Lot": "auction",
  "Auction: Once Around": "auction",
  "Auction: Sealed Bid": "auction",
  "Auction: Turn Order Until Pass": "auction",
  "Automatic Resource Growth": "area",
  "Betting and Bluffing": "social",
  Bias: "deduction",
  "Bids As Wagers": "auction",
  Bingo: "dice",
  Bribery: "social",
  "Campaign / Battle Card Driven": "cards",
  "Card Play Conflict Resolution": "conflict",
  "Catch the Leader": "conflict",
  Chaining: "cards",
  "Chit-Pull System": "dice",
  "Closed Drafting": "cards",
  "Closed Economy Auction": "auction",
  "Command Cards": "cards",
  "Commodity Speculation": "auction",
  "Communication Limits": "social",
  Connections: "area",
  "Constrained Bidding": "auction",
  Contracts: "auction",
  "Cooperative Game": "coop",
  "Crayon Rail System": "area",
  "Critical Hits and Failures": "conflict",
  "Cube Tower": "dice",
  "Deck Construction": "cards",
  "Deck, Bag, and Pool Building": "cards",
  Deduction: "deduction",
  "Delayed Purchase": "auction",
  "Dice Rolling": "dice",
  "Die Icon Resolution": "dice",
  "Different Dice Movement": "dice",
  Drawing: "social",
  "Elapsed Real Time Ending": "social",
  Enclosure: "area",
  "End Game Bonuses": "area",
  Events: "cards",
  "Finale Ending": "conflict",
  Flicking: "area",
  Follow: "cards",
  "Force Commitment": "area",
  "Grid Coverage": "area",
  "Grid Movement": "area",
  "Hand Management": "cards",
  "Hexagon Grid": "area",
  "Hidden Movement": "deduction",
  "Hidden Roles": "social",
  "Hidden Victory Points": "deduction",
  "Highest-Lowest Scoring": "conflict",
  "Hot Potato": "social",
  "I Cut, You Choose": "social",
  "Impulse Movement": "area",
  Income: "area",
  "Increase Value of Unchosen Resources": "area",
  Induction: "deduction",
  Interrupts: "area",
  Investment: "auction",
  "Kill Steal": "conflict",
  "King of the Hill": "conflict",
  "Ladder Climbing": "conflict",
  Layering: "area",
  "Legacy Game": "coop",
  "Line Drawing": "area",
  "Line of Sight": "area",
  Loans: "auction",
  "Lose a Turn": "conflict",
  Mancala: "area",
  "Map Addition": "area",
  "Map Deformation": "area",
  "Map Reduction": "area",
  Market: "auction",
  Matching: "deduction",
  "Measurement Movement": "area",
  "Melding and Splaying": "cards",
  Memory: "deduction",
  "Minimap Resolution": "area",
  "Modular Board": "area",
  "Move Through Deck": "cards",
  "Movement Points": "area",
  "Movement Template": "area",
  "Moving Multiple Units": "area",
  "Multi-Use Cards": "cards",
  "Multiple Maps": "area",
  "Narrative Choice / Paragraph": "social",
  Negotiation: "social",
  "Neighbor Scope": "area",
  "Network and Route Building": "area",
  "Once-Per-Game Abilities": "area",
  "Open Drafting": "cards",
  "Order Counters": "area",
  Ordering: "area",
  Ownership: "auction",
  "Paper-and-Pencil": "social",
  "Passed Action Token": "area",
  "Pattern Building": "area",
  "Pattern Movement": "area",
  "Pattern Recognition": "deduction",
  "Physical Removal": "conflict",
  "Pick-up and Deliver": "area",
  "Pieces as Map": "area",
  "Player Elimination": "conflict",
  "Player Judge": "social",
  "Point to Point Movement": "area",
  "Predictive Bid": "auction",
  "Prisoner's Dilemma": "social",
  "Programmed Movement": "area",
  "Push Your Luck": "dice",
  "Questions and Answers": "social",
  Race: "area",
  "Random Production": "dice",
  "Ratio / Combat Results Table": "conflict",
  "Re-rolling and Locking": "dice",
  "Real-Time": "social",
  "Relative Movement": "area",
  "Resource Queue": "area",
  "Resource to Move": "area",
  "Rock-Paper-Scissors": "dice",
  "Role Playing": "social",
  "Roles with Asymmetric Information": "deduction",
  "Roll / Spin and Move": "dice",
  Rondel: "area",
  "Scenario / Mission / Campaign Game": "coop",
  "Score-and-Reset Game": "area",
  "Secret Unit Deployment": "deduction",
  "Selection Order Bid": "auction",
  "Semi-Cooperative Game": "coop",
  "Set Collection": "cards",
  Simulation: "area",
  "Simultaneous Action Selection": "area",
  Singing: "social",
  "Single Loser Game": "conflict",
  "Slide / Push": "area",
  "Solo / Solitaire Game": "area",
  "Speed Matching": "social",
  Spelling: "social",
  "Square Grid": "area",
  "Stacking and Balancing": "area",
  "Stat Check Resolution": "dice",
  "Static Capture": "conflict",
  "Stock Holding": "auction",
  Storytelling: "social",
  "Sudden Death Ending": "conflict",
  Tags: "area",
  "Take That": "conflict",
  "Targeted Clues": "deduction",
  "Team-Based Game": "social",
  "Tech Trees / Tech Tracks": "area",
  "Three Dimensional Movement": "area",
  "Tile Placement": "area",
  "Track Movement": "area",
  Trading: "auction",
  "Traitor Game": "social",
  "Trick-taking": "cards",
  "Tug of War": "conflict",
  "Turn Order: Auction": "auction",
  "Turn Order: Claim Action": "area",
  "Turn Order: Pass Order": "area",
  "Turn Order: Progressive": "area",
  "Turn Order: Random": "area",
  "Turn Order: Role Order": "area",
  "Turn Order: Stat-Based": "area",
  "Turn Order: Time Track": "area",
  "Variable Phase Order": "area",
  "Variable Player Powers": "area",
  "Variable Set-up": "area",
  "Victory Points as a Resource": "auction",
  Voting: "social",
  "Worker Placement": "area",
  "Worker Placement with Dice Workers": "area",
  "Worker Placement, Different Worker Types": "area",
  "Zone of Control": "area",
};

export function mechanicBucketForRaw(raw: string): MechanicBucketId | null {
  const key = decodeHtmlEntities(raw).trim();
  return RAW_TO_BUCKET[key] ?? null;
}

export function mechanicBucketIdsForGame(game: BggGame): MechanicBucketId[] {
  const set = new Set<MechanicBucketId>();
  for (const m of game.mechanics) {
    const b = mechanicBucketForRaw(m);
    if (b) set.add(b);
  }
  return MECHANIC_BUCKET_ORDER.filter((id) => set.has(id));
}

export function gameMatchesMechanicBucket(
  game: BggGame,
  bucketId: MechanicBucketId,
): boolean {
  return game.mechanics.some((m) => mechanicBucketForRaw(m) === bucketId);
}

/** Bucket ids that appear in at least one game (stable display order). */
export function collectMechanicBuckets(games: BggGame[]): MechanicBucketId[] {
  const set = new Set<MechanicBucketId>();
  for (const g of games) {
    for (const m of g.mechanics) {
      const b = mechanicBucketForRaw(m);
      if (b) set.add(b);
    }
  }
  return MECHANIC_BUCKET_ORDER.filter((id) => set.has(id));
}

export function mechanicBucketDisplayLabels(ids: MechanicBucketId[]): string[] {
  return ids.map((id) => MECHANIC_BUCKET_LABELS[id]);
}
