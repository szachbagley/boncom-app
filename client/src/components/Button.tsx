import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Button — the primary action primitive. Sharp corners, flat, no shadow.
 * Values match the Claude Design bundle's Button (components/core/Button.jsx).
 */

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-navy text-white border-navy hover:bg-[var(--action-primary-hover)]',
  secondary: 'bg-transparent text-navy border-navy hover:bg-[var(--surface-hover)]',
  accent: 'bg-cyan text-navy border-cyan hover:bg-[var(--action-accent-hover)]',
  ghost: 'bg-transparent text-navy border-transparent hover:bg-[var(--surface-hover)]',
  danger:
    'bg-transparent text-[var(--color-danger)] border-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-[34px] px-[14px] text-micro tracking-[1.6px]',
  md: 'h-[44px] px-[22px] text-nav tracking-[2.3px]',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-[10px] rounded-none border font-sans font-bold uppercase leading-none transition-colors duration-150 ease-[var(--ease-standard)] disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {iconLeft}
      {children}
    </button>
  );
}
