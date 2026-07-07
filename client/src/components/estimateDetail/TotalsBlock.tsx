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
      <TotalRow
        label="Tax"
        note={`(${basisPointsToPercent(taxRateBasisPoints)})`}
        amountCents={totals.taxAmountCents}
      />
      <TotalRow label="Total" amountCents={totals.grandTotalCents} emphasize />
    </div>
  );
}
