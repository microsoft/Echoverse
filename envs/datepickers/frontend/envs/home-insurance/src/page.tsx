import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const WDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function daysIn(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function weekday(y: number, m: number, d: number) {
  return new Date(y, m, d).getDay();
}
function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/* ================================================================
   Widget 1 – Coverage Period (range picker, future_only)
   ================================================================ */
function CoverageDatesPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [vY, setVY] = useState(2025);
  const [vM, setVM] = useState(8); // September
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const minDate = '2025-09-01';

  const prev = useCallback(() => {
    setVM(m => { if (m === 0) { setVY(y => y - 1); return 11; } return m - 1; });
  }, []);
  const next = useCallback(() => {
    setVM(m => { if (m === 11) { setVY(y => y + 1); return 0; } return m + 1; });
  }, []);

  const total = daysIn(vY, vM);
  const offset = weekday(vY, vM, 1);

  const disabled = useCallback(
    (d: number) => iso(vY, vM, d) < minDate,
    [vY, vM],
  );

  const click = useCallback(
    (d: number) => {
      if (disabled(d)) return;
      const ds = iso(vY, vM, d);
      if (!start || end) {
        setStart(ds);
        setEnd(null);
      } else if (ds < start) {
        setStart(ds);
      } else if (ds === start) {
        return;
      } else {
        setEnd(ds);
      }
    },
    [vY, vM, start, end, disabled],
  );

  const cellStyle = useCallback(
    (d: number): { bg: string; fg: string } => {
      const ds = iso(vY, vM, d);
      if (disabled(d)) return { bg: 'transparent', fg: '#CBD5E1' };
      if (ds === start || ds === end) return { bg: '#059669', fg: '#fff' };
      let lo = start, hi = end || hover;
      if (lo && hi) {
        if (hi < lo) { const t = lo; lo = hi; hi = t; }
        if (ds > lo && ds < hi) return { bg: '#ECFDF5', fg: '#065F46' };
      }
      return { bg: 'transparent', fg: '#1E293B' };
    },
    [vY, vM, start, end, hover, disabled],
  );

  const submit = useCallback(() => {
    if (start && end) {
      onSubmit({
        type: 'date_range',
        value: `${start}/${end}`,
        raw: { widget_id: 'coverage_dates', start_date: start, end_date: end },
      });
    }
  }, [start, end, onSubmit]);

  return (
    <div data-widget-id="coverage_dates" className="p-6" style={{ background: '#fefefe' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#1E293B' }}>
        📅 Coverage Period
      </h3>
      <p className="text-sm mb-4" style={{ color: '#64748B' }}>
        Select the start and end dates for your home insurance coverage. Only dates from September 1, 2025 onward are available.
      </p>

      {/* nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="px-3 py-1 text-sm font-medium" style={{ color: '#059669' }} aria-label="Previous month">‹ Prev</button>
        <span className="font-semibold text-sm" style={{ color: '#1E293B' }}>{MONTHS[vM]} {vY}</span>
        <button onClick={next} className="px-3 py-1 text-sm font-medium" style={{ color: '#059669' }} aria-label="Next month">Next ›</button>
      </div>

      {/* headers */}
      <div className="grid grid-cols-7 mb-1">
        {WDAYS.map(w => (
          <div key={w} className="text-center text-xs font-medium py-1" style={{ color: '#64748B' }}>{w}</div>
        ))}
      </div>

      {/* grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: offset }, (_, i) => <div key={`p${i}`} className="py-2" />)}
        {Array.from({ length: total }, (_, i) => {
          const d = i + 1;
          const s = cellStyle(d);
          const dis = disabled(d);
          return (
            <div
              key={d}
              onClick={() => click(d)}
              onMouseEnter={() => { if (!dis) setHover(iso(vY, vM, d)); }}
              onMouseLeave={() => setHover(null)}
              className={`text-center py-2 text-sm select-none ${dis ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              style={{ background: s.bg, color: s.fg }}
            >
              {d}
            </div>
          );
        })}
      </div>

      {/* status */}
      <div className="mt-3 text-sm" style={{ color: '#64748B' }}>
        {!start && 'Click a date to set the start of your coverage period.'}
        {start && !end && (
          <>
            Start: <strong style={{ color: '#059669' }}>{start}</strong>
            <span className="ml-2">→ Now select an end date</span>
          </>
        )}
        {start && end && (
          <>
            Start: <strong style={{ color: '#059669' }}>{start}</strong>
            <span className="mx-2">—</span>
            End: <strong style={{ color: '#059669' }}>{end}</strong>
          </>
        )}
      </div>

      <button
        onClick={submit}
        disabled={!start || !end}
        className="mt-4 px-6 py-2 text-sm font-medium text-white transition-colors"
        style={{ background: start && end ? '#059669' : '#CBD5E1', borderRadius: 0 }}
      >
        Submit Coverage Period
      </button>
    </div>
  );
}

/* ================================================================
   Widget 2 – Inspection Date (constrained, business days only)
   ================================================================ */
function InspectionDatePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [vY, setVY] = useState(2025);
  const [vM, setVM] = useState(8); // September
  const [selected, setSelected] = useState<string | null>(null);

  const holidays = useMemo(
    () => new Set(['2025-01-01', '2025-07-04', '2025-12-25', '2025-11-28']),
    [],
  );

  const prev = useCallback(() => {
    setVM(m => { if (m === 0) { setVY(y => y - 1); return 11; } return m - 1; });
  }, []);
  const next = useCallback(() => {
    setVM(m => { if (m === 11) { setVY(y => y + 1); return 0; } return m + 1; });
  }, []);

  const total = daysIn(vY, vM);
  const offset = weekday(vY, vM, 1);

  const disabled = useCallback(
    (d: number) => {
      const dow = weekday(vY, vM, d);
      if (dow === 0 || dow === 6) return true;
      if (holidays.has(iso(vY, vM, d))) return true;
      return false;
    },
    [vY, vM, holidays],
  );

  const submit = useCallback(() => {
    if (selected) {
      onSubmit({
        type: 'date',
        value: selected,
        raw: { widget_id: 'inspection_date', selected_date: selected },
      });
    }
  }, [selected, onSubmit]);

  return (
    <div data-widget-id="inspection_date" className="p-6" style={{ background: '#fefefe' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#1E293B' }}>
        🔍 Inspection Date
      </h3>
      <p className="text-sm mb-4" style={{ color: '#64748B' }}>
        Choose a business day for your home inspection. Weekends and holidays are grayed out.
      </p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="px-3 py-1 text-sm font-medium" style={{ color: '#059669' }} aria-label="Previous month">‹ Prev</button>
        <span className="font-semibold text-sm" style={{ color: '#1E293B' }}>{MONTHS[vM]} {vY}</span>
        <button onClick={next} className="px-3 py-1 text-sm font-medium" style={{ color: '#059669' }} aria-label="Next month">Next ›</button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WDAYS.map(w => (
          <div key={w} className="text-center text-xs font-medium py-1" style={{ color: '#64748B' }}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: offset }, (_, i) => <div key={`p${i}`} className="py-2" />)}
        {Array.from({ length: total }, (_, i) => {
          const d = i + 1;
          const dis = disabled(d);
          const ds = iso(vY, vM, d);
          const isSel = ds === selected;
          let bg = 'transparent';
          let fg = '#1E293B';
          if (dis) { fg = '#CBD5E1'; }
          else if (isSel) { bg = '#059669'; fg = '#fff'; }
          return (
            <div
              key={d}
              onClick={() => { if (!dis) setSelected(ds); }}
              className={`text-center py-2 text-sm select-none ${dis ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              style={{ background: bg, color: fg }}
            >
              {d}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-sm" style={{ color: '#64748B' }}>
        {selected
          ? <>Selected: <strong style={{ color: '#059669' }}>{selected}</strong></>
          : 'Select a weekday for your inspection.'}
      </div>

      <button
        onClick={submit}
        disabled={!selected}
        className="mt-4 px-6 py-2 text-sm font-medium text-white transition-colors"
        style={{ background: selected ? '#059669' : '#CBD5E1', borderRadius: 0 }}
      >
        Submit Inspection Date
      </button>
    </div>
  );
}

/* ================================================================
   Widget 3 – Compound (standard single-date picker, min date)
   ================================================================ */
function CompoundPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [vY, setVY] = useState(2025);
  const [vM, setVM] = useState(5); // June
  const [selected, setSelected] = useState<string | null>(null);

  const minDate = '2025-06-01';

  const prev = useCallback(() => {
    setVM(m => { if (m === 0) { setVY(y => y - 1); return 11; } return m - 1; });
  }, []);
  const next = useCallback(() => {
    setVM(m => { if (m === 11) { setVY(y => y + 1); return 0; } return m + 1; });
  }, []);

  const total = daysIn(vY, vM);
  const offset = weekday(vY, vM, 1);

  const disabled = useCallback(
    (d: number) => iso(vY, vM, d) < minDate,
    [vY, vM],
  );

  const submit = useCallback(() => {
    if (selected) {
      onSubmit({
        type: 'date',
        value: selected,
        raw: { widget_id: 'compound', selected_date: selected },
      });
    }
  }, [selected, onSubmit]);

  return (
    <div data-widget-id="compound" className="p-6" style={{ background: '#fefefe' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#1E293B' }}>
        📋 Coverage Period + Inspection Date
      </h3>
      <p className="text-sm mb-4" style={{ color: '#64748B' }}>
        Select a date for your combined coverage and inspection scheduling. Dates from June 1, 2025 onward are available.
      </p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="px-3 py-1 text-sm font-medium" style={{ color: '#059669' }} aria-label="Previous month">‹ Prev</button>
        <span className="font-semibold text-sm" style={{ color: '#1E293B' }}>{MONTHS[vM]} {vY}</span>
        <button onClick={next} className="px-3 py-1 text-sm font-medium" style={{ color: '#059669' }} aria-label="Next month">Next ›</button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WDAYS.map(w => (
          <div key={w} className="text-center text-xs font-medium py-1" style={{ color: '#64748B' }}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: offset }, (_, i) => <div key={`p${i}`} className="py-2" />)}
        {Array.from({ length: total }, (_, i) => {
          const d = i + 1;
          const dis = disabled(d);
          const ds = iso(vY, vM, d);
          const isSel = ds === selected;
          let bg = 'transparent';
          let fg = '#1E293B';
          if (dis) { fg = '#CBD5E1'; }
          else if (isSel) { bg = '#059669'; fg = '#fff'; }
          return (
            <div
              key={d}
              onClick={() => { if (!dis) setSelected(ds); }}
              className={`text-center py-2 text-sm select-none ${dis ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              style={{ background: bg, color: fg }}
            >
              {d}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-sm" style={{ color: '#64748B' }}>
        {selected
          ? <>Selected: <strong style={{ color: '#059669' }}>{selected}</strong></>
          : 'Select a date to proceed.'}
      </div>

      <button
        onClick={submit}
        disabled={!selected}
        className="mt-4 px-6 py-2 text-sm font-medium text-white transition-colors"
        style={{ background: selected ? '#059669' : '#CBD5E1', borderRadius: 0 }}
      >
        Submit Date
      </button>
    </div>
  );
}

/* ================================================================
   Main Page
   ================================================================ */
export default function Page_home_insurance(props: GeneratedPageProps) {
  const [filter, setFilter] = useState('home');

  return (
    <div style={{ background: '#e4e7e8', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* ── Header ── */}
      <header style={{ background: '#fefefe', borderBottom: '1px solid #e4e7e8' }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="font-bold text-xl" style={{ color: '#059669' }}>EchoSure</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {['Quotes', 'Claims', 'Policy', 'Contact'].map(item => (
              <span key={item} className="text-sm font-medium cursor-pointer" style={{ color: '#1E293B' }}>{item}</span>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm cursor-pointer hidden sm:inline" style={{ color: '#059669' }}>Policy Login</span>
            <button
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#059669', borderRadius: 0 }}
            >
              Get a Quote
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop"
          alt="Family home exterior"
          className="w-full object-cover"
          style={{ height: 260 }}
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="text-center px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Protect What Matters</h1>
            <p className="text-white text-sm opacity-90 max-w-lg mx-auto">
              Comprehensive home insurance tailored to your needs. Get covered in minutes.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* context banner */}
        <div className="mb-8 p-4" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
          <p className="text-sm" style={{ color: '#065F46' }}>
            Complete the sections below to finalize your home insurance quote. Choose your coverage period, schedule a property inspection, and confirm your selections.
          </p>
        </div>

        {/* filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { key: 'home', label: '🏠 Home Insurance' },
            { key: 'auto', label: '🚗 Auto Insurance' },
            { key: 'life', label: '☂️ Life Insurance' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: filter === f.key ? '#059669' : '#fafafa',
                color: filter === f.key ? '#fff' : '#1E293B',
                border: `1px solid ${filter === f.key ? '#059669' : '#e4e7e8'}`,
                borderRadius: 0,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Widget 1 ── */}
        <section className="mb-8" style={{ border: '1px solid #e4e7e8' }}>
          <CoverageDatesPicker onSubmit={props.onSubmit} />
        </section>

        {/* ── Widget 2 ── */}
        <section className="mb-8" style={{ border: '1px solid #e4e7e8' }}>
          <InspectionDatePicker onSubmit={props.onSubmit} />
        </section>

        {/* ── Widget 3 ── */}
        <section className="mb-8" style={{ border: '1px solid #e4e7e8' }}>
          <CompoundPicker onSubmit={props.onSubmit} />
        </section>

        {/* ── Coverage Comparison ── */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#1E293B' }}>Coverage Options</h2>
          <div className="overflow-x-auto" style={{ border: '1px solid #e4e7e8' }}>
            <table className="w-full text-sm" style={{ background: '#fefefe' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: '#1E293B' }}>Feature</th>
                  <th className="text-center px-4 py-3 font-medium" style={{ color: '#1E293B' }}>Basic</th>
                  <th className="text-center px-4 py-3 font-medium" style={{ color: '#1E293B' }}>Standard</th>
                  <th className="text-center px-4 py-3 font-medium" style={{ color: '#059669' }}>Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feat: 'Dwelling Coverage', b: '$150K', s: '$300K', p: '$500K' },
                  { feat: 'Personal Property', b: '50%', s: '70%', p: '100%' },
                  { feat: 'Liability Protection', b: '$100K', s: '$300K', p: '$500K' },
                  { feat: 'Temporary Housing', b: '—', s: '✓', p: '✓' },
                  { feat: 'Flood & Earthquake', b: '—', s: '—', p: '✓' },
                ].map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <td className="px-4 py-3" style={{ color: '#1E293B' }}>{r.feat}</td>
                    <td className="text-center px-4 py-3" style={{ color: '#64748B' }}>{r.b}</td>
                    <td className="text-center px-4 py-3" style={{ color: '#64748B' }}>{r.s}</td>
                    <td className="text-center px-4 py-3 font-medium" style={{ color: '#059669' }}>{r.p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#1E293B' }}>What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div style={{ background: '#fefefe', border: '1px solid #e4e7e8' }}>
              <img
                src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop"
                alt="Handshake representing trust"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <p className="text-sm mb-2" style={{ color: '#64748B' }}>
                  "EchoSure made the entire process seamless. From the quote to the inspection scheduling, everything was handled professionally."
                </p>
                <p className="text-xs font-semibold" style={{ color: '#1E293B' }}>— Sarah M., Austin TX</p>
              </div>
            </div>
            <div style={{ background: '#fefefe', border: '1px solid #e4e7e8' }}>
              <img
                src="https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&h=300&fit=crop"
                alt="Umbrella representing protection"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <p className="text-sm mb-2" style={{ color: '#64748B' }}>
                  "After a storm damaged our roof, EchoSure covered everything quickly. Best decision we ever made for our home."
                </p>
                <p className="text-xs font-semibold" style={{ color: '#1E293B' }}>— James R., Denver CO</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust Badges ── */}
        <section className="flex flex-wrap justify-center gap-8 py-6 mb-4" style={{ background: '#fafafa', border: '1px solid #e4e7e8' }}>
          {[
            { icon: '✓', label: 'A+ Rated' },
            { icon: '🔒', label: 'Secure & Private' },
            { icon: '⭐', label: '50K+ Policies' },
            { icon: '📞', label: '24/7 Claims Support' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-2">
              <span className="text-lg">{b.icon}</span>
              <span className="text-sm font-medium" style={{ color: '#1E293B' }}>{b.label}</span>
            </div>
          ))}
        </section>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: '#1E293B' }} className="py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🛡️</span>
                <span className="font-bold text-lg text-white">EchoSure</span>
              </div>
              <p className="text-sm" style={{ color: '#94A3B8' }}>
                Trusted home insurance since 2005. Licensed in all 50 states.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Quick Links</h4>
              <div className="flex flex-col gap-1">
                {['File a Claim', 'Coverage Options', 'FAQ', 'Accessibility'].map(l => (
                  <span key={l} className="text-sm cursor-pointer" style={{ color: '#94A3B8' }}>{l}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Contact</h4>
              <p className="text-sm" style={{ color: '#94A3B8' }}>Claims: 1-800-SAFEGUARD</p>
              <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>support@safeguard-ins.com</p>
            </div>
          </div>
          <div className="pt-6" style={{ borderTop: '1px solid #334155' }}>
            <p className="text-xs" style={{ color: '#64748B' }}>
              © 2025 EchoSure Insurance Co. All rights reserved. Coverage subject to policy terms and conditions.
              State disclosures and licensing information available upon request. NAIC #12345.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
