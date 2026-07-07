import type { ReactNode } from 'react';
import { AdornedInput } from './AdornedInput.js';
import type { DiscountMode } from '../../utils/estimateForm.js';

/** %/$ toggle + adorned input, matching the bundle's discount control. */
export interface DiscountFieldProps {
  mode: DiscountMode;
  value: string;
  onModeChange: (mode: DiscountMode) => void;
  onValueChange: (value: string) => void;
  error?: string;
}

function ToggleSeg({
  active,
  onClick,
  withBorder,
  children,
}: {
  active: boolean;
  onClick: () => void;
  withBorder?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[44px] w-[44px] font-sans text-[15px] font-bold transition-colors duration-150 ${
        withBorder ? 'border-l border-[var(--border-strong)]' : ''
      } ${active ? 'bg-navy text-white' : 'bg-white text-[var(--text-secondary)]'}`}
    >
      {children}
    </button>
  );
}

export function DiscountField({ mode, value, onModeChange, onValueChange, error }: DiscountFieldProps) {
  return (
    <div className="flex items-stretch gap-[10px]">
      <div className="flex border border-[var(--border-strong)]">
        <ToggleSeg active={mode === 'percent'} onClick={() => onModeChange('percent')}>
          %
        </ToggleSeg>
        <ToggleSeg active={mode === 'fixed'} onClick={() => onModeChange('fixed')} withBorder>
          $
        </ToggleSeg>
      </div>
      <div className="w-[180px]">
        <AdornedInput
          symbol={mode === 'percent' ? '%' : '$'}
          symbolSide={mode === 'percent' ? 'right' : 'left'}
          value={value}
          onChange={onValueChange}
          error={error}
        />
      </div>
    </div>
  );
}
