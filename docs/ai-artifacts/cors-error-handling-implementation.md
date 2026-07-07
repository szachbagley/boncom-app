# CORS + Centralized Error Handling — Implementation Plan

**Feature:** Cross-cutting hardening before the frontend talks to the API — lock CORS to a
configured origin (env var, no hardcoded URL) and close two real gaps in the centralized
error handler so nothing leaks internals and bad input never yields a 500.
**Branch:** `feat/cors-error-handling`
**Touches:** `server/src/config.ts`, `server/src/app.ts`, `server/src/routes/errorHandler.ts`,
`server/.env.example`, and new tests. No changes to services, data layer, or calc module.

Written for straightforward execution — every change, value, and test is specified below.

---

## Starting point (already in place from the routes feature)

The centralized `errorHandler` already exists and maps: `ZodError` → 400 (field-level
`details`), `ValidationError` → 400, `NotFoundError` → 404, everything else → a logged-only
500 `{ error: 'Internal Server Error' }` with no leaked detail. **This is not rebuilt.** The
work here is: (a) CORS lockdown, and (b) two additional error branches that are currently
gaps.

CORS today is `app.use(cors())` — wide open (reflects any origin). That must become an
env-configured allowlist.

---

## Design decisions (baked in; flagged for visibility)

1. **CORS origin(s) from an env var, never hardcoded** (CLAUDE.md: "API base URLs … an env
   var, not a literal"). New var **`CORS_ALLOWED_ORIGINS`** — a **comma-separated list**
   (not a single value) so production can allow the primary Vercel URL *and* Vercel preview
   deployments if desired. `config.ts` parses it into `string[]` (trim each, drop empties).
   *Decision to log: list, not single value, for Vercel previews.*

2. **Local-dev default.** When `CORS_ALLOWED_ORIGINS` is unset, default to
   `['http://localhost:5173']` (the Vite dev origin — matches the client's dev server).
   Production (Railway) sets the var explicitly to the Vercel origin. Same pattern as
   `PORT`/`DATABASE_URL`: env-driven with a sensible local fallback. *Decision to log.*

3. **Use the `cors` package's array form** — `cors({ origin: config.corsAllowedOrigins })`.
   Behavior: for a browser request whose `Origin` is in the list, the package echoes it in
   `Access-Control-Allow-Origin`; for a disallowed origin it simply **omits** the header (no
   error thrown — the browser blocks it). Requests with **no `Origin`** header (curl,
   server-to-server, health probes) proceed normally. This is the standard, correct
   behavior and needs no custom origin function. The package also handles the `OPTIONS`
   preflight automatically. No `credentials` (we use no cookies/auth).

4. **Gap 1 — malformed JSON body → 400, not 500.** `express.json()` throws a `SyntaxError`
   (with `type: 'entity.parse.failed'` and `statusCode: 400`) when a request body isn't
   valid JSON. Today that falls through to the 500 branch — wrong: a bad body is *client*
   error, and CLAUDE.md says never crash/500 on bad input. Add a branch that detects a
   body-parser error (`err instanceof SyntaxError && 'status'/'statusCode' === 400 && 'body'
   in err`) and returns **400 `{ error: 'Malformed JSON in request body' }`**. Generic, no
   internal detail leaked.

5. **Gap 2 — unknown route → JSON 404, not Express's default HTML.** An unmatched path
   currently returns Express's built-in HTML 404 ("Cannot GET /foo"), which is
   inconsistent with the JSON API and mildly leaks framework detail. Add a catch-all
   (registered after the routers, before the error handler) that responds **404
   `{ error: 'Not found' }`**. *Decision to log.*

6. **No new dependencies** (`cors` already installed).

---

## Exact changes

### `server/src/config.ts`
Add to the exported `config` object:

```ts
  /**
   * Browser origins allowed by CORS, from CORS_ALLOWED_ORIGINS (comma-separated).
   * Production (Railway) sets this to the Vercel origin(s); local dev falls back to
   * the Vite dev server. Never hardcode the deployed URL.
   */
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0),
```

### `server/src/app.ts`
- Change `app.use(cors());` → `app.use(cors({ origin: config.corsAllowedOrigins }));`
  (import `config`).
- After the two `app.use('/api/...', ...)` router mounts and BEFORE `app.use(errorHandler)`,
  add a catch-all 404:
  ```ts
  // Unmatched routes -> JSON 404 (consistent with the API; no framework HTML).
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  ```

### `server/src/routes/errorHandler.ts`
Add, as the FIRST branch (before the ZodError check), a body-parser SyntaxError guard:

```ts
  // Malformed JSON body (thrown by express.json()). A client error, not a 500.
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Malformed JSON in request body' });
    return;
  }
```
(The `'body' in err` check distinguishes the body-parser SyntaxError from any unrelated
SyntaxError; body-parser attaches the raw `body` to the error.)

### `server/.env.example`
Add:
```
# Comma-separated list of browser origins allowed by CORS. Local dev defaults to the
# Vite dev server if unset. Production (Railway) sets this to the deployed Vercel
# origin(s), e.g. https://boncom-app.vercel.app (add preview URLs comma-separated if needed).
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

## Testing

### `server/src/routes/errorHandler.test.ts` (NEW — unit, direct calls, no DB, no HTTP)
Call `errorHandler(err, req, res, next)` with a minimal mock `res`
(`{ status: vi.fn().returnsThis(), json: vi.fn() }`) and assert status + payload for every
branch:
- `ZodError` (build one via `z.string().safeParse(123)`'s `.error`) → 400, body has
  `error: 'Validation failed'` and `details`.
- `ValidationError` → 400, body `{ error: <message> }`.
- `NotFoundError` → 404, body `{ error: <message> }`.
- body-parser `SyntaxError` (a `new SyntaxError('...'); (err as any).body = '...'`) → 400,
  `{ error: 'Malformed JSON in request body' }`.
- a generic `new Error('secret db detail')` → 500, body exactly
  `{ error: 'Internal Server Error' }` — **assert the leaked message is NOT present**
  (the no-leak guarantee, tested explicitly).

### `server/src/app.test.ts` (NEW — supertest against `createApp()`, no service mock needed)
These paths don't need the DB or services (they short-circuit before any handler that would):
- **CORS allowed origin:** `GET /health` with `Origin: http://localhost:5173` →
  `access-control-allow-origin: http://localhost:5173` present.
- **CORS disallowed origin:** `GET /health` with `Origin: https://evil.example.com` →
  the `access-control-allow-origin` header is **absent** (not echoed).
- **CORS preflight:** `OPTIONS /api/estimates` with the allowed origin + a
  `Access-Control-Request-Method: POST` → 204/opts-handled with the allow-origin header.
- **Malformed JSON:** `POST /api/clients` with a raw body of `'{ bad json'` and
  `Content-Type: application/json` → 400, `{ error: 'Malformed JSON in request body' }`.
- **Unknown route:** `GET /api/nope` → 404, `{ error: 'Not found' }`.

(`/health` reads the DB but `getHealthStatus` catches failures and still returns 200, so
these HTTP-layer tests pass with or without Docker running.)

Both files are `*.test.ts` (run under `npm test`, fast, no DB). No `.db.test.ts`.

### Manual smoke (final step, real server)
Build + run; curl three cases and eyeball headers:
- `curl -H 'Origin: http://localhost:5173' -i /health` → shows `access-control-allow-origin`.
- `curl -H 'Origin: https://evil.example.com' -i /health` → no allow-origin header.
- `curl -X POST /api/clients -H 'Content-Type: application/json' -d '{bad'` → 400 JSON.

---

## Phases & steps (one step at a time; verify, then STOP)

### Phase 1 — Implementation
1. Edit `config.ts` (add `corsAllowedOrigins`), `app.ts` (env-driven CORS + JSON 404
   catch-all), `errorHandler.ts` (malformed-JSON branch), and `.env.example`. `tsc --noEmit`
   clean. *Stop.*

### Phase 2 — Tests
2. Add `errorHandler.test.ts` and `app.test.ts`. `npm test` green (all prior + new);
   `tsc --noEmit` clean. *Stop.*

### Phase 3 — Smoke, docs & land
3. Manual curl smoke (above). Add a `TESTING.md` "CORS & error handling" section; append
   decisions to `docs/ai-artifacts/DECISIONS.md`. Commit, push, open PR
   `feat/cors-error-handling` → `main`; **you merge manually**. Reminder: set
   `CORS_ALLOWED_ORIGINS` in Railway to the Vercel origin as a separate manual step (like
   the DB URL) — this PR does not touch Railway.

---

## Explicitly NOT in this feature
Auth, rate-limiting, request logging/observability, Helmet/security headers beyond CORS,
per-route CORS overrides, and any Railway/Vercel env configuration (manual, yours).
