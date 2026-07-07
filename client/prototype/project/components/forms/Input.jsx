import React from 'react';

/**
 * Input — single-line text field. Sharp corners, hairline border,
 * cyan focus ring (border, not glow). Optional label + hint/error.
 */
export function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  id,
  style = {},
  wrapStyle = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || React.useId();
  const borderColor = error
    ? 'var(--color-danger)'
    : focus
    ? 'var(--border-focus)'
    : 'var(--border-strong)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...wrapStyle }}>
      {label && (
        <label htmlFor={inputId} style={{
          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700,
          letterSpacing: '2.3px', textTransform: 'uppercase', color: 'var(--text-secondary)',
        }}>{label}</label>
      )}
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `1px solid ${borderColor}`, background: '#fff',
        transition: 'border-color 160ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        {prefix != null && <span style={{ paddingLeft: 14, color: 'var(--text-secondary)', fontSize: 15 }}>{prefix}</span>}
        <input
          id={inputId}
          onFocus={(e) => { setFocus(true); rest.onFocus && rest.onFocus(e); }}
          onBlur={(e) => { setFocus(false); rest.onBlur && rest.onBlur(e); }}
          {...rest}
          style={{
            flex: 1, minWidth: 0,
            border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 400,
            color: 'var(--text-primary)', height: 44, padding: '0 14px',
            borderRadius: 0, ...style,
          }}
        />
        {suffix != null && <span style={{ paddingRight: 14, color: 'var(--text-secondary)', fontSize: 15 }}>{suffix}</span>}
      </div>
      {(hint || error) && (
        <span style={{ fontSize: 13, color: error ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
