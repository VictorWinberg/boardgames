#!/usr/bin/env node
/**
 * Fetches owned board games from BGG XML API2 and writes public/games.json.
 * Requires BGG_USERNAME and BGG_ACCESS_TOKEN (BoardGameGeek → Applications).
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { XMLParser } from "fast-xml-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "games.json");

const BATCH = 18;
const POLL_MS = 6000;
const POLL_MAX = 20;
const BETWEEN_BATCH_MS = 2200;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function asArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function text(el) {
  if (el == null) return "";
  if (typeof el === "string") return el.trim();
  if (typeof el === "number") return String(el);
  if (el["#text"] != null) return String(el["#text"]).trim();
  return "";
}

function num(el) {
  const t = text(el);
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function attrNum(obj, key) {
  if (!obj || typeof obj !== "object") return null;
  const v = obj[`@_${key}`];
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function attrStr(obj, key) {
  if (!obj || typeof obj !== "object") return null;
  const v = obj[`@_${key}`];
  return v != null ? String(v) : null;
}

function primaryName(names) {
  const list = asArray(names);
  for (const n of list) {
    if (n && typeof n === "object" && n["@_type"] === "primary") {
      const v = attrStr(n, "value");
      if (v) return v;
    }
  }
  for (const n of list) {
    const v = attrStr(n, "value");
    if (v) return v;
  }
  return "";
}

function linksByType(links, type) {
  return asArray(links)
    .filter((l) => l && typeof l === "object" && l["@_type"] === type)
    .map((l) => attrStr(l, "value"))
    .filter(Boolean);
}

function bggHeaders() {
  const token = process.env.BGG_ACCESS_TOKEN?.trim();
  const headers = {
    Accept: "application/xml, text/xml, */*",
    "User-Agent": "boardgames-dashboard/1.0 (https://github.com)",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: bggHeaders() });
  const body = await res.text();
  return { status: res.status, body };
}

async function fetchCollectionXml(username) {
  const url = new URL("https://boardgamegeek.com/xmlapi2/collection");
  url.searchParams.set("username", username);
  url.searchParams.set("own", "1");
  url.searchParams.set("subtype", "boardgame");
  url.searchParams.set("stats", "1");

  for (let i = 0; i < POLL_MAX; i++) {
    const { status, body } = await fetchText(url.toString());
    if (status === 200) return body;
    if (status === 202) {
      console.warn(
        `BGG collection not ready (202). Waiting ${POLL_MS / 1000}s…`
      );
      await sleep(POLL_MS);
      continue;
    }
    if (status === 401) {
      throw new Error(
        "BGG returned 401. Create an application at https://boardgamegeek.com/applications " +
          "and set BGG_ACCESS_TOKEN to its access token (see README)."
      );
    }
    throw new Error(`Collection request failed: HTTP ${status}`);
  }
  throw new Error("Collection still not ready after polling");
}

function parseCollectionItems(xml) {
  const doc = parser.parse(xml);
  const items = asArray(doc?.items?.item);
  const rows = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const id = attrStr(item, "objectid");
    if (!id) continue;
    const subtype = attrStr(item, "subtype");
    if (subtype && subtype !== "boardgame") continue;

    const name = text(item.name) || primaryName(item.name);
    const yearPublished = num(item.yearpublished);
    const thumbnail = text(item.thumbnail) || null;
    const image = text(item.image) || null;
    const stats = item.stats;
    let numPlays = null;
    if (stats && typeof stats === "object") {
      numPlays = num(stats.numplays);
    }

    rows.push({
      id,
      name: name || `Game ${id}`,
      yearPublished,
      thumbnail,
      image,
      numPlays,
    });
  }
  return rows;
}

async function fetchThingBatch(ids) {
  const url = new URL("https://boardgamegeek.com/xmlapi2/thing");
  url.searchParams.set("id", ids.join(","));
  url.searchParams.set("stats", "1");
  const { status, body } = await fetchText(url.toString());
  if (status === 401) {
    throw new Error(
      "BGG returned 401 on thing request. Check BGG_ACCESS_TOKEN (see README)."
    );
  }
  if (status !== 200) {
    throw new Error(`Thing request failed for ids ${ids.join(",")}: ${status}`);
  }
  return body;
}

function parseThingItems(xml) {
  const doc = parser.parse(xml);
  return asArray(doc?.items?.item);
}

function mergeThingIntoGame(base, thingItem) {
  const id = attrStr(thingItem, "id") || base.id;
  const name = primaryName(thingItem.name) || base.name;
  const yearPublished =
    attrNum(thingItem, "yearpublished") ?? base.yearPublished;
  const thumbnail = text(thingItem.thumbnail) || base.thumbnail;
  const image = text(thingItem.image) || base.image;

  const minPlayers = attrNum(thingItem.minplayers, "value");
  const maxPlayers = attrNum(thingItem.maxplayers, "value");
  const minPlayTime = attrNum(thingItem.minplaytime, "value");
  const maxPlayTime = attrNum(thingItem.maxplaytime, "value");
  const playingTime = attrNum(thingItem.playingtime, "value");

  let averageWeight = null;
  const stats = thingItem.statistics?.ratings;
  if (stats && typeof stats === "object") {
    averageWeight = num(stats.averageweight);
  }

  const categories = linksByType(thingItem.link, "boardgamecategory");
  const mechanics = linksByType(thingItem.link, "boardgamemechanic");

  return {
    id,
    name,
    yearPublished: yearPublished ?? null,
    thumbnail: thumbnail || null,
    image: image || null,
    minPlayers: minPlayers ?? null,
    maxPlayers: maxPlayers ?? null,
    playingTime: playingTime ?? null,
    minPlayTime: minPlayTime ?? null,
    maxPlayTime: maxPlayTime ?? null,
    averageWeight,
    numPlays: base.numPlays,
    categories,
    mechanics,
  };
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function main() {
  const username = process.env.BGG_USERNAME?.trim();
  const token = process.env.BGG_ACCESS_TOKEN?.trim();
  if (!username) {
    console.error("BGG_USERNAME is required (your BoardGameGeek username).");
    process.exit(1);
  }
  if (!token) {
    console.error(
      "BGG_ACCESS_TOKEN is required. Create an app at https://boardgamegeek.com/applications " +
        "and copy the access token into your environment or GitHub secret."
    );
    process.exit(1);
  }

  console.log(`Fetching collection for “${username}”…`);
  const collectionXml = await fetchCollectionXml(username);
  const collectionRows = parseCollectionItems(collectionXml);
  if (collectionRows.length === 0) {
    console.warn("No owned board games found.");
  }

  const byId = new Map(collectionRows.map((r) => [r.id, { ...r }]));

  const ids = [...byId.keys()];
  const batches = chunk(ids, BATCH);
  console.log(
    `Fetching details for ${ids.length} games in ${batches.length} batch(es)…`
  );

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const xml = await fetchThingBatch(batch);
    const items = parseThingItems(xml);
    for (const thingItem of items) {
      const id = attrStr(thingItem, "id");
      if (!id || !byId.has(id)) continue;
      const merged = mergeThingIntoGame(byId.get(id), thingItem);
      byId.set(id, merged);
    }
    if (b < batches.length - 1) await sleep(BETWEEN_BATCH_MS);
  }

  const games = [...byId.values()]
    .map((g) => ({
      id: String(g.id),
      name: g.name,
      yearPublished: g.yearPublished ?? null,
      thumbnail: g.thumbnail ?? null,
      image: g.image ?? null,
      minPlayers: g.minPlayers ?? null,
      maxPlayers: g.maxPlayers ?? null,
      playingTime: g.playingTime ?? null,
      minPlayTime: g.minPlayTime ?? null,
      maxPlayTime: g.maxPlayTime ?? null,
      averageWeight: g.averageWeight ?? null,
      numPlays: g.numPlays ?? null,
      categories: Array.isArray(g.categories) ? g.categories : [],
      mechanics: Array.isArray(g.mechanics) ? g.mechanics : [],
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );

  const payload = {
    syncedAt: new Date().toISOString(),
    username,
    games,
  };

  await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${games.length} games to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
