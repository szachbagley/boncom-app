import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * AppHeader — the persistent top bar every screen renders. Wordmark on the left (links
 * home); an optional `actions` slot on the right for screen-specific controls (e.g. the
 * Dashboard's Add/Sort/Filter). Values match the Claude Design bundle's header
 * (prototype/project/prototype/Dashboard.html).
 */
export interface AppHeaderProps {
  actions?: ReactNode;
}

export function AppHeader({ actions }: AppHeaderProps) {
  return (
    <header className="border-b border-[var(--border-hairline)] px-[48px]">
      <div className="mx-auto flex h-[96px] max-w-[1200px] items-center justify-between gap-6">
        <Link to="/" className="flex items-baseline gap-[9px] no-underline">
          <span className="text-[30px] font-bold tracking-[-0.6px] text-navy">Boncom</span>
          <span className="text-[30px] font-light tracking-[-0.6px] text-ink">Estimates</span>
        </Link>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
