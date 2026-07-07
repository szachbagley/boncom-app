import * as React from 'react';

export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  /** Large light heading. */
  title?: string;
  /** Uppercase eyebrow above the title. */
  label?: string;
  /** Footer node — typically Buttons. */
  footer?: React.ReactNode;
  width?: number;
  children?: React.ReactNode;
}

/** Centered modal over a navy scrim; sharp corners, cyan top rule, no shadow. */
export function Dialog(props: DialogProps): JSX.Element | null;
