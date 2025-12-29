# RosterApp UI

A production-ready frontend SPA for RosterApp. Built with React, Vite, TypeScript, and Tailwind CSS.

## Features
- Auth0 authentication (Authorization Code + PKCE)
- Phase 1: GET `/api/me` and render raw JSON
- Phase 2: roster image upload UI (JPG/PNG validation + max size env + convert call)
- Debug panel in dev mode (redacts Authorization header)
- GitHub Pages deployment workflow

## Local development

1) Install dependencies

```bash
npm install
```

2) Create `.env` from `.env.example`

```bash
cp .env.example .env
```

Tests use `.env.test` (checked into git) for deterministic configuration.

3) Run the dev server

```bash
npm run dev
```

## Auth0 setup

Create a Single Page Application in Auth0 and configure:

- Allowed Callback URLs:
  - `http://localhost:5173/callback`
  - `https://<github-username>.github.io/<repo-name>/callback`
- Allowed Logout URLs:
  - `http://localhost:5173`
  - `https://<github-username>.github.io/<repo-name>/`
- Allowed Web Origins:
  - `http://localhost:5173`
  - `https://<github-username>.github.io`

If you see "Callback URL mismatch", double-check the list above and ensure your `VITE_GH_PAGES_BASE` matches your repo name.

Set the following environment variables:

- `VITE_AUTH0_DOMAIN`
- `VITE_AUTH0_CLIENT_ID`
- `VITE_AUTH0_AUDIENCE` (optional unless your API expects an audience)
- `VITE_BACKEND_BASE_URL` (defaults to the Cloud Run URL)
- `VITE_GH_PAGES_BASE` (e.g. `/rosterapp-ui`)
- `VITE_MAX_UPLOAD_MB` (max image size in MB, default 1)
- `VITE_UI_DEBUG` (`true` shows full debug UI, `false` shows minimal UI)

## Backend CORS requirements

Ensure the backend allows these origins:

- `http://localhost:5173`
- `https://<github-username>.github.io`

## Error model recommendation

The frontend expects JSON error responses shaped like:

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/me",
  "details": {}
}
```

Status codes:
- `200` success
- `400` validation errors
- `401/403` auth failures
- `5xx` server errors

## GitHub Pages deployment

This repo includes a GitHub Actions workflow that builds and deploys the `dist/` folder to GitHub Pages.

1) Update your repository name in `VITE_GH_PAGES_BASE` (e.g. `/rosterapp-ui`).
2) Push to `main`. The workflow runs `npm install`, `npm test`, `npm run build`, and deploys.
3) Configure GitHub Pages to use GitHub Actions as the source.

## Testing

```bash
npm run test
```

## Notes
- Tokens are stored in memory only. Nothing is written to localStorage or sessionStorage.
- Authorization headers are redacted in debug output.
- GitHub Pages does not support SPA history fallback by default; the `public/404.html` file redirects users back to the app.

## Roster convert API (Phase 2)

The convert call uses `POST /api/roster/convert` with `multipart/form-data`:

- `image`: the uploaded roster image (PNG/JPG)
- `format`: `JSON` or `ICS`
- `yearMonth` or `dateFrom` / `dateTo` (future fields)

The UI validates PNG/JPG and max file size before upload and displays JSON output after success.
If the backend returns `text/calendar`, the UI offers an `.ics` download (and share on supported mobile browsers).
When `VITE_UI_DEBUG=false`, the UI is minimized to Login/Logout + upload + ICS download only.
