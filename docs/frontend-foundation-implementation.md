# Frontend Foundation — Implementation Plan

**Feature:** Establish the frontend's foundation before any screen content: Tailwind
configured from the Claude Design bundle's tokens, the chosen component-library tooling,
a typed `api/` layer mirroring `server/docs/API-REFERENCE.md` exactly, shared money/percent
formatters, and the app shell + routing.
**Branch:** `feat/frontend-foundation`
**Touches:** `client/` only. No screen content (Dashboard cards, estimate forms, dialogs)
is built here — every view is a stub. No backend changes.

Written for straightforward execution — every file's exact contents, every dependency and
its justification, and every test case is specified below.

---

## Scope confirmed with the user

**Component-library approach = tooling only, zero component code.** Radix primitives are
installed and the shadcn-style ownership convention (own the source, style with Tailwind)
is documented in `DECISIONS.md`, but no actual component (not even Button) is built in this
feature. The first real component gets built by the first screen feature that needs it —
building one now without a consuming screen risks over/under-fitting its API to guessed
usage.

---

## Design decisions (baked in; flagged for visibility)

1. **Tailwind CSS v4** (`tailwindcss@4.3.2` + `@tailwindcss/vite@4.3.2`, verified current
   versions) via the official Vite plugin — CSS-native theming through an `@theme` block,
   no `tailwind.config.js` needed. Explicitly requested by the user's own instructions;
   justified further by how directly v4's CSS-custom-property theming maps onto the
   bundle's own token files (`colors.css`/`typography.css`/`spacing.css` are themselves
   CSS custom properties).

2. **Radius and shadow are zeroed at the token level, not by convention.** Every
   `--radius-*` and `--shadow-*` key Tailwind's default theme defines is overridden to `0`/
   `none` in our `@theme` block (exact key names confirmed by extracting the installed
   `tailwindcss` package's `theme.css` — see the token file below). This means `rounded-lg`
   or `shadow-md` used anywhere, even by accident, silently renders as sharp/flat — the
   brand rule ("radius 0 everywhere," "no shadows anywhere") is enforced structurally, not
   by developer discipline. *Decision to log.*

3. **Two-tier token structure, mirroring the bundle exactly:** raw brand palette
   (`--color-navy`, `--color-cyan`, etc.) lives in Tailwind's `@theme` block so it generates
   real utilities (`bg-navy`, `text-cyan`, …). Semantic aliases (`--surface-page`,
   `--text-secondary`, `--border-hairline`, `--action-primary`, …) are plain `:root` custom
   properties, NOT inside `@theme` — Tailwind v4 only auto-generates utilities for
   recognized namespaces (`--color-*`, `--font-*`, `--text-*`, `--spacing-*`, `--radius-*`,
   `--shadow-*`, …), so a `--surface-*`/`--text-secondary` var wouldn't produce a utility
   anyway. Semantic aliases are consumed via Tailwind's arbitrary-value syntax
   (`border-[var(--border-hairline)]`) or in hand-written base CSS, exactly how the bundle
   itself uses them. *Decision to log.*

4. **Font weight needs no custom token.** Tailwind's built-in weight scale
   (`font-light`=300, `font-normal`=400, `font-semibold`=600, `font-bold`=700) already
   matches the bundle's four weights exactly — no override needed.

5. **API layer types are hand-written, not generated/shared.** `client/src/api/types.ts`
   mirrors `server/docs/API-REFERENCE.md` by hand. No monorepo/shared-types package exists
   or is introduced; the API reference doc is the sync point between the two hand-written
   copies (server's Zod schemas/service types, client's TS interfaces). Acceptable at this
   app's size; a shared-types package would be a future consideration if drift becomes a
   real problem. *Decision to log.*

6. **One request helper, one error class, no per-function try/catch.**
   `client/src/api/http.ts` exports `request<T>()` (thin `fetch` wrapper) and `ApiError`.
   Every one of the 8 functions is a one-line call into `request()`. **Every non-2xx
   response throws `ApiError`, including 404** — no function returns `null`. This keeps a
   single, consistent error path; a future hooks-layer feature decides how to interpret a
   given status code (e.g., 404 → "not found" UI). *Decision to log.*

7. **No data-fetching/query library (TanStack Query, SWR) in this feature.** The user's own
   scope names "the api layer" as typed fetch functions — caching/refetch strategy is a
   hooks-layer concern for the next feature, not decided here.

8. **Formatters live in a new `client/src/utils/` folder** (not `views/`/`components/`/
   `hooks/`/`api/`) — a pure, dependency-free module, analogous to how the backend's
   calculation module lives outside its own `routes/services/data` layering. *Decision to
   log: a 5th top-level folder, deliberately minimal (one file + its test).*

9. **Formatters built TDD-first** (failing tests, then implement), matching the project's
   established convention for pure logic modules (the backend calc module, `estimateRules`).

10. **`centsToDisplay`/`basisPointsToPercent` use `Intl.NumberFormat`, not manual string
    math.** Dividing cents by 100 here is a terminal, rounded-for-display conversion (not
    arithmetic that could accumulate error across operations) — exactly what the
    `estimate-calculations` skill carves out as the frontend's job ("formatting … is a
    PRESENTATION concern … NOT in \[the calc] module"). `Intl.NumberFormat` handles
    currency/percent rounding and thousands-separators correctly and is the idiomatic
    choice over hand-rolled `toFixed`/string splitting, which has known float-precision
    footguns for exactly this kind of formatting.

11. **Radix primitives installed now, justified, but unused until a screen needs them.**
    `@radix-ui/react-dialog` (Send/Delete/Add-Client confirmations), `@radix-ui/react-select`
    (client dropdown), `@radix-ui/react-dropdown-menu` (the "…" card menu) — the three
    interactive components the view inventory actually names. Justification: these need
    real accessible behavior (keyboard nav, focus trap, ARIA) that would be substantial and
    error-prone to hand-roll; Radix is the de facto standard for exactly this, and the user's
    own instructions name it explicitly. **Numeric inputs need no Radix primitive** — Radix
    has no "numeric input" component; that's a plain styled `<input>`, deferred to the
    screen that needs it (no primitive to install for it). No `clsx`/`tailwind-merge`/
    `class-variance-authority` yet — nothing to conditionally style until a real component
    exists.

12. **React Router v7** (`react-router-dom@7.18.1`, verified current) for the three routes.
    Justified as the standard SPA routing library; no lighter alternative is warranted for
    a real multi-screen app. Plain `<BrowserRouter>`/`<Routes>`/`<Route>` (not the newer data
    router APIs) — simplest fit for 4 static routes with no loaders/actions needed yet.

13. **`EstimateFormView` is ONE component for both create and edit**, matching
    `VIEW-INVENTORY.md`'s treatment of 3a/3b/3c as one screen with different initial states
    — mounted at both `/estimates/new` and `/estimates/:id/edit`, differentiated by the
    presence of the `:id` route param. Still just a stub in this feature.

14. **`App.tsx`'s health-check placeholder is retired**, not extended. It was explicit
    scaffolding ("this exists only to prove the cross-origin frontend→backend call works")
    from before any real backend existed; that connectivity has since been proven
    extensively via the backend's own test suites and manual smoke tests. `App.tsx` becomes
    the real shell (header + routed outlet). *Decision to log.*

15. **Client-side Vitest, mirroring the server's setup**, added specifically to fulfill
    "Unit-test these \[formatters]." No `@testing-library/react` yet — no components are
    rendered/tested in this feature; that arrives with the first screen-testing feature.

16. **Verification approach for each layer, stated honestly up front:**
    - Tokens (Phase 1): inspect the actual built CSS output for the token values and the
      zeroed radius/shadow keys — not just "it compiled."
    - API layer (Phase 2): `tsc --noEmit` plus a careful line-by-line cross-check against
      `API-REFERENCE.md`. **Not** a live call against the running backend — the layer isn't
      invoked by any UI yet in this feature (no hooks/screens), so genuine runtime
      verification happens naturally in the next feature when real code calls it. Said
      plainly rather than fabricating a check that can't meaningfully happen yet.
    - Formatters (Phase 3): the unit tests themselves, TDD.
    - Shell/routing (Phase 5): driven for real in a browser (via the `run`/`verify` skill or
      a manual check) to confirm each route actually renders a distinct stub — this is the
      one place a "did it compile" check would be insufficient.

---

## Files

```
client/
├── package.json                    # EDIT — + tailwindcss, @tailwindcss/vite, react-router-dom,
│                                    #   3 Radix packages, vitest (dev)
├── vite.config.ts                  # EDIT — add @tailwindcss/vite plugin
├── vitest.config.ts                # NEW — client unit-test config
├── src/
│   ├── main.tsx                    # EDIT — wrap in BrowserRouter; import the two CSS files
│   ├── App.tsx                     # REWRITE — becomes the shell (header + <Routes>)
│   ├── config.ts                   # unchanged — reused by api/http.ts
│   ├── styles/
│   │   ├── fonts.css               # NEW — Open Sans Google Fonts import
│   │   ├── theme.css               # NEW — Tailwind entry + @theme (palette/type/spacing/radius-0/shadow-none)
│   │   └── base.css                # NEW — semantic aliases (:root) + element defaults
│   ├── api/
│   │   ├── types.ts                # NEW — all shapes from API-REFERENCE.md
│   │   ├── http.ts                 # NEW — ApiError + request<T>()
│   │   ├── clients.ts              # NEW — getClients, createClient
│   │   └── estimates.ts            # NEW — getEstimates, getEstimate, createEstimate,
│   │                                #   updateEstimate, patchEstimateStatus, deleteEstimate
│   ├── utils/
│   │   ├── format.ts               # NEW — centsToDisplay, basisPointsToPercent
│   │   └── format.test.ts          # NEW — unit tests (written first)
│   └── views/
│       ├── DashboardView.tsx       # NEW — stub
│       ├── EstimateDetailView.tsx  # NEW — stub
│       ├── EstimateFormView.tsx    # NEW — stub (handles both create and edit)
│       └── NotFoundView.tsx        # NEW — stub (catch-all route)
docs/
├── frontend-foundation-implementation.md   # THIS plan
└── ai-artifacts/DECISIONS.md                # append decisions above
TESTING.md                                    # append a "Frontend foundation" section
```

---

## Exact contents

### `client/src/styles/fonts.css`
```css
/* Open Sans — the single brand typeface (weights 300 / 400 / 600 / 700). */
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap');
```

### `client/src/styles/theme.css`
```css
@import "tailwindcss";
@import "./fonts.css";

@theme {
  /* Brand palette — raw values; generates bg-navy, text-cyan, etc. */
  --color-white: #FFFFFF;
  --color-ink: #292A2C;
  --color-navy: #002042;
  --color-cyan: #65C6D9;
  --color-orange: #FC4F2C;
  --color-mute: #BFCED9;
  --color-neutral-50: #F6F8FA;
  --color-neutral-100: #EDF1F4;
  --color-neutral-200: #DDE5EC;
  --color-neutral-300: #C7D3DD;
  --color-neutral-500: #6B7A87;
  --color-success: #3E8E6E;
  --color-success-bg: #E7F1ED;
  --color-danger: #C24634;
  --color-danger-bg: #F7E7E3;
  --color-warning: #FC4F2C;
  --color-warning-bg: #FDE8E3;

  /* Type — one family; hierarchy by weight/size only (weight scale = Tailwind's default) */
  --font-sans: 'Open Sans', Arial, Helvetica, sans-serif;
  --text-hero: 72px;
  --text-display: 48px;
  --text-h1: 36px;
  --text-h2: 28px;
  --text-h3: 22px;
  --text-subhead: 18px;
  --text-body: 18px;
  --text-body-sm: 15px;
  --text-label: 14px;
  --text-nav: 13px;
  --text-micro: 12px;

  /* Spacing — 4px base scale */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 24px;
  --spacing-6: 32px;
  --spacing-7: 48px;
  --spacing-8: 64px;
  --spacing-9: 96px;
  --spacing-10: 128px;

  /* Shape — sharp corners everywhere. Every radius utility Tailwind ships is zeroed,
     so rounded-* can never accidentally produce a curved corner. */
  --radius-xs: 0px;
  --radius-sm: 0px;
  --radius-md: 0px;
  --radius-lg: 0px;
  --radius-xl: 0px;
  --radius-2xl: 0px;
  --radius-3xl: 0px;
  --radius-4xl: 0px;
  --radius: 0px;

  /* Depth — no shadows anywhere. Every shadow utility Tailwind ships is zeroed. */
  --shadow-2xs: none;
  --shadow-xs: none;
  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;
  --shadow-xl: none;
  --shadow-2xl: none;
  --shadow: none;
  --shadow-inner: none;
}
```

### `client/src/styles/base.css`
```css
/* Semantic aliases — reference these (not raw palette vars) in hand-written CSS/components.
   Not inside @theme: these namespaces aren't Tailwind-recognized, so they wouldn't generate
   utilities anyway; used via arbitrary-value classes, e.g. border-[var(--border-hairline)]. */
:root {
  /* Surfaces */
  --surface-page: var(--color-white);
  --surface-card: var(--color-white);
  --surface-subtle: var(--color-neutral-50);
  --surface-hover: var(--color-neutral-100);

  /* Text */
  --text-primary: var(--color-ink);
  --text-heading: var(--color-navy);
  --text-secondary: var(--color-neutral-500);
  --text-muted: var(--color-mute);
  --text-on-dark: var(--color-white);
  --text-link: var(--color-cyan);
  --text-link-hover: var(--color-navy);

  /* Lines */
  --border-hairline: var(--color-neutral-200);
  --border-strong: var(--color-neutral-300);
  --border-focus: var(--color-cyan);

  /* Interaction */
  --action-primary: var(--color-navy);
  --action-primary-hover: #001630;
  --action-accent: var(--color-cyan);
  --action-accent-hover: #4FB4C8;
  --action-emphasis: var(--color-orange);

  /* Letter spacing / line height — not Tailwind namespaces; used via arbitrary values */
  --ls-hero: -1.4px;
  --ls-display: -1px;
  --ls-heading: -0.4px;
  --ls-label: 5.6px;
  --ls-nav: 2.3px;
  --lh-tight: 1.1;
  --lh-heading: 1.25;
  --lh-body: 1.67;

  /* Motion — calm, no bounce */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --dur-fast: 120ms;
  --dur-base: 200ms;
}

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--surface-page);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-body);
  line-height: var(--lh-body);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

h1, h2, h3, h4, h5, h6 {
  color: var(--text-heading);
  margin: 0 0 var(--spacing-4);
  line-height: var(--lh-heading);
}
h1 { font-size: var(--text-h1); font-weight: 300; letter-spacing: var(--ls-display); }
h2 { font-size: var(--text-h2); font-weight: 300; letter-spacing: var(--ls-heading); }
h3 { font-size: var(--text-h3); font-weight: 600; }

p { margin: 0 0 var(--spacing-4); }
p:last-child { margin-bottom: 0; }

a {
  color: var(--text-link);
  text-decoration: none;
  transition: color var(--dur-fast) var(--ease-standard);
}
a:hover { color: var(--text-link-hover); }

strong, b { font-weight: 700; }

hr {
  border: 0;
  border-top: 1px solid var(--border-hairline);
  margin: var(--spacing-6) 0;
}

::selection {
  background: var(--color-cyan);
  color: var(--color-navy);
}
```

### `client/vite.config.ts`
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### `client/src/api/types.ts`
```ts
/** Types mirroring server/docs/API-REFERENCE.md exactly. */

export type EstimateStatus = 'draft' | 'sent';

export type Discount =
  | { type: 'percentage'; valueBasisPoints: number }
  | { type: 'fixed'; amountCents: number };

export interface Client {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  id: number;
  estimateId: number;
  description: string;
  quantity: number;
  rateCents: number;
}

export interface EstimateTotals {
  lineTotalsCents: number[];
  subtotalCents: number;
  discountAmountCents: number;
  discountedSubtotalCents: number;
  taxAmountCents: number;
  grandTotalCents: number;
}

export interface EstimateSummary {
  id: number;
  clientId: number;
  projectName: string;
  status: EstimateStatus;
  taxRateBasisPoints: number;
  discount?: Discount;
  createdAt: string;
  updatedAt: string;
}

export interface EstimateDetail extends EstimateSummary {
  lineItems: LineItem[];
  totals: EstimateTotals;
}

/** Request-side line item shape — no id/estimateId; those don't exist until created. */
export interface LineItemInput {
  description: string;
  quantity: number;
  rateCents: number;
}

export interface CreateClientInput {
  name: string;
}

export interface CreateEstimateInput {
  clientId: number;
  projectName: string;
  status?: EstimateStatus;
  taxRateBasisPoints?: number;
  discount?: Discount;
  lineItems?: LineItemInput[];
}

/** PUT is a full replace: every field but discount is required, matching the API. */
export interface UpdateEstimateInput {
  projectName: string;
  status: EstimateStatus;
  taxRateBasisPoints: number;
  discount?: Discount;
  lineItems: LineItemInput[];
}

export interface EstimateListFilter {
  clientId?: number;
  status?: EstimateStatus;
}
```

### `client/src/api/http.ts`
```ts
import { API_BASE_URL } from '../config.js';

/** An API error response: { error, details? } per server/docs/API-REFERENCE.md. */
export class ApiError extends Error {
  status: number;
  details?: Record<string, string[]>;

  constructor(status: number, message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Shared fetch wrapper for every api/ function. Always throws ApiError (never returns
 * null) for a non-2xx response — including 404 — so callers have one consistent error
 * path; the hooks layer decides how to present a given status. Handles 204 No Content
 * (DELETE) by resolving with no value.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    const errorBody = body as { error?: string; details?: Record<string, string[]> } | undefined;
    throw new ApiError(
      response.status,
      errorBody?.error ?? `Request failed with status ${response.status}`,
      errorBody?.details,
    );
  }

  return body as T;
}
```

### `client/src/api/clients.ts`
```ts
import { request } from './http.js';
import type { Client, CreateClientInput } from './types.js';

export async function getClients(): Promise<Client[]> {
  return request<Client[]>('/api/clients');
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  return request<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
```

### `client/src/api/estimates.ts`
```ts
import { request } from './http.js';
import type {
  CreateEstimateInput,
  EstimateDetail,
  EstimateListFilter,
  EstimateStatus,
  EstimateSummary,
  UpdateEstimateInput,
} from './types.js';

function buildQuery(filter?: EstimateListFilter): string {
  if (!filter) return '';
  const params = new URLSearchParams();
  if (filter.clientId !== undefined) params.set('clientId', String(filter.clientId));
  if (filter.status !== undefined) params.set('status', filter.status);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getEstimates(filter?: EstimateListFilter): Promise<EstimateSummary[]> {
  return request<EstimateSummary[]>(`/api/estimates${buildQuery(filter)}`);
}

export async function getEstimate(id: number): Promise<EstimateDetail> {
  return request<EstimateDetail>(`/api/estimates/${id}`);
}

export async function createEstimate(input: CreateEstimateInput): Promise<EstimateDetail> {
  return request<EstimateDetail>('/api/estimates', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateEstimate(
  id: number,
  input: UpdateEstimateInput,
): Promise<EstimateDetail> {
  return request<EstimateDetail>(`/api/estimates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function patchEstimateStatus(
  id: number,
  status: EstimateStatus,
): Promise<EstimateDetail> {
  return request<EstimateDetail>(`/api/estimates/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteEstimate(id: number): Promise<void> {
  return request<void>(`/api/estimates/${id}`, { method: 'DELETE' });
}
```

### `client/src/utils/format.test.ts` (written first)
```ts
import { describe, it, expect } from 'vitest';
import { centsToDisplay, basisPointsToPercent } from './format.js';

describe('centsToDisplay', () => {
  it('formats the canonical worked example ($59.65)', () => {
    expect(centsToDisplay(5965)).toBe('$59.65');
  });
  it('formats zero', () => {
    expect(centsToDisplay(0)).toBe('$0.00');
  });
  it('formats a single-digit-cents value with a leading zero', () => {
    expect(centsToDisplay(5)).toBe('$0.05');
  });
  it('formats a whole-dollar amount with .00', () => {
    expect(centsToDisplay(5000)).toBe('$50.00');
  });
  it('inserts a thousands separator for large amounts', () => {
    expect(centsToDisplay(100000)).toBe('$1,000.00');
  });
});

describe('basisPointsToPercent', () => {
  it('formats a value needing two decimal places', () => {
    expect(basisPointsToPercent(825)).toBe('8.25%');
  });
  it('formats a whole-percent value with no trailing decimal', () => {
    expect(basisPointsToPercent(1000)).toBe('10%');
  });
  it('formats zero', () => {
    expect(basisPointsToPercent(0)).toBe('0%');
  });
  it('formats a value needing one decimal place', () => {
    expect(basisPointsToPercent(50)).toBe('0.5%');
  });
});
```

### `client/src/utils/format.ts` (implemented after the tests are red)
```ts
/**
 * The ONLY place money/percent formatting happens on the frontend. The API speaks
 * integer cents and basis points; components must never do ad-hoc division — always
 * go through these functions. Dividing by 100 here is a terminal, rounded-for-display
 * conversion (not arithmetic that could accumulate error) — the estimate-calculations
 * skill carves this out as the frontend's job, not the calc module's.
 */

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Integer cents -> formatted dollar string, e.g. 5965 -> "$59.65". */
export function centsToDisplay(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/** Integer basis points -> formatted percent string, e.g. 825 -> "8.25%". */
export function basisPointsToPercent(basisPoints: number): string {
  return `${percentFormatter.format(basisPoints / 100)}%`;
}
```

### `client/vitest.config.ts`
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```
Add to `client/package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

### `client/src/main.tsx` (edit)
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './styles/theme.css';
import './styles/base.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

### `client/src/App.tsx` (rewrite — the shell)
```tsx
import { Route, Routes } from 'react-router-dom';
import { DashboardView } from './views/DashboardView';
import { EstimateDetailView } from './views/EstimateDetailView';
import { EstimateFormView } from './views/EstimateFormView';
import { NotFoundView } from './views/NotFoundView';

export function App() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[var(--border-hairline)] px-6 py-5">
        <h1 className="m-0 text-h2 font-light tracking-[var(--ls-heading)] text-navy">
          Boncom Estimates
        </h1>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/estimates/new" element={<EstimateFormView />} />
          <Route path="/estimates/:id" element={<EstimateDetailView />} />
          <Route path="/estimates/:id/edit" element={<EstimateFormView />} />
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </main>
    </div>
  );
}
```

### Stub views (each a trivial named-export placeholder)

`client/src/views/DashboardView.tsx`:
```tsx
export function DashboardView() {
  return (
    <div className="px-6 py-8">
      <p className="text-body-sm text-[var(--text-secondary)]">Dashboard — coming soon.</p>
    </div>
  );
}
```

`client/src/views/EstimateDetailView.tsx`:
```tsx
import { useParams } from 'react-router-dom';

export function EstimateDetailView() {
  const { id } = useParams();
  return (
    <div className="px-6 py-8">
      <p className="text-body-sm text-[var(--text-secondary)]">
        Estimate detail (id: {id}) — coming soon.
      </p>
    </div>
  );
}
```

`client/src/views/EstimateFormView.tsx`:
```tsx
import { useParams } from 'react-router-dom';

export function EstimateFormView() {
  const { id } = useParams();
  return (
    <div className="px-6 py-8">
      <p className="text-body-sm text-[var(--text-secondary)]">
        {id ? `Edit estimate ${id}` : 'Create estimate'} — coming soon.
      </p>
    </div>
  );
}
```

`client/src/views/NotFoundView.tsx`:
```tsx
export function NotFoundView() {
  return (
    <div className="px-6 py-8">
      <p className="text-body-sm text-[var(--text-secondary)]">Page not found.</p>
    </div>
  );
}
```

---

## Phases & steps (one step at a time; verify, then STOP)

### Phase 1 — Tailwind + design tokens
1. Install `tailwindcss@4.3.2` + `@tailwindcss/vite@4.3.2`; edit `vite.config.ts`; create
   `styles/fonts.css`, `styles/theme.css`, `styles/base.css` exactly as above; import
   `theme.css` + `base.css` in `main.tsx` (App.tsx not yet rewritten — leave the current
   placeholder content in place for this step so the build stays green). Run
   `npm run build`; inspect the built CSS in `dist/assets/*.css` for the token values
   (`#002042`, zeroed `--radius-*`/`--shadow-*` keys) actually present in the output.
   `tsc -b` clean. *Stop.*

### Phase 2 — API layer
2. `api/types.ts`. `tsc --noEmit` (or `tsc -b`) clean. *Stop.*
3. `api/http.ts`. Clean. *Stop.*
4. `api/clients.ts`, `api/estimates.ts`. Clean, plus a manual line-by-line cross-check of
   every function against `API-REFERENCE.md` (method, path, request shape, response
   shape). *Stop.*

### Phase 3 — Formatters (TDD)
5. Add `vitest` (dev dep) + `vitest.config.ts` + `test`/`test:watch` scripts. Write
   `utils/format.test.ts` with a throwing-stub `utils/format.ts` (matching the calc
   module's established red-first pattern); run `npm test` → confirm red for the right
   reason. *Stop for test review.*
6. Implement `utils/format.ts` to green, no test changes. `npm test` green. *Stop.*

### Phase 4 — Component-library tooling
7. Install `@radix-ui/react-dialog@1.1.19`, `@radix-ui/react-select@2.3.3`,
   `@radix-ui/react-dropdown-menu@2.1.20`. No component code. `tsc -b` clean (dependencies
   present but unused is fine — nothing imports them yet). *Stop.*

### Phase 5 — App shell + routing
8. Install `react-router-dom@7.18.1`. Add the four stub views. Rewrite `App.tsx` as the
   shell; wrap `main.tsx` in `BrowserRouter`. Verify for real: run the dev server and drive
   it in an actual browser (via the `run`/`verify` skill, or a manual check if neither
   applies) to confirm all five routes (`/`, `/estimates/new`, `/estimates/1`,
   `/estimates/1/edit`, an unmatched path) each render their distinct stub text, and that
   the header/tokens render correctly (navy heading, hairline border, no rounded corners).
   `tsc -b` clean. *Stop.*

### Phase 6 — Docs & land
9. Add the `TESTING.md` "Frontend foundation" section (what's covered, known limitation:
   api layer isn't runtime-verified until the next feature calls it). Append the decisions
   above to `docs/ai-artifacts/DECISIONS.md`. Commit, push, open PR
   `feat/frontend-foundation` → `main`; **you merge manually**.

---

## Explicitly NOT in this feature
Any real screen content (Dashboard cards, estimate read/edit forms, dialogs), the
`hooks/` layer, any owned component code (Button, Dialog wrapper, etc.), a data-fetching/
caching library, `clsx`/`tailwind-merge`, and any Railway/Vercel configuration.
