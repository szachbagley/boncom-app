import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, Filter } from 'lucide-react';
import type { Client, EstimateStatus } from '../../api/types.js';

export interface FilterControlProps {
  statuses: ReadonlySet<EstimateStatus>;
  onToggleStatus: (status: EstimateStatus) => void;
  clients: Client[];
  selectedClientIds: ReadonlySet<number>;
  onToggleClient: (clientId: number) => void;
}

/** Keeps the dropdown open across multiple checkbox toggles (Radix closes by default). */
function preventClose(event: Event): void {
  event.preventDefault();
}

function CheckSquare({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center border ${
        checked ? 'border-cyan bg-cyan' : 'border-[var(--border-strong)] bg-white'
      }`}
    >
      {checked && <Check size={12} strokeWidth={3} className="text-navy" />}
    </span>
  );
}

export function FilterControl({
  statuses,
  onToggleStatus,
  clients,
  selectedClientIds,
  onToggleClient,
}: FilterControlProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-[44px] items-center gap-2 border border-[var(--border-strong)] px-[14px] font-sans text-nav font-bold uppercase tracking-[2.3px] text-navy hover:bg-[var(--surface-hover)] data-[state=open]:bg-[var(--surface-hover)]"
        >
          <Filter size={16} strokeWidth={1.75} />
          Filter
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
            Status
          </div>
          {(['draft', 'sent'] as const).map((status) => (
            <DropdownMenu.CheckboxItem
              key={status}
              checked={statuses.has(status)}
              onSelect={preventClose}
              onCheckedChange={() => onToggleStatus(status)}
              className="flex cursor-pointer items-center gap-[10px] px-[14px] py-[10px] font-sans text-[14px] text-[var(--text-primary)] outline-none hover:bg-[var(--surface-subtle)] data-[highlighted]:bg-[var(--surface-subtle)]"
            >
              <CheckSquare checked={statuses.has(status)} />
              {status === 'draft' ? 'Draft' : 'Sent'}
            </DropdownMenu.CheckboxItem>
          ))}

          {clients.length > 0 && (
            <>
              <DropdownMenu.Separator className="border-t border-[var(--border-hairline)]" />
              <div className="px-[14px] pb-[6px] pt-[10px] font-sans text-[11px] font-bold uppercase tracking-[2px] text-[var(--text-secondary)]">
                Client
              </div>
              {clients.map((client) => (
                <DropdownMenu.CheckboxItem
                  key={client.id}
                  checked={selectedClientIds.has(client.id)}
                  onSelect={preventClose}
                  onCheckedChange={() => onToggleClient(client.id)}
                  className="flex cursor-pointer items-center gap-[10px] px-[14px] py-[10px] font-sans text-[14px] text-[var(--text-primary)] outline-none hover:bg-[var(--surface-subtle)] data-[highlighted]:bg-[var(--surface-subtle)]"
                >
                  <CheckSquare checked={selectedClientIds.has(client.id)} />
                  {client.name}
                </DropdownMenu.CheckboxItem>
              ))}
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
