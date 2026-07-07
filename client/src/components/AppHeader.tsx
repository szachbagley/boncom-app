import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * AppHeader — the persistent top bar every screen renders. Wordmark on the left (links
 * home); an optional `actions` slot on the right for screen-specific controls (e.g. the
 * Dashboard's Add/Sort/Filter). When `backTo` is set, renders a back-link + divider before
 * a smaller wordmark instead (e.g. the estimate detail screen). Values match the Claude
 * Design bundle's headers (prototype/project/prototype/Dashboard.html and Estimate-*.html).
 */
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
