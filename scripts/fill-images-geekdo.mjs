#!/usr/bin/env node
/**
 * Fetches Geekdo gallery images for one game (one API request, up to 100) and writes
 * them to public/games.json under that game's `geekdoImages` array. Does not guess a cover —
 * thumbnail/image are left unchanged unless you pass --clear-images (sets them to null).
 *
 *   node scripts/fill-images-geekdo.mjs <objectid> [--pageid N] [--dry-run] [--verbose] [--clear-images]
 *   node scripts/fill-images-geekdo.mjs --objectid <id>   # same
 *
 *   GET https://api.geekdo.com/api/images?objectid=<id>&objecttype=thing&showcount=100&pageid=<N>&sort=hot
 *   Always uses `sort=hot` (Geekdo’s “hot” order ≈ most recommended first).
 *
 * Pick covers in the web UI (localStorage), then use "Download games.json" to replace
 * public/games.json in the repo.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const GAMES_PATH = path.join(ROOT, "public", "games.json");

/** Geekdo `showcount` (max images returned per request). */
const SHOW_COUNT = 100;
const GEEKDO_SORT = "hot";

function parseArgs(argv) {
  const out = {
    dryRun: false,
    verbose: false,
    clearImages: false,
    /** @type {string | null} */
    objectId: null,
    /** Geekdo gallery pagination (1-based). */
    pageId: 1,
  };
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--verbose" || a === "-v") out.verbose = true;
    else if (a === "--clear-images") out.clearImages = true;
    else if (a === "--objectid" || a === "--id") {
      const v = argv[++i];
      if (v != null && !v.startsWith("-")) out.objectId = String(v).trim();
    } else if (a === "--pageid") {
      const v = argv[++i];
      if (v == null || v.startsWith("-")) {
        console.error("--pageid requires a value (integer >= 1)");
        process.exit(1);
      }
      const n = Number.parseInt(v, 10);
      if (!Number.isFinite(n) || n < 1) {
        console.error(`Invalid --pageid: ${v} (expected integer >= 1)`);
        process.exit(1);
      }
      out.pageId = n;
    } else if (a.startsWith("--pageid=")) {
      const v = a.slice("--pageid=".length);
      const n = Number.parseInt(v, 10);
      if (!Number.isFinite(n) || n < 1) {
        console.error(`Invalid --pageid: ${v} (expected integer >= 1)`);
        process.exit(1);
      }
      out.pageId = n;
    } else if (!a.startsWith("-")) {
      positionals.push(a);
    }
  }
  if (!out.objectId && positionals.length > 0) {
    out.objectId = String(positionals[0]).trim();
    if (positionals.length > 1) {
      console.warn("ignoring extra arguments:", positionals.slice(1).join(" "));
    }
  }
  return out;
}

/** @param {unknown} row */
function mapGalleryRow(row) {
  if (!row || typeof row !== "object") return null;
  const imageid = String(row.imageid ?? "");
  if (!imageid) return null;
  const caption = typeof row.caption === "string" ? row.caption.trim() : "";
  const t2x = row["imageurl@2x"];
  const thumb = typeof t2x === "string" && t2x ? t2x : null;
  const lg = row.imageurl_lg;
  const large = typeof lg === "string" && lg ? lg : null;
  return {
    imageid,
    caption,
    thumbnail: typeof thumb === "string" && thumb ? thumb : null,
    image: typeof large === "string" && large ? large : null,
  };
}

/**
 * @param {string} objectId
 * @param {{ verbose?: boolean, name?: string, pageId?: number }} [opts]
 */
async function fetchGallery(objectId, opts = {}) {
  const pageId = opts.pageId ?? 1;
  const url = new URL("https://api.geekdo.com/api/images");
  url.searchParams.set("objectid", objectId);
  url.searchParams.set("objecttype", "thing");
  url.searchParams.set("showcount", String(SHOW_COUNT));
  url.searchParams.set("pageid", String(pageId));
  url.searchParams.set("sort", GEEKDO_SORT);

  console.log(url.href);
  const res = await fetch(url.href, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Geekdo images HTTP ${res.status} for thing ${objectId}`);
  }
  const data = await res.json();
  const raw = Array.isArray(data.images) ? data.images : [];
  const ordered = [];
  const seen = new Set();
  for (const row of raw) {
    const m = mapGalleryRow(row);
    if (m && (m.thumbnail || m.image) && !seen.has(m.imageid)) {
      seen.add(m.imageid);
      ordered.push(m);
    }
  }

  if (opts.verbose) {
    const pag = data.pagination;
    const total =
      pag && typeof pag === "object" && typeof pag.total === "number"
        ? pag.total
        : null;
    const label = opts.name ? ` ${opts.name.slice(0, 40)}` : "";
    if (total != null && total > ordered.length) {
      const capped = total > SHOW_COUNT;
      const pageHint = pageId > 1 ? ` pageid=${pageId};` : "";
      console.warn(
        capped
          ? `thing ${objectId}${label}:${pageHint} API total=${total}, stored ${ordered.length} (max ${SHOW_COUNT} per request)`
          : `thing ${objectId}${label}:${pageHint} got ${ordered.length} usable images, API total=${total} (some rows may lack URLs)`,
      );
    }
  }

  return ordered;
}

function printUsage() {
  console.error(`Usage: node scripts/fill-images-geekdo.mjs <objectid> [options]
       node scripts/fill-images-geekdo.mjs --objectid <id> [options]

Options:
  --pageid N      Geekdo gallery page (default 1); also --pageid=N
  --dry-run       Do not write games.json
  --verbose, -v   Log per-request details
  --clear-images  Set thumbnail and image to null for this game`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.objectId) {
    console.error("Missing objectid (BGG thing id matching games.json id).\n");
    printUsage();
    process.exit(1);
  }

  const payload = JSON.parse(await readFile(GAMES_PATH, "utf8"));

  if (!payload.games || !Array.isArray(payload.games)) {
    console.error("Invalid games.json: missing games array");
    process.exit(1);
  }

  const wanted = args.objectId;
  const g = payload.games.find((game) => String(game.id) === wanted);
  if (!g) {
    console.error(`No game with id ${wanted} in public/games.json`);
    process.exit(1);
  }

  const id = String(g.id);
  const name = g.name || "";

  let images;
  try {
    images = await fetchGallery(id, {
      verbose: args.verbose,
      name,
      pageId: args.pageId,
    });
  } catch (err) {
    console.error(`${id} ${name}:`, err.message);
    process.exit(1);
  }

  g.geekdoImages = images;
  if (args.clearImages) {
    g.thumbnail = null;
    g.image = null;
  }

  if (args.verbose) {
    console.log(`${id} ${name.slice(0, 42)} → ${images.length} images`);
  }

  const text = `${JSON.stringify(payload, null, 2)}\n`;
  if (!args.dryRun) {
    await writeFile(GAMES_PATH, text, "utf8");
  }

  console.log(
    args.dryRun
      ? `Dry run: would set geekdoImages (${images.length}) for ${id} ${name.slice(0, 50)}`
      : `Updated geekdoImages (${images.length}) for ${id} ${name.slice(0, 50)} in public/games.json`,
  );
  if (args.clearImages) {
    console.log("(thumbnail/image set to null for this game)");
  }
  console.log(
    `sort=${GEEKDO_SORT}; showcount=${SHOW_COUNT}; pageid=${args.pageId}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
