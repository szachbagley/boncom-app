import React from 'react';

/**
 * Tabs — a flat, underline-style tab row. Active tab carries a cyan underline
 * and navy label; inactive tabs are quiet gray. Uppercase, spaced labels.
 * Controlled via `value`/`onChange` or uncontrolled via `defaultValue`.
 */
export function Tabs({ items = [], value, defaultValue, onChange, style = {} }) {
  const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.value);
  const active = value !== undefined ? value : internal;

  const select = (v) => {
    if (value === undefined) setInternal(v);
    onChange && onChange(v);
  };

  return (
    <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--border-hairline)', ...style }}>
      {items.map((it) => {
        const on = it.value === active;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => select(it.value)}
            style={{
              appearance: 'none', background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '0 0 14px', margin: 0,
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700,
              letterSpacing: '2.3px', textTransform: 'uppercase',
              color: on ? 'var(--color-navy)' : 'var(--text-secondary)',
              borderBottom: `2px solid ${on ? 'var(--color-cyan)' : 'transparent'}`,
              marginBottom: -1,
              transition: 'color 140ms, border-color 140ms',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            {it.label}
            {it.count != null && (
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 0,
                color: on ? 'var(--color-navy)' : 'var(--text-muted)',
              }}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
