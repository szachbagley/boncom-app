import { FilePlus, Plus } from 'lucide-react';
import { Button } from '../Button.js';

/**
 * Two flavors: the true empty state (zero estimates exist at all — matches
 * prototype/project/prototype/Dashboard-Empty.html) vs. filters excluding everything
 * (the prototype's own "No estimates match these filters" line).
 */
export interface DashboardEmptyProps {
  variant: 'no-estimates' | 'no-matches';
  onAddEstimate: () => void;
}

export function DashboardEmpty({ variant, onAddEstimate }: DashboardEmptyProps) {
  if (variant === 'no-matches') {
    return (
      <div className="border-t border-[var(--border-hairline)] py-[60px] text-[18px] text-[var(--text-secondary)]">
        No estimates match these filters.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center border-t border-[var(--border-hairline)] px-6 py-[110px] text-center">
      <div className="mb-7 flex h-14 w-14 items-center justify-center border border-[var(--border-strong)]">
        <FilePlus size={24} strokeWidth={1.75} className="text-[var(--color-mute)]" />
      </div>
      <h1 className="m-0 text-[30px] font-light tracking-[-1px] text-navy">No estimates yet. Add one?</h1>
      <p className="mx-auto mb-[30px] mt-[14px] max-w-[420px] text-base text-[var(--text-secondary)]">
        Create your first estimate and it will appear here, grouped by client.
      </p>
      <Button variant="primary" iconLeft={<Plus size={16} className="text-white" />} onClick={onAddEstimate}>
        Add estimate
      </Button>
    </div>
  );
}
