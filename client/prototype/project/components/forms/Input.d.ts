import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Uppercase field label. */
  label?: string;
  /** Helper text below the field. */
  hint?: string;
  /** Error message (turns border + text red). */
  error?: string;
  /** Leading adornment, e.g. "$". */
  prefix?: React.ReactNode;
  /** Trailing adornment, e.g. "hrs". */
  suffix?: React.ReactNode;
  wrapStyle?: React.CSSProperties;
}

/** Single-line text field with cyan focus border. */
export function Input(props: InputProps): JSX.Element;
