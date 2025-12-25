# RosterApp UI

A production-ready frontend SPA for RosterApp. Built with React, Vite, TypeScript, and Tailwind CSS.

## Features
- Auth0 authentication (Authorization Code + PKCE)
- Phase 1: POST `/api/me` and render raw JSON
- Phase 2 scaffold: roster image upload UI (JPG/PNG validation + simulated progress)
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
