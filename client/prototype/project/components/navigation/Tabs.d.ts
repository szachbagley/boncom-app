import * as React from 'react';

export interface TabItem {
  value: string;
  label: string;
  /** Optional count shown after the label. */
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  /** Controlled active value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}

/** Flat underline tab row; active tab has a cyan underline and navy label. */
export function Tabs(props: TabsProps): JSX.Element;
