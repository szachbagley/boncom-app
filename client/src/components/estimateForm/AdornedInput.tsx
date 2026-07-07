/**
 * $/% adornment wrapper, matching the bundle's `AdornedInput`
 * (prototype/project/prototype/Estimate-Edit.html).
 */
export interface AdornedInputProps {
  symbol: string;
  symbolSide?: 'left' | 'right';
  value: string;
  onChange: (value: string) => void;
  align?: 'left' | 'right' | 'center';
  error?: string;
  placeholder?: string;
}

export function AdornedInput({
  symbol,
  symbolSide = 'left',
  value,
  onChange,
  align = 'right',
  error,
  placeholder,
}: AdornedInputProps) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <div>
      <div
        className={`flex h-[44px] items-center border bg-white transition-colors duration-150 ease-[var(--ease-standard)] focus-within:border-cyan ${
          error ? 'border-[var(--color-danger)]' : 'border-[var(--border-strong)]'
        }`}
      >
        {symbolSide === 'left' && (
          <span className="pl-3 text-[15px] text-[var(--text-secondary)]">{symbol}</span>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode="decimal"
          className={`h-full min-w-0 flex-1 border-none bg-transparent font-sans text-[15px] tabular-nums text-[var(--text-primary)] outline-none ${alignClass} ${
            symbolSide === 'left' ? 'px-2 pl-2' : 'px-2 pr-2'
          }`}
        />
        {symbolSide === 'right' && (
          <span className="pr-3 text-[15px] text-[var(--text-secondary)]">{symbol}</span>
        )}
      </div>
      {error && <p className="mt-1 text-[13px] text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
