import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * IconButton — a square, flat button for a single icon (toolbar / row actions).
 * Values match the Claude Design bundle's IconButton (components/core/IconButton.jsx).
 */

export type IconButtonVariant = 'ghost' | 'secondary' | 'accent' | 'danger';
export type IconButtonSize = 'sm' | 'md';

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  ghost: 'bg-transparent text-navy border-transparent hover:bg-[var(--surface-hover)]',
  secondary:
    'bg-transparent text-navy border-[var(--border-strong)] hover:bg-[var(--surface-hover)]',
  accent: 'bg-cyan text-navy border-cyan hover:bg-[var(--action-accent-hover)]',
  danger:
    'bg-transparent text-[var(--color-danger)] border-transparent hover:bg-[var(--color-danger-bg)]',
};

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: 'w-[30px] h-[30px]',
  md: 'w-[38px] h-[38px]',
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  label: string;
  children: ReactNode;
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  label,
  className = '',
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-none border transition-colors duration-150 ease-[var(--ease-standard)] disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
