# Data Model — Estimate App

This document defines the data model for the cost-estimate app: the entities, their
fields, relationships, and the design decisions behind them. It is the source of truth
for the schema and migration work that follows. Claude Code will use this to produce an
implementation plan.

## Design principles

- **The database stores facts; the calculation module derives figures.** Line items,
  tax rate, and discount are stored. Computed totals (subtotal, discount amount, tax
  amount, grand total) are **never stored** — they are derived on read by the pure
  `estimate-calculations` module. This guarantees totals can never drift out of sync
  with the inputs.
- **Money is integer cents; rates are basis points; quantity is decimal.** No floats
  touch money anywhere in the schema. (See the `estimate-calculations` skill for the
  full rationale and the calculation pipeline.)
- **The schema mirrors the domain model.** Notably, the discount's `type` + `value`
  columns mirror the discriminated union the calculation module consumes.

## Entities overview

Three entities in a simple hierarchy:

```
Client (1) ──< Estimate (1) ──< LineItem
```

- A **Client** has many **Estimates**.
- An **Estimate** belongs to one Client and has many **LineItems**.
- Totals are computed from an Estimate's LineItems + tax + discount at read time.

---

## Client

Represents a client the estimates are prepared for. Promoted to a first-class entity
(rather than a name string on the estimate) so that estimates can be grouped by client
and a client can accumulate many estimates over time.

| Column | Type | Notes |
|---|---|---|
| `id` | `INT` (or `BIGINT`) AUTO_INCREMENT | Primary key |
| `name` | `VARCHAR` | Client's name (required) |
| `created_at` | `TIMESTAMP` | Set on creation |
| `updated_at` | `TIMESTAMP` | Updated on modification |

**Relationships:** one Client has many Estimates.

**Notes:**
- Kept intentionally minimal (name only) for this build. Additional client details
  (email, address, company, etc.) are a natural future extension but out of scope now.
- Deleting a client: deleting a Client is restricted
  while estimates exist; all of a client's estimates must be deleted before that client
  can be deleted (don't let a client deletion silently destroy estimate history). 

---

## Estimate

The core record. Belongs to a Client, owns a set of LineItems, and carries the
estimate-level tax rate, discount, and status.

| Column | Type | Notes |
|---|---|---|
| `id` | `INT` AUTO_INCREMENT | Primary key |
| `client_id` | `INT` | Foreign key → `Client.id` (required) |
| `project_name` | `VARCHAR(255)` | What the estimate is for (e.g. "Spring Brand Refresh"). Required; distinguishes a client's multiple estimates. |
| `status` | `ENUM('draft','sent')` | Defaults to `'draft'` |
| `tax_rate_basis_points` | `INT` | Tax rate in basis points (8.25% → `825`). Defaults to `0`. Never a float. |
| `discount_type` | `ENUM('percentage','fixed')` NULL | Null when the estimate has no discount |
| `discount_value` | `BIGINT` NULL | Meaning depends on `discount_type`: **basis points** when `percentage`, **integer cents** when `fixed`. Null when no discount. |
| `created_at` | `TIMESTAMP` | Set on creation |
| `updated_at` | `TIMESTAMP` | Updated on modification (supports "last edited" in list views) |

**Relationships:**
- Belongs to one Client (`client_id` FK).
- Has many LineItems.

**Discount modeling (important):**
- Discount is optional at the estimate level. An estimate with no discount has both
  `discount_type` and `discount_value` as `NULL`.
- When present, `discount_type` disambiguates the unit of `discount_value`:
  - `percentage` → `discount_value` is **basis points** (10% → `1000`)
  - `fixed` → `discount_value` is **integer cents** ($50 → `5000`)
- **Invariant to enforce in the application layer (Zod):** either both discount columns
  are null, or both are non-null with a valid type. The two-column pair can technically
  represent an invalid state (type set without value, or vice versa); the app must
  reject that. Document this in validation.
- This maps directly to the calculation module's discount union:
  `{ type: 'percentage', valueBasisPoints }` | `{ type: 'fixed', amountCents }`.

**Status:**
- `ENUM('draft','sent')` — DB-level enforcement of the fixed status set. Defaults to
  `draft`. If statuses expand later, this is the point of change.

**Project name:**
- A client can accumulate many estimates over time; `project_name` is what tells them
  apart ("Spring Brand Refresh" vs. "Q3 Social Campaign") in list views.
- At the DB level the column is `NOT NULL DEFAULT ''` so an `ALTER TABLE` adding it is
  safe against existing rows (they backfill to an empty string rather than failing the
  migration). The real requirement — a non-empty, meaningful name — is enforced at the
  application boundary (Zod), the same split used for the discount-pair invariant above.
- Required when creating an estimate; optional (renameable) on update.

**Not stored (computed on read):** subtotal, discount amount, discounted subtotal, tax
amount, grand total. These come from the calculation module.

---

## LineItem

A single line on an estimate. Belongs to one Estimate.

| Column | Type | Notes |
|---|---|---|
| `id` | `INT` AUTO_INCREMENT | Primary key |
| `estimate_id` | `INT` | Foreign key → `Estimate.id` (required) |
| `description` | `VARCHAR` | Line description |
| `quantity` | `DECIMAL(12,3)` | Fractional allowed (e.g. `2.5`, `1.75`); 3 decimal places. **Not** a float — decimal for exactness. Not money. |
| `rate_cents` | `BIGINT` | Rate per unit in **integer cents** ($12.50 → `1250`). Never a float. |

**Relationships:** belongs to one Estimate (`estimate_id` FK).

**Deletion behavior:** `ON DELETE CASCADE` on `estimate_id` — deleting an Estimate
deletes its LineItems. This is the correct relational behavior (orphaned line items are
meaningless). Log this as a deliberate choice.

**Ordering:** line items are ordered by `id` (insertion order) for this build. A
dedicated `position`/`sort_order` column to support user-reordering is a future
extension, intentionally deferred.

**Line total:** `quantity × rate_cents`, rounded half-up to whole cents per line, is
computed by the calculation module — **not** stored.

---

## Money & numeric representation summary

Consolidated for the schema work:

| Value | Storage | Rationale |
|---|---|---|
| Rate per unit | `BIGINT` (integer cents) | No float money |
| Fixed discount amount | `BIGINT` (integer cents) | No float money |
| Tax rate | `INT` (basis points) | Integer, no float rate |
| Percentage discount | `BIGINT` (basis points) | Integer, no float rate |
| Quantity | `DECIMAL(12,3)` | Fractional but exact; not money |
| Computed totals | **not stored** | Derived on read by the calc module |

No `FLOAT` or `DOUBLE` column anywhere in the schema.

---

## Indexing

- `Estimate.client_id` — indexed (foreign key; supports "estimates for this client").
- `LineItem.estimate_id` — indexed (foreign key; supports loading an estimate's lines).
- Foreign key constraints imply/most engines create supporting indexes, but confirm the
  lookup paths are index-backed. Add explicit indexes if the FK doesn't provide them.

---

## Out of scope for this build (candidate "with more time" extensions)

- Users / authentication / multi-tenancy.
- Client detail fields beyond name (email, address, company).
- Line item reordering (`position` column).
- Soft deletes / archiving (hard delete with cascade is used).
- Stored/denormalized totals (deliberately computed on read instead).
- Multiple tax rates or per-line tax/discount (one estimate-level rate, one
  estimate-level discount).

---

## Relationship diagram

```
┌─────────────┐        ┌──────────────────────────┐        ┌─────────────────┐
│   Client    │        │        Estimate          │        │    LineItem     │
├─────────────┤        ├──────────────────────────┤        ├─────────────────┤
│ id (PK)     │───┐    │ id (PK)                  │───┐    │ id (PK)         │
│ name        │   └──< │ client_id (FK)           │   └──< │ estimate_id(FK) │
│ created_at  │        │ project_name             │        │ description     │
│ updated_at  │        │ status (enum)            │        │ quantity(12,3)  │
└─────────────┘        │ tax_rate_basis_points    │        │ rate_cents      │
                       │ discount_type (enum,null)│        └─────────────────┘
                       │ discount_value (null)    │
                       │ created_at               │        (ordered by id)
                       │ updated_at               │
                       └──────────────────────────┘
                          totals computed on read
```
