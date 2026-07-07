import * as React from 'react';

export interface SelectOption { value: string; label: string; }

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Options as data; alternatively pass <option> children. */
  options?: SelectOption[];
  wrapStyle?: React.CSSProperties;
}

/** Native select styled to match Input, with a navy chevron. */
export function Select(props: SelectProps): JSX.Element;
