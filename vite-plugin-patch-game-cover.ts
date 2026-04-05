import fs from "node:fs/promises";
import path from "node:path";

import type { Plugin, ViteDevServer } from "vite";

const GAMES_JSON = path.join(process.cwd(), "public", "games.json");

function matchesPatchRoute(server: ViteDevServer, pathname: string): boolean {
  const suffix = "/api/patch-game-cover";
  if (pathname === suffix || pathname.endsWith(suffix)) return true;
  const base = server.config.base.replace(/\/$/, "");
  if (!base) return false;
  return pathname === `${base}${suffix}` || pathname.endsWith(`${base}${suffix}`);
}

export function patchGameCoverApi(): Plugin {
  return {
    name: "patch-game-cover-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? "").split("?")[0] ?? "";
        if (req.method !== "POST" || !matchesPatchRoute(server, pathname)) {
          next();
          return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (c: Buffer) => chunks.push(c));
        req.on("end", () => {
          void (async () => {
            res.setHeader("Content-Type", "application/json");
            try {
              const raw = Buffer.concat(chunks).toString("utf8");
              const parsed = JSON.parse(raw) as {
                gameId?: unknown;
                thumbnail?: unknown;
                image?: unknown;
              };
              const gameId =
                typeof parsed.gameId === "string" ||
                typeof parsed.gameId === "number"
                  ? String(parsed.gameId)
                  : "";
              const thumbnail =
                typeof parsed.thumbnail === "string"
                  ? parsed.thumbnail.trim()
                  : "";
              const image =
                typeof parsed.image === "string" ? parsed.image.trim() : "";
              if (!gameId) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "gameId required" }));
                return;
              }

              const text = await fs.readFile(GAMES_JSON, "utf8");
              const payload = JSON.parse(text) as {
                games?: unknown;
                [key: string]: unknown;
              };
              if (!payload.games || !Array.isArray(payload.games)) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "invalid games.json" }));
                return;
              }

              let found = false;
              const games = payload.games.map((g: Record<string, unknown>) => {
                if (String(g.id) !== gameId) return g;
                found = true;
                const { geekdoImages: _g, ...rest } = g;
                return {
                  ...rest,
                  thumbnail: thumbnail || null,
                  image: image || null,
                };
              });

              if (!found) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: "game not found" }));
                return;
              }

              await fs.writeFile(
                GAMES_JSON,
                `${JSON.stringify({ ...payload, games }, null, 2)}\n`,
                "utf8"
              );
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  error: e instanceof Error ? e.message : "write failed",
                })
              );
            }
          })();
        });
      });
    },
  };
}
