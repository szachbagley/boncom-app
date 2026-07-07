import React from 'react';

/**
 * SectionLabel — the spaced, uppercase micro-heading that opens a section.
 * A signature Boncom device: wide letter-spacing, bold, small.
 */
export function SectionLabel({ as = 'div', color, children, style = {}, ...rest }) {
  const Tag = as;
  return (
    <Tag
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-label)',
        fontWeight: 700,
        letterSpacing: 'var(--ls-label)',
        textTransform: 'uppercase',
        color: color || 'var(--text-secondary)',
        margin: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
