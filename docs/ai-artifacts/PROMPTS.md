In this repository, we will build a web app for managing client estimates at Boncom, a creative advertising agency. The app will include an Express backend (TypeScript and MySQL, deployed with Railway) in the server/ directory and a React frontend (TypeScript, deployed with Vercel) in the client/ directory. Review the following files to orient yourself to the project: docs/PROJECT-BRIEF.md, CLAUDE.md, .claude/skills/estimate-calculations/SKILL.md. Summarize your understanding of the situation, desired outcomes, and conventions to follow.

Set up a minimal Express health-check server in server/ — just enough to run locally and deploy to Railway. No features, no route/service/data layering yet; that comes later.
- TypeScript, Express, with cors and express.json() middleware.
- One endpoint: GET /health → returns JSON { status: "ok", timestamp: <ISO string> }.
- Listen on process.env.PORT with a local fallback (Railway injects PORT).
- Use tsx for dev; include scripts: dev (tsx watch), build (tsc), start (node dist).
- Strict tsconfig, src/ → dist/ output.
- Stop after it runs locally; confirm the curl to /health works and report back.
Follow CLAUDE.md conventions (named exports, env vars not literals), but you can bypass the normal development workflow. This is foundational setup on main, so no plan document or feature branch needed.

Set up a minimal Vite + React + TypeScript app in client/ — just enough to run locally
and deploy to Vercel, and to verify it can reach the backend. No real UI, no component
library, no routing, no api/hooks layering yet; that comes later.
- Vite + React + TypeScript (a clean scaffold).
- Read the backend base URL from an env var (Vite style, e.g. import.meta.env.VITE_API_BASE_URL); the backend server
  is deployed at boncom-app-production.up.railway.app;
  do NOT hardcode the URL. Include a .env.example documenting the var; local fallback to
  http://localhost:3001.
- Single page: on load, fetch GET {base}/health and render the result — show the returned
  status/timestamp on success, and a visible error message on failure. This exists only to
  prove the cross-origin frontend→backend call works.
- Include scripts: dev, build, preview.
- Stop after it runs locally; confirm npm run dev serves the page and the /health fetch
  displays (against the local backend), then report back.
Follow CLAUDE.md conventions (named exports, env vars not literals), but you can bypass the normal development workflow. This is foundational setup on main, so no plan document or feature branch needed.