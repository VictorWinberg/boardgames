import type { BggGame, GamesPayload } from "@/types/bgg";

function asArray<T>(x: T | T[] | undefined | null): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

function parseNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function bggDescriptionToPlain(html: string | undefined): string | undefined {
  if (!html?.trim()) return undefined;
  const plain = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
  return plain || undefined;
}

/** BGG collection `<status own="1">`; merged into each game as `status.own`. */
function isBggCollectionOwned(raw: Record<string, unknown>): boolean {
  const status = raw.status as Record<string, unknown> | undefined;
  if (status == null) return true;
  const own = status.own;
  if (own === 1 || own === true) return true;
  if (typeof own === "string" && own.trim() === "1") return true;
  return false;
}

function extractLinks(
  raw: Record<string, unknown>,
  linkType: string
): string[] {
  const links = asArray(
    raw.link as Record<string, unknown>[] | Record<string, unknown> | undefined
  );
  return links
    .filter((l) => l && typeof l === "object" && (l as { type?: string }).type === linkType)
    .map((l) => String((l as { value?: unknown }).value ?? ""))
    .filter(Boolean);
}

/** Extract BGG ranks from statistics.ratings.ranks, excluding the generic "boardgame" rank */
function extractRanks(raw: Record<string, unknown>): import("@/types/bgg").BggRank[] {
  const statistics = raw.statistics as Record<string, unknown> | undefined;
  const ratings = statistics?.ratings as Record<string, unknown> | undefined;
  const ranks = ratings?.ranks as Record<string, unknown> | undefined;
  const rankArray = asArray(
    ranks?.rank as Record<string, unknown>[] | Record<string, unknown> | undefined
  );

  return rankArray
    .filter((r) => {
      if (!r || typeof r !== "object") return false;
      const name = String((r as { name?: unknown }).name ?? "");
      // Only include family ranks (strategygames, partygames, etc.), not the generic boardgame rank
      return name !== "" && name !== "boardgame";
    })
    .map((r) => ({
      name: String((r as { name?: unknown }).name ?? ""),
    }));
}

function rawBggGameToBggGame(raw: Record<string, unknown>): BggGame {
  const id =
    raw.objectid != null
      ? String(raw.objectid)
      : raw.id != null
        ? String(raw.id)
        : "";

  const stats = raw.stats as Record<string, unknown> | undefined;
  const minP =
    parseNum(raw.minplayers) ?? parseNum(stats?.minplayers);
  const maxP =
    parseNum(raw.maxplayers) ?? parseNum(stats?.maxplayers);
  const playingTime =
    parseNum(raw.playingtime) ?? parseNum(stats?.playingtime);
  const minPlayTime =
    parseNum(raw.minplaytime) ?? parseNum(stats?.minplaytime);
  const maxPlayTime =
    parseNum(raw.maxplaytime) ?? parseNum(stats?.maxplaytime);

  const statistics = raw.statistics as Record<string, unknown> | undefined;
  const ratings = statistics?.ratings as Record<string, unknown> | undefined;
  const averageWeight = parseNum(ratings?.averageweight);

  const name = typeof raw.name === "string" ? raw.name : "";
  const bggDescription = bggDescriptionToPlain(
    typeof raw.description === "string" ? raw.description : undefined
  );

  return {
    id,
    name,
    yearPublished: parseNum(raw.yearpublished),
    thumbnail: raw.thumbnail != null ? String(raw.thumbnail) : null,
    image: raw.image != null ? String(raw.image) : null,
    minPlayers: minP,
    maxPlayers: maxP,
    playingTime,
    minPlayTime,
    maxPlayTime,
    averageWeight,
    minAge: parseNum(raw.minage),
    numPlays: parseNum(raw.numplays),
    categories: extractLinks(raw, "boardgamecategory"),
    mechanics: extractLinks(raw, "boardgamemechanic"),
    ranks: extractRanks(raw),
    bggDescription,
    description: bggDescription,
  };
}

type CustomGameEntry = {
  name?: string;
  description?: string;
  friendOwner?: string;
  /** When true, the game is omitted from the in-app collection (BGG row and custom-only friend rows). */
  exclude?: boolean;
  /** Overrides BGG `thumbnail` when set. */
  thumbnail?: string;
  /** Overrides BGG `image` when set. */
  image?: string;
};

function parseCustomGamesMap(
  data: unknown
): Map<string, CustomGameEntry> {
  const map = new Map<string, CustomGameEntry>();
  if (!data || typeof data !== "object") return map;
  const games = (data as Record<string, unknown>).games;
  if (!Array.isArray(games)) return map;
  for (const g of games) {
    if (!g || typeof g !== "object") continue;
    const o = g as Record<string, unknown>;
    const id = o.id != null ? String(o.id) : "";
    if (id === "") continue;
    const name = typeof o.name === "string" ? o.name : undefined;
    const description =
      typeof o.description === "string" ? o.description : undefined;
    const friendOwner =
      typeof o.friendOwner === "string" ? o.friendOwner : undefined;
    const exclude = o.exclude === true;
    const thumbnail =
      typeof o.thumbnail === "string" && o.thumbnail.trim()
        ? o.thumbnail.trim()
        : undefined;
    const image =
      typeof o.image === "string" && o.image.trim()
        ? o.image.trim()
        : undefined;
    map.set(id, {
      name,
      description,
      friendOwner,
      exclude,
      thumbnail,
      image,
    });
  }
  return map;
}

function friendTaggedIds(custom: Map<string, CustomGameEntry>): Set<string> {
  const s = new Set<string>();
  for (const [id, v] of custom) {
    if (v.friendOwner?.trim()) s.add(id);
  }
  return s;
}

function applyCustomOverlay(
  game: BggGame,
  entry: CustomGameEntry | undefined
): void {
  if (!entry) return;
  if (entry.description?.trim()) {
    game.customDescription = entry.description.trim();
  }
  game.description = game.customDescription ?? game.bggDescription;
  const fo = entry.friendOwner?.trim();
  if (fo) game.owner = fo;
  if (entry.thumbnail?.trim()) {
    game.thumbnail = entry.thumbnail.trim();
  }
  if (entry.image?.trim()) {
    game.image = entry.image.trim();
  }
}

function minimalGameFromCustom(
  id: string,
  entry: CustomGameEntry
): BggGame {
  const fo = entry.friendOwner?.trim() ?? "";
  return {
    id,
    name: entry.name?.trim() || `Game ${id}`,
    yearPublished: null,
    thumbnail: entry.thumbnail?.trim() ?? null,
    image: entry.image?.trim() ?? null,
    minPlayers: null,
    maxPlayers: null,
    playingTime: null,
    minPlayTime: null,
    maxPlayTime: null,
    averageWeight: null,
    minAge: null,
    numPlays: null,
    categories: [],
    mechanics: [],
    ranks: [],
    bggDescription: undefined,
    customDescription: entry.description?.trim() || undefined,
    description: entry.description?.trim() || undefined,
    owner: fo || undefined,
  };
}

/**
 * Turns `public/bgg.json` (collection + thing merge from `fetch-bgg.mjs`) into app `GamesPayload`.
 * Optional `public/custom.json` overlays descriptions, `image` / `thumbnail` (over BGG), maps `friendOwner` → `owner` for the friends filter, and can set `exclude` to drop a title from the app list.
 */
export function normalizeBggJsonPayload(
  data: unknown,
  customData?: unknown
): GamesPayload | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const gamesRaw = o.games;
  if (!Array.isArray(gamesRaw)) return null;

  const customMap = parseCustomGamesMap(customData);
  const friendIds = friendTaggedIds(customMap);

  const games: BggGame[] = [];
  const seenIds = new Set<string>();

  for (const g of gamesRaw) {
    if (!g || typeof g !== "object") continue;
    const raw = g as Record<string, unknown>;
    const id =
      raw.objectid != null
        ? String(raw.objectid)
        : raw.id != null
          ? String(raw.id)
          : "";
    if (id === "") continue;
    if (!isBggCollectionOwned(raw) && !friendIds.has(id)) continue;

    const customEntry = customMap.get(id);
    if (customEntry?.exclude) continue;

    const row = rawBggGameToBggGame(raw);
    if (row.id === "") continue;
    applyCustomOverlay(row, customEntry);
    games.push(row);
    seenIds.add(row.id);
  }

  for (const [id, entry] of customMap) {
    if (!entry.friendOwner?.trim() || seenIds.has(id)) continue;
    if (entry.exclude) continue;
    games.push(minimalGameFromCustom(id, entry));
    seenIds.add(id);
  }

  const pubdate = o.pubdate;
  return {
    syncedAt: typeof pubdate === "string" ? pubdate : null,
    username: null,
    games,
  };
}
