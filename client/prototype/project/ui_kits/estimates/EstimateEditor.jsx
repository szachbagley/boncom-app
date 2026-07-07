// EstimateEditor — detail / editing view for a single estimate.
function EstimateEditor({ estimate, onBack, onSend }) {
  const NS = window.BoncomEstimatesDesignSystem_54c230;
  const { Button, Badge, SectionLabel, Input, Select, Checkbox, Card } = NS;
  const { lineItems, money } = window.EstData;
  const [contingency, setContingency] = React.useState(true);

  const e = estimate || { id: 'NEW', client: 'New client', project: 'Untitled project', status: 'draft', owner: 'M. Alvarez' };

  const sections = ['Pre-production', 'Production', 'Post-production'];
  const subtotal = lineItems.reduce((s, li) => s + li.qty * li.rate, 0);
  const cont = contingency ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + cont;

  return (
    <div style={{ padding: '24px 32px 60px', maxWidth: 1120, margin: '0 auto' }}>
      {/* Breadcrumb / back */}
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, letterSpacing: '2.3px', textTransform: 'uppercase', padding: '8px 0', marginBottom: 8 }}>
        <Icon name="arrow-left" size={15} color="#6B7A87" /> Estimates
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, paddingBottom: 24, borderBottom: '1px solid var(--border-hairline)', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '1.5px', color: 'var(--color-navy)' }}>{e.id}</span>
            <Badge status={e.status} />
          </div>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 300, letterSpacing: '-1px', color: 'var(--color-navy)' }}>{e.client}</h1>
          <div style={{ fontSize: 17, color: 'var(--text-secondary)', marginTop: 4 }}>{e.project}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" iconLeft={<Icon name="printer" size={15} color="#002042" />}>Export</Button>
          <Button variant="ghost">Save draft</Button>
          <Button variant="accent" iconLeft={<Icon name="send" size={15} color="#002042" />} onClick={onSend}>Send</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40, alignItems: 'start' }}>
        {/* Left — line items */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <SectionLabel>Line items</SectionLabel>
            <Button size="sm" variant="ghost" iconLeft={<Icon name="plus" size={14} color="#002042" />}>Add item</Button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
            <thead>
              <tr>
                {['Description', 'Qty', 'Unit', 'Rate', 'Amount'].map((h, i) => (
                  <th key={i} style={{ textAlign: i > 0 ? (i === 4 ? 'right' : 'center') : 'left', padding: '0 12px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-strong)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map((sec) => (
                <React.Fragment key={sec}>
                  <tr>
                    <td colSpan={5} style={{ padding: '18px 12px 8px', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-cyan)' }}>{sec}</td>
                  </tr>
                  {lineItems.filter(li => li.section === sec).map((li, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-hairline)', fontSize: 15, color: 'var(--text-primary)' }}>{li.desc}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-hairline)', textAlign: 'center', fontSize: 14, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{li.qty}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-hairline)', textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>{li.unit}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-hairline)', textAlign: 'center', fontSize: 14, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{money(li.rate)}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-hairline)', textAlign: 'right', fontSize: 15, fontWeight: 600, color: 'var(--color-navy)', fontVariantNumeric: 'tabular-nums' }}>{money(li.qty * li.rate)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right — summary rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card padding="lg" accent>
            <SectionLabel style={{ marginBottom: 16 }}>Summary</SectionLabel>
            <SummaryRow label="Subtotal" value={money(subtotal)} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-hairline)' }}>
              <Checkbox label="Contingency 10%" checked={contingency} onChange={(ev) => setContingency(ev.target.checked)} />
              <span style={{ fontSize: 15, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{money(cont)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 18 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2.3px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Total</span>
              <span style={{ fontSize: 32, fontWeight: 300, letterSpacing: '-1px', color: 'var(--color-navy)', fontVariantNumeric: 'tabular-nums' }}>{money(total)}</span>
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionLabel>Details</SectionLabel>
            <Select label="Owner" defaultValue={e.owner} options={[{ value: e.owner, label: e.owner }, { value: 'S. Okafor', label: 'S. Okafor' }, { value: 'J. Pike', label: 'J. Pike' }]} />
            <Input label="Valid until" defaultValue="Aug 15, 2026" suffix={<Icon name="calendar" size={15} color="#6B7A87" />} />
            <Checkbox label="Apply nonprofit rate" defaultChecked />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-hairline)' }}>
      <span style={{ fontSize: 15, color: 'var(--text-primary)' }}>{label}</span>
      <span style={{ fontSize: 15, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

Object.assign(window, { EstimateEditor });
