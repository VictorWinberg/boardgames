# Board games dashboard

React + Vite app that shows your **BoardGameGeek** owned collection and includes a **random game** picker with optional filters. Built for **GitHub Pages** (static hosting).

Data comes from a generated `public/games.json` file. The BoardGameGeek API is not called from the browser (CORS), so a small sync script runs locally or in CI to refresh that file.

**Authentication:** BGG’s XML API requires a **Bearer access token**. Create an application on [boardgamegeek.com/applications](https://boardgamegeek.com/applications), copy the token, and set `BGG_ACCESS_TOKEN` (see below). Your username is still passed as `BGG_USERNAME` for the collection endpoint.

## Local development

```bash
npm install
cp .env.example .env
# Set BGG_USERNAME and BGG_ACCESS_TOKEN in .env, then:
npm run sync:bgg
npm run dev
```

Open the URL Vite prints (port **8080** by default). Keep `VITE_BASE_URL=/` in `.env` for local dev.

## Syncing from BoardGameGeek

```bash
export BGG_USERNAME=your_bgg_username
export BGG_ACCESS_TOKEN=your_token_from_bgg_applications
npm run sync:bgg
```

This writes [`public/games.json`](public/games.json). Commit the updated file if you want the collection versioned without CI secrets.

## Production build

Match the **GitHub repository name** in `VITE_BASE_URL` (trailing slash). Example for repo `boardgames`:

```bash
VITE_BASE_URL=/boardgames/ npm run build
```

Output is in `dist/`.

## GitHub Pages

1. Push this repo to GitHub (e.g. repository name `boardgames`).
2. In **Settings → Secrets and variables → Actions**, add **`BGG_USERNAME`** and **`BGG_ACCESS_TOKEN`** (from [BGG Applications](https://boardgamegeek.com/applications)). If either is missing, the workflow skips sync and uses whatever `public/games.json` is already in the repo.
3. In **Settings → Pages**, set **Source** to the **`gh-pages`** branch (created by the deploy action).
4. If your repository name is not `boardgames`, change `VITE_BASE_URL` in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) to `/<your-repo-name>/`.

The workflow (see [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) installs dependencies, optionally runs `npm run sync:bgg`, builds with `VITE_BASE_URL`, and publishes `dist/` with [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages).

**SPA routing** under a project URL uses the [spa-github-pages](https://github.com/rafgraph/spa-github-pages) pattern: redirect snippet in [`index.html`](index.html) and [`public/404.html`](public/404.html) with `pathSegmentsToKeep = 1`.

## License

MIT (app code). BoardGameGeek data and trademarks belong to their respective owners.
