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

## Driving real interactions (menus, dialogs, dropdowns)

A static `--screenshot` only captures one load — it can't click anything, and **Radix
triggers listen for real `pointerdown` events**, so a synthetic `element.click()` (e.g.
via `--dump-dom` + injected JS) will NOT open a Radix `DropdownMenu`/`Dialog`. To
actually drive clicks, use Chrome's DevTools Protocol (CDP) directly — no
Playwright/Puppeteer dependency needed, just Node's built-in `fetch` + `WebSocket`
(stable since Node 22):

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --remote-debugging-port=9222 \
  --window-size=1280,900 about:blank &
sleep 2
curl -s http://localhost:9222/json/version   # confirms CDP is up
```

Then a small Node script:
1. `PUT http://localhost:9222/json/new?<url>` → returns `{ webSocketDebuggerUrl }`.
2. `new WebSocket(webSocketDebuggerUrl)`, send JSON-RPC messages
   `{ id, method, params }`; each response arrives as a message with a matching `id`.
3. `Page.enable`, `Runtime.enable`, then per step:
   - Find an element's center via `Runtime.evaluate` running
     `el.getBoundingClientRect()`.
   - Click it for real with `Input.dispatchMouseEvent` (`mousePressed` then
     `mouseReleased` at those coordinates) — this fires genuine pointer events Radix
     listens for, unlike `.click()`.
   - `Page.captureScreenshot` (`format: 'png'`, base64) → write to a file, then `Read`
     it.
4. Close the tab/socket when done.

This is the only way seen so far to verify a Radix-based interactive element (dropdown
opens, checkbox toggles without closing the menu, dialog opens with the right
interpolated content, Cancel safely closes without side effects) rather than just its
closed/idle appearance.

## Simulating loading/empty/error without touching real data

To see a state that depends on the API behaving a particular way (empty list, a 500, a
hang), don't delete/fake real seed data — inject a `fetch` override via CDP's
`Page.addScriptToEvaluateOnNewDocument` **before** navigating, so it's in place before
the app's first fetch:

```js
await send(ws, 'Page.addScriptToEvaluateOnNewDocument', {
  source: `
    window.fetch = new Proxy(window.fetch, {
      apply(target, thisArg, args) {
        const url = String(args[0]);
        if (url.includes('/api/estimates')) {
          return Promise.resolve(new Response('[]', { status: 200 })); // empty
          // or: Response(JSON.stringify({error:'...'}), {status:500})  // error
          // or: new Promise(() => {})                                  // hangs (loading)
        }
        return Reflect.apply(target, thisArg, args);
      },
    });
  `,
});
await send(ws, 'Page.navigate', { url: 'http://localhost:5173/' });
```
Nothing about the real backend or seed data is touched; the override lives only in that
one CDP-controlled tab.
