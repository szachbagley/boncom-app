/* @ds-bundle: {"format":4,"namespace":"BoncomEstimatesDesignSystem_54c230","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"SectionLabel","sourcePath":"components/core/SectionLabel.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Button.jsx":"396479ff8fdf","components/core/Card.jsx":"0265c958fa20","components/core/IconButton.jsx":"b146fb872152","components/core/SectionLabel.jsx":"28d6a66b81d7","components/feedback/Badge.jsx":"19c044caeabc","components/feedback/Dialog.jsx":"f1f1acbc0b96","components/forms/Checkbox.jsx":"a37262f8b2c4","components/forms/Input.jsx":"20162d22ff60","components/forms/Select.jsx":"96bf1193ab2a","components/forms/Textarea.jsx":"c2142f663b6e","components/navigation/Tabs.jsx":"6fc5c9b21a11","ui_kits/estimates/AppShell.jsx":"b2f125536d9d","ui_kits/estimates/Dashboard.jsx":"6e021b5cf813","ui_kits/estimates/EstimateEditor.jsx":"14ebe859727d","ui_kits/estimates/data.js":"9f25951e980e"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BoncomEstimatesDesignSystem_54c230 = window.BoncomEstimatesDesignSystem_54c230 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — the primary action primitive.
 * Sharp corners, flat, no shadow. Navy is the default primary action;
 * cyan is the accent; ghost/link are quiet. Orange "emphasis" is reserved.
 */
function Button({
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
    sm: {
      padding: '0 14px',
      height: 34,
      fontSize: 12,
      ls: '1.6px'
    },
    md: {
      padding: '0 22px',
      height: 44,
      fontSize: 13,
      ls: '2.3px'
    },
    lg: {
      padding: '0 32px',
      height: 54,
      fontSize: 14,
      ls: '2.3px'
    }
  };
  const s = sizes[size] || sizes.md;
  const palette = {
    primary: {
      bg: 'var(--action-primary)',
      fg: '#fff',
      bd: 'var(--action-primary)',
      hoverBg: 'var(--action-primary-hover)'
    },
    accent: {
      bg: 'var(--action-accent)',
      fg: 'var(--color-navy)',
      bd: 'var(--action-accent)',
      hoverBg: 'var(--action-accent-hover)'
    },
    emphasis: {
      bg: 'var(--action-emphasis)',
      fg: '#fff',
      bd: 'var(--action-emphasis)',
      hoverBg: '#E5401E'
    },
    secondary: {
      bg: 'transparent',
      fg: 'var(--color-navy)',
      bd: 'var(--color-navy)',
      hoverBg: 'var(--surface-hover)'
    },
    ghost: {
      bg: 'transparent',
      fg: 'var(--color-navy)',
      bd: 'transparent',
      hoverBg: 'var(--surface-hover)'
    },
    danger: {
      bg: 'transparent',
      fg: 'var(--color-danger)',
      bd: 'var(--color-danger)',
      hoverBg: 'var(--color-danger-bg)'
    }
  };
  const p = palette[variant] || palette.primary;
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
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
      ...style
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — a flat, hairline-bordered container. No shadow, no rounding.
 * Depth comes from the border and interior whitespace.
 */
function Card({
  padding = 'md',
  interactive = false,
  accent = false,
  children,
  style = {},
  ...rest
}) {
  const pad = {
    none: 0,
    sm: 16,
    md: 24,
    lg: 32
  }[padding] ?? 24;
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => interactive && setHover(false),
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-hairline)',
      borderTop: accent ? '3px solid var(--color-cyan)' : '1px solid var(--border-hairline)',
      borderRadius: 0,
      boxShadow: 'none',
      padding: pad,
      cursor: interactive ? 'pointer' : 'default',
      transition: 'border-color 160ms cubic-bezier(0.4,0,0.2,1)',
      borderColor: hover ? 'var(--border-strong)' : undefined,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * IconButton — a square, flat button for a single icon (toolbar / row actions).
 * Pass an icon element (e.g. a Lucide <i data-lucide> or SVG) as children.
 */
function IconButton({
  variant = 'ghost',
  size = 'md',
  disabled = false,
  label,
  children,
  style = {},
  ...rest
}) {
  const dim = {
    sm: 30,
    md: 38,
    lg: 46
  }[size] || 38;
  const palette = {
    ghost: {
      bg: 'transparent',
      fg: 'var(--color-navy)',
      bd: 'transparent',
      hoverBg: 'var(--surface-hover)'
    },
    secondary: {
      bg: 'transparent',
      fg: 'var(--color-navy)',
      bd: 'var(--border-strong)',
      hoverBg: 'var(--surface-hover)'
    },
    accent: {
      bg: 'var(--action-accent)',
      fg: 'var(--color-navy)',
      bd: 'var(--action-accent)',
      hoverBg: 'var(--action-accent-hover)'
    },
    danger: {
      bg: 'transparent',
      fg: 'var(--color-danger)',
      bd: 'transparent',
      hoverBg: 'var(--color-danger-bg)'
    }
  };
  const p = palette[variant] || palette.ghost;
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
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
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionLabel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SectionLabel — the spaced, uppercase micro-heading that opens a section.
 * A signature Boncom device: wide letter-spacing, bold, small.
 */
function SectionLabel({
  as = 'div',
  color,
  children,
  style = {},
  ...rest
}) {
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-label)',
      fontWeight: 700,
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: color || 'var(--text-secondary)',
      margin: 0,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { SectionLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionLabel.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge — small, flat, sharp, uppercase status/label chip.
 * `status` maps to the estimate lifecycle; `tone` sets an arbitrary color role.
 */
function Badge({
  status,
  tone,
  children,
  style = {},
  ...rest
}) {
  // Estimate-lifecycle presets
  const statusMap = {
    draft: {
      bg: 'var(--color-neutral-100)',
      fg: 'var(--color-neutral-500)',
      bd: 'var(--color-neutral-200)'
    },
    sent: {
      bg: 'transparent',
      fg: 'var(--color-cyan)',
      bd: 'var(--color-cyan)'
    },
    approved: {
      bg: 'var(--color-success-bg)',
      fg: 'var(--color-success)',
      bd: 'var(--color-success)'
    },
    rejected: {
      bg: 'var(--color-danger-bg)',
      fg: 'var(--color-danger)',
      bd: 'var(--color-danger)'
    },
    revised: {
      bg: 'transparent',
      fg: 'var(--color-navy)',
      bd: 'var(--color-navy)'
    }
  };
  // Generic tone presets
  const toneMap = {
    neutral: {
      bg: 'var(--color-neutral-100)',
      fg: 'var(--color-neutral-500)',
      bd: 'var(--color-neutral-200)'
    },
    navy: {
      bg: 'var(--color-navy)',
      fg: '#fff',
      bd: 'var(--color-navy)'
    },
    cyan: {
      bg: 'var(--color-cyan)',
      fg: 'var(--color-navy)',
      bd: 'var(--color-cyan)'
    },
    success: {
      bg: 'var(--color-success-bg)',
      fg: 'var(--color-success)',
      bd: 'var(--color-success)'
    },
    danger: {
      bg: 'var(--color-danger-bg)',
      fg: 'var(--color-danger)',
      bd: 'var(--color-danger)'
    },
    warning: {
      bg: 'var(--color-warning-bg)',
      fg: 'var(--color-warning)',
      bd: 'var(--color-warning)'
    }
  };
  const p = status && statusMap[status] || tone && toneMap[tone] || toneMap.neutral;
  const text = children != null ? children : status || '';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: 22,
      padding: '0 9px',
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '1.4px',
      textTransform: 'uppercase',
      lineHeight: 1,
      color: p.fg,
      background: p.bg,
      border: `1px solid ${p.bd}`,
      borderRadius: 0,
      ...style
    }
  }, rest), text);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
/**
 * Dialog — a centered modal over a dim scrim. Sharp corners, hairline border,
 * no shadow (a subtle scrim provides separation). Header / body / footer.
 */
function Dialog({
  open,
  onClose,
  title,
  label,
  footer,
  width = 520,
  children
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = e => e.key === 'Escape' && onClose && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onMouseDown: e => {
      if (e.target === e.currentTarget) onClose && onClose();
    },
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0, 32, 66, 0.42)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    style: {
      width,
      maxWidth: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      background: '#fff',
      border: '1px solid var(--border-strong)',
      borderTop: '3px solid var(--color-cyan)',
      borderRadius: 0,
      boxShadow: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 28px 20px',
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, label && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '3px',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)',
      marginBottom: 8
    }
  }, label), title && /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 24,
      fontWeight: 300,
      letterSpacing: '-0.4px',
      color: 'var(--color-navy)'
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 28px',
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--text-primary)'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 28px',
      borderTop: '1px solid var(--border-hairline)',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 12
    }
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/**
 * Checkbox — square (never rounded) box with a cyan checked fill.
 */
function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  id,
  style = {}
}) {
  const inputId = id || React.useId();
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const handle = e => {
    if (!isControlled) setInternal(e.target.checked);
    onChange && onChange(e);
  };
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'var(--text-primary)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    id: inputId,
    type: "checkbox",
    checked: on,
    disabled: disabled,
    onChange: handle,
    style: {
      position: 'absolute',
      opacity: 0,
      width: 1,
      height: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      flexShrink: 0,
      borderRadius: 0,
      border: `1px solid ${on ? 'var(--color-cyan)' : 'var(--border-strong)'}`,
      background: on ? 'var(--color-cyan)' : '#fff',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 140ms, border-color 140ms'
    }
  }, on && /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--color-navy)",
    strokeWidth: "3",
    strokeLinecap: "square"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12l5 5L19 7"
  }))), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — single-line text field. Sharp corners, hairline border,
 * cyan focus ring (border, not glow). Optional label + hint/error.
 */
function Input({
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
  const borderColor = error ? 'var(--color-danger)' : focus ? 'var(--border-focus)' : 'var(--border-strong)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...wrapStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '2.3px',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      border: `1px solid ${borderColor}`,
      background: '#fff',
      transition: 'border-color 160ms cubic-bezier(0.4,0,0.2,1)'
    }
  }, prefix != null && /*#__PURE__*/React.createElement("span", {
    style: {
      paddingLeft: 14,
      color: 'var(--text-secondary)',
      fontSize: 15
    }
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    onFocus: e => {
      setFocus(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur && rest.onBlur(e);
    }
  }, rest, {
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      fontWeight: 400,
      color: 'var(--text-primary)',
      height: 44,
      padding: '0 14px',
      borderRadius: 0,
      ...style
    }
  })), suffix != null && /*#__PURE__*/React.createElement("span", {
    style: {
      paddingRight: 14,
      color: 'var(--text-secondary)',
      fontSize: 15
    }
  }, suffix)), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: error ? 'var(--color-danger)' : 'var(--text-secondary)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Select — native select styled to match Input. Sharp, hairline, cyan focus.
 * Pass options as [{value,label}] or use children <option>s.
 */
function Select({
  label,
  hint,
  error,
  options,
  id,
  children,
  style = {},
  wrapStyle = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || React.useId();
  const borderColor = error ? 'var(--color-danger)' : focus ? 'var(--border-focus)' : 'var(--border-strong)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...wrapStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '2.3px',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: inputId,
    onFocus: e => {
      setFocus(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur && rest.onBlur(e);
    }
  }, rest, {
    style: {
      flex: 1,
      appearance: 'none',
      WebkitAppearance: 'none',
      border: `1px solid ${borderColor}`,
      outline: 'none',
      background: '#fff',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      fontWeight: 400,
      color: 'var(--text-primary)',
      height: 44,
      padding: '0 40px 0 14px',
      borderRadius: 0,
      transition: 'border-color 160ms cubic-bezier(0.4,0,0.2,1)',
      cursor: 'pointer',
      ...style
    }
  }), options ? options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label)) : children), /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--color-navy)",
    strokeWidth: "2",
    strokeLinecap: "square",
    style: {
      position: 'absolute',
      right: 14,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 9l6 6 6-6"
  }))), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: error ? 'var(--color-danger)' : 'var(--text-secondary)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Textarea — multi-line text field. Matches Input styling.
 */
function Textarea({
  label,
  hint,
  error,
  id,
  rows = 4,
  style = {},
  wrapStyle = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || React.useId();
  const borderColor = error ? 'var(--color-danger)' : focus ? 'var(--border-focus)' : 'var(--border-strong)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...wrapStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '2.3px',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("textarea", _extends({
    id: inputId,
    rows: rows,
    onFocus: e => {
      setFocus(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur && rest.onBlur(e);
    }
  }, rest, {
    style: {
      border: `1px solid ${borderColor}`,
      outline: 'none',
      background: '#fff',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      fontWeight: 400,
      lineHeight: 1.6,
      color: 'var(--text-primary)',
      padding: '12px 14px',
      borderRadius: 0,
      resize: 'vertical',
      transition: 'border-color 160ms cubic-bezier(0.4,0,0.2,1)',
      ...style
    }
  })), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: error ? 'var(--color-danger)' : 'var(--text-secondary)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/**
 * Tabs — a flat, underline-style tab row. Active tab carries a cyan underline
 * and navy label; inactive tabs are quiet gray. Uppercase, spaced labels.
 * Controlled via `value`/`onChange` or uncontrolled via `defaultValue`.
 */
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  style = {}
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.value);
  const active = value !== undefined ? value : internal;
  const select = v => {
    if (value === undefined) setInternal(v);
    onChange && onChange(v);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 32,
      borderBottom: '1px solid var(--border-hairline)',
      ...style
    }
  }, items.map(it => {
    const on = it.value === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      type: "button",
      onClick: () => select(it.value),
      style: {
        appearance: 'none',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '0 0 14px',
        margin: 0,
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '2.3px',
        textTransform: 'uppercase',
        color: on ? 'var(--color-navy)' : 'var(--text-secondary)',
        borderBottom: `2px solid ${on ? 'var(--color-cyan)' : 'transparent'}`,
        marginBottom: -1,
        transition: 'color 140ms, border-color 140ms',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8
      }
    }, it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0,
        color: on ? 'var(--color-navy)' : 'var(--text-muted)'
      }
    }, it.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/estimates/AppShell.jsx
try { (() => {
// AppShell — sidebar + top bar chrome for the Estimates app.
function Icon({
  name,
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.75
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = '';
      const el = document.createElement('i');
      el.setAttribute('data-lucide', name);
      ref.current.appendChild(el);
      window.lucide.createIcons({
        attrs: {
          width: size,
          height: size,
          stroke: color,
          'stroke-width': strokeWidth
        }
      });
    }
  }, [name, size, color, strokeWidth]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    style: {
      display: 'inline-flex',
      width: size,
      height: size
    }
  });
}
function NavItem({
  icon,
  label,
  active,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      padding: '11px 14px',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      background: active ? 'rgba(101,198,217,0.14)' : hover ? 'rgba(255,255,255,0.05)' : 'transparent',
      borderLeft: `2px solid ${active ? 'var(--color-cyan)' : 'transparent'}`,
      color: active ? '#fff' : 'rgba(255,255,255,0.62)',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '2.3px',
      textTransform: 'uppercase',
      transition: 'background 140ms, color 140ms'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 17,
    color: active ? '#65C6D9' : 'rgba(255,255,255,0.55)'
  }), label);
}
function AppShell({
  nav = 'estimates',
  onNav,
  actions,
  children
}) {
  const items = [{
    key: 'estimates',
    icon: 'file-text',
    label: 'Estimates'
  }, {
    key: 'clients',
    icon: 'users',
    label: 'Clients'
  }, {
    key: 'rates',
    icon: 'sliders-horizontal',
    label: 'Rate cards'
  }, {
    key: 'reports',
    icon: 'bar-chart-3',
    label: 'Reports'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100%',
      minHeight: 0,
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 232,
      flexShrink: 0,
      background: 'var(--color-navy)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '26px 20px 22px',
      borderBottom: '1px solid rgba(255,255,255,0.10)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: '-0.4px',
      color: '#fff'
    }
  }, "Boncom"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 300,
      letterSpacing: '-0.4px',
      color: 'rgba(255,255,255,0.7)'
    }
  }, "Estimates")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '2.6px',
      textTransform: 'uppercase',
      color: 'var(--color-cyan)',
      marginTop: 8
    }
  }, "Good work \xB7 good causes")), /*#__PURE__*/React.createElement("nav", {
    style: {
      padding: '14px 0',
      flex: 1
    }
  }, items.map(it => /*#__PURE__*/React.createElement(NavItem, {
    key: it.key,
    icon: it.icon,
    label: it.label,
    active: nav === it.key,
    onClick: () => onNav && onNav(it.key)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 20px',
      borderTop: '1px solid rgba(255,255,255,0.10)',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      background: 'var(--color-cyan)',
      color: 'var(--color-navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: 12
    }
  }, "MA"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#fff',
      fontWeight: 600
    }
  }, "Maria Alvarez"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.5)'
    }
  }, "Producer")))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      height: 68,
      flexShrink: 0,
      borderBottom: '1px solid var(--border-hairline)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      maxWidth: 420
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      border: '1px solid var(--border-hairline)',
      padding: '0 12px',
      height: 40,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 16,
    color: "#6B7A87"
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Search estimates, clients\u2026",
    style: {
      border: 'none',
      outline: 'none',
      flex: 1,
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--text-primary)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, actions)), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      minHeight: 0,
      overflow: 'auto'
    }
  }, children)));
}
Object.assign(window, {
  Icon,
  AppShell,
  NavItem
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/estimates/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/estimates/Dashboard.jsx
try { (() => {
// Dashboard — the estimates list view.
function Dashboard({
  onOpen,
  onNew
}) {
  const NS = window.BoncomEstimatesDesignSystem_54c230;
  const {
    Button,
    Badge,
    Tabs,
    SectionLabel
  } = NS;
  const {
    estimates,
    money
  } = window.EstData;
  const [tab, setTab] = React.useState('all');
  const counts = {
    all: estimates.length,
    draft: estimates.filter(e => e.status === 'draft').length,
    sent: estimates.filter(e => e.status === 'sent').length,
    approved: estimates.filter(e => e.status === 'approved').length
  };
  const rows = tab === 'all' ? estimates : estimates.filter(e => e.status === tab);
  const outstanding = estimates.filter(e => e.status === 'sent').reduce((s, e) => s + e.total, 0);
  const approved = estimates.filter(e => e.status === 'approved').reduce((s, e) => s + e.total, 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '32px 32px 48px',
      maxWidth: 1120,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "Workspace"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: '8px 0 0',
      fontSize: 40,
      fontWeight: 300,
      letterSpacing: '-1.2px',
      color: 'var(--color-navy)'
    }
  }, "Estimates")), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 16,
      color: "#fff"
    }),
    onClick: onNew
  }, "New estimate")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      borderTop: '1px solid var(--border-hairline)',
      borderBottom: '1px solid var(--border-hairline)',
      marginBottom: 28
    }
  }, [{
    label: 'Open estimates',
    value: counts.all,
    sub: 'across all clients'
  }, {
    label: 'Awaiting response',
    value: money(outstanding),
    sub: `${counts.sent} sent`
  }, {
    label: 'Approved this quarter',
    value: money(approved),
    sub: `${counts.approved} projects`
  }].map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: '20px 24px',
      borderLeft: i ? '1px solid var(--border-hairline)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '2.3px',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, s.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 300,
      letterSpacing: '-0.8px',
      color: 'var(--color-navy)',
      marginTop: 8
    }
  }, s.value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)',
      marginTop: 2
    }
  }, s.sub)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: 'all',
      label: 'All',
      count: counts.all
    }, {
      value: 'draft',
      label: 'Drafts',
      count: counts.draft
    }, {
      value: 'sent',
      label: 'Sent',
      count: counts.sent
    }, {
      value: 'approved',
      label: 'Approved',
      count: counts.approved
    }]
  })), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ['Estimate', 'Client & project', 'Owner', 'Status', 'Total', ''].map((h, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    style: {
      textAlign: i === 4 ? 'right' : 'left',
      padding: '14px 16px',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '1.8px',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)',
      borderBottom: '1px solid var(--border-hairline)',
      whiteSpace: 'nowrap'
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, rows.map(e => /*#__PURE__*/React.createElement(Row, {
    key: e.id,
    e: e,
    onOpen: onOpen
  })))));
}
function Row({
  e,
  onOpen
}) {
  const {
    Badge
  } = window.BoncomEstimatesDesignSystem_54c230;
  const {
    money
  } = window.EstData;
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("tr", {
    onClick: () => onOpen(e),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      cursor: 'pointer',
      background: hover ? 'var(--surface-subtle)' : 'transparent'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '16px',
      borderBottom: '1px solid var(--border-hairline)',
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: '1px',
      color: 'var(--color-navy)',
      whiteSpace: 'nowrap'
    }
  }, e.id), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '16px',
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--color-navy)'
    }
  }, e.client), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)'
    }
  }, e.project)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '16px',
      borderBottom: '1px solid var(--border-hairline)',
      fontSize: 14,
      color: 'var(--text-primary)',
      whiteSpace: 'nowrap'
    }
  }, e.owner), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '16px',
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    status: e.status
  })), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '16px',
      borderBottom: '1px solid var(--border-hairline)',
      textAlign: 'right',
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--color-navy)',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap'
    }
  }, money(e.total)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '16px',
      borderBottom: '1px solid var(--border-hairline)',
      textAlign: 'right',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 18,
    color: hover ? '#002042' : '#BFCED9'
  })));
}
Object.assign(window, {
  Dashboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/estimates/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/estimates/EstimateEditor.jsx
try { (() => {
// EstimateEditor — detail / editing view for a single estimate.
function EstimateEditor({
  estimate,
  onBack,
  onSend
}) {
  const NS = window.BoncomEstimatesDesignSystem_54c230;
  const {
    Button,
    Badge,
    SectionLabel,
    Input,
    Select,
    Checkbox,
    Card
  } = NS;
  const {
    lineItems,
    money
  } = window.EstData;
  const [contingency, setContingency] = React.useState(true);
  const e = estimate || {
    id: 'NEW',
    client: 'New client',
    project: 'Untitled project',
    status: 'draft',
    owner: 'M. Alvarez'
  };
  const sections = ['Pre-production', 'Production', 'Post-production'];
  const subtotal = lineItems.reduce((s, li) => s + li.qty * li.rate, 0);
  const cont = contingency ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + cont;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 32px 60px',
      maxWidth: 1120,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-secondary)',
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '2.3px',
      textTransform: 'uppercase',
      padding: '8px 0',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 15,
    color: "#6B7A87"
  }), " Estimates"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 24,
      paddingBottom: 24,
      borderBottom: '1px solid var(--border-hairline)',
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '1.5px',
      color: 'var(--color-navy)'
    }
  }, e.id), /*#__PURE__*/React.createElement(Badge, {
    status: e.status
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 34,
      fontWeight: 300,
      letterSpacing: '-1px',
      color: 'var(--color-navy)'
    }
  }, e.client), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      color: 'var(--text-secondary)',
      marginTop: 4
    }
  }, e.project)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "printer",
      size: 15,
      color: "#002042"
    })
  }, "Export"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost"
  }, "Save draft"), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "send",
      size: 15,
      color: "#002042"
    }),
    onClick: onSend
  }, "Send"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 320px',
      gap: 40,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Line items"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 14,
      color: "#002042"
    })
  }, "Add item")), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ['Description', 'Qty', 'Unit', 'Rate', 'Amount'].map((h, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    style: {
      textAlign: i > 0 ? i === 4 ? 'right' : 'center' : 'left',
      padding: '0 12px 10px',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '1.6px',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)',
      borderBottom: '1px solid var(--border-strong)'
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, sections.map(sec => /*#__PURE__*/React.createElement(React.Fragment, {
    key: sec
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 5,
    style: {
      padding: '18px 12px 8px',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '2px',
      textTransform: 'uppercase',
      color: 'var(--color-cyan)'
    }
  }, sec)), lineItems.filter(li => li.section === sec).map((li, idx) => /*#__PURE__*/React.createElement("tr", {
    key: idx
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 12px',
      borderBottom: '1px solid var(--border-hairline)',
      fontSize: 15,
      color: 'var(--text-primary)'
    }
  }, li.desc), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 12px',
      borderBottom: '1px solid var(--border-hairline)',
      textAlign: 'center',
      fontSize: 14,
      color: 'var(--text-primary)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, li.qty), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 12px',
      borderBottom: '1px solid var(--border-hairline)',
      textAlign: 'center',
      fontSize: 13,
      color: 'var(--text-secondary)'
    }
  }, li.unit), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 12px',
      borderBottom: '1px solid var(--border-hairline)',
      textAlign: 'center',
      fontSize: 14,
      color: 'var(--text-primary)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, money(li.rate)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 12px',
      borderBottom: '1px solid var(--border-hairline)',
      textAlign: 'right',
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--color-navy)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, money(li.qty * li.rate))))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "lg",
    accent: true
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    style: {
      marginBottom: 16
    }
  }, "Summary"), /*#__PURE__*/React.createElement(SummaryRow, {
    label: "Subtotal",
    value: money(subtotal)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Contingency 10%",
    checked: contingency,
    onChange: ev => setContingency(ev.target.checked)
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: 'var(--text-primary)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, money(cont))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingTop: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '2.3px',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 32,
      fontWeight: 300,
      letterSpacing: '-1px',
      color: 'var(--color-navy)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, money(total)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Details"), /*#__PURE__*/React.createElement(Select, {
    label: "Owner",
    defaultValue: e.owner,
    options: [{
      value: e.owner,
      label: e.owner
    }, {
      value: 'S. Okafor',
      label: 'S. Okafor'
    }, {
      value: 'J. Pike',
      label: 'J. Pike'
    }]
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Valid until",
    defaultValue: "Aug 15, 2026",
    suffix: /*#__PURE__*/React.createElement(Icon, {
      name: "calendar",
      size: 15,
      color: "#6B7A87"
    })
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Apply nonprofit rate",
    defaultChecked: true
  })))));
}
function SummaryRow({
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: 'var(--text-primary)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: 'var(--text-primary)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, value));
}
Object.assign(window, {
  EstimateEditor
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/estimates/EstimateEditor.jsx", error: String((e && e.message) || e) }); }

// ui_kits/estimates/data.js
try { (() => {
// Shared fake data + helpers for the Boncom Estimates UI kit.
window.EstData = function () {
  const estimates = [{
    id: 'RVB-004',
    client: 'Riverbend Foundation',
    project: 'Brand film — 90s',
    owner: 'M. Alvarez',
    status: 'draft',
    total: 48200,
    updated: 'Today'
  }, {
    id: 'CLN-118',
    client: 'Cleanwater Alliance',
    project: 'Annual report + microsite',
    owner: 'S. Okafor',
    status: 'sent',
    total: 63400,
    updated: 'Yesterday'
  }, {
    id: 'HOP-052',
    client: 'Hope Collective',
    project: 'Fundraising campaign',
    owner: 'M. Alvarez',
    status: 'approved',
    total: 122000,
    updated: '2 days ago'
  }, {
    id: 'GRN-231',
    client: 'Greenline Trust',
    project: 'Social video series',
    owner: 'J. Pike',
    status: 'sent',
    total: 27500,
    updated: '3 days ago'
  }, {
    id: 'LIT-009',
    client: 'Literacy Now',
    project: 'Website redesign',
    owner: 'S. Okafor',
    status: 'revised',
    total: 89100,
    updated: 'Last week'
  }, {
    id: 'FDB-077',
    client: 'Foodbank Regional',
    project: 'PSA broadcast spot',
    owner: 'J. Pike',
    status: 'rejected',
    total: 54000,
    updated: 'Last week'
  }, {
    id: 'SHL-045',
    client: 'Shelter First',
    project: 'Donor stewardship kit',
    owner: 'M. Alvarez',
    status: 'draft',
    total: 18750,
    updated: 'Last week'
  }, {
    id: 'EDU-300',
    client: 'EdReach',
    project: 'Explainer animation',
    owner: 'J. Pike',
    status: 'approved',
    total: 41200,
    updated: '2 weeks ago'
  }];
  const lineItems = [{
    section: 'Pre-production',
    desc: 'Creative direction & scripting',
    qty: 3,
    unit: 'days',
    rate: 1250
  }, {
    section: 'Pre-production',
    desc: 'Storyboarding',
    qty: 2,
    unit: 'days',
    rate: 950
  }, {
    section: 'Production',
    desc: 'Director',
    qty: 2,
    unit: 'days',
    rate: 1800
  }, {
    section: 'Production',
    desc: 'Crew & equipment',
    qty: 2,
    unit: 'days',
    rate: 4200
  }, {
    section: 'Production',
    desc: 'Location & permits',
    qty: 1,
    unit: 'flat',
    rate: 2400
  }, {
    section: 'Post-production',
    desc: 'Editorial',
    qty: 5,
    unit: 'days',
    rate: 1100
  }, {
    section: 'Post-production',
    desc: 'Color & sound mix',
    qty: 2,
    unit: 'days',
    rate: 1350
  }, {
    section: 'Post-production',
    desc: 'Motion graphics',
    qty: 3,
    unit: 'days',
    rate: 1150
  }];
  const money = n => '$' + n.toLocaleString('en-US');
  return {
    estimates,
    lineItems,
    money
  };
}();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/estimates/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.SectionLabel = __ds_scope.SectionLabel;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
