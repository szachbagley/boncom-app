import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { Button } from './Button.js';

/**
 * Reusable destructive-confirmation dialog (Radix Dialog, styled to the design system:
 * navy scrim, white panel, 3px cyan top rule). Used for Delete here; Send/Add-Client
 * dialogs on later screens will reuse this same primitive.
 */
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  pending?: boolean;
  danger?: boolean;
  error?: string | null;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  pending = false,
  danger = false,
  error = null,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(0,32,66,0.42)]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[440px] -translate-x-1/2 -translate-y-1/2 border border-t-[3px] border-[var(--border-strong)] border-t-cyan bg-white p-[28px]">
          <Dialog.Title className="m-0 text-[20px] font-semibold text-navy">{title}</Dialog.Title>
          <Dialog.Description className="mt-3 text-[15px] text-[var(--text-secondary)]">
            {description}
          </Dialog.Description>
          {error && <p className="mt-3 text-[14px] text-[var(--color-danger)]">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm" disabled={pending}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm} disabled={pending}>
              {pending ? 'Working…' : confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
