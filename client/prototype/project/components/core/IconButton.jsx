import React from 'react';

/**
 * IconButton — a square, flat button for a single icon (toolbar / row actions).
 * Pass an icon element (e.g. a Lucide <i data-lucide> or SVG) as children.
 */
export function IconButton({
  variant = 'ghost',
  size = 'md',
  disabled = false,
  label,
  children,
  style = {},
  ...rest
}) {
  const dim = { sm: 30, md: 38, lg: 46 }[size] || 38;

  const palette = {
    ghost:     { bg: 'transparent', fg: 'var(--color-navy)', bd: 'transparent', hoverBg: 'var(--surface-hover)' },
    secondary: { bg: 'transparent', fg: 'var(--color-navy)', bd: 'var(--border-strong)', hoverBg: 'var(--surface-hover)' },
    accent:    { bg: 'var(--action-accent)', fg: 'var(--color-navy)', bd: 'var(--action-accent)', hoverBg: 'var(--action-accent-hover)' },
    danger:    { bg: 'transparent', fg: 'var(--color-danger)', bd: 'transparent', hoverBg: 'var(--color-danger-bg)' },
  };
  const p = palette[variant] || palette.ghost;
  const [hover, setHover] = React.useState(false);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dim,
        height: dim,
        color: p.fg,
        background: hover && !disabled ? p.hoverBg : p.bg,
        border: `1px solid ${p.bd}`,
        borderRadius: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        boxShadow: 'none',
        transition: 'background 160ms cubic-bezier(0.4,0,0.2,1)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
