# Estimate Calculation Module — Implementation Plan

**Feature:** The pure estimate calculation module + Vitest test infrastructure.
**Branch:** `feat/estimate-calculations`
**Source of truth:** the `estimate-calculations` skill (rules, pipeline, edge cases,
worked example) and `CLAUDE.md` (money invariants, layering, testing policy).

This is the **highest-value TDD target** in the app: a wrong total is a failed product.
Tests are written and reviewed **before** the implementation.

---

## Design decisions (please confirm)

1. **Dependency: Vitest** (dev). *Justification (CLAUDE.md):* the standard fast test runner
   for TS/ESM projects — native ESM + TypeScript via esbuild (matches our `tsx`/ESM
   backend), Jest-compatible API, and it's already the natural fit since the client is
   Vite. This is the expected test tool, not a random utility. Also adds it as the schema
   feature's deferred "TDD comes with the calc module" test surface.

2. **Module location: `server/src/calculations/estimate.ts`** — a dedicated, pure module
   (no I/O, no DB), layer-independent (not under `services/`/`data/`, which do
   orchestration/I/O). Colocated test `server/src/calculations/estimate.test.ts`. One file,
   multiple **named exports** (the small pure pieces + the top-level `calculateEstimate`),
   per the skill's "small pure functions the module composes." *Decision to log.*

3. **Server-side now; frontend live-updating is a later feature.** This task builds the
   backend module that routes/services will consume. CLAUDE.md's "UI never does money math"
   will be satisfied later by either (a) the UI consuming API-computed totals, or (b)
   sharing this module to the client for instant local recompute (debounced). That
   share-vs-fetch decision belongs to the estimate-UI feature; **flagging it now**, not
   deciding it here. This module is written to be trivially shareable (pure, dependency-free).

4. **`number` (integer cents), not `bigint`.** Per the skill's edge-case note, estimate
   cents stay far below `Number.MAX_SAFE_INTEGER`; `number` keeps the API ergonomic. The
   ceiling is documented. *Decision to log.*

5. **Test files excluded from the build.** `tsconfig.json` gets `"exclude": ["**/*.test.ts"]`
   so `npm run build` / `tsc --noEmit` don't emit or check test files into `dist/`; Vitest
   (esbuild) runs them. Explicit `import { describe, it, expect } from 'vitest'` (no
   globals) — no ambient test types needed in the app tsconfig.

---

## Public shape (verbatim from the skill — this is the contract)

```ts
export interface LineItemInput { quantity: number; rateCents: number; }
export type Discount =
  | { type: 'percentage'; valueBasisPoints: number }
  | { type: 'fixed'; amountCents: number };
export interface EstimateCalcInput {
  lineItems: LineItemInput[];
  discount?: Discount;
  taxRateBasisPoints: number;
}
export interface EstimateTotals {
  lineTotalsCents: number[];
  subtotalCents: number;
  discountAmountCents: number;
  discountedSubtotalCents: number;
  taxAmountCents: number;
  grandTotalCents: number;
}
export function calculateEstimate(input: EstimateCalcInput): EstimateTotals;
```

**Exported pure pieces (for direct testing):** `roundHalfUp`, `lineTotalCents`,
`subtotalCents`, `discountAmountCents`, `discountedSubtotalCents`, `taxAmountCents`.

## Pipeline (order is an invariant — from the skill)

```
lineTotalCents(item)   = roundHalfUp(quantity * rateCents)        // per line
subtotalCents          = Σ rounded line totals
discountAmountCents    = fixed: amountCents
                         percentage: roundHalfUp(subtotal * valueBasisPoints / 10_000)
discountedSubtotalCents= max(0, subtotal − discountAmount)        // clamp at 0
taxAmountCents         = roundHalfUp(discountedSubtotal * taxRateBasisPoints / 10_000)
grandTotalCents        = discountedSubtotal + taxAmount
```
`roundHalfUp(v) = Math.sign(v) * Math.round(Math.abs(v))`. Rounding happens ONLY per-line
and after the percentage-discount and tax multiplications. `quantity * rateCents` is the
one sanctioned fractional multiply (quantity is not money), rounded immediately.

---

## Files touched

```
server/
├── package.json           # + vitest dep, + "test"/"test:watch" scripts
├── vitest.config.ts       # NEW — node environment
├── tsconfig.json          # exclude **/*.test.ts from build
└── src/calculations/
    ├── estimate.ts        # NEW — types + pure functions (impl in Phase 3)
    └── estimate.test.ts   # NEW — failing tests first (Phase 2)
TESTING.md                 # + "Estimate calculation module" section (Phase 4)
docs/
├── estimate-calculations-implementation.md   # THIS plan
└── ai-artifacts/DECISIONS.md                  # append the decisions above
```

---

## Test plan (written & reviewed BEFORE implementation)

Every test asserts a real expected number, not a mock shape. Minimum coverage (per skill):

- **`roundHalfUp`**: `0.5→1`, `1.5→2`, `2.5→3`, `2.4→2`, `3.5→4`; negatives `-0.5→-1`,
  `-2.5→-3` (proves `Math.sign` handling).
- **`lineTotalCents`**: integer (`3 × 999 = 2997`); fractional exact (`2.5 × 1250 = 3125`);
  fractional rounding (`1.75 × 1299 = 2273.25 → 2273`); `quantity = 0 → 0`; `rateCents = 0 → 0`.
- **`subtotalCents`**: empty list → `0`; **per-line-rounding proof** — two lines of
  `0.5 × 1 = 0.5 → 1` each ⇒ subtotal `2` (rounding the raw sum `1.0` would give `1`;
  asserting `2` proves round-per-line-then-sum).
- **`discountAmountCents` / `discountedSubtotalCents`**: fixed (`5000`); percentage with
  rounding (`6122 × 1000 / 10_000 = 612.2 → 612`); **fixed > subtotal clamps to 0**
  (subtotal `2000`, fixed `50000` ⇒ discounted `0`, never negative).
- **`taxAmountCents`**: normal (`5510 × 825 / 10_000 = 454.575 → 455`); zero rate → `0`;
  **discount-before-tax proof** — subtotal `10000`, 50% discount ⇒ discounted `5000`,
  10% tax ⇒ `500` (tax-before-discount would give `1000`); asserting `500` proves ordering.
- **`calculateEstimate`**: the skill's full worked example end-to-end, with the hand
  arithmetic in code comments — lines `2.5×1250` & `3×999`, 10% discount, 8.25% tax ⇒
  `{ lineTotals:[3125,2997], subtotal:6122, discount:612, discountedSubtotal:5510,
  tax:455, grandTotal:5965 }` ($59.65). Plus a no-line-items case → all zeros, and a
  no-discount case.

At least one test (the worked example) has its expected values computed BY HAND in
comments, anchoring them to human arithmetic rather than the code's own output.

---

## Phases & steps (one step at a time; stop after each)

### Phase 1 — Vitest setup
1. Install `vitest` (dev); add `vitest.config.ts` (node env), `test` / `test:watch`
   scripts, and the `tsconfig.json` test-exclude. Add a throwaway trivial test to confirm
   `npm test` runs and `tsc --noEmit` stays clean; remove it. *Stop.*

### Phase 2 — Tests first (TDD red)
2. Write `estimate.ts` with **types + exported function signatures that throw
   `not implemented`**, and the full `estimate.test.ts` from the test plan above. Run
   `npm test` → confirm **all assertions fail/red** for the right reason (not-implemented),
   and `tsc --noEmit` is clean. *Stop for test review* (per CLAUDE.md: review tests before
   implementation).

### Phase 3 — Implementation (green)
3. Implement the pure functions and `calculateEstimate`. Run `npm test` → **all green**;
   `tsc --noEmit` clean. *Stop.*

### Phase 4 — Docs & land
4. Add the `TESTING.md` section (happy path, edge cases, known limitations: `number`
   ceiling / rounding is half-up not banker's, error scenarios). Append decisions to
   `docs/ai-artifacts/DECISIONS.md`. Open PR `feat/estimate-calculations` → `main` with a
   short description; **you merge manually** (per updated CLAUDE.md workflow).

---

## Explicitly NOT in this feature
Zod input validation, routes/services wiring, DB reads, the frontend integration and the
share-vs-fetch decision, and money → `"$12.34"` formatting (presentation, frontend).
