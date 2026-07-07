import * as React from 'react';

export interface SectionLabelProps extends React.HTMLAttributes<HTMLElement> {
  /** Element to render. Default 'div'. */
  as?: keyof JSX.IntrinsicElements;
  /** Override color (defaults to secondary text). */
  color?: string;
  children?: React.ReactNode;
}

/** Spaced uppercase micro-heading that opens a section. */
export function SectionLabel(props: SectionLabelProps): JSX.Element;
