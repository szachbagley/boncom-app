---
name: verify
description: Verify a client/ frontend change by driving it in a real browser (screenshots), not just typecheck/tests. Use for any change to client/src/ (routes, views, components, styles).
---

# Verifying the client (Boncom Estimates frontend)

The client is a Vite + React SPA. There is no Playwright/Puppeteer dependency in this
project (not justified for a small app) — use the **system Chrome's built-in headless
screenshot mode** instead. No new dependency, no setup.

## Launch

```bash
cd client
nohup npm run dev > /tmp/vite-dev.log 2>&1 &
# wait for it:
for i in $(seq 1 30); do curl -s http://localhost:5173/ >/dev/null 2>&1 && break; sleep 0.3; done
```
Vite serves on `http://localhost:5173/` by default. Dev mode's SPA fallback correctly
serves `index.html` for any nested path (e.g. `/estimates/1/edit`), so React Router's
client-side routes are directly reachable by URL — no need to click through from `/`.

## Drive it — screenshot a route

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --screenshot="/tmp/shots/<name>.png" \
  --window-size=1280,800 --virtual-time-budget=3000 "http://localhost:5173/<route>"
```
Then `Read` the resulting PNG to see it. `--virtual-time-budget=3000` gives React/fonts
time to render before the screenshot is taken.

## Check console/network for errors

```bash
"$CHROME" --headless=new --disable-gpu --virtual-time-budget=3000 \
  --enable-logging=stderr --v=1 --dump-dom "http://localhost:5173/<route>" 2>&1 \
  | grep -iE "error|warn"
```
Ignore Chrome's own `Histogram: ...` telemetry lines (noise, not app errors). Grep for
`fonts.googleapis|fonts.gstatic` in the same output to confirm the Open Sans webfont
request actually fires (the brand's font is loaded via Google Fonts CDN, not bundled).

## Routes worth checking (as of the frontend-foundation feature)

- `/` — Dashboard
- `/estimates/new` — create form
- `/estimates/:id` — read-only detail
- `/estimates/:id/edit` — edit form (same component as create, differentiated by `:id`)
- any unmatched path — should show the app's own 404 stub, not Vite/React's default error

## Clean up

```bash
lsof -i :5173 | grep LISTEN   # find the node pid
kill -9 <pid>
pkill -f "Google Chrome.*headless"  # in case a headless instance lingers
```

## Gotchas

- The dev server's stdout `nohup`'d to a background job doesn't always die with a plain
  `kill` on the shell's reported PID — Vite sometimes forks; double-check
  `lsof -i :5173` after killing and kill again if still listening.
- Screenshots only show what rendered — they won't catch a component that renders fine
  but calls the wrong data. Pair with a DOM/text check (`grep` the `--dump-dom` output)
  when verifying actual content, not just layout/tokens.
