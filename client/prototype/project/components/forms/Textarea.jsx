import React from 'react';

/**
 * Textarea — multi-line text field. Matches Input styling.
 */
export function Textarea({ label, hint, error, id, rows = 4, style = {}, wrapStyle = {}, ...rest }) {
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
      <textarea
        id={inputId}
        rows={rows}
        onFocus={(e) => { setFocus(true); rest.onFocus && rest.onFocus(e); }}
        onBlur={(e) => { setFocus(false); rest.onBlur && rest.onBlur(e); }}
        {...rest}
        style={{
          border: `1px solid ${borderColor}`, outline: 'none', background: '#fff',
          fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 400, lineHeight: 1.6,
          color: 'var(--text-primary)', padding: '12px 14px', borderRadius: 0, resize: 'vertical',
          transition: 'border-color 160ms cubic-bezier(0.4,0,0.2,1)', ...style,
        }}
      />
      {(hint || error) && (
        <span style={{ fontSize: 13, color: error ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
