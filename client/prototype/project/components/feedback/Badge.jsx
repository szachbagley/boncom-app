import React from 'react';

/**
 * Badge — small, flat, sharp, uppercase status/label chip.
 * `status` maps to the estimate lifecycle; `tone` sets an arbitrary color role.
 */
export function Badge({ status, tone, children, style = {}, ...rest }) {
  // Estimate-lifecycle presets
  const statusMap = {
    draft:    { bg: 'var(--color-neutral-100)', fg: 'var(--color-neutral-500)', bd: 'var(--color-neutral-200)' },
    sent:     { bg: 'transparent', fg: 'var(--color-cyan)', bd: 'var(--color-cyan)' },
    approved: { bg: 'var(--color-success-bg)', fg: 'var(--color-success)', bd: 'var(--color-success)' },
    rejected: { bg: 'var(--color-danger-bg)', fg: 'var(--color-danger)', bd: 'var(--color-danger)' },
    revised:  { bg: 'transparent', fg: 'var(--color-navy)', bd: 'var(--color-navy)' },
  };
  // Generic tone presets
  const toneMap = {
    neutral: { bg: 'var(--color-neutral-100)', fg: 'var(--color-neutral-500)', bd: 'var(--color-neutral-200)' },
    navy:    { bg: 'var(--color-navy)', fg: '#fff', bd: 'var(--color-navy)' },
    cyan:    { bg: 'var(--color-cyan)', fg: 'var(--color-navy)', bd: 'var(--color-cyan)' },
    success: { bg: 'var(--color-success-bg)', fg: 'var(--color-success)', bd: 'var(--color-success)' },
    danger:  { bg: 'var(--color-danger-bg)', fg: 'var(--color-danger)', bd: 'var(--color-danger)' },
    warning: { bg: 'var(--color-warning-bg)', fg: 'var(--color-warning)', bd: 'var(--color-warning)' },
  };
  const p = (status && statusMap[status]) || (tone && toneMap[tone]) || toneMap.neutral;
  const text = children != null ? children : (status || '');

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        height: 22, padding: '0 9px',
        fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700,
        letterSpacing: '1.4px', textTransform: 'uppercase', lineHeight: 1,
        color: p.fg, background: p.bg, border: `1px solid ${p.bd}`,
        borderRadius: 0, ...style,
      }}
      {...rest}
    >
      {text}
    </span>
  );
}
