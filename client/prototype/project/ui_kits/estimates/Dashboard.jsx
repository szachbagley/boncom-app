// Dashboard — the estimates list view.
function Dashboard({ onOpen, onNew }) {
  const NS = window.BoncomEstimatesDesignSystem_54c230;
  const { Button, Badge, Tabs, SectionLabel } = NS;
  const { estimates, money } = window.EstData;
  const [tab, setTab] = React.useState('all');

  const counts = {
    all: estimates.length,
    draft: estimates.filter(e => e.status === 'draft').length,
    sent: estimates.filter(e => e.status === 'sent').length,
    approved: estimates.filter(e => e.status === 'approved').length,
  };
  const rows = tab === 'all' ? estimates : estimates.filter(e => e.status === tab);

  const outstanding = estimates.filter(e => e.status === 'sent').reduce((s, e) => s + e.total, 0);
  const approved = estimates.filter(e => e.status === 'approved').reduce((s, e) => s + e.total, 0);

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 1120, margin: '0 auto' }}>
      {/* Heading */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <SectionLabel>Workspace</SectionLabel>
          <h1 style={{ margin: '8px 0 0', fontSize: 40, fontWeight: 300, letterSpacing: '-1.2px', color: 'var(--color-navy)' }}>Estimates</h1>
        </div>
        <Button variant="primary" iconLeft={<Icon name="plus" size={16} color="#fff" />} onClick={onNew}>New estimate</Button>
      </div>

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: '1px solid var(--border-hairline)', borderBottom: '1px solid var(--border-hairline)', marginBottom: 28 }}>
        {[
          { label: 'Open estimates', value: counts.all, sub: 'across all clients' },
          { label: 'Awaiting response', value: money(outstanding), sub: `${counts.sent} sent` },
          { label: 'Approved this quarter', value: money(approved), sub: `${counts.approved} projects` },
        ].map((s, i) => (
          <div key={i} style={{ padding: '20px 24px', borderLeft: i ? '1px solid var(--border-hairline)' : 'none' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2.3px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{s.label}</div>
            <div style={{ fontSize: 30, fontWeight: 300, letterSpacing: '-0.8px', color: 'var(--color-navy)', marginTop: 8 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 4 }}>
        <Tabs value={tab} onChange={setTab} items={[
          { value: 'all', label: 'All', count: counts.all },
          { value: 'draft', label: 'Drafts', count: counts.draft },
          { value: 'sent', label: 'Sent', count: counts.sent },
          { value: 'approved', label: 'Approved', count: counts.approved },
        ]} />
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
        <thead>
          <tr>
            {['Estimate', 'Client & project', 'Owner', 'Status', 'Total', ''].map((h, i) => (
              <th key={i} style={{
                textAlign: i === 4 ? 'right' : 'left', padding: '14px 16px',
                fontSize: 11, fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase',
                color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-hairline)', whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => <Row key={e.id} e={e} onOpen={onOpen} />)}
        </tbody>
      </table>
    </div>
  );
}

function Row({ e, onOpen }) {
  const { Badge } = window.BoncomEstimatesDesignSystem_54c230;
  const { money } = window.EstData;
  const [hover, setHover] = React.useState(false);
  return (
    <tr
      onClick={() => onOpen(e)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ cursor: 'pointer', background: hover ? 'var(--surface-subtle)' : 'transparent' }}
    >
      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-hairline)', fontWeight: 700, fontSize: 13, letterSpacing: '1px', color: 'var(--color-navy)', whiteSpace: 'nowrap' }}>{e.id}</td>
      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-hairline)' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-navy)' }}>{e.client}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{e.project}</div>
      </td>
      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-hairline)', fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{e.owner}</td>
      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-hairline)' }}><Badge status={e.status} /></td>
      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-hairline)', textAlign: 'right', fontSize: 15, fontWeight: 600, color: 'var(--color-navy)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{money(e.total)}</td>
      <td style={{ padding: '16px', borderBottom: '1px solid var(--border-hairline)', textAlign: 'right', color: 'var(--text-muted)' }}>
        <Icon name="chevron-right" size={18} color={hover ? '#002042' : '#BFCED9'} />
      </td>
    </tr>
  );
}

Object.assign(window, { Dashboard });
