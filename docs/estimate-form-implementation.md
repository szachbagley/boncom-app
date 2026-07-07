# Estimate Create/Edit Form — Implementation Plan

**Feature:** The estimate create/edit form — the most complex screen. Three entry modes,
editable line items, discount (%/$ toggle) and tax inputs, **live totals computed by the
shared calc module**, client-side validation mirroring the contract, and create/edit/
cancel/delete. Visual target: `client/prototype/project/prototype/Estimate-{Create,Edit,
Create-Client}.html` and the Add-New-Client dialog in `Dialogs.html`.
**Branch:** `feat/estimate-form`
**Touches:** `client/` only. Reuses `TotalsBlock`, `ConfirmDialog`, `Button`, `IconButton`,
`AppHeader` unchanged. No backend changes.

The plan is deliberately most detailed on the **pure money/form logic**, because that's
where a subtle bug would silently produce a *wrong dollar amount* — the exact failure this
whole integer-cents design exists to prevent.

---

## The core challenge: form strings → cents/basis points, without float bugs

The form holds **strings** (what the user types: `"12.50"`, `"8.25"`). To feed the shared
calc module we need **integer cents** and **integer basis points**. The naive
`parseFloat("19.99") * 100` is `1998.9999999999998` — a float error. So the conversion is
done with **integer arithmetic on the digit substrings, never `float * 100`**, and it's a
pure, exhaustively-TDD'd module. This is the single most important part of the feature.

```ts
// Parse a non-negative decimal string into an integer number of hundredths.
// "12.5" -> 1250 (cents) or 825 <- "8.25" (basis points). Integer math only.
function decimalToHundredths(raw: string): number | null {
  const s = raw.trim();
  if (s === '') return null;
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(s); // non-negative, <= 2 decimals
  if (!m) return null;
  const intPart = Number(m[1]);
  const frac = Number((m[2] ?? '').padEnd(2, '0')); // "5" -> 50, "" -> 0
  return intPart * 100 + frac;
}
```
Both `dollarsToCents` and `percentToBasisPoints` are this function. Quantity is different —
it's **not money**, keeps up to 3 decimals, and stays a JS `number` (the calc module does
the one sanctioned `quantity * rateCents` multiply and rounds immediately), so `parseQuantity`
validates `^\d+(\.\d{1,3})?$` and returns `Number(s)`.

---

## Live totals: the shared calc module IS the preview (the whole point of shared-calc)

On every edit, the view builds an `EstimateCalcInput` from the current form strings (lenient
conversion: blank/invalid → 0) and calls **`calculateEstimate`** — the exact module the
server uses authoritatively (mirrored + drift-guarded from the shared-calc feature). This
means the live preview is **per-line rounded and identical to what the server will store on
save** — strictly better than the prototype's naive inline `qty*rate` float sum, which could
disagree with the server by a cent. Results (integer cents) are formatted with the display
formatters. **The form never reimplements the math.**

**No debounce on the recompute.** CLAUDE.md says "debounce input-driven recalculation where
appropriate" — that's about *I/O* (network/DB). Here the recompute is a pure, synchronous,
microsecond arithmetic pass over a handful of line items; debouncing would only add latency
between a keystroke and the preview updating. So it's a synchronous `useMemo`, recomputed
every render. *Decision to log.*

---

## Reuse: the totals rendering lives in ONE place

The form's live-totals summary reuses the **existing `TotalsBlock`** (from the detail view)
for the Subtotal/Discount/Tax/Total rows — including the `(10%)`-only-for-percentage
discount-note rule, which therefore has a single implementation shared by both screens. The
form wraps it in the bundle's summary card (cyan top rule + "Summary" label). The form
computes an `EstimateTotals` via the shared calc and passes it, plus the `Discount` union
(or `undefined`) and the tax basis points, straight into `TotalsBlock`. *Decision to log:
reuse rather than a parallel totals renderer.*

---

## Design decisions (baked in; the flagged ones are yours to veto at review)

1. **Client dropdown = Radix `Select`** (`@radix-ui/react-select`, installed in the
   foundation for exactly this). Accessible keyboard nav, styled to the bundle's dropdown.

2. **Add-New-Client is a dedicated `AddClientDialog`** (Radix `Dialog` + a text field +
   Cancel/Add), not the message-only `ConfirmDialog`. On Add it calls `createClient` via a
   new `useCreateClient` hook, then hands the created `Client` back to the form, which
   **adds it to the dropdown options and auto-selects it** — the create-then-autoselect flow
   from the view inventory. Errors show inline in the dialog; it stays open on failure.

3. **`%`/`$` discount toggle keeps the typed value when switched** (matching the prototype:
   `"10"` reads as `10%` in percent mode, `$10` in fixed mode). Simplest behavior; the live
   preview immediately reflects the reinterpretation so it's not silently confusing. *Flag
   for veto: the alternative is clearing the value on toggle.*

4. **A blank discount input = no discount** (`discount: undefined` in the payload). A
   non-blank value (even `"0"`) is included as a discount object. *Flag for veto.*

5. **Blank tax input = 0% tax** (`taxRateBasisPoints: 0`); the API defaults tax to 0 and a
   blank tax field naturally means "no tax". Edit-mode prefill shows `0` bp as an empty field.

6. **Saving with zero line items is allowed** — the API/service explicitly permit an empty
   `lineItems` array, and the prototype's create screen shows Save available with none (with
   a "No line items yet" placeholder). Each *present* row must still validate. *Flag for
   veto: the alternative is requiring >= 1 line item.*

7. **The form only ever saves drafts.** Create → status `draft` (the API default); edit is
   only reachable for drafts (see the guard), and saving keeps it `draft`. There is no
   status control on the form; the PUT sends `status: 'draft'`. Sending an estimate is the
   detail view's job, not the form's.

8. **Sent-estimate entry guard.** In edit mode the form loads the estimate; if its status is
   `'sent'`, the form does not render — it `navigate('/estimates/:id', { replace: true })`s
   to the read-only detail (which correctly offers no edit). A sent estimate can't normally
   reach the form through the UI (the detail view hides Edit for sent), but a direct URL
   could; this guard enforces the one-way rule in the UI, not just via server rejection.
   *Decision to log.*

9. **Cancel → `/` (Dashboard)** for both modes (matches the prototype). **Save success →
   `/estimates/:id`** (the read-only detail for the created/updated estimate). **Delete
   success → `/`.**

10. **Client-side validation mirrors the server's Zod** so the UI rejects before the server:
    client selected; `projectName` trimmed 1–255; per line item description trimmed 1–255,
    quantity a valid `<=3`-decimal non-negative number, rate a valid non-negative money
    value; tax (if non-blank) valid non-negative; discount (if non-blank) valid non-negative.
    Errors are field-level and block the API call. This validation is pure and TDD'd.

11. **Line-item local ids.** New rows get a local `crypto.randomUUID()` id for React keys and
    remove/edit targeting (distinct from DB ids, which new rows don't have). Edit-mode rows
    are prefilled from the estimate's line items.

12. **No new npm dependency.** Radix Select and Dialog were installed in the foundation;
    every icon (`Plus`, `Trash2`, `Check`, `ChevronDown`, `X`) is in `lucide-react`.

---

## Files

```
client/src/
├── utils/
│   ├── money.ts                       # NEW (pure): dollarsToCents, centsToInputString,
│   │                                  #   percentToBasisPoints, basisPointsToInputString, parseQuantity
│   ├── money.test.ts                  # NEW (TDD)
│   ├── estimateForm.ts                # NEW (pure): form types, emptyFormState,
│   │                                  #   formStateFromEstimate, buildCalcInput, validateForm
│   └── estimateForm.test.ts           # NEW (TDD)
├── hooks/
│   ├── useEstimateFormData.ts         # NEW — fetch clients (+ estimate in edit mode)
│   ├── useCreateClient.ts             # NEW
│   └── useSaveEstimate.ts             # NEW — create (POST) or update (PUT)
├── components/
│   ├── AddClientDialog.tsx            # NEW (Radix Dialog + text field)
│   └── estimateForm/
│       ├── TextField.tsx              # NEW — bare styled input (cyan focus)
│       ├── AdornedInput.tsx           # NEW — $/% adornment wrapper
│       ├── ClientSelect.tsx           # NEW (Radix Select)
│       ├── DiscountField.tsx          # NEW — %/$ toggle + AdornedInput
│       └── LineItemEditorRow.tsx      # NEW — desc/qty/rate/live-total/remove
└── views/
    └── EstimateFormView.tsx           # REWRITE — three modes, live totals, validation, save
docs/
├── estimate-form-implementation.md    # THIS plan
└── ai-artifacts/DECISIONS.md           # append decisions
TESTING.md                              # append an "Estimate create/edit form" section
```

---

## Pure module detail (the TDD targets)

### `utils/money.ts`
```ts
/** "12.50" -> 1250 cents; null if not a valid non-negative <=2-decimal number. */
export function dollarsToCents(raw: string): number | null;
/** 1250 -> "12.50" (always 2 decimals; for prefilling a rate input). */
export function centsToInputString(cents: number): string;
/** "8.25" -> 825 basis points; null if invalid. */
export function percentToBasisPoints(raw: string): number | null;
/** 825 -> "8.25", 1000 -> "10", 850 -> "8.5" (no trailing zeros; for prefill). */
export function basisPointsToInputString(bp: number): string;
/** "2.5" -> 2.5; null if not a valid non-negative <=3-decimal number. */
export function parseQuantity(raw: string): number | null;
```

**`money.test.ts` cases** (the sharp edges get named tests):
- `dollarsToCents`: `"12.50"`→1250, `"12.5"`→1250, `"12"`→1200, `"0.07"`→7,
  **`"19.99"`→1999** (the classic float-error case, proven correct), `"0"`→0; rejects `""`,
  `"abc"`, `"12.999"` (3 decimals), `"-5"`, `"1.2.3"`, `"$5"` → null.
- `centsToInputString`: 1250→`"12.50"`, 5→`"0.05"`, 1200→`"12.00"`, 0→`"0.00"`.
- `percentToBasisPoints`: `"8.25"`→825, `"10"`→1000, `"0.5"`→50, `"0"`→0; rejects
  `"8.255"`, `"-1"`, `""`→null.
- `basisPointsToInputString`: 825→`"8.25"`, 1000→`"10"`, 850→`"8.5"`, 0→`"0"`.
- `parseQuantity`: `"2.5"`→2.5, `"3"`→3, `"0.333"`→0.333, `"0"`→0; rejects `"2.5001"`
  (4 decimals), `"-1"`, `"abc"`, `""`→null.

### `utils/estimateForm.ts`
```ts
export interface LineItemFormState { id: string; description: string; quantity: string; rateDollars: string; }
export type DiscountMode = 'percent' | 'fixed';
export interface EstimateFormState {
  clientId: number | null;
  projectName: string;
  lineItems: LineItemFormState[];
  discountMode: DiscountMode;
  discountValue: string;
  taxRate: string;
}

export function emptyFormState(clientId?: number): EstimateFormState;
export function formStateFromEstimate(estimate: EstimateDetail): EstimateFormState;

/** Lenient: blank/invalid -> 0. Drives the live preview via the shared calc module. */
export function buildCalcInput(form: EstimateFormState): EstimateCalcInput;

/** Strict: field-level errors, or a ready-to-send payload. Mirrors the server's Zod. */
export type FormErrors = {
  client?: string; projectName?: string; taxRate?: string; discount?: string;
  lineItems: Record<string /* local id */, { description?: string; quantity?: string; rate?: string }>;
};
export function validateForm(form: EstimateFormState):
  | { ok: true; discount?: Discount; clientId: number; projectName: string;
      taxRateBasisPoints: number; lineItems: LineItemInput[] }
  | { ok: false; errors: FormErrors };
```
Helper (internal, used by both `buildCalcInput` and `validateForm`): `buildDiscount(form)` →
`Discount | undefined` (percent mode → `{percentage, valueBasisPoints}`, fixed →
`{fixed, amountCents}`, blank → `undefined`).

**`estimateForm.test.ts` cases:**
- `formStateFromEstimate`: round-trips a percentage-discount estimate (bp→`"10"`,
  rateCents→`"12.50"`, quantity→`"2.5"`); a fixed-discount estimate; a no-discount estimate
  (mode defaults `percent`, value `""`, tax `0`→`""`).
- `buildCalcInput`: a fully-filled form yields the exact `EstimateCalcInput` whose
  `calculateEstimate` result is the canonical `$59.65` (proving the preview path equals the
  server path); a form with a blank rate / blank tax yields zeros in the right places (no
  throw).
- `validateForm`: a valid form → `{ ok: true, ... }` payload with correct cents/bp; missing
  client → `errors.client`; blank project → `errors.projectName`; a line with a 4-decimal
  quantity → `errors.lineItems[id].quantity`; a line with a negative/garbage rate →
  `errors.lineItems[id].rate`; a blank-discount form → `ok` with `discount: undefined`; a
  garbage tax → `errors.taxRate`.

---

## Hooks

- **`useEstimateFormData(id?: number)`** — fetches `getClients()` always, and `getEstimate(id)`
  when `id` is provided (edit mode), in parallel. State:
  `{ status:'loading' } | { status:'error'; error } | { status:'success'; clients: Client[]; estimate?: EstimateDetail }`,
  plus `refetch`. (Create mode: `estimate` is absent.)
- **`useCreateClient()`** — `{ createClient(name): Promise<Client>; pending }` over the api
  layer; used by `AddClientDialog`.
- **`useSaveEstimate()`** — `{ save(args): Promise<EstimateDetail>; pending }` where `save`
  branches: create → `createEstimate(payload)`, edit → `updateEstimate(id, payload)`. Returns
  the saved `EstimateDetail` so the view can navigate to `/estimates/${saved.id}`.

---

## View: `EstimateFormView` (assembly)

- Reads `:id` (`useParams`) → edit mode when present; reads `?clientId=` (`useSearchParams`)
  for create-with-preselected-client.
- `useEstimateFormData(id)` for loading/error/data. On success, initialize form state once:
  edit → `formStateFromEstimate(estimate)` **after the sent-guard** (if `estimate.status ===
  'sent'`, `navigate` to the detail and render nothing); create → `emptyFormState(clientIdFromQuery)`.
- Holds `EstimateFormState` + a `FormErrors` (shown after a failed save attempt).
- **Live totals**: `const totals = useMemo(() => calculateEstimate(buildCalcInput(form)), [form])`,
  passed with the derived `Discount` and tax bp into the reused `TotalsBlock`, wrapped in the
  summary card.
- Line items: `LineItemEditorRow` per row (each shows its own live line total via the same
  `centsToDisplay(calculateEstimate-per-line or dollarsToCents(rate)*qty)` — actually the row
  shows `centsToDisplay(lineTotalsCents[i])` from the same computed `totals`, so the row total
  and the subtotal are guaranteed consistent). "Add line item" appends a blank row; remove
  removes (disabled when it's the only row, matching the prototype's `canRemove`).
- Client field: `ClientSelect` (options from `clients`, plus any just-added client) + "Add new
  client" button opening `AddClientDialog`; on add, the new client is appended to the options
  and selected.
- Discount: `DiscountField` (toggle + adorned input). Tax: `AdornedInput` (`%`, right).
- Actions: **Save as draft** (validate → on errors set `FormErrors` and stop; on ok → `save`
  → navigate to detail), **Cancel** (→ `/`), and in edit mode **Delete estimate**
  (`ConfirmDialog` + `useDeleteEstimate` → `/`).
- Header: `AppHeader backTo="/"` (same as the detail view). Title: "New estimate" /
  "Editing estimate" + the live `projectName || 'Untitled estimate'`.

---

## Phases & steps (one step at a time; verify, then STOP)

### Phase 1 — Money primitives (TDD)
1. `money.test.ts` against throwing stubs → red for the right reason. *Stop for test review.*
2. Implement `money.ts` to green. `npm test` green; `tsc -b` clean. *Stop.*

### Phase 2 — Form logic (TDD)
3. `estimateForm.test.ts` against stubs → red. *Stop for test review.*
4. Implement `estimateForm.ts` to green (incl. the `$59.65` preview-path assertion). `tsc -b`
   clean. *Stop.*

### Phase 3 — Hooks
5. `useEstimateFormData`, `useCreateClient`, `useSaveEstimate`. `tsc -b` clean. *Stop.*

### Phase 4 — Input components
6. `TextField`, `AdornedInput`, `ClientSelect`, `DiscountField`, `LineItemEditorRow`,
   `AddClientDialog`. `tsc -b` clean. *Stop.*

### Phase 5 — View assembly
7. Rewrite `EstimateFormView`: three modes, live totals via shared calc + reused
   `TotalsBlock`, validation, save/cancel/delete, sent-guard. `tsc -b` clean; `npm test`
   green. *Stop.*

### Phase 6 — Browser verification (the big one)
8. Drive it via CDP (per `client/.claude/skills/verify/SKILL.md`), against the real seeded
   backend. Verify: **create-empty** (`/estimates/new`) — type a client, project, add line
   items, watch **subtotal/discount/tax/total update live and match the calc module**;
   **create-with-preselected-client** (`/estimates/new?clientId=<id>`); **edit** an existing
   draft (prefilled correctly from the estimate); the **%/$ toggle** flips the discount
   interpretation live; **Add New Client** dialog creates + auto-selects (use a throwaway
   name, clean up after); **validation** blocks save on a bad quantity/blank project and
   shows inline errors; **save create** → POST → lands on the new detail with correct totals
   (create a throwaway estimate, verify, delete it); **save edit** → PUT → detail reflects
   changes (edit a throwaway, not seed data — or re-seed after); **delete** (edit mode) →
   dialog → confirm → `/`; **sent-guard** — navigate directly to `/estimates/<a sent id>/edit`
   → redirected to the read-only detail. Any estimate mutated for real is a throwaway or
   restored via `npm run seed`. Report findings. *Stop.*

### Phase 7 — Docs & land
9. Append decisions to `DECISIONS.md`; add the `TESTING.md` "Estimate create/edit form"
   section. Commit, push, open PR `feat/estimate-form` → `main`; **you merge manually**.

---

## Explicitly NOT in this feature
Line-item reordering, per-line tax/discount, autosave/drafts-in-progress, and any Railway/
Vercel configuration. (The estimate lifecycle is now complete: dashboard → create/edit →
detail → send/delete.)
