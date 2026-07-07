import React from 'react';

/**
 * Button — the primary action primitive.
 * Sharp corners, flat, no shadow. Navy is the default primary action;
 * cyan is the accent; ghost/link are quiet. Orange "emphasis" is reserved.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  fullWidth = false,
  iconLeft = null,
  iconRight = null,
  children,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: { padding: '0 14px', height: 34, fontSize: 12, ls: '1.6px' },
    md: { padding: '0 22px', height: 44, fontSize: 13, ls: '2.3px' },
    lg: { padding: '0 32px', height: 54, fontSize: 14, ls: '2.3px' },
  };
  const s = sizes[size] || sizes.md;

  const palette = {
    primary:   { bg: 'var(--action-primary)',  fg: '#fff', bd: 'var(--action-primary)',  hoverBg: 'var(--action-primary-hover)' },
    accent:    { bg: 'var(--action-accent)',   fg: 'var(--color-navy)', bd: 'var(--action-accent)', hoverBg: 'var(--action-accent-hover)' },
    emphasis:  { bg: 'var(--action-emphasis)', fg: '#fff', bd: 'var(--action-emphasis)', hoverBg: '#E5401E' },
    secondary: { bg: 'transparent', fg: 'var(--color-navy)', bd: 'var(--color-navy)', hoverBg: 'var(--surface-hover)' },
    ghost:     { bg: 'transparent', fg: 'var(--color-navy)', bd: 'transparent', hoverBg: 'var(--surface-hover)' },
    danger:    { bg: 'transparent', fg: 'var(--color-danger)', bd: 'var(--color-danger)', hoverBg: 'var(--color-danger-bg)' },
  };
  const p = palette[variant] || palette.primary;
  const [hover, setHover] = React.useState(false);

  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: fullWidth ? '100%' : 'auto',
        height: s.height,
        padding: s.padding,
        fontFamily: 'var(--font-sans)',
        fontSize: s.fontSize,
        fontWeight: 700,
        letterSpacing: s.ls,
        textTransform: 'uppercase',
        lineHeight: 1,
        color: p.fg,
        background: hover && !disabled ? p.hoverBg : p.bg,
        border: `1px solid ${p.bd}`,
        borderRadius: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 160ms cubic-bezier(0.4,0,0.2,1), color 160ms cubic-bezier(0.4,0,0.2,1)',
        boxShadow: 'none',
        ...style,
      }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
