import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { Button } from './Button.js';
import { useCreateClient } from '../hooks/useCreateClient.js';
import type { Client } from '../api/types.js';

/**
 * Add New Client dialog (Radix Dialog + a text field), matching Dialogs.html. On Add,
 * creates the client via the api layer and hands it back so the form can add it to the
 * dropdown and auto-select it.
 */
export interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (client: Client) => void;
}

export function AddClientDialog({ open, onOpenChange, onCreated }: AddClientDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { createClient, pending } = useCreateClient();

  async function handleAdd(): Promise<void> {
    const trimmed = name.trim();
    if (trimmed === '') {
      setError('Client name is required.');
      return;
    }
    setError(null);
    try {
      const client = await createClient(trimmed);
      setName('');
      onOpenChange(false);
      onCreated(client);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setName('');
          setError(null);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(0,32,66,0.42)]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 -translate-y-1/2 border border-t-[3px] border-[var(--border-strong)] border-t-cyan bg-white p-[28px]">
          <Dialog.Title className="m-0 text-[20px] font-semibold text-navy">Add new client</Dialog.Title>
          <div className="mt-5">
            <label className="mb-2 block font-sans text-[13px] font-bold uppercase tracking-[2.3px] text-[var(--text-secondary)]">
              Client name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Harbor Light Nonprofit"
              className={`h-[44px] w-full border bg-white px-3 font-sans text-[15px] text-[var(--text-primary)] outline-none focus:border-cyan ${
                error ? 'border-[var(--color-danger)]' : 'border-[var(--border-strong)]'
              }`}
            />
            {error && <p className="mt-2 text-[13px] text-[var(--color-danger)]">{error}</p>}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm" disabled={pending}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={pending}>
              {pending ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
