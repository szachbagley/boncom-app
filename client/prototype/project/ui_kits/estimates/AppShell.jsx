// AppShell — sidebar + top bar chrome for the Estimates app.
function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.75 }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = '';
      const el = document.createElement('i');
      el.setAttribute('data-lucide', name);
      ref.current.appendChild(el);
      window.lucide.createIcons({ attrs: { width: size, height: size, stroke: color, 'stroke-width': strokeWidth } });
    }
  }, [name, size, color, strokeWidth]);
  return <span ref={ref} style={{ display: 'inline-flex', width: size, height: size }} />;
}

function NavItem({ icon, label, active, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: '11px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
        background: active ? 'rgba(101,198,217,0.14)' : (hover ? 'rgba(255,255,255,0.05)' : 'transparent'),
        borderLeft: `2px solid ${active ? 'var(--color-cyan)' : 'transparent'}`,
        color: active ? '#fff' : 'rgba(255,255,255,0.62)',
        fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700,
        letterSpacing: '2.3px', textTransform: 'uppercase',
        transition: 'background 140ms, color 140ms',
      }}
    >
      <Icon name={icon} size={17} color={active ? '#65C6D9' : 'rgba(255,255,255,0.55)'} />
      {label}
    </button>
  );
}

function AppShell({ nav = 'estimates', onNav, actions, children }) {
  const items = [
    { key: 'estimates', icon: 'file-text', label: 'Estimates' },
    { key: 'clients', icon: 'users', label: 'Clients' },
    { key: 'rates', icon: 'sliders-horizontal', label: 'Rate cards' },
    { key: 'reports', icon: 'bar-chart-3', label: 'Reports' },
  ];
  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0, background: 'var(--surface-page)' }}>
      {/* Sidebar */}
      <aside style={{ width: 232, flexShrink: 0, background: 'var(--color-navy)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '26px 20px 22px', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', color: '#fff' }}>Boncom</span>
            <span style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.4px', color: 'rgba(255,255,255,0.7)' }}>Estimates</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2.6px', textTransform: 'uppercase', color: 'var(--color-cyan)', marginTop: 8 }}>
            Good work · good causes
          </div>
        </div>
        <nav style={{ padding: '14px 0', flex: 1 }}>
          {items.map((it) => (
            <NavItem key={it.key} icon={it.icon} label={it.label} active={nav === it.key} onClick={() => onNav && onNav(it.key)} />
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: 'var(--color-cyan)', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>MA</div>
          <div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>Maria Alvarez</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Producer</div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <header style={{
          height: 68, flexShrink: 0, borderBottom: '1px solid var(--border-hairline)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border-hairline)', padding: '0 12px', height: 40, flex: 1 }}>
              <Icon name="search" size={16} color="#6B7A87" />
              <input placeholder="Search estimates, clients…" style={{ border: 'none', outline: 'none', flex: 1, fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{actions}</div>
        </header>
        <main style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>{children}</main>
      </div>
    </div>
  );
}

Object.assign(window, { Icon, AppShell, NavItem });
