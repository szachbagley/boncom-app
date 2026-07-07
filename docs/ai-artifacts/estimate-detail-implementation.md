# Estimate Detail (Read-Only) View — Implementation Plan

**Feature:** The read-only estimate detail screen — line items, computed totals (from the
API response, never recomputed), draft-vs-sent affordances, and the Send/Delete
confirmation flows. Visual target: `client/prototype/project/prototype/Estimate-{Draft,
Sent,Loading,Error}.html`.
**Branch:** `feat/estimate-detail`
**Touches:** `client/` only. One shared component (`AppHeader`) gets a small additive
extension; everything else is new. No backend changes.

Detailed enough to execute step-by-step; every file's exact contents, every reused piece,
and every test case is specified below.

---

## What's reused unchanged (confirmed by reading the actual source, not assumed)

- **`Button`, `Badge`** — used as-is; no new variants needed (`primary`/`accent`/`danger`
  already exist; `Badge` already handles `draft`/`sent`).
- **`ConfirmDialog`** — already fully generic (`title`/`description`/`confirmLabel`/
  `onConfirm`/`danger`/`pending`/`error`). Reused **twice**, unmodified, for both Send and
  Delete — Send passes `danger={false}` (default → primary/navy confirm button), Delete
  passes `danger`.
- **`useDeleteEstimate`** — already generic (`{ deleteEstimate(id), pending }`); reused as-is.
- **`centsToDisplay`, `basisPointsToPercent`** — reused as-is; this is the first screen that
  actually calls them.
- **`api/estimates.ts`** (`getEstimate`, `patchEstimateStatus`, `deleteEstimate`) and
  **`api/clients.ts`** (`getClients`) — no changes needed.
- **No new npm dependency.** Every icon this screen needs (`ArrowLeft`, `Pencil`, `Send`,
  `Trash2`, `RefreshCw`, `AlertTriangle`) is already available from `lucide-react`.

## The one shared-component change

**`AppHeader` gets an additive `backTo?: string` prop.** This screen's header (confirmed
from all four prototype files) differs from the Dashboard's: a "← Estimates" back-link, a
1px vertical divider, then a **smaller wordmark (26px vs. the Dashboard's 30px)** — and no
right-side actions. `backTo` is optional and the Dashboard's existing usage
(`<AppHeader actions={...} />`) is untouched (no `backTo` → renders exactly as before).
*Decision to log.*

---

## Design decisions (baked in; flagged for visibility)

1. **The detail view fetches clients too**, exactly like the Dashboard — `EstimateDetail`
   carries only `clientId`, no client name, and there's no singular `GET /api/clients/:id`
   (clients are list+create only per `API-REFERENCE.md`). `useEstimateDetail` fetches
   `getEstimate(id)` and `getClients()` in parallel and resolves the name client-side, with
   an `'Unknown client'` defensive fallback (mirrors the Dashboard's defensive unknown-client
   handling).

2. **Line totals are paired with line items by position, not recomputed.** The API returns
   `lineItems: LineItem[]` and `totals.lineTotalsCents: number[]` as two parallel arrays
   (documented in `API-REFERENCE.md`: "in the same order as lineItems"). Zipping them
   correctly is a real, easy-to-get-subtly-wrong data transformation (a silent off-by-one
   would show a plausible-looking but *wrong* dollar amount next to the wrong line) — so
   it's a pure, TDD'd function (`pairLineItemsWithTotals`), not inline `.map` in the
   component. It throws (loudly) rather than silently mis-pairing if the arrays are ever
   unequal length — that would be a genuine contract violation, and money bugs must never
   be silent.

3. **Discount display rule, exactly as specified**, also pulled into a pure, tested
   function (`discountNote`): returns `` `(${basisPointsToPercent(...)})` `` only when
   `discount?.type === 'percentage'`; `null` for a `fixed` discount **and** for no discount
   at all.

4. **When there's no discount at all, the Discount row is still shown, as `$0.00` with no
   percentage note** (rather than hiding the row). The totals object always has a
   `discountAmountCents` (0 when there's no discount), and always rendering the same four
   rows (Subtotal/Discount/Tax/Total) from that object — with no conditional row-hiding
   beyond the one rule the user specified — is simpler and keeps the block's shape
   predictable. **Flagging this for explicit confirmation** since the user's rule addressed
   the *note*, not row visibility, and a reasonable alternative is hiding the row entirely
   when `estimate.discount` is `undefined`.

5. **Tax's rate note is always shown** (even `(0%)` for a draft with no tax set yet) — same
   reasoning: derived directly and unconditionally from the totals/tax-rate fields, no
   special-casing.

6. **Send and Delete each keep the confirming dialog open on failure**, showing the error
   inline via `ConfirmDialog`'s `error` prop (mirrors the Dashboard's delete-error handling)
   — never auto-close or navigate away on a failed mutation.

7. **On successful Send: close the dialog and `refetch()`** (re-fetches both the estimate
   and the client), rather than hand-splicing the `PATCH` response into local state — same
   pattern as the Dashboard's delete-then-refetch, kept consistent across screens even at
   the minor cost of one redundant `getClients()` call. This means the view briefly shows
   its loading skeleton again after confirming Send; accepted as consistent with the
   Dashboard's existing behavior, not something this feature works around.

8. **On successful Delete: navigate to `/`** (not a refetch — the estimate being viewed no
   longer exists, so there's nothing to re-render here; back to the list is the only
   sensible destination).

9. **A malformed `:id` route param (e.g. `/estimates/abc`) is not specially guarded.**
   `Number(idParam)` → `NaN` → the api layer's request still fires
   (`/api/estimates/NaN`) → the backend's Zod validation rejects it with 400 → the hook's
   normal error path renders `EstimateDetailError` with that message and a working "Back to
   estimates" link. No crash, no dead end — just an unremarkable error path, not worth
   dedicated client-side validation for this feature.

10. **A second, separate error-state component (`EstimateDetailError`), not a shared
    abstraction with the Dashboard's `DashboardError`.** The two share a visual pattern
    (icon box, heading, message, error-detail box, action row) but differ in copy and
    secondary action (Dashboard: "Contact support"; here: "Back to estimates" navigating to
    `/`). Per CLAUDE.md's anti-premature-abstraction guidance, this is only the second
    occurrence of the pattern — building a shared `ErrorState` component now would be
    designing for a hypothetical third screen. Flagged as a candidate for extraction if a
    third occurrence appears (likely the create/edit form).

11. **Loading skeleton always shows all three action-button placeholders** (Edit, Send,
    Delete widths), regardless of what the eventual status turns out to be — matching
    `Estimate-Loading.html` exactly, which does the same (the skeleton can't know
    draft-vs-sent yet, since that's part of what's still loading).

---

## Files

```
client/src/
├── components/
│   ├── AppHeader.tsx                       # EDIT — + optional backTo prop
│   └── estimateDetail/
│       ├── LineItemRow.tsx                 # NEW
│       ├── TotalsBlock.tsx                 # NEW
│       ├── EstimateDetailSkeleton.tsx      # NEW
│       └── EstimateDetailError.tsx         # NEW
├── hooks/
│   ├── useEstimateDetail.ts                # NEW
│   └── useSendEstimate.ts                  # NEW
├── utils/
│   ├── estimateDisplay.ts                  # NEW (pure, TDD'd)
│   └── estimateDisplay.test.ts             # NEW
└── views/
    └── EstimateDetailView.tsx              # REWRITE
docs/
├── estimate-detail-implementation.md       # THIS plan
└── ai-artifacts/DECISIONS.md                # append decisions
TESTING.md                                    # append an "Estimate detail view" section
```

---

## Exact contents

### `components/AppHeader.tsx` (edit — additive)
```tsx
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export interface AppHeaderProps {
  actions?: ReactNode;
  /** When present, renders a back-link + divider before a smaller wordmark. */
  backTo?: string;
}

export function AppHeader({ actions, backTo }: AppHeaderProps) {
  const wordmarkSize = backTo ? 'text-[26px]' : 'text-[30px]';
  return (
    <header className="border-b border-[var(--border-hairline)] px-[48px]">
      <div className="mx-auto flex h-[96px] max-w-[1200px] items-center justify-between gap-6">
        <div className="flex items-center gap-[22px]">
          {backTo && (
            <Link
              to={backTo}
              className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[2.3px] text-[var(--text-secondary)] no-underline hover:text-navy"
            >
              <ArrowLeft size={16} strokeWidth={1.75} />
              Estimates
            </Link>
          )}
          {backTo && <span className="h-[30px] w-px bg-[var(--border-hairline)]" />}
          <Link to="/" className="flex items-baseline gap-[9px] no-underline">
            <span className={`${wordmarkSize} font-bold tracking-[-0.6px] text-navy`}>Boncom</span>
            <span className={`${wordmarkSize} font-light tracking-[-0.6px] text-ink`}>Estimates</span>
          </Link>
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
```

### `utils/estimateDisplay.test.ts` (written first)
```ts
import { describe, it, expect } from 'vitest';
import type { EstimateDetail } from '../api/types.js';
import { discountNote, pairLineItemsWithTotals } from './estimateDisplay.js';

function makeEstimate(overrides: Partial<EstimateDetail> = {}): EstimateDetail {
  return {
    id: 1, clientId: 1, projectName: 'Test', status: 'draft',
    taxRateBasisPoints: 825, createdAt: '', updatedAt: '',
    lineItems: [
      { id: 10, estimateId: 1, description: 'Design consultation', quantity: 2.5, rateCents: 1250 },
      { id: 11, estimateId: 1, description: 'Concept revisions', quantity: 3, rateCents: 999 },
    ],
    totals: {
      lineTotalsCents: [3125, 2997], subtotalCents: 6122, discountAmountCents: 612,
      discountedSubtotalCents: 5510, taxAmountCents: 455, grandTotalCents: 5965,
    },
    ...overrides,
  };
}

describe('pairLineItemsWithTotals', () => {
  it('zips each line item with its positional total, preserving order', () => {
    const result = pairLineItemsWithTotals(makeEstimate());
    expect(result).toEqual([
      { id: 10, description: 'Design consultation', totalCents: 3125 },
      { id: 11, description: 'Concept revisions', totalCents: 2997 },
    ]);
  });

  it('returns an empty array for an estimate with no line items', () => {
    const result = pairLineItemsWithTotals(
      makeEstimate({ lineItems: [], totals: { ...makeEstimate().totals, lineTotalsCents: [] } }),
    );
    expect(result).toEqual([]);
  });

  it('throws if a line item has no corresponding computed total (contract violation)', () => {
    const broken = makeEstimate();
    broken.totals = { ...broken.totals, lineTotalsCents: [3125] }; // one short
    expect(() => pairLineItemsWithTotals(broken)).toThrow();
  });
});

describe('discountNote', () => {
  it('returns the formatted percentage for a percentage discount', () => {
    expect(discountNote({ type: 'percentage', valueBasisPoints: 1000 })).toBe('(10%)');
  });

  it('returns null for a fixed discount', () => {
    expect(discountNote({ type: 'fixed', amountCents: 5000 })).toBeNull();
  });

  it('returns null when there is no discount', () => {
    expect(discountNote(undefined)).toBeNull();
  });
});
```

### `utils/estimateDisplay.ts` (throwing stub first, then implemented to green)
```ts
import { basisPointsToPercent } from './format.js';
import type { Discount, EstimateDetail } from '../api/types.js';

/**
 * Display-mapping helpers for the estimate detail view. Both are pure, deterministic
 * transformations that are easy to get subtly wrong (a silent zip error shows a
 * plausible but WRONG dollar figure next to the wrong line) — TDD'd like the calc module.
 */

export interface DisplayLineItem {
  id: number;
  description: string;
  totalCents: number;
}

/**
 * Zips lineItems with totals.lineTotalsCents by position (the API returns them as
 * parallel arrays in the same order). Throws if they don't line up — a real contract
 * violation should be loud, never silently mis-paired.
 */
export function pairLineItemsWithTotals(estimate: EstimateDetail): DisplayLineItem[] {
  return estimate.lineItems.map((item, index) => {
    const totalCents = estimate.totals.lineTotalsCents[index];
    if (totalCents === undefined) {
      throw new Error(`Missing computed total for line item at index ${index}`);
    }
    return { id: item.id, description: item.description, totalCents };
  });
}

/** `(10%)` for a percentage discount; null for fixed or no discount. */
export function discountNote(discount: Discount | undefined): string | null {
  if (!discount || discount.type !== 'percentage') return null;
  return `(${basisPointsToPercent(discount.valueBasisPoints)})`;
}
```

### `components/estimateDetail/LineItemRow.tsx`
```tsx
import { centsToDisplay } from '../../utils/format.js';

export interface LineItemRowProps {
  description: string;
  totalCents: number;
  last?: boolean;
}

export function LineItemRow({ description, totalCents, last = false }: LineItemRowProps) {
  return (
    <div
      className={`flex items-baseline justify-between gap-6 py-[18px] ${last ? '' : 'border-b border-[var(--border-hairline)]'}`}
    >
      <span className="text-[17px] text-[var(--text-primary)]">{description}</span>
      <span className="whitespace-nowrap text-[17px] tabular-nums text-navy">
        {centsToDisplay(totalCents)}
      </span>
    </div>
  );
}
```

### `components/estimateDetail/TotalsBlock.tsx`
```tsx
import { basisPointsToPercent, centsToDisplay } from '../../utils/format.js';
import { discountNote } from '../../utils/estimateDisplay.js';
import type { Discount, EstimateTotals } from '../../api/types.js';

export interface TotalsBlockProps {
  totals: EstimateTotals;
  discount?: Discount;
  taxRateBasisPoints: number;
}

function TotalRow({
  label,
  note,
  amountCents,
  emphasize = false,
}: {
  label: string;
  note?: string | null;
  amountCents: number;
  emphasize?: boolean;
}) {
  return (
    <div
      className={
        emphasize
          ? 'mt-[10px] flex items-baseline justify-between gap-6 border-t border-[var(--border-strong)] pt-5'
          : 'flex items-baseline justify-between gap-6 py-[11px]'
      }
    >
      <span
        className={
          emphasize
            ? 'inline-flex items-baseline gap-2 text-[13px] font-bold uppercase tracking-[2.3px] text-[var(--text-secondary)]'
            : 'inline-flex items-baseline gap-2 text-[15px] text-[var(--text-primary)]'
        }
      >
        {label}
        {note && (
          <span className="text-[13px] font-normal normal-case tracking-normal text-[var(--text-muted)]">
            {note}
          </span>
        )}
      </span>
      <span
        className={
          emphasize
            ? 'whitespace-nowrap text-[30px] font-light tracking-[-0.8px] text-navy tabular-nums'
            : 'whitespace-nowrap text-[15px] tabular-nums text-navy'
        }
      >
        {centsToDisplay(amountCents)}
      </span>
    </div>
  );
}

export function TotalsBlock({ totals, discount, taxRateBasisPoints }: TotalsBlockProps) {
  return (
    <div>
      <TotalRow label="Subtotal" amountCents={totals.subtotalCents} />
      <TotalRow label="Discount" note={discountNote(discount)} amountCents={-totals.discountAmountCents} />
      <TotalRow label="Tax" note={`(${basisPointsToPercent(taxRateBasisPoints)})`} amountCents={totals.taxAmountCents} />
      <TotalRow label="Total" amountCents={totals.grandTotalCents} emphasize />
    </div>
  );
}
```

### `components/estimateDetail/EstimateDetailSkeleton.tsx`
```tsx
function Bar({ width, height = 14 }: { width: string | number; height?: number }) {
  return <div className="animate-pulse bg-neutral-100" style={{ width, height }} />;
}

export function EstimateDetailSkeleton() {
  return (
    <div aria-busy="true">
      <div className="flex items-start justify-between gap-6 border-b border-[var(--border-hairline)] pb-7">
        <div>
          <Bar width={150} height={13} />
          <div className="mt-4">
            <Bar width={340} height={38} />
          </div>
        </div>
        <div className="h-[22px] w-16 animate-pulse bg-neutral-100" />
      </div>

      <div className="mt-10">
        <div className="mb-5">
          <Bar width={90} height={12} />
        </div>
        {[68, 58, 74, 62].map((w, i) => (
          <div
            key={i}
            className={`flex items-center justify-between py-[18px] ${i === 3 ? '' : 'border-b border-[var(--border-hairline)]'}`}
          >
            <Bar width={`${w}%`} height={16} />
            <Bar width={72} height={16} />
          </div>
        ))}
      </div>

      <div className="ml-auto mt-10 max-w-[380px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between py-[11px]">
            <Bar width={110} height={14} />
            <Bar width={70} height={14} />
          </div>
        ))}
        <div className="mt-[10px] flex items-center justify-between border-t border-[var(--border-strong)] pt-5">
          <Bar width={80} height={14} />
          <Bar width={110} height={28} />
        </div>
      </div>

      <div className="mt-12 flex items-center gap-3 border-t border-[var(--border-hairline)] pt-7">
        <div className="h-[44px] w-[108px] animate-pulse bg-neutral-100" />
        <div className="h-[44px] w-[168px] animate-pulse bg-neutral-100" />
        <div className="flex-1" />
        <div className="h-[44px] w-[168px] animate-pulse bg-neutral-100" />
      </div>
    </div>
  );
}
```

### `components/estimateDetail/EstimateDetailError.tsx`
```tsx
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../Button.js';

export interface EstimateDetailErrorProps {
  message?: string;
  onRetry: () => void;
}

export function EstimateDetailError({ message, onRetry }: EstimateDetailErrorProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-7 flex h-14 w-14 items-center justify-center border border-[var(--color-warning)]">
        <AlertTriangle size={24} strokeWidth={1.75} className="text-[var(--color-warning)]" />
      </div>
      <h1 className="m-0 text-[30px] font-light tracking-[-1px] text-navy">
        Something went wrong viewing this estimate.
      </h1>
      <p className="mx-auto mt-[14px] max-w-[440px] text-base text-[var(--text-secondary)]">
        We couldn't load this estimate. Try again, or head back to the list.
      </p>
      {message && (
        <div className="mt-[26px] w-full max-w-[520px] border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-[14px_16px] text-left">
          <div className="mb-[6px] text-[11px] font-bold uppercase tracking-[2px] text-[var(--text-secondary)]">
            Error detail
          </div>
          <code className="font-sans text-[13px] text-[var(--color-danger)]">{message}</code>
        </div>
      )}
      <div className="mt-[30px] flex gap-3">
        <Button variant="primary" iconLeft={<RefreshCw size={15} className="text-white" />} onClick={onRetry}>
          Try again
        </Button>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back to estimates
        </Button>
      </div>
    </div>
  );
}
```

### `hooks/useEstimateDetail.ts`
```ts
import { useCallback, useEffect, useState } from 'react';
import { getClients } from '../api/clients.js';
import { getEstimate } from '../api/estimates.js';
import type { EstimateDetail } from '../api/types.js';

export type EstimateDetailState =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'success'; estimate: EstimateDetail; clientName: string };

export interface UseEstimateDetailResult {
  state: EstimateDetailState;
  refetch: () => void;
}

/** Fetches the estimate + clients (to resolve the client name) in parallel. */
export function useEstimateDetail(id: number): UseEstimateDetailResult {
  const [state, setState] = useState<EstimateDetailState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    async function load(): Promise<void> {
      try {
        const [estimate, clients] = await Promise.all([getEstimate(id), getClients()]);
        if (cancelled) return;
        const client = clients.find((c) => c.id === estimate.clientId);
        setState({ status: 'success', estimate, clientName: client?.name ?? 'Unknown client' });
      } catch (error) {
        if (!cancelled) setState({ status: 'error', error });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);
  return { state, refetch };
}
```

### `hooks/useSendEstimate.ts`
```ts
import { useCallback, useState } from 'react';
import { patchEstimateStatus } from '../api/estimates.js';

export interface UseSendEstimateResult {
  sendEstimate: (id: number) => Promise<void>;
  pending: boolean;
}

/** Wraps the status-patch call for the Send action; mirrors useDeleteEstimate. */
export function useSendEstimate(): UseSendEstimateResult {
  const [pending, setPending] = useState(false);

  const sendEstimate = useCallback(async (id: number): Promise<void> => {
    setPending(true);
    try {
      await patchEstimateStatus(id, 'sent');
    } finally {
      setPending(false);
    }
  }, []);

  return { sendEstimate, pending };
}
```

### `views/EstimateDetailView.tsx` (rewrite)
```tsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Send, Trash2 } from 'lucide-react';
import { AppHeader } from '../components/AppHeader.js';
import { Badge } from '../components/Badge.js';
import { Button } from '../components/Button.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { EstimateDetailError } from '../components/estimateDetail/EstimateDetailError.js';
import { EstimateDetailSkeleton } from '../components/estimateDetail/EstimateDetailSkeleton.js';
import { LineItemRow } from '../components/estimateDetail/LineItemRow.js';
import { TotalsBlock } from '../components/estimateDetail/TotalsBlock.js';
import { ApiError } from '../api/http.js';
import { useDeleteEstimate } from '../hooks/useDeleteEstimate.js';
import { useEstimateDetail } from '../hooks/useEstimateDetail.js';
import { useSendEstimate } from '../hooks/useSendEstimate.js';
import { pairLineItemsWithTotals } from '../utils/estimateDisplay.js';

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

export function EstimateDetailView() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const navigate = useNavigate();

  const { state, refetch } = useEstimateDetail(id);
  const { deleteEstimate, pending: deletePending } = useDeleteEstimate();
  const { sendEstimate, pending: sendPending } = useSendEstimate();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function handleDelete(): Promise<void> {
    setDeleteError(null);
    try {
      await deleteEstimate(id);
      setDeleteOpen(false);
      navigate('/');
    } catch (error) {
      setDeleteError(errorMessage(error));
    }
  }

  async function handleSend(): Promise<void> {
    setSendError(null);
    try {
      await sendEstimate(id);
      setSendOpen(false);
      refetch();
    } catch (error) {
      setSendError(errorMessage(error));
    }
  }

  return (
    <div>
      <AppHeader backTo="/" />
      <main className="mx-auto max-w-[760px] px-[48px] py-[48px] pb-[80px]">
        {state.status === 'loading' && <EstimateDetailSkeleton />}

        {state.status === 'error' && (
          <EstimateDetailError message={errorMessage(state.error)} onRetry={refetch} />
        )}

        {state.status === 'success' && (
          <>
            <div className="flex items-start justify-between gap-6 border-b border-[var(--border-hairline)] pb-7">
              <div>
                <div className="mb-[10px] text-[14px] font-bold uppercase tracking-[2.3px] text-[var(--text-secondary)]">
                  {state.clientName}
                </div>
                <h1 className="m-0 text-[40px] font-light tracking-[-1.2px] text-navy">
                  {state.estimate.projectName}
                </h1>
              </div>
              <div className="pt-[6px]">
                <Badge status={state.estimate.status} />
              </div>
            </div>

            <div className="mt-10">
              <div className="mb-[6px] text-[12px] font-bold uppercase tracking-[3px] text-[var(--text-secondary)]">
                Line items
              </div>
              {pairLineItemsWithTotals(state.estimate).map((row, index, all) => (
                <LineItemRow
                  key={row.id}
                  description={row.description}
                  totalCents={row.totalCents}
                  last={index === all.length - 1}
                />
              ))}
            </div>

            <div className="ml-auto mt-10 max-w-[380px]">
              <TotalsBlock
                totals={state.estimate.totals}
                discount={state.estimate.discount}
                taxRateBasisPoints={state.estimate.taxRateBasisPoints}
              />
            </div>

            <div className="mt-12 flex items-center gap-3 border-t border-[var(--border-hairline)] pt-7">
              {state.estimate.status === 'draft' && (
                <>
                  <Button
                    variant="primary"
                    iconLeft={<Pencil size={15} className="text-white" />}
                    onClick={() => navigate(`/estimates/${id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="accent"
                    iconLeft={<Send size={15} className="text-navy" />}
                    onClick={() => setSendOpen(true)}
                  >
                    Send estimate
                  </Button>
                  <div className="flex-1" />
                </>
              )}
              <Button
                variant="danger"
                iconLeft={<Trash2 size={15} className="text-[var(--color-danger)]" />}
                onClick={() => setDeleteOpen(true)}
              >
                Delete estimate
              </Button>
            </div>
          </>
        )}
      </main>

      <ConfirmDialog
        open={sendOpen}
        onOpenChange={(open) => {
          setSendOpen(open);
          if (!open) setSendError(null);
        }}
        title="Send estimate"
        description="Sending marks this estimate Sent and it can no longer be edited. This cannot be undone."
        confirmLabel="Send"
        pending={sendPending}
        error={sendError}
        onConfirm={handleSend}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteError(null);
        }}
        title="Delete estimate"
        description={
          state.status === 'success'
            ? `Delete "${state.estimate.projectName}"? This cannot be undone.`
            : 'This cannot be undone.'
        }
        confirmLabel="Delete"
        danger
        pending={deletePending}
        error={deleteError}
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

---

## Phases & steps (one step at a time; verify, then STOP)

### Phase 1 — Pure display logic (TDD)
1. Write `estimateDisplay.test.ts` against throwing stubs; run `npm test` → confirm red for
   the right reason. *Stop for test review.*
2. Implement `estimateDisplay.ts` to green. `npm test` green; `tsc -b` clean. *Stop.*

### Phase 2 — AppHeader extension + hooks
3. Extend `AppHeader` with `backTo`. `useEstimateDetail`, `useSendEstimate`. `tsc -b` clean;
   quick browser check that the Dashboard route (`/`) still renders its header identically
   (proving `backTo` is additive, not a regression). *Stop.*

### Phase 3 — Presentational components
4. `LineItemRow`, `TotalsBlock`, `EstimateDetailSkeleton`, `EstimateDetailError`. `tsc -b`
   clean. *Stop.*

### Phase 4 — View assembly
5. Rewrite `EstimateDetailView`. `tsc -b` clean; `npm test` still green (no regressions).
   *Stop.*

### Phase 5 — Browser verification (all four states + interactions)
6. Backend up + seeded. Drive it via the CDP technique already documented in
   `client/.claude/skills/verify/SKILL.md`: view a **draft** estimate (Edit/Send/Delete all
   present, correct totals math against the seed data, correct discount-note behavior for
   that estimate's discount type), view a **sent** estimate (only Delete present, back-link
   works), the **loading** skeleton, and an **error** (bad id → 404, or an injected `fetch`
   failure). Click through: Send → confirm dialog → confirm → status flips to Sent and
   Edit/Send disappear; Delete → confirm dialog → Cancel (safe, seed data unchanged) and
   separately verify Delete's confirm path against a **throwaway** estimate created via the
   API for exactly this purpose (never a real seeded one), confirming it navigates back to
   `/` and the estimate is gone. Report findings. *Stop.*

### Phase 6 — Docs & land
7. Append decisions to `DECISIONS.md`; add the `TESTING.md` "Estimate detail view" section.
   Commit, push, open PR `feat/estimate-detail` → `main`; **you merge manually**.

---

## One thing to confirm before I start
**Decision #4** (Discount row always shown, `$0.00` + no note when there's no discount) is
the one place I made a judgment call beyond your stated rule. If you'd rather the row
disappear entirely when `estimate.discount` is `undefined`, say so now — it's a small
change (one conditional) but affects the totals layout, so better to settle before Phase 3.

## Explicitly NOT in this feature
The create/edit form (still a stub — Edit navigates to it but doesn't build it), the
Add-New-Client dialog, and any Railway/Vercel configuration.
