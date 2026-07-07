import React from 'react';

/**
 * Select — native select styled to match Input. Sharp, hairline, cyan focus.
 * Pass options as [{value,label}] or use children <option>s.
 */
export function Select({ label, hint, error, options, id, children, style = {}, wrapStyle = {}, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || React.useId();
  const borderColor = error ? 'var(--color-danger)' : focus ? 'var(--border-focus)' : 'var(--border-strong)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...wrapStyle }}>
      {label && (
        <label htmlFor={inputId} style={{
          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700,
          letterSpacing: '2.3px', textTransform: 'uppercase', color: 'var(--text-secondary)',
        }}>{label}</label>
      )}
      <div style={{ position: 'relative', display: 'flex' }}>
        <select
          id={inputId}
          onFocus={(e) => { setFocus(true); rest.onFocus && rest.onFocus(e); }}
          onBlur={(e) => { setFocus(false); rest.onBlur && rest.onBlur(e); }}
          {...rest}
          style={{
            flex: 1, appearance: 'none', WebkitAppearance: 'none',
            border: `1px solid ${borderColor}`, outline: 'none', background: '#fff',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 400,
            color: 'var(--text-primary)', height: 44, padding: '0 40px 0 14px', borderRadius: 0,
            transition: 'border-color 160ms cubic-bezier(0.4,0,0.2,1)', cursor: 'pointer', ...style,
          }}
        >
          {options
            ? options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)
            : children}
        </select>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy)"
          strokeWidth="2" strokeLinecap="square"
          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
      {(hint || error) && (
        <span style={{ fontSize: 13, color: error ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
