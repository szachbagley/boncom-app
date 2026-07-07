# Dashboard Screen — Implementation Plan

**Feature:** The first real screen — the estimates Dashboard. Estimates grouped by client
under client-name headings, with sort + filter controls, a per-card actions menu (View /
Edit / Delete), and all four states (data / loading / empty / error). Visual target: the
Claude Design bundle's four `Dashboard*.html` prototypes; structure per CLAUDE.md.
**Branch:** `feat/dashboard`
**Touches:** `client/` only (new `components/`, `hooks/`; `views/DashboardView.tsx`; small
edits to `App.tsx` and the three stub views). No backend changes.

Detailed enough to execute step-by-step. Exact pixel/color values come from the prototype
files (referenced, not duplicated); this plan specifies structure, component APIs, the
pure logic, and tests.

---

## Two facts that shape everything

1. **The dashboard must fetch clients, not just estimates.** `GET /api/estimates` returns
   `EstimateSummary[]`, which carries `clientId` (a number) but **no client name**. The
   screen groups under client-*name* headings and offers a client multi-select filter — both
   need names. So the data hook fetches `getEstimates()` **and** `getClients()` and joins
   `clientId → client.name`. (This is also why grouping is done client-side; see §Query
   params.)

2. **The prototype's header is a page-specific bar** (wordmark on the left; Add / Sort /
   Filter on the right, 96px tall), not the generic shell header `App.tsx` currently renders.
   Different screens have different top bars (the detail screen has a back button). So
   `App.tsx` stops rendering a header, and each view renders its own via a shared
   `AppHeader` (wordmark + an `actions` slot). The dashboard fills the slot with its
   controls; the three stub views render a bare `<AppHeader />` so the app stays coherent
   between routes. *Decision to log: App.tsx header moves into per-view `AppHeader`.*

---

## Design decisions (baked in; flagged for visibility)

3. **New dependency: `lucide-react@^1.23.0`** (verified current; peer-supports React 19). The
   design system explicitly specifies Lucide icons; `lucide-react` is its official React
   package — the expected, justified choice, not a random util. Icons are imported as
   components (`Plus`, `ArrowUpDown`, `Filter`, `MoreHorizontal`, `Eye`, `Pencil`, `Trash2`,
   `Check`, `FilePlus`, `AlertTriangle`, `RefreshCw`, `ChevronRight`). No other new deps —
   Radix (`react-dialog`, `react-dropdown-menu`, `react-select`) was installed in the
   foundation for exactly these interactive pieces.

4. **First owned components get built** (the foundation deliberately built none). Reusable
   primitives in `client/src/components/`, styled with **Tailwind classes** reproducing the
   design-system's exact values (from `prototype/project/components/`), NOT copied inline-
   style code:
   - `Button` — variants `primary | secondary | accent | ghost | danger`, sizes `sm | md`,
     optional `iconLeft`. (Values from `components/core/Button.jsx`.)
   - `Badge` — `status: 'draft' | 'sent'`. (Values from `components/feedback/Badge.jsx`:
     draft = neutral fill/gray; sent = transparent/cyan border+text.)
   - `IconButton` — variants `ghost | secondary | accent | danger`, sizes `sm | md`.
   - `AppHeader` — the wordmark ("Boncom" 700 + "Estimates" 300, navy/ink, links to `/`) +
     an optional right-side `actions` slot.
   - `ConfirmDialog` — a Radix `Dialog` wrapper (navy scrim, white panel, 3px cyan top rule)
     for a destructive confirm: title, body, confirm/cancel, a `danger` confirm variant,
     and a `pending` state. Built reusable because Send / Delete / Add-Client dialogs all
     need it later; used here for Delete.
   *Decision to log: these are the project's first owned components; the shadcn-style
   "own the source, style with Tailwind, wrap Radix for behavior" approach the foundation
   documented becomes concrete here.*

5. **Dashboard-specific pieces live in `client/src/components/dashboard/`** (kept out of the
   generic pool since they're not reusable): `EstimateCard`, `ClientGroup`, `SortControl`,
   `FilterControl`, and the three non-data states `DashboardSkeleton`, `DashboardEmpty`,
   `DashboardError`. `SortControl`/`FilterControl`/the card menu are built on Radix
   `DropdownMenu` (real popover behavior — focus, keyboard, click-outside — instead of the
   prototype's hand-rolled listeners). Sort uses Radix `RadioGroup`/`RadioItem`; Filter uses
   `CheckboxItem` with `onSelect` prevented so it stays open across multiple toggles.

6. **The group/sort/filter logic is a pure, unit-tested function** —
   `client/src/utils/dashboardGrouping.ts`, TDD'd first (it's real logic: 4 sort modes,
   group-recency ordering, multi-status + multi-client filtering, hide-empty-clients — the
   project's convention is to test non-trivial pure logic). The components/hooks that wrap it
   are glue → test-documented + browser-verified, per CLAUDE.md's testing policy. Signature:
   ```ts
   export type DashboardSort = 'updated' | 'created' | 'status' | 'alpha';
   export interface DashboardFilters {
     sort: DashboardSort;
     statuses: ReadonlySet<EstimateStatus>;  // which statuses to show
     clientIds: ReadonlySet<number>;         // empty = all clients
   }
   export interface DashboardGroup {
     clientId: number;
     clientName: string;
     estimates: EstimateSummary[];           // sorted within the group
   }
   export function buildDashboardGroups(
     estimates: EstimateSummary[],
     clients: Client[],
     filters: DashboardFilters,
   ): DashboardGroup[];
   ```
   Rules (ported from the prototype's `sortEstimates` + `groupRecency`, made total):
   join `clientId → name`; drop estimates whose client isn't in the list (defensive — FK
   guarantees one exists, but the two fetches are independent); group by client; within a
   group filter by `statuses` then sort by mode (`updated`/`created` = date desc — ISO
   strings compare lexically; `status` = draft before sent; `alpha` = by projectName); drop
   groups left empty; apply the client filter (empty set = all); order groups (`alpha` = by
   client name; else = by the group's most-recent updated/created, desc). Dates are the
   `createdAt`/`updatedAt` ISO strings already on `EstimateSummary`.

7. **Data flows through hooks; components never fetch** (CLAUDE.md).
   `hooks/useDashboardData.ts` fetches estimates + clients in parallel and exposes a
   discriminated union `{ status: 'loading' } | { status: 'error'; error } | { status:
   'success'; estimates; clients }`, plus `refetch()`. Plain `useEffect` + cancellation flag
   (same pattern as the retired health-check), no query library — the foundation deferred
   caching to "if a screen needs it," and this screen doesn't. `hooks/useDeleteEstimate.ts`
   exposes `{ deleteEstimate(id): Promise<void>; pending }` over the api layer. The view
   coordinates: confirm in dialog → `await deleteEstimate(id)` → `refetch()`.

8. **No money and no dates are rendered on this screen, so the display formatters are
   correctly not invoked here.** Cards show project name + status badge only (per the prompt
   and prototype); group headings show the client name; the subtitle shows the sort *label*
   ("Sorted by date updated"), not a formatted date. `createdAt`/`updatedAt` are used only as
   sort keys, never displayed. Stated plainly so this reads as intentional, not an omission —
   the "use the formatters, no ad-hoc formatting" rule is honored trivially (there is nothing
   to format). `centsToDisplay`/`basisPointsToPercent` first get real use on the detail/edit
   screens.

9. **Query params: fetch all, filter/sort/group client-side.** The api layer supports
   `?clientId=`/`?status=` (single-valued), but the dashboard's filter UI is **multi-select**
   for both status and client, which single-valued params can't express — and grouping needs
   every client regardless. So `useDashboardData` fetches the full lists and
   `buildDashboardGroups` does the rest in memory. This is exactly the prompt's "use the
   params where they fit, client-side otherwise" — they don't fit a multi-select, so it's
   client-side. *Decision to log.*

10. **Navigation targets** (via react-router `useNavigate`/`Link`):
    - Header "Add estimate" → `/estimates/new`
    - Per-client "+" → `/estimates/new?clientId=<id>` (the create form will read the param;
      it's a stub today, so this is forward-compatible and harmless now)
    - Card body click, and menu "View" → `/estimates/<id>`
    - Menu "Edit" → `/estimates/<id>/edit`
    - Menu "Delete" → open `ConfirmDialog` → confirm → delete + refetch

11. **`ConfirmDialog` uses Radix `Dialog`, not `AlertDialog`.** The foundation installed
    `react-dialog` and named it for these confirmations; `Dialog` with a focused confirm
    button is a fine, common choice. Noted that `AlertDialog` is marginally more correct
    a11y-wise for destructive confirms — a possible future refinement, not worth a new dep
    here. *Decision to log.*

---

## Files

```
client/
├── package.json                         # EDIT — + lucide-react
├── src/
│   ├── App.tsx                          # EDIT — drop the built-in header; just the routed container
│   ├── components/
│   │   ├── Button.tsx                   # NEW
│   │   ├── Badge.tsx                    # NEW
│   │   ├── IconButton.tsx               # NEW
│   │   ├── AppHeader.tsx                # NEW
│   │   ├── ConfirmDialog.tsx            # NEW (Radix Dialog wrapper)
│   │   └── dashboard/
│   │       ├── EstimateCard.tsx         # NEW
│   │       ├── ClientGroup.tsx          # NEW
│   │       ├── SortControl.tsx          # NEW (Radix DropdownMenu, radio)
│   │       ├── FilterControl.tsx        # NEW (Radix DropdownMenu, checkbox)
│   │       ├── DashboardSkeleton.tsx    # NEW (loading)
│   │       ├── DashboardEmpty.tsx       # NEW
│   │       └── DashboardError.tsx       # NEW
│   ├── hooks/
│   │   ├── useDashboardData.ts          # NEW
│   │   └── useDeleteEstimate.ts         # NEW
│   ├── utils/
│   │   ├── dashboardGrouping.ts         # NEW (pure)
│   │   └── dashboardGrouping.test.ts    # NEW (unit, TDD)
│   └── views/
│       ├── DashboardView.tsx            # REWRITE — compose hook + components + 4 states
│       ├── EstimateDetailView.tsx       # EDIT — add bare <AppHeader/>
│       ├── EstimateFormView.tsx         # EDIT — add bare <AppHeader/>
│       └── NotFoundView.tsx             # EDIT — add bare <AppHeader/>
docs/
├── dashboard-implementation.md          # THIS plan
└── ai-artifacts/DECISIONS.md             # append decisions
TESTING.md                                # append a "Dashboard screen" section
```

---

## Phases & steps (one step at a time; verify, then STOP)

### Phase 1 — Reusable primitives + header refactor
1. Install `lucide-react`. Build `Button`, `Badge`, `IconButton`, `AppHeader` (Tailwind,
   matching the DS values). Refactor `App.tsx` to drop its header; add a bare `<AppHeader />`
   to the three stub views so every route keeps the wordmark. `tsc -b` clean; quick browser
   screenshot of a stub route to confirm the wordmark/tokens render (navy, sharp, hairline).
   *Stop.*

### Phase 2 — Pure grouping/sort/filter logic (TDD)
2. Write `dashboardGrouping.test.ts` against a throwing stub `dashboardGrouping.ts`; run
   `npm test` → red for the right reason. *Stop for test review.*
3. Implement to green. `npm test` green; `tsc -b` clean. *Stop.*

### Phase 3 — Hooks
4. `useDashboardData` (parallel fetch of estimates + clients, 4-state union, `refetch`) and
   `useDeleteEstimate`. `tsc -b` clean. (Glue — verified for real when the view drives them
   in Phase 6.) *Stop.*

### Phase 4 — Dashboard components
5. Build `SortControl`, `FilterControl` (Radix DropdownMenu), `EstimateCard` (+ its Radix
   card menu → View/Edit/Delete), `ClientGroup`, `ConfirmDialog`, and
   `DashboardSkeleton`/`DashboardEmpty`/`DashboardError`, matching the four prototype files.
   `tsc -b` clean. *Stop.*

### Phase 5 — View assembly + wiring
6. Rewrite `DashboardView` to: call `useDashboardData`; hold sort/filter UI state; on
   `success` build groups via `buildDashboardGroups` and render groups (or `DashboardEmpty`
   when there are zero estimates at all, vs. a "no matches" note when filters exclude
   everything); render `DashboardSkeleton` on loading and `DashboardError` (with `refetch`)
   on error; wire all navigation and the delete flow (dialog → delete → refetch). `tsc -b`
   clean. *Stop.*

### Phase 6 — Browser verification (all four states + interactions)
7. Drive it for real via the client verify skill (headless Chrome). **Data:** backend up
   (`docker compose up -d` + seeded) → dashboard shows the seeded clients grouped with their
   estimates + badges. **Error:** stop the backend (or bad base URL) → error state with
   `refetch`. **Empty / Loading:** force via a temporary stub (return `[]` / a pending
   promise) for the screenshot, then revert. Also exercise: open Sort menu, open Filter menu
   and toggle, open a card "…" menu, open the Delete dialog. Capture a screenshot per state/
   interaction. Report findings. *Stop.*

### Phase 7 — Docs & land
8. Append decisions to `docs/ai-artifacts/DECISIONS.md`; add the `TESTING.md` "Dashboard
   screen" section (four states, the pure-logic tests, what was browser-verified, known
   limitations). Commit, push, open PR `feat/dashboard` → `main`; **you merge manually**.

---

## Testing summary
- **Unit (TDD):** `dashboardGrouping.ts` — the group/sort/filter logic (the one piece with
  real branching). Cases: group-by-client + hide-empty; each of the 4 sort modes (within-
  group and group order); multi-status filter incl. none-selected; multi-client filter incl.
  empty=all; unknown-client estimate skipped; empty input → `[]`.
- **Test-documented + browser-verified:** components, hooks, the view, and all four states —
  per CLAUDE.md (UI/glue is test-after/documented). No `@testing-library/react` yet
  (consistent with the foundation); component behavior is proven by driving the real screen.

## Explicitly NOT in this feature
The detail and create/edit screens (still stubs; the dashboard only navigates to them), the
Add-New-Client and Send dialogs, any caching/query library, and pagination.
