import React from 'react';

/**
 * Dialog — a centered modal over a dim scrim. Sharp corners, hairline border,
 * no shadow (a subtle scrim provides separation). Header / body / footer.
 */
export function Dialog({ open, onClose, title, label, footer, width = 520, children }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0, 32, 66, 0.42)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div role="dialog" aria-modal="true" style={{
        width, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto',
        background: '#fff', border: '1px solid var(--border-strong)',
        borderTop: '3px solid var(--color-cyan)', borderRadius: 0, boxShadow: 'none',
      }}>
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border-hairline)' }}>
          {label && (
            <div style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '3px',
              textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8,
            }}>{label}</div>
          )}
          {title && (
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 300, letterSpacing: '-0.4px', color: 'var(--color-navy)' }}>
              {title}
            </h2>
          )}
        </div>
        <div style={{ padding: '24px 28px', fontSize: 15, lineHeight: 1.6, color: 'var(--text-primary)' }}>
          {children}
        </div>
        {footer && (
          <div style={{
            padding: '18px 28px', borderTop: '1px solid var(--border-hairline)',
            display: 'flex', justifyContent: 'flex-end', gap: 12,
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
