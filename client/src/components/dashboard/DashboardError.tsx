import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../Button.js';

/** Matches prototype/project/prototype/Dashboard-Error.html. */
export interface DashboardErrorProps {
  message?: string;
  onRetry: () => void;
}

export function DashboardError({ message, onRetry }: DashboardErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center border-t border-[var(--border-hairline)] px-6 py-[104px] text-center">
      <div className="mb-7 flex h-14 w-14 items-center justify-center border border-[var(--color-warning)]">
        <AlertTriangle size={24} strokeWidth={1.75} className="text-[var(--color-warning)]" />
      </div>
      <h1 className="m-0 text-[30px] font-light tracking-[-1px] text-navy">Looks like something went wrong.</h1>
      <p className="mx-auto mt-[14px] max-w-[460px] text-base text-[var(--text-secondary)]">
        We couldn't load your estimates. Try again in a moment.
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
        <Button variant="secondary">Contact support</Button>
      </div>
    </div>
  );
}
