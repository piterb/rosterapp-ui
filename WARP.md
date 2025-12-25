# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands & workflows

### Install & run locally

```bash path=null start=null
npm install           # install dependencies
cp .env.example .env  # copy example env and then edit values
npm run dev           # start Vite dev server on http://localhost:5173
```

### Build & preview

```bash path=null start=null
npm run build    # production build (uses Vite + React + Tailwind)
npm run preview  # preview the production build locally
```

### Tests

Vitest is configured with a jsdom environment and React Testing Library.

```bash path=null start=null
npm run test          # run the full Vitest suite once
npm run test:watch    # run Vitest in watch (interactive) mode

# Run a single test file
npm run test -- src/__tests__/Home.test.tsx

# Filter by test name (regex)
npm run test -- -t "Home"      # or a more specific test name
```

### Linting / formatting

There is currently no dedicated lint or format npm script defined in `package.json`. If you need linting, you will have to add ESLint/Prettier configuration and scripts first.

## Environment & configuration

Key environment variables (see `README.md` and `.env.example` for details):

- `VITE_AUTH0_DOMAIN` / `VITE_AUTH0_CLIENT_ID`: required to enable Auth0 SPA authentication. If either is missing, the app runs without an Auth0 client and shows an "Auth0 is not configured" notice.
- `VITE_AUTH0_AUDIENCE` (optional): audience for the backend API. Used when requesting tokens.
- `VITE_BACKEND_BASE_URL` (optional): base URL for the backend. Defaults to a Cloud Run URL if not set. Trailing slashes are stripped.
- `VITE_GH_PAGES_BASE`: base path for GitHub Pages deployments (e.g. `/rosterapp-ui`). This drives both Vite's `base` option and the router/basePath utilities.
- `VITE_APP_BUILD` (optional): string shown in the footer to identify the build (e.g. `local`, commit hash, CI build id).
- `VITE_ENABLE_CONVERT` (optional): when set to `true`, marks the roster image conversion feature as "enabled" (the Phase 2 API wiring is still TODO).

Auth0 and CORS expectations (summarized from `README.md`):

- The Auth0 application must be configured with callback/logout/web origin URLs matching the local dev server and GitHub Pages deployment URLs.
- The backend should allow CORS from at least `http://localhost:5173` and `https://<github-username>.github.io`.
- Error responses are expected to follow the JSON shape described in `README.md` (`timestamp`, `status`, `error`, `message`, `path`, `details`). The API client normalizes arbitrary error payloads to this shape where possible.

## High-level architecture

### Frontend framework & styling

- Single-page app built with React 18, Vite, TypeScript, React Router, and Tailwind CSS.
- Tailwind configuration lives in `tailwind.config.cjs` with a small custom design system (`skyglass` and `runway` colors, custom fonts, panel shadows).
- Global styles and layout utilities are in `src/index.css` (dark theme background, glass panels, code block font, etc.).

### Entry point, routing, and layout

- `src/main.tsx` mounts `<App />` into `#root` and imports `index.css`.
- `src/App.tsx` wraps the app in `AuthProvider` and a `BrowserRouter` whose `basename` is derived from `getBasePath()` (GitHub Pages base path awareness).
- Routes:
  - `/` → `Home` page (`src/pages/Home.tsx`)
  - `/callback` → Auth0 redirect handler (`src/pages/Callback.tsx`)
  - `*` → fallback to `Home` (helps with GitHub Pages refresh behavior).

Routing and base path logic are centralized in `src/utils/basePath.ts`:

- `normalizeBasePath` and `getBasePath` normalize `VITE_GH_PAGES_BASE` into a leading-slash, no-trailing-slash base (`/` or `/something`).
- `withBasePath(path)` prefixes arbitrary paths with the configured base for constructing redirect URLs.

### Authentication layer (Auth0)

All authentication concerns are encapsulated in `src/auth/AuthProvider.tsx`:

- On mount, `AuthProvider` conditionally initializes an Auth0 SPA client if `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENT_ID` are set; otherwise it marks `isLoading` false and `hasClient` false.
- It exposes an `AuthContext` with:
  - `isLoading`, `isAuthenticated`, `user`, and `hasClient` state.
  - `login()` / `logout()` helpers that perform Auth0 redirects using URLs derived from the base path (`/callback` for login, base path root for logout).
  - `getAccessToken()` for acquiring an access token (used by the API client).
  - `handleRedirectCallback()` for processing Auth0 redirect responses and updating auth state.
- `buildRedirectUri` and `buildLogoutUri` use `withBasePath` / `getBasePath` to generate URLs that work for both local dev and GitHub Pages deployments.

Consumers use the `useAuth()` hook to access this context (e.g. `Header`, `Home`, `Callback`).

### Pages and UI components

- `Home` (`src/pages/Home.tsx`)
  - Main dashboard page, responsible for:
    - Wiring Auth0 state into the UI (login requirement messaging, button disabled states).
    - Issuing a `POST /api/me` request (via `createApiClient`) to fetch the current user profile and render it via `JsonViewer`.
    - Displaying normalized error responses in a dedicated error panel.
    - Hosting the Phase 2 roster image upload card (`UploadCard`).
    - Providing a footer that shows the build id and toggles the `DebugPanel` (only in dev mode).
  - Handles `?redirect=` query parameter to normalize paths with/without the base path and then navigates accordingly.

- `Callback` (`src/pages/Callback.tsx`)
  - Handles the Auth0 redirect flow:
    - Calls `handleRedirectCallback()` once the Auth0 client is ready.
    - Reads `appState.returnTo` from the callback result to determine where to send the user post-login.
    - Uses the base path utilities to normalize `returnTo` so the router can handle it correctly under GitHub Pages.

- `Header` (`src/components/Header.tsx`)
  - Shows the app title and current auth status (including the signed-in email when available).
  - Renders a status pill (`Checking session`, `Authenticated`, or `Signed out`).
  - Provides Login/Logout buttons that delegate to `useAuth()` and respect whether Auth0 is configured.

- `UploadCard` (`src/components/UploadCard.tsx`)
  - Phase 2 "roster image convert" UI only; it does not yet call the backend.
  - Responsibilities:
    - Client-side file validation (type: JPG/PNG only, no PDF; size limit 10 MB).
    - Drag-and-drop + file picker, with validation errors surfaced to the user.
    - Thumbnail preview using `URL.createObjectURL`.
    - Output format selector (`JSON` vs `ICS`).
    - Simulated progress bar and status messages (driven by `useSimulatedProgress`).
  - Behavior depends on `VITE_ENABLE_CONVERT`:
    - `false` or unset → conversion is feature-flagged off; clicking Convert shows a Phase 1 placeholder message.
    - `true` → still simulated, but messaging indicates that backend conversion is enabled and API wiring is TODO.

- `JsonViewer` (`src/components/JsonViewer.tsx`)
  - Generic JSON pretty-printer used to display `/api/me` responses.
  - Supports collapse/expand behavior and robustly stringifies arbitrary data.

- `DebugPanel` (`src/components/DebugPanel.tsx`)
  - Only active in dev builds (guarded by `import.meta.env.DEV`).
  - Subscribes to a simple global store (`debugStore`) via `useSyncExternalStore`.
  - Renders the last request URL, method, and headers (with the `Authorization` header redacted), plus a response status and body snippet.

### API client and debugging

- `createApiClient` (`src/api/client.ts`)
  - Accepts a `TokenProvider` (`getAccessToken`, `login`) – usually sourced from `AuthProvider`.
  - Computes the backend base URL from `VITE_BACKEND_BASE_URL` or a default Cloud Run URL and trims trailing slashes.
  - `request<T>(path, options)`:
    - Constructs the full URL and attaches the `Authorization: Bearer <token>` header (token from Auth0).
    - Updates the debug store before and after requests with sanitized headers and a truncated response body.
    - Parses JSON or text responses based on `content-type`.
    - Normalizes error payloads into the shared `ApiError` type (`src/api/types.ts`).
    - Handles auth-related errors (`login_required`, `consent_required`, `interaction_required`, `401/403`) by calling `tokenProvider.login()` and re-throwing the error.
    - Implements a limited retry strategy for network errors (with exponential-style delays defined in `RETRY_DELAYS_MS`).

- `debugStore` (`src/api/debugStore.ts`)
  - Minimal global store for request/response debug data (`DebugState`).
  - Exposes `getDebugState`, `setDebugState`, and `subscribeDebugState` for components like `DebugPanel`.

- Shared types (`src/api/types.ts`)
  - `ApiError`: common error shape used across the UI.
  - `DebugRequest`, `DebugResponse`, `DebugState`: structures for capturing and displaying HTTP debug info.

## Testing setup

- The test runner is Vitest, configured in `vite.config.ts` with:
  - `environment: "jsdom"`.
  - `setupFiles: "src/test/setup.ts"`.
- `src/test/setup.ts` imports `@testing-library/jest-dom` to extend Jest/Vitest matchers.
- Example React test: `src/__tests__/Home.test.tsx` renders `<App />` and asserts the presence of the Login button, using React Testing Library.

When adding new tests, prefer placing them under `src/__tests__/` or alongside components and rely on `npm run test` / `npm run test:watch` for execution.
