import React, { useState, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function firstDow(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}
function pad(n: number) {
  return n < 10 ? '0' + n : '' + n;
}
function iso(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

/* ── Single-date calendar ─────────────────────────────── */
function CalendarPicker({
  initYear, initMonth, minDate, maxDate, selected, onSelect,
}: {
  initYear: number; initMonth: number;
  minDate?: string; maxDate?: string;
  selected: string | null; onSelect: (d: string) => void;
}) {
  const [vy, setVy] = useState(initYear);
  const [vm, setVm] = useState(initMonth);

  const dim = daysInMonth(vy, vm);
  const fd = firstDow(vy, vm);

  const prev = () => { if (vm === 0) { setVm(11); setVy(vy - 1); } else setVm(vm - 1); };
  const next = () => { if (vm === 11) { setVm(0); setVy(vy + 1); } else setVm(vm + 1); };

  const disabled = (d: number) => {
    const s = iso(vy, vm, d);
    if (minDate && s < minDate) return true;
    if (maxDate && s > maxDate) return true;
    return false;
  };

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < fd; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= dim; d++) {
    const dis = disabled(d);
    const sel = selected === iso(vy, vm, d);
    cells.push(
      <button key={d} type="button" disabled={dis}
        onClick={() => { if (!dis) onSelect(iso(vy, vm, d)); }}
        className={`h-9 text-sm flex items-center justify-center transition-colors
          ${dis ? 'cursor-not-allowed' : 'cursor-pointer'}
          ${!dis && !sel ? 'hover:bg-gray-100' : ''}`}
        style={{
          borderRadius: 0,
          backgroundColor: sel ? '#059669' : undefined,
          color: dis ? '#cbd5e1' : sel ? '#fff' : '#1E293B',
          fontWeight: sel ? 600 : 400,
        }}
      >{d}</button>,
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prev} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100" style={{ borderRadius: 0, color: '#1E293B' }}>‹</button>
        <span className="text-sm font-medium" style={{ color: '#1E293B' }}>{MONTHS[vm]} {vy}</span>
        <button type="button" onClick={next} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100" style={{ borderRadius: 0, color: '#1E293B' }}>›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="h-8 flex items-center justify-center text-xs font-medium" style={{ color: '#64748b' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">{cells}</div>
    </div>
  );
}

/* ── DOB picker (year + month dropdowns + day grid) ──── */
function DOBPicker({
  initMonth, minYear, maxYear, maxDate, selected, onSelect,
}: {
  initMonth: number; minYear: number; maxYear: number;
  maxDate?: string; selected: string | null; onSelect: (d: string) => void;
}) {
  const [vy, setVy] = useState(maxYear);
  const [vm, setVm] = useState(initMonth);

  const years = useMemo(() => {
    const a: number[] = [];
    for (let y = maxYear; y >= minYear; y--) a.push(y);
    return a;
  }, [minYear, maxYear]);

  const dim = daysInMonth(vy, vm);
  const fd = firstDow(vy, vm);

  const disabled = (d: number) => {
    const s = iso(vy, vm, d);
    if (maxDate && s > maxDate) return true;
    return false;
  };

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < fd; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= dim; d++) {
    const dis = disabled(d);
    const sel = selected === iso(vy, vm, d);
    cells.push(
      <button key={d} type="button" disabled={dis}
        onClick={() => { if (!dis) onSelect(iso(vy, vm, d)); }}
        className={`h-9 text-sm flex items-center justify-center transition-colors
          ${dis ? 'cursor-not-allowed' : 'cursor-pointer'}
          ${!dis && !sel ? 'hover:bg-gray-100' : ''}`}
        style={{
          borderRadius: 0,
          backgroundColor: sel ? '#059669' : undefined,
          color: dis ? '#cbd5e1' : sel ? '#fff' : '#1E293B',
          fontWeight: sel ? 600 : 400,
        }}
      >{d}</button>,
    );
  }

  const selectStyle: React.CSSProperties = { borderRadius: 0, borderColor: '#d8e1e9', color: '#1E293B' };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <select value={vy} onChange={e => setVy(Number(e.target.value))}
          className="border px-3 py-2 text-sm bg-white flex-1" style={selectStyle}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={vm} onChange={e => setVm(Number(e.target.value))}
          className="border px-3 py-2 text-sm bg-white flex-1" style={selectStyle}>
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="h-8 flex items-center justify-center text-xs font-medium" style={{ color: '#64748b' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">{cells}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════ */
/* ══  PAGE COMPONENT  ═════════════════════════════════ */
/* ══════════════════════════════════════════════════════ */

export default function Page_life_insurance(props: GeneratedPageProps) {
  const [effectiveDate, setEffectiveDate] = useState<string | null>(null);
  const [beneficiaryDob, setBeneficiaryDob] = useState<string | null>(null);
  const [compoundDate, setCompoundDate] = useState<string | null>(null);

  const [coverageType, setCoverageType] = useState('term');

  const submit = (widgetId: string, type: string, value: string | null, extra?: Record<string, unknown>) => {
    if (!value) return;
    props.onSubmit({
      type,
      value,
      raw: { widget_id: widgetId, selected: value, taskId: props.taskId, ...extra },
    });
  };

  /* ── Header ─────────────────────────────────────────── */
  const header = (
    <header className="w-full border-b" style={{ backgroundColor: '#fafbfd', borderColor: '#d8e1e9' }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <span className="text-lg font-semibold" style={{ color: '#1E293B' }}>EchoSure</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm" style={{ color: '#1E293B' }}>
          <a href="#quotes" className="hover:opacity-70">Quotes</a>
          <a href="#claims" className="hover:opacity-70">Claims</a>
          <a href="#policy" className="hover:opacity-70">Policy</a>
          <a href="#contact" className="hover:opacity-70">Contact</a>
        </nav>
        <div className="flex items-center gap-4">
          <a href="#login" className="text-sm hover:opacity-70" style={{ color: '#1E293B' }}>Policy Login</a>
          <button type="button" className="px-5 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#059669', borderRadius: 0 }}>
            Get a Quote
          </button>
        </div>
      </div>
    </header>
  );

  /* ── Hero ────────────────────────────────────────────── */
  const hero = (
    <section className="relative w-full overflow-hidden" style={{ maxHeight: 360 }}>
      <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop"
        alt="Family home" className="w-full object-cover" style={{ height: 360 }} />
      <div className="absolute inset-0 flex items-center" style={{ background: 'linear-gradient(to right, rgba(30,41,59,.75), transparent)' }}>
        <div className="max-w-6xl mx-auto px-6 w-full">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Protect What Matters</h1>
          <p className="text-white text-base opacity-90 max-w-md">
            Affordable life insurance plans designed to safeguard your family's future. Get a personalized quote in minutes.
          </p>
        </div>
      </div>
    </section>
  );

  /* ── Coverage filter ────────────────────────────────── */
  const coverageOptions = [
    { value: 'term', label: 'Term Life' },
    { value: 'whole', label: 'Whole Life' },
    { value: 'universal', label: 'Universal Life' },
  ];

  const filters = (
    <div className="flex items-center gap-6 mb-8">
      <span className="text-sm font-medium" style={{ color: '#1E293B' }}>Coverage Type:</span>
      {coverageOptions.map(o => (
        <label key={o.value} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: '#1E293B' }}>
          <input type="radio" name="coverage" value={o.value}
            checked={coverageType === o.value}
            onChange={() => setCoverageType(o.value)}
            className="accent-emerald-600" />
          {o.label}
        </label>
      ))}
    </div>
  );

  /* ── Widget card wrapper ────────────────────────────── */
  const WidgetCard = ({ id, title, description, children, onSubmitClick, canSubmit }: {
    id: string; title: string; description: string;
    children: React.ReactNode; onSubmitClick: () => void; canSubmit: boolean;
  }) => (
    <div data-widget-id={id} className="border p-6 mb-6"
      style={{ backgroundColor: '#fafbfd', borderColor: '#d8e1e9', borderRadius: 0 }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#1E293B' }}>{title}</h3>
      <p className="text-sm mb-5" style={{ color: '#64748b' }}>{description}</p>
      <div className="mb-5">{children}</div>
      <button type="button" onClick={onSubmitClick} disabled={!canSubmit}
        className={`w-full py-2.5 text-sm font-medium text-white transition-opacity
          ${canSubmit ? 'opacity-100 hover:opacity-90' : 'opacity-40 cursor-not-allowed'}`}
        style={{ backgroundColor: '#059669', borderRadius: 0 }}>
        Submit
      </button>
    </div>
  );

  /* ── Supporting content ─────────────────────────────── */
  const coverageCards = (
    <section className="mt-10 mb-10">
      <h2 className="text-lg font-semibold mb-5" style={{ color: '#1E293B' }}>Compare Coverage Options</h2>
      <div className="grid md:grid-cols-3 gap-5">
        {[
          { title: 'Term Life', desc: 'Affordable coverage for a set period. Ideal for young families.', img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop', alt: 'Handshake' },
          { title: 'Whole Life', desc: 'Lifelong protection with cash value growth over time.', img: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&h=300&fit=crop', alt: 'Umbrella' },
          { title: 'Pet Coverage Add-on', desc: 'Extend your plan to include veterinary benefits for pets.', img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop', alt: 'Pet dog' },
        ].map(c => (
          <div key={c.title} className="border overflow-hidden" style={{ backgroundColor: '#f6f7fb', borderColor: '#d8e1e9', borderRadius: 0 }}>
            <img src={c.img} alt={c.alt} className="w-full h-48 object-cover" style={{ borderRadius: 0 }} />
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#1E293B' }}>{c.title}</h3>
              <p className="text-xs" style={{ color: '#64748b' }}>{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const testimonials = (
    <section className="mb-10 border p-6" style={{ backgroundColor: '#f6f7fb', borderColor: '#d8e1e9', borderRadius: 0 }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: '#1E293B' }}>What Our Customers Say</h2>
      <div className="grid md:grid-cols-2 gap-5">
        {[
          { name: 'Maria G.', text: 'EchoSure gave my family peace of mind at a price we could actually afford.' },
          { name: 'James T.', text: 'The claims process was seamless. I had my payout within 10 business days.' },
        ].map(t => (
          <div key={t.name} className="border p-4" style={{ backgroundColor: '#fafbfd', borderColor: '#eef1f6', borderRadius: 0 }}>
            <p className="text-sm italic mb-2" style={{ color: '#1E293B' }}>"{t.text}"</p>
            <p className="text-xs font-medium" style={{ color: '#059669' }}>— {t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );

  const trustBadges = (
    <section className="mb-10 flex flex-wrap items-center justify-center gap-8 py-6">
      {['A+ BBB Rated', 'Licensed in 50 States', '$2B+ Claims Paid', '24/7 Support'].map(b => (
        <div key={b} className="flex items-center gap-2 text-sm" style={{ color: '#1E293B' }}>
          <span style={{ color: '#059669' }}>✓</span>
          {b}
        </div>
      ))}
    </section>
  );

  /* ── Footer ─────────────────────────────────────────── */
  const footer = (
    <footer className="border-t py-8 mt-4" style={{ backgroundColor: '#f6f7fb', borderColor: '#d8e1e9' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div>
            <h4 className="text-sm font-semibold mb-2" style={{ color: '#1E293B' }}>Claims Contact</h4>
            <p className="text-xs" style={{ color: '#64748b' }}>1-800-555-0199 (24/7)</p>
            <p className="text-xs" style={{ color: '#64748b' }}>claims@safeguardins.com</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2" style={{ color: '#1E293B' }}>Licensing</h4>
            <p className="text-xs" style={{ color: '#64748b' }}>EchoSure Insurance Co. NAIC #12345</p>
            <p className="text-xs" style={{ color: '#64748b' }}>Licensed in all 50 states and D.C.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2" style={{ color: '#1E293B' }}>Accessibility</h4>
            <p className="text-xs" style={{ color: '#64748b' }}>WCAG 2.1 AA compliant. For assistance, call our support line.</p>
          </div>
        </div>
        <div className="border-t pt-4 text-center" style={{ borderColor: '#d8e1e9' }}>
          <p className="text-xs" style={{ color: '#94a3b8' }}>
            © 2025 EchoSure Insurance Co. All rights reserved. Coverage subject to terms, conditions, and state regulations. Not available in all states.
          </p>
        </div>
      </div>
    </footer>
  );

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#d8e1e9' }}>
      {header}
      {hero}

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="border p-6 mb-8" style={{ backgroundColor: '#fafbfd', borderColor: '#d8e1e9', borderRadius: 0 }}>
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#1E293B' }}>
            Life Insurance Quote — Personal Details
          </h2>
          <p className="text-sm mb-6" style={{ color: '#64748b' }}>
            Complete each section below to receive your customized life insurance quote. Select the relevant dates to proceed.
          </p>
          {filters}

          {/* Policy term selector */}
          <div className="flex items-center gap-4 mb-8">
            <label className="text-sm font-medium" style={{ color: '#1E293B' }}>Policy Term:</label>
            <select className="border px-3 py-2 text-sm bg-white" style={{ borderRadius: 0, borderColor: '#d8e1e9', color: '#1E293B' }}>
              <option>10 Years</option>
              <option>20 Years</option>
              <option>30 Years</option>
            </select>
          </div>
        </div>

        {/* ── Widget 1: Effective Date ─────────────────── */}
        <WidgetCard
          id="effective_date"
          title="Policy Effective Date"
          description="Choose the date your life insurance coverage should begin. Only dates between June 5, 2025 and October 4, 2025 are available."
          canSubmit={!!effectiveDate}
          onSubmitClick={() => submit('effective_date', 'date', effectiveDate)}
        >
          <CalendarPicker
            initYear={2025} initMonth={6}
            minDate="2025-06-05" maxDate="2025-10-04"
            selected={effectiveDate} onSelect={setEffectiveDate}
          />
          {effectiveDate && (
            <p className="mt-3 text-sm" style={{ color: '#059669' }}>Selected: {effectiveDate}</p>
          )}
        </WidgetCard>

        {/* ── Widget 2: Beneficiary DOB ────────────────── */}
        <WidgetCard
          id="beneficiary_dob"
          title="Beneficiary Date of Birth"
          description="Enter the date of birth of your primary beneficiary. Use the year and month dropdowns to navigate."
          canSubmit={!!beneficiaryDob}
          onSubmitClick={() => submit('beneficiary_dob', 'dob', beneficiaryDob)}
        >
          <DOBPicker
            initMonth={5}
            minYear={1950} maxYear={2015}
            maxDate="2026-06-30"
            selected={beneficiaryDob} onSelect={setBeneficiaryDob}
          />
          {beneficiaryDob && (
            <p className="mt-3 text-sm" style={{ color: '#059669' }}>Selected: {beneficiaryDob}</p>
          )}
        </WidgetCard>

        {/* ── Widget 3: Compound ───────────────────────── */}
        <WidgetCard
          id="compound"
          title="Effective Date + Beneficiary DOB"
          description="Select a date for this combined coverage field. Only dates between April 20, 2025 and August 18, 2025 are available."
          canSubmit={!!compoundDate}
          onSubmitClick={() => submit('compound', 'date', compoundDate)}
        >
          <CalendarPicker
            initYear={2025} initMonth={5}
            minDate="2025-04-20" maxDate="2025-08-18"
            selected={compoundDate} onSelect={setCompoundDate}
          />
          {compoundDate && (
            <p className="mt-3 text-sm" style={{ color: '#059669' }}>Selected: {compoundDate}</p>
          )}
        </WidgetCard>

        {coverageCards}
        {testimonials}
        {trustBadges}
      </main>

      {footer}
    </div>
  );
}
