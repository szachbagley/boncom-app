import React from 'react';

/**
 * Card — a flat, hairline-bordered container. No shadow, no rounding.
 * Depth comes from the border and interior whitespace.
 */
export function Card({
  padding = 'md',
  interactive = false,
  accent = false,
  children,
  style = {},
  ...rest
}) {
  const pad = { none: 0, sm: 16, md: 24, lg: 32 }[padding] ?? 24;
  const [hover, setHover] = React.useState(false);

  return (
    <div
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-hairline)',
        borderTop: accent ? '3px solid var(--color-cyan)' : '1px solid var(--border-hairline)',
        borderRadius: 0,
        boxShadow: 'none',
        padding: pad,
        cursor: interactive ? 'pointer' : 'default',
        transition: 'border-color 160ms cubic-bezier(0.4,0,0.2,1)',
        borderColor: hover ? 'var(--border-strong)' : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
