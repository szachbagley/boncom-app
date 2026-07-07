import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Estimate-lifecycle preset. If set, label defaults to the status name. */
  status?: 'draft' | 'sent' | 'approved' | 'rejected' | 'revised';
  /** Generic color role (used when `status` is not set). */
  tone?: 'neutral' | 'navy' | 'cyan' | 'success' | 'danger' | 'warning';
  children?: React.ReactNode;
}

/**
 * Flat, sharp, uppercase status/label chip.
 * @startingPoint section="Feedback" subtitle="Estimate-status chips" viewport="700x150"
 */
export function Badge(props: BadgeProps): JSX.Element;
