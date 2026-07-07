import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import type { Client } from '../../api/types.js';

/** Client dropdown (Radix Select), matching the bundle's `ClientSelect`. */
export interface ClientSelectProps {
  clients: Client[];
  value: number | null;
  onChange: (clientId: number) => void;
  error?: string;
}

export function ClientSelect({ clients, value, onChange, error }: ClientSelectProps) {
  return (
    <div>
      <Select.Root
        value={value === null ? undefined : String(value)}
        onValueChange={(v) => onChange(Number(v))}
      >
        <Select.Trigger
          className={`flex h-[44px] w-full items-center justify-between border bg-white px-[14px] font-sans text-[15px] text-[var(--text-primary)] outline-none data-[placeholder]:text-[var(--text-secondary)] ${
            error ? 'border-[var(--color-danger)]' : 'border-[var(--border-strong)] data-[state=open]:border-cyan'
          }`}
        >
          <Select.Value placeholder="Select a client…" />
          <Select.Icon>
            <ChevronDown size={16} strokeWidth={1.75} className="text-[var(--text-secondary)]" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="z-30 max-h-[260px] w-[var(--radix-select-trigger-width)] overflow-hidden border border-[var(--border-strong)] border-t-[3px] border-t-cyan bg-white">
            <Select.Viewport>
              {clients.map((client) => (
                <Select.Item
                  key={client.id}
                  value={String(client.id)}
                  className="flex cursor-pointer items-center justify-between border-b border-[var(--border-hairline)] px-[14px] py-[11px] font-sans text-[15px] text-[var(--text-primary)] outline-none last:border-b-0 data-[highlighted]:bg-[var(--surface-subtle)]"
                >
                  <Select.ItemText>{client.name}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={15} strokeWidth={1.75} className="text-cyan" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      {error && <p className="mt-1 text-[13px] text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
