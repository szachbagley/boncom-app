# Screen & State Inventory — Boncom Estimates Frontend

Derived from the UI storyboard. This is the completeness checklist for the Claude Design
prototype and the frontend build: every screen, every state, and every dialog. Nothing
ships until each row here is designed and then built. Display values are formatted
(money `$X.XX`, percentages `X%`, status as a badge) — the underlying data is integer
cents and basis points.

---

## 1. Dashboard

The landing screen. Lists estimates as clickable cards, grouped by client. Top bar has
the app title ("Boncom Estimates"), an **Add Estimate** button, a **sort** control, and a
**filter** control.

Persistent controls (present in every non-error dashboard state):
- **Add Estimate** button → opens blank create form.
- **Sort** control → date updated (default), date created, status, alphabetical.
  (Governs both client-group ordering and estimate ordering within a group — see notes.)
- **Filter** control → by client (multi-select from existing clients) and by status.

| # | State | What it shows |
|---|---|---|
| 1a | **Data** | Estimates as cards, grouped under client-name headings. Each card: project name + status badge (Draft/Sent). Each client heading has a **"+"** to create an estimate pre-populated with that client. Clients with **no** estimates are not shown. |
| 1b | **Loading** | Skeleton of the data state (card/heading placeholders) with pulsing animation. |
| 1c | **Empty** | "No estimates yet. Add one?" — controls (Add Estimate) still present. |
| 1d | **Error** | "Looks like something went wrong." + `{ error text }`. |

**Per-card "..." menu** (on each estimate card) → dialog/menu with:
- **View Estimate** → read-only estimate view (same as clicking the card).
- **Edit Estimate** → edit estimate view.
- **Delete Estimate** → delete confirmation dialog.

**Interactions the static design can't fully show (note for build):**
- Client grouping + the four sort modes (and their within-group ordering rules).
- Filter by client (multi-select) and status.
- Card click → read-only view; "+" → create view pre-populated with that client.

---

## 2. Estimate View — Read-only

Shows the estimate breakdown: line items (description + line total), subtotal, discount,
tax, total, and status. Back button returns to the previous screen. **Two data variants**
because draft and sent differ in available actions.

| # | State | What it shows |
|---|---|---|
| 2a | **Data — Draft** | Client name, project name, **DRAFT** status. Line items list, subtotal, discount, tax, total. Actions: **Edit** button (opens edit view) and **Send Estimate** button (opens send confirmation). |
| 2b | **Data — Sent** | Same breakdown, **SENT** status. **No Edit button, no Send button** (sent estimates cannot be edited or reverted). Action: **Delete Estimate** only. |
| 2c | **Loading** | Data skeleton for the estimate view with pulsing animation. |
| 2d | **Error** | "Something went wrong viewing this estimate." + `{ error text }`, with back button. |

**Display rules (from storyboard):**
- **Discount line:** show the percentage (e.g. "(60%) $6,000") **only if** the discount
  was a percentage. If it was a fixed amount, show only the dollar amount — no percentage.
  (Maps to the discriminated union: show `%` only when `discount.type === 'percentage'`.)
- Tax line shows its rate and amount (e.g. "(25%) $1,000" → in real data, the rate is
  basis points formatted to a percentage).
- Both draft and sent expose **Delete**; only draft exposes **Edit** and **Send**.

---

## 3. Estimate View — Edit / Create

The interactive form: client, project name, line items (with add), discount (with %/$
toggle), live subtotal/tax/total. **Three entry variants** (same screen, different initial
state).

| # | State | What it shows |
|---|---|---|
| 3a | **Edit (existing)** | Pre-filled from an existing estimate: client (shown/selected), project name, line items, discount, tax. Actions: **Save as Draft**, **Cancel**, **Delete Estimate**. |
| 3b | **Create — empty** | Blank form. Client selectable from dropdown. Actions: **Save as Draft**, **Cancel**. (No Delete — nothing to delete yet.) |
| 3c | **Create — client preselected** | Same as 3b but the client is pre-populated (opened via a client's "+" on the dashboard). |

**Form elements (from storyboard):**
- **Client:** dropdown of existing clients, plus an **Add New Client** button (opens the
  add-client dialog; on submit the client is created via the API and auto-selected).
- **Project Name:** text input.
- **Line Items:** rows of inputs (description + numeric rate/quantity); **Add Line Item**
  button appends a row. Inputs are validated (numeric where required, etc.).
- **Discount:** input with a **toggle to switch between percentage and fixed amount**
  (shows `%` or `$` accordingly).
- **Live totals:** subtotal, tax, and total update live as the user edits.

**Interactions the static design can't fully show (note for build):**
- Live recomputation of subtotal/tax/total on every edit (shared pure calc module).
- The discount %/$ toggle switching input mode and symbol.
- Add-line-item appending rows; per-line numeric validation.
- Add-New-Client create-then-autoselect flow.
- Save persists (create → `POST`, edit → `PUT`); Cancel discards; Delete confirms.

---

## 4. Dialogs / Modals

Overlays triggered from the screens above. Each is its own designed element.

| # | Dialog | Trigger | Behavior |
|---|---|---|---|
| 4a | **Add New Client** | "Add New Client" in edit/create view | Simple text input for client name. On submit → creates client via API, becomes available and auto-selected in the dropdown. |
| 4b | **Send Estimate confirmation** | "Send Estimate" on a draft | Confirms the irreversible action. On confirm → sets status to **sent** (one-way; disables further editing). |
| 4c | **Delete Estimate confirmation** | "Delete Estimate" (draft or sent), or "..." menu → Delete | Confirms deletion. On confirm → deletes the estimate (and its line items). |

---

## Coverage summary (design + build checklist)

Dashboard
- [ ] 1a Data (grouped cards, per-client "+", "..." menu)
- [ ] 1b Loading (skeleton)
- [ ] 1c Empty
- [ ] 1d Error

Estimate View — Read-only
- [ ] 2a Data — Draft (Edit + Send + Delete)
- [ ] 2b Data — Sent (Delete only)
- [ ] 2c Loading (skeleton)
- [ ] 2d Error

Estimate View — Edit / Create
- [ ] 3a Edit existing (Save / Cancel / Delete)
- [ ] 3b Create empty (Save / Cancel)
- [ ] 3c Create with client preselected

Dialogs
- [ ] 4a Add New Client
- [ ] 4b Send Estimate confirmation
- [ ] 4c Delete Estimate confirmation

Cross-cutting (apply to every screen)
- [ ] Formatted display (money `$X.XX`, percent `X%`, status badge)
- [ ] Back navigation where shown (estimate views)
- [ ] Consistent header/shell ("Boncom Estimates")
- [ ] Tokens honored (palette, type scale, spacing)

---

## Notes / open items surfaced by this inventory

- **Sort semantics** are richer than a single dropdown suggests — each mode defines both
  client-group order *and* within-group estimate order. Worth confirming these are built
  as specified (date updated = default) rather than approximated.
- **Filter vs. sort** are distinct controls (filter = client multi-select + status; sort =
  the four modes). Keep them visually separate.
- **"+" per client vs. "Add Estimate"** — both reach the create view; the "+" pre-selects
  the client (3c), the button starts blank (3b).
- **Discount display asymmetry** (2a/2b) — percentage shown only for percentage discounts —
  is a real display rule tied to the discriminated union; make sure it's not lost.
- **Sent is terminal** — no edit, no revert — enforced server-side *and* reflected in the
  UI by hiding the affordances (2b). Don't rely only on the server rejecting.
