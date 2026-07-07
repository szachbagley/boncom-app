# Display Data Shapes — Boncom Estimates Frontend

What each screen actually *shows*, translated from the API contract into display terms for
the Claude Design prototype. This is deliberately NOT the JSON — it's "what the user sees
in each element," with realistic sample content.

## The one rule that governs everything

The API speaks in **integer cents** and **basis points**; the UI speaks in **formatted
dollars and percentages**. The frontend converts at the display boundary — the prototype
should show formatted values everywhere, never raw cents or basis points.

| Stored (API) | Displayed (UI) |
|---|---|
| `rateCents: 1250` | `$12.50` |
| `grandTotalCents: 5965` | `$59.65` |
| `taxRateBasisPoints: 825` | `8.25%` |
| `discount.valueBasisPoints: 1000` | `10%` |
| `discount.amountCents: 5000` | `$50.00` |
| `quantity: 2.5` | `2.5` (unitless; up to 3 decimals) |
| `status: "draft"` | **Draft** badge |
| `status: "sent"` | **Sent** badge |
| `updatedAt: "2026-07-08T00:03:42.000Z"` | a human date (e.g. `Jul 8, 2026`) |

No float math on money in the UI — formatting only (cents → dollars is a display
transform, not arithmetic on money).

---

## Dashboard

### Top bar
- Title: **Boncom Estimates**
- **Add Estimate** button
- **Sort** control — options: *Date updated* (default), *Date created*, *Status*,
  *Alphabetical*
- **Filter** control — *Client* (multi-select of existing client names), *Status*
  (Draft / Sent)

### Client group heading
- Client name (e.g. **Northwind Studios**)
- A **"+"** affordance to create an estimate for that client
- (Clients with zero estimates are not shown at all)

### Estimate card (the repeating unit)
Each card shows only:
- **Project name** (e.g. *Spring Brand Refresh*)
- **Status badge** — **Draft** or **Sent**
- A **"..."** menu (View / Edit / Delete)

> Cards deliberately show **no dollar totals**. The list endpoint returns summaries
> without computed totals (by design, to avoid an N+1 query), so totals appear only on the
> single-estimate view. Do not put a grand total on the dashboard cards.

### Sample content for the prototype (grouped)
```
Northwind Studios
  • Spring Brand Refresh          [Draft]   ⋯
  • Q3 Product Launch Video       [Sent]    ⋯
  • Holiday Campaign (Print)      [Draft]   ⋯

Cascade Public Health
  • Wellness Awareness Billboards [Draft]   ⋯
  • Landing Page Design           [Sent]    ⋯

Meridian Museum
  • Exhibit Promotion Spot        [Sent]    ⋯
```

### Empty state
- Message: **"No estimates yet. Add one?"** (Add Estimate button still present)

### Error state
- Message: **"Looks like something went wrong."** + `{ error text }`

---

## Estimate View — Read-only

### Header block
- Client name (small, above): e.g. *Northwind Studios*
- **Project name** (prominent): e.g. **Spring Brand Refresh**
- **Status** shown at right: **DRAFT** or **SENT**
- Back affordance to return to the previous screen

### Line items (list)
Each row: **description** on the left, **line total** on the right.
```
Design consultation                     $31.25
Concept revisions                       $29.97
Photography direction                   $150.00
Post-production                          $80.00
```
(Line total = quantity × rate, already computed and formatted; the read-only view does not
show the raw quantity/rate breakdown — just the description and the line's dollar total.)

### Totals block (the heart of the screen)
```
Subtotal                               $291.22
Discount        (10%)                  −$29.12
Tax             (8.25%)                 $21.61
Total                                  $283.71
```
Display rules:
- **Discount line:** show the percentage in parentheses **only if** the discount was a
  percentage (e.g. `(10%)`). If it was a **fixed** amount, show only the dollar figure with
  **no** percentage. (This asymmetry is a real rule — see the discriminated union.)
- **Tax line:** show the rate as a percentage (from basis points) and the amount.
- **Total** is the grand total, visually emphasized.

### Actions
- **Draft:** **Edit**, **Send Estimate**, **Delete Estimate**
- **Sent:** **Delete Estimate** only (no Edit, no Send — sent is terminal)

### Loading state
- Skeleton of the header + line rows + totals block, pulsing.

### Error state
- **"Something went wrong viewing this estimate."** + `{ error text }`, with back affordance.

---

## Estimate View — Edit / Create

### Client
- A **dropdown** of existing client names (e.g. *Northwind Studios ▾*)
- An **Add New Client** button beside it
- In create-with-preselected mode, the client is already chosen

### Project name
- A **text input** (e.g. *Spring Brand Refresh*)

### Line items (editable rows)
Each row has inputs:
- **Description** (text): e.g. *Design consultation*
- **Quantity** (number, up to 3 decimals): e.g. `2.5`
- **Rate** (currency, shown with `$`): e.g. `$12.50`
- (a remove-row affordance)
- **Add Line Item** button appends a new row

> Note: unlike the read-only view, the edit view exposes **quantity and rate as separate
> inputs** (that's what the user edits); the read-only view shows only the resulting line
> total.

### Discount
- A single input with a **%/$ toggle**:
  - In **%** mode: shows a `%` symbol; user enters a percentage (e.g. `10%`)
  - In **$** mode: shows a `$` symbol; user enters a fixed dollar amount (e.g. `$50.00`)

### Tax
- A tax-rate input, shown as a percentage (e.g. `8.25%`)

### Live totals (update as the user edits)
```
Subtotal                               $291.22
Discount                               −$29.12
Tax                                     $21.61
Total                                  $283.71
```
These recompute live on every edit.

### Actions
- **Edit existing:** **Save as Draft**, **Cancel**, **Delete Estimate**
- **Create (empty or preselected):** **Save as Draft**, **Cancel** (no Delete)

---

## Dialogs

### Add New Client
- Title: **Add New Client**
- One **text input**: client name
- Buttons: **Add** / **Cancel**
- (On add: the client is created and becomes the selected client in the dropdown)

### Send Estimate confirmation
- Confirms an **irreversible** action.
- Copy conveys: sending marks the estimate **Sent** and it can no longer be edited.
- Buttons: **Send** (confirm) / **Cancel**

### Delete Estimate confirmation
- Confirms deletion of the estimate.
- Buttons: **Delete** (confirm) / **Cancel**

---

## Realistic sample numbers (use these for a coherent prototype)

A single worked estimate the prototype can use so every screen shows consistent figures.
(Derived the same way the backend computes — discount before tax, half-up rounding.)

```
Client:        Northwind Studios
Project:       Spring Brand Refresh
Status:        Draft
Line items:
  Design consultation     qty 2.5  × $12.50  = $31.25
  Concept revisions       qty 3    × $9.99   = $29.97
  Photography direction   qty 1    × $150.00 = $150.00
  Post-production         qty 1    × $80.00  = $80.00
Subtotal:                                      $291.22
Discount (10%):                               −$29.12
Discounted subtotal:                           $262.10
Tax (8.25%):                                    $21.62
Total:                                          $283.72
```

> If you want an exact-to-the-cent fixture, use the API contract's canonical example
> instead ($59.65 grand total): two lines (2.5 × $12.50, 3 × $9.99), 10% discount, 8.25%
> tax → subtotal $61.22, discount $6.12, tax $4.55, total $59.65. The four-line set above
> is for a fuller-looking screen; verify its cents against the real calc module before
> using it in anything that must foot exactly.
