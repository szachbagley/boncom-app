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
