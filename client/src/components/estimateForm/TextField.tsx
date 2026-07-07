import type { InputHTMLAttributes } from 'react';

/**
 * Bare styled text input (cyan focus border), matching the bundle's `BareInput`
 * (prototype/project/prototype/Estimate-Edit.html).
 */
export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function TextField({ error, className = '', ...rest }: TextFieldProps) {
  return (
    <div>
      <input
        className={`h-[44px] w-full min-w-0 rounded-none border bg-white px-3 font-sans text-[15px] tabular-nums text-[var(--text-primary)] outline-none transition-colors duration-150 ease-[var(--ease-standard)] focus:border-cyan ${
          error ? 'border-[var(--color-danger)]' : 'border-[var(--border-strong)]'
        } ${className}`}
        {...rest}
      />
      {error && <p className="mt-1 text-[13px] text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
