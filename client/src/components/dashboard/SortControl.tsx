import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';
import type { DashboardSort } from '../../utils/dashboardGrouping.js';

const SORT_OPTIONS: { value: DashboardSort; label: string }[] = [
  { value: 'updated', label: 'Date updated' },
  { value: 'created', label: 'Date created' },
  { value: 'status', label: 'Status' },
  { value: 'alpha', label: 'Alphabetical' },
];

export interface SortControlProps {
  value: DashboardSort;
  onChange: (sort: DashboardSort) => void;
}

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-[44px] items-center gap-2 border border-[var(--border-strong)] px-[14px] font-sans text-nav font-bold uppercase tracking-[2.3px] text-navy hover:bg-[var(--surface-hover)] data-[state=open]:bg-[var(--surface-hover)]"
        >
          <ArrowUpDown size={16} strokeWidth={1.75} />
          Sort
          <ChevronDown size={14} strokeWidth={1.75} className="text-[var(--text-secondary)]" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-30 min-w-[220px] border border-[var(--border-strong)] border-t-[3px] border-t-cyan bg-white"
        >
          <div className="px-[14px] pb-[6px] pt-[10px] font-sans text-[11px] font-bold uppercase tracking-[2px] text-[var(--text-secondary)]">
            Sort by
          </div>
          <DropdownMenu.RadioGroup value={value} onValueChange={(v) => onChange(v as DashboardSort)}>
            {SORT_OPTIONS.map((option) => (
              <DropdownMenu.RadioItem
                key={option.value}
                value={option.value}
                className="flex cursor-pointer items-center justify-between border-b border-[var(--border-hairline)] px-[14px] py-[11px] font-sans text-[14px] text-[var(--text-primary)] outline-none last:border-b-0 hover:bg-[var(--surface-subtle)] data-[highlighted]:bg-[var(--surface-subtle)]"
              >
                {option.label}
                <DropdownMenu.ItemIndicator>
                  <Check size={15} strokeWidth={1.75} className="text-cyan" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
