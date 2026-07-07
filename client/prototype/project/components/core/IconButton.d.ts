import * as React from 'react';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'ghost' | 'secondary' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** Accessible label (also the title tooltip). */
  label?: string;
  /** The icon element. */
  children?: React.ReactNode;
}

/** Square flat button for a single icon. */
export function IconButton(props: IconButtonProps): JSX.Element;
