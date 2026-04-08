#!/usr/bin/env node
/**
 * Collection → public/bgg.json, then `thing` in batches (THING_BATCH_SIZE), shallow-merged per game.
 * Primary thing title replaces `name`. Needs BGG_USERNAME + BGG_ACCESS_TOKEN.
 */

import "./load-env.mjs";

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { XMLParser } from "fast-xml-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "bgg.json");
const THING_BATCH_SIZE = 18;
const POLL_MS = 6000;
const POLL_MAX = 20;
const BETWEEN_REQUEST_MS = 2200;

const parser = new XMLParser({
  ignoreAttributes: false,
  ignoreDeclaration: true,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

const ATTR_VALUE = "@_value";
const TEXT_NODE = "#text";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function bggHeaders() {
  return {
    Accept: "application/xml, text/xml, */*",
    "User-Agent": "boardgames-dashboard/1.0 (https://github.com)",
    Authorization: `Bearer ${process.env.BGG_ACCESS_TOKEN.trim()}`,
  };
}

async function fetchText(url) {
  const res = await fetch(url, { headers: bggHeaders() });
  return { status: res.status, body: await res.text() };
}

async function fetchCollectionXml(username) {
  const url = new URL("https://boardgamegeek.com/xmlapi2/collection");
  url.searchParams.set("username", username);
  url.searchParams.set("subtype", "boardgame");
  url.searchParams.set("stats", "1");

  for (let i = 0; i < POLL_MAX; i++) {
    const { status, body } = await fetchText(url.toString());
    if (status === 200) return body;
    if (status === 202) {
      console.warn(`BGG collection 202 — waiting ${POLL_MS / 1000}s…`);
      await sleep(POLL_MS);
      continue;
    }
    if (status === 401) {
      throw new Error(
        "BGG 401 — set BGG_ACCESS_TOKEN (https://boardgamegeek.com/using_the_xml_api)."
      );
    }
    throw new Error(`Collection HTTP ${status}`);
  }
  throw new Error("Collection still 202 after max polls");
}

async function fetchThingXmlForIds(ids) {
  const url = new URL("https://boardgamegeek.com/xmlapi2/thing");
  url.searchParams.set("id", ids.join(","));
  url.searchParams.set("stats", "1");
  const { status, body } = await fetchText(url.toString());
  if (status === 401) {
    throw new Error(
      "BGG 401 on thing — set BGG_ACCESS_TOKEN (https://boardgamegeek.com/using_the_xml_api)."
    );
  }
  if (status !== 200) throw new Error(`Thing HTTP ${status} for ${ids.join(",")}`);
  return body;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function coerceBggScalar(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === "" || s === "N/A") return null;
  if (/^-?\d+$/.test(s)) return Number(s);
  if (/^-?\d+\.\d+$/.test(s)) return Number(s);
  return s;
}

function normalizeAttrValues(node) {
  if (node === null || typeof node !== "object") return node;
  if (Array.isArray(node)) return node.map(normalizeAttrValues);

  const keys = Object.keys(node);
  if (keys.length === 1 && keys[0] === ATTR_VALUE) {
    return coerceBggScalar(node[ATTR_VALUE]);
  }

  const out = {};
  let vAttr;
  for (const k of keys) {
    if (k === ATTR_VALUE) vAttr = node[k];
    else out[k] = normalizeAttrValues(node[k]);
  }
  if (vAttr !== undefined) out.value = coerceBggScalar(vAttr);
  return out;
}

function stripAttrKeyPrefixes(node) {
  if (node === null || typeof node !== "object") return node;
  if (Array.isArray(node)) return node.map(stripAttrKeyPrefixes);
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    out[k.startsWith("@_") ? k.slice(2) : k] = stripAttrKeyPrefixes(v);
  }
  return out;
}

function unwrapNameTextNodes(node) {
  if (node === null || typeof node !== "object") return node;
  if (Array.isArray(node)) return node.map(unwrapNameTextNodes);

  const keys = Object.keys(node);
  if (
    keys.length &&
    keys.every((k) => k === TEXT_NODE || k === "sortindex") &&
    TEXT_NODE in node
  ) {
    const t = node[TEXT_NODE];
    return typeof t === "string" ? t : String(t ?? "");
  }

  const out = {};
  for (const [k, v] of Object.entries(node)) out[k] = unwrapNameTextNodes(v);
  return out;
}

/** BGG `<items><item>…` after parse: normalize + ensure `item` is an array. */
function transformItemsDoc(doc) {
  const raw = doc.items.item;
  if (!Array.isArray(raw)) doc.items.item = raw == null ? [] : [raw];
  let d = normalizeAttrValues(doc);
  d = stripAttrKeyPrefixes(d);
  return unwrapNameTextNodes(d);
}

function unwrapItemsList(doc, listKey) {
  const { item, ...meta } = doc.items;
  return { [listKey]: item, ...meta };
}

function primaryThingName(nameField) {
  if (nameField == null) return "";
  if (typeof nameField === "string") return nameField;
  const names = Array.isArray(nameField) ? nameField : [nameField];
  const primary = names.find((n) => n?.type === "primary");
  const pick = primary ?? names[0];
  return pick?.value != null ? String(pick.value) : "";
}

function mergeGame(game, thing) {
  return { ...game, ...thing, name: primaryThingName(thing.name) };
}

async function main() {
  const username = process.env.BGG_USERNAME?.trim();
  const token = process.env.BGG_ACCESS_TOKEN?.trim();
  if (!username || !token) {
    console.error("BGG_USERNAME and BGG_ACCESS_TOKEN are required.");
    process.exit(1);
  }

  console.log(`Fetching collection for “${username}”…`);
  const payload = unwrapItemsList(
    transformItemsDoc(parser.parse(await fetchCollectionXml(username))),
    "games"
  );
  const { games } = payload;
  const n = games.length;

  const idList = [...new Set(games.map((g) => String(g.objectid)))];
  const batches = chunk(idList, THING_BATCH_SIZE);
  const thingById = new Map();

  await sleep(BETWEEN_REQUEST_MS);
  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    console.log(`Thing batch ${b + 1}/${batches.length} (${batch.length})…`);
    const items = unwrapItemsList(
      transformItemsDoc(parser.parse(await fetchThingXmlForIds(batch))),
      "item"
    ).item;
    for (const item of items) thingById.set(String(item.id), item);
    if (b < batches.length - 1) await sleep(BETWEEN_REQUEST_MS);
  }

  const missing = idList.filter((id) => !thingById.has(id));
  if (missing.length) {
    console.warn(`Thing missing ${missing.length} id(s): ${missing.slice(0, 8).join(",")}${missing.length > 8 ? "…" : ""}`);
  }

  payload.games = games.map((g) => {
    const t = thingById.get(String(g.objectid));
    return t ? mergeGame(g, t) : g;
  });

  await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${n} games → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
