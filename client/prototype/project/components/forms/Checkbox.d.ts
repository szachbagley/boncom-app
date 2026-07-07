import * as React from 'react';

export interface CheckboxProps {
  label?: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
  style?: React.CSSProperties;
}

/** Square checkbox with cyan checked fill and navy tick. */
export function Checkbox(props: CheckboxProps): JSX.Element;
