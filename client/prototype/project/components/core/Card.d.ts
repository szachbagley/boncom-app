import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Adds hover border feedback. */
  interactive?: boolean;
  /** Cyan top rule for emphasis. */
  accent?: boolean;
  children?: React.ReactNode;
}

/**
 * Flat, hairline-bordered container — no shadow, no rounding.
 * @startingPoint section="Core" subtitle="Flat hairline container" viewport="700x150"
 */
export function Card(props: CardProps): JSX.Element;
