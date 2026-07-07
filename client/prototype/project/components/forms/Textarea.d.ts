import * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapStyle?: React.CSSProperties;
}

/** Multi-line text field; matches Input styling. */
export function Textarea(props: TextareaProps): JSX.Element;
