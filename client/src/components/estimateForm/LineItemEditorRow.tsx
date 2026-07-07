import { Trash2 } from 'lucide-react';
import { IconButton } from '../IconButton.js';
import { AdornedInput } from './AdornedInput.js';
import { TextField } from './TextField.js';
import { centsToDisplay } from '../../utils/format.js';
import type { LineItemFieldErrors, LineItemFormState } from '../../utils/estimateForm.js';

export interface LineItemEditorRowProps {
  item: LineItemFormState;
  totalCents: number;
  onChange: (next: LineItemFormState) => void;
  onRemove: () => void;
  canRemove: boolean;
  errors?: LineItemFieldErrors;
}

/** Description/qty/rate/live-total/remove — matches the bundle's `LineItemRow`. */
export function LineItemEditorRow({
  item,
  totalCents,
  onChange,
  onRemove,
  canRemove,
  errors,
}: LineItemEditorRowProps) {
  return (
    <div className="grid grid-cols-[1fr_96px_132px_104px_44px] items-start gap-3 py-[10px]">
      <TextField
        value={item.description}
        placeholder="Description"
        onChange={(e) => onChange({ ...item, description: e.target.value })}
        error={errors?.description}
      />
      <TextField
        value={item.quantity}
        placeholder="1"
        inputMode="decimal"
        className="text-center"
        onChange={(e) => onChange({ ...item, quantity: e.target.value })}
        error={errors?.quantity}
      />
      <AdornedInput
        symbol="$"
        value={item.rateDollars}
        onChange={(value) => onChange({ ...item, rateDollars: value })}
        error={errors?.rate}
      />
      <div className="flex h-[44px] items-center justify-end pr-1 text-[15px] font-semibold tabular-nums text-navy">
        {centsToDisplay(totalCents)}
      </div>
      <IconButton label="Remove line item" variant="danger" onClick={onRemove} disabled={!canRemove}>
        <Trash2 size={16} strokeWidth={1.75} />
      </IconButton>
    </div>
  );
}
