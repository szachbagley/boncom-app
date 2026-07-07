---
name: estimate-calculations
description: Rules and procedure for ALL estimate money math — line totals, subtotal, discount, tax, and grand total. Consult this skill whenever you touch calculation logic, money values, rounding, tax, or discount, or when adding/editing anything in the calculation module. Enforces integer-cents arithmetic, per-line rounding, discount-before-tax ordering, and half-up rounding. Trigger phrases: "line total", "subtotal", "apply discount", "apply tax", "grand total", "calculate estimate", "rounding", "money math", "cents".
---

# Estimate Calculations

All estimate money math lives in ONE pure calculation module and follows the rules
below exactly. The UI and the API routes never do arithmetic on money — they call this
module and render/return what it produces. This module is pure: no I/O, no DB, no
side effects; same inputs always produce same outputs. That is what makes it
exhaustively unit-testable, and it is the single source of truth for how an estimate's
numbers are computed.

If any requirement, prompt, or generated code appears to conflict with a rule here,
STOP and ask before proceeding. These rules are load-bearing for correctness.

---

## The data model these calculations assume

**Money is always integer cents (whole `bigint`/`number` of cents). Never floats for money.**

Per-item inputs:
- `quantity` — **fractional allowed** (e.g. `2.5` hours, `1.75` units). This is the ONE
  non-integer input. Keep it as a number with defined precision; it is NOT money.
- `rate` — **integer cents** (whole cents per unit, e.g. `$12.50` → `1250`).

Estimate-level inputs:
- `taxRateBasisPoints` — the tax rate as an **integer in basis points** (1 bp = 0.01%).
  Example: `8.25%` → `825`. Rationale below.
- `discount` — a discriminated union, one of:
  - `{ type: 'percentage', valueBasisPoints: number }` — e.g. `10%` → `1000` bp
  - `{ type: 'fixed', amountCents: number }` — e.g. `$50 off` → `5000`

### Why basis points for rates (not a decimal)

The user enters a human decimal like `8.25` (%). We convert that to an integer number of
basis points (`825`) at the boundary, and the calculation module works only in integers.
This keeps floating-point entirely out of the money path — the module never multiplies
money by a fractional float. Conversion `8.25 → 825` happens once, at input validation
(Zod), not inside the math. Store the tax rate as basis points; store discount percentage
as basis points too. (A fixed discount is already integer cents.)

> If you're tempted to represent the rate as a JS float like `0.0825` and multiply,
> STOP — that reintroduces the float-money bug this whole design exists to prevent.

---

## Rounding rules (absolute)

- **Round each line item to whole cents, THEN sum.** Line amounts are rounded before they
  contribute to the subtotal, so displayed line totals always sum exactly to the subtotal
  (no "off by a cent" appearance).
- **Rounding mode is half-up** (`0.5` rounds away from zero: `0.5 → 1`, `2.5 → 3`).
  Do NOT use banker's rounding. Do NOT use bare `Math.round` on negative values without
  checking — implement an explicit `roundHalfUp` helper (below) and use it everywhere a
  fractional cent must become a whole cent.
- **Rounding happens ONLY at defined points** (per-line, and after the percentage
  discount and tax multiplications). Do not scatter rounding elsewhere.

### The one rounding helper

```ts
/** Round to the nearest integer, half away from zero (half-up). */
export function roundHalfUp(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}
```

Using `Math.sign * Math.round(Math.abs())` gives correct half-up behavior for negative
values too (bare `Math.round(-2.5)` is `-2`, not `-3`). All money values here are
non-negative in normal flow, but the helper is correct regardless.

---

## The calculation pipeline (order is an invariant)

Compute in exactly this order. Each step is its own small, pure, individually tested
function; the module composes them.

```
lineTotal(item)        for each line  → round half-up to whole cents
subtotal               = Σ rounded line totals
discountAmount         = from subtotal, per discount type (rounded if percentage)
discountedSubtotal     = subtotal − discountAmount        (floored at 0)
taxAmount              = discountedSubtotal × taxRate      → round half-up
grandTotal             = discountedSubtotal + taxAmount
```

### Step 1 — Line total (per item)

```
raw = quantity * rate            // fractional quantity × integer cents → may be fractional cents
lineTotalCents = roundHalfUp(raw)
```

- `quantity` may be fractional; `rate` is integer cents; the product may have fractional
  cents; round half-up to whole cents **here**, per line.
- A line with `quantity = 0` or `rate = 0` yields `0`. That is valid (see edge cases).

### Step 2 — Subtotal

```
subtotal = sum of every line's rounded lineTotalCents
```

Integer addition only — no rounding needed (all addends are already whole cents).
An estimate with no line items has `subtotal = 0`.

### Step 3 — Discount (applied to the subtotal, before tax)

Discount is applied ONCE to the whole estimate, to the subtotal:

- **Fixed:** `discountAmount = discount.amountCents` (already whole cents).
- **Percentage:**
  ```
  raw = subtotal * discount.valueBasisPoints / 10_000   // 10_000 bp = 100%
  discountAmount = roundHalfUp(raw)
  ```
  (Dividing by 10,000 converts basis points to a fraction; round the result half-up.)

Then:
```
discountedSubtotal = max(0, subtotal − discountAmount)
```

- **Clamp at zero.** A fixed discount larger than the subtotal must not produce a negative
  discounted subtotal (and therefore must not produce negative tax or a negative grand
  total). `discountAmount` effectively cannot exceed `subtotal`. Document this: an
  over-large fixed discount zeroes the estimate, it does not go negative.

### Step 4 — Tax (applied to the discounted subtotal)

```
raw = discountedSubtotal * taxRateBasisPoints / 10_000
taxAmount = roundHalfUp(raw)
```

- Tax is computed on the **discounted** subtotal (discount-before-tax invariant).
- One tax rate per estimate.
- `taxRateBasisPoints = 0` → `taxAmount = 0` (valid, common for draft estimates).

### Step 5 — Grand total

```
grandTotal = discountedSubtotal + taxAmount
```

Integer addition; no rounding needed.

---

## The module's public shape

Expose a single top-level function that returns every derived number the UI/API needs,
plus the small pure pieces (for direct testing). All amounts out are integer cents.

```ts
export interface LineItemInput {
  quantity: number;        // fractional allowed
  rateCents: number;       // integer cents
}

export type Discount =
  | { type: 'percentage'; valueBasisPoints: number }
  | { type: 'fixed'; amountCents: number };

export interface EstimateCalcInput {
  lineItems: LineItemInput[];
  discount?: Discount;              // absent → no discount
  taxRateBasisPoints: number;       // 0 allowed
}

export interface EstimateTotals {
  lineTotalsCents: number[];        // rounded, per line, in input order
  subtotalCents: number;
  discountAmountCents: number;      // 0 if no discount
  discountedSubtotalCents: number;
  taxAmountCents: number;
  grandTotalCents: number;
}

export function calculateEstimate(input: EstimateCalcInput): EstimateTotals { … }
```

- Return `lineTotalsCents` per line so the UI can display each line's rounded amount
  WITHOUT recomputing (UI never does money math).
- Formatting cents → `"$12.34"` is a PRESENTATION concern and lives on the frontend,
  NOT in this module. This module returns integers only.

---

## Edge cases (all must be handled and tested)

| Case | Expected behavior |
|---|---|
| No line items | `subtotal = 0`, discount/tax computed on 0 → all `0` |
| `quantity = 0` or `rateCents = 0` on a line | that line total is `0`; still included |
| Fractional quantity producing a half-cent | `roundHalfUp` at the line (e.g. `2.5 × 1250 = 3125` exact; `0.3333 × 100 = 33.33 → 33`) |
| Percentage discount with rounding | round the discount amount half-up |
| Fixed discount > subtotal | `discountedSubtotal` clamps to `0`; grand total ≥ 0, never negative |
| `taxRateBasisPoints = 0` | `taxAmount = 0` |
| No discount provided | `discountAmount = 0`, `discountedSubtotal = subtotal` |
| Very large values | use `number` safely within `Number.MAX_SAFE_INTEGER`; estimate cents stay well below it. (If ever modeling into the tens of trillions of cents, switch to `bigint` — not needed here, note the ceiling.) |

---

## TDD expectation for this module

Per CLAUDE.md, this module is TDD'd **first**, before implementation, and every function
is tested against real expected numbers (not mock shapes). Minimum coverage:

- `roundHalfUp`: `0.5→1`, `1.5→2`, `2.5→3`, `2.4→2`, negatives correct.
- `lineTotal`: integer case, fractional-quantity case, zero-quantity, zero-rate.
- `subtotal`: empty list → 0; multi-line sum equals the sum of ROUNDED line totals
  (include a case where rounding per-line vs. total-only would differ, and assert the
  per-line result — this is the test that proves the rounding rule).
- `discount`: fixed; percentage-with-rounding; fixed-greater-than-subtotal clamps to 0.
- `tax`: normal; zero-rate; tax computed on discounted (not raw) subtotal — assert with a
  case where discount changes the tax amount, proving discount-before-tax ordering.
- `calculateEstimate`: one full worked example end-to-end with known hand-computed totals.

Write at least one test whose numbers you computed BY HAND in the test file's comments,
so the expected values are anchored to human arithmetic, not to the code's own output.

---

## Worked example (use as an end-to-end test fixture)

Inputs:
- Line A: `quantity = 2.5`, `rateCents = 1250` → `2.5 × 1250 = 3125` → `3125`
- Line B: `quantity = 3`, `rateCents = 999`   → `3 × 999 = 2997`   → `2997`
- `subtotal = 3125 + 2997 = 6122`
- Discount: `{ percentage, 1000 bp }` (10%) → `6122 × 1000 / 10000 = 612.2 → 612`
- `discountedSubtotal = 6122 − 612 = 5510`
- Tax: `825 bp` (8.25%) → `5510 × 825 / 10000 = 454.575 → 455`
- `grandTotal = 5510 + 455 = 5965`  → displays as `$59.65`

If code produces anything other than these integers, the code is wrong — not the example.

---

## Never do this

- ❌ Float money: `0.1 + 0.2`, `price * 1.0825`, storing dollars as `12.34` floats.
- ❌ Rounding only at the end when the rule is per-line (breaks displayed-sum consistency).
- ❌ Tax before discount (violates the ordering invariant).
- ❌ Formatting money inside this module (presentation belongs on the frontend).
- ❌ Recomputing totals in a component or a route (they consume this module's output).
- ❌ Letting a discount drive any total negative (clamp at 0).
