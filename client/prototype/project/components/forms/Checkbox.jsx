import React from 'react';

/**
 * Checkbox — square (never rounded) box with a cyan checked fill.
 */
export function Checkbox({ label, checked, defaultChecked, onChange, disabled = false, id, style = {} }) {
  const inputId = id || React.useId();
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;

  const handle = (e) => {
    if (!isControlled) setInternal(e.target.checked);
    onChange && onChange(e);
  };

  return (
    <label htmlFor={inputId} style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
      fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--text-primary)', ...style,
    }}>
      <input id={inputId} type="checkbox" checked={on} disabled={disabled} onChange={handle}
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
      <span style={{
        width: 20, height: 20, flexShrink: 0, borderRadius: 0,
        border: `1px solid ${on ? 'var(--color-cyan)' : 'var(--border-strong)'}`,
        background: on ? 'var(--color-cyan)' : '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 140ms, border-color 140ms',
      }}>
        {on && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy)" strokeWidth="3" strokeLinecap="square">
            <path d="M5 12l5 5L19 7"/>
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}
