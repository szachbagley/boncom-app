import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual role. primary = navy, accent = cyan, emphasis = orange (sparingly). */
  variant?: 'primary' | 'accent' | 'emphasis' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Primary action button — sharp, flat, uppercase label.
 * @startingPoint section="Core" subtitle="Sharp, flat action buttons" viewport="700x150"
 */
export function Button(props: ButtonProps): JSX.Element;
