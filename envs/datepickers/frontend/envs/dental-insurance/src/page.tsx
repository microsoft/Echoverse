import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function dateBefore(a: string, b: string): boolean {
  return a < b;
}

/* ─── chevron icons ─── */
function ChevronLeft() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   WIDGET 1 — Constrained single-date picker
   ════════════════════════════════════════════════════ */
function ConstrainedPicker({
  widgetId, label, description, initialYear, initialMonth, minDate, maxDate, onSubmit,
}: {
  widgetId: string; label: string; description: string;
  initialYear: number; initialMonth: number;
  minDate?: string; maxDate?: string;
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const isDisabled = useCallback((y: number, m: number, d: number) => {
    const iso = toISO(y, m, d);
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    return false;
  }, [minDate, maxDate]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const days = getDaysInMonth(year, month);
  const offset = getFirstDayOfWeek(year, month);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= days; d++) {
    const iso = toISO(year, month, d);
    const dis = isDisabled(year, month, d);
    const sel = selected === iso;
    cells.push(
      <button
        key={d} type="button" disabled={dis}
        onClick={() => !dis && setSelected(iso)}
        className={`h-10 rounded-lg text-sm font-medium transition-colors
          ${dis ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50'}
          ${sel ? 'text-white' : ''}`}
        style={sel ? { backgroundColor: '#5a90a8' } : undefined}
      >
        {d}
      </button>,
    );
  }

  return (
    <div data-widget-id={widgetId} className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#1E293B' }}>{label}</h3>
      <p className="text-sm mb-4" style={{ color: '#64748b' }}>{description}</p>

      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prev} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Previous month"><ChevronLeft /></button>
        <span className="font-semibold text-sm" style={{ color: '#1E293B' }}>{MONTHS[month]} {year}</span>
        <button type="button" onClick={next} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Next month"><ChevronRight /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(dn => <div key={dn} className="text-center text-xs font-medium py-1" style={{ color: '#94a3b8' }}>{dn}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>

      {selected && <p className="mt-3 text-sm font-medium" style={{ color: '#5a90a8' }}>Selected: {selected}</p>}

      <button
        type="button" disabled={!selected}
        onClick={() => selected && onSubmit({ type: 'date', value: selected, raw: { widget_id: widgetId, selected_date: selected } })}
        className="mt-4 w-full py-2.5 rounded-xl text-white font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
        style={{ backgroundColor: '#5a90a8' }}
      >
        Confirm Date
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   WIDGET 2 — Range picker
   ════════════════════════════════════════════════════ */
function RangePicker({
  widgetId, label, description, initialYear, initialMonth, onSubmit,
}: {
  widgetId: string; label: string; description: string;
  initialYear: number; initialMonth: number;
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const handleClick = (day: number) => {
    const iso = toISO(year, month, day);
    if (!startDate || (startDate && endDate)) {
      setStartDate(iso);
      setEndDate(null);
    } else {
      if (dateBefore(iso, startDate)) {
        setStartDate(iso);
        setEndDate(null);
      } else {
        setEndDate(iso);
      }
    }
  };

  const inRange = useCallback((iso: string) => {
    if (startDate && endDate) return iso >= startDate && iso <= endDate;
    if (startDate && !endDate && hover) {
      const lo = hover >= startDate ? startDate : hover;
      const hi = hover >= startDate ? hover : startDate;
      return iso >= lo && iso <= hi;
    }
    return false;
  }, [startDate, endDate, hover]);

  const days = getDaysInMonth(year, month);
  const offset = getFirstDayOfWeek(year, month);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= days; d++) {
    const iso = toISO(year, month, d);
    const isStart = startDate === iso;
    const isEnd = endDate === iso;
    const mid = inRange(iso) && !isStart && !isEnd;
    cells.push(
      <button
        key={d} type="button"
        onClick={() => handleClick(d)}
        onMouseEnter={() => setHover(iso)}
        onMouseLeave={() => setHover(null)}
        className={`h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer
          ${!isStart && !isEnd && !mid ? 'hover:bg-blue-50' : ''}`}
        style={
          isStart || isEnd
            ? { backgroundColor: '#5a90a8', color: '#fff' }
            : mid
            ? { backgroundColor: '#cde7f6', color: '#1E293B' }
            : undefined
        }
      >
        {d}
      </button>,
    );
  }

  return (
    <div data-widget-id={widgetId} className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#1E293B' }}>{label}</h3>
      <p className="text-sm mb-4" style={{ color: '#64748b' }}>{description}</p>

      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prev} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Previous month"><ChevronLeft /></button>
        <span className="font-semibold text-sm" style={{ color: '#1E293B' }}>{MONTHS[month]} {year}</span>
        <button type="button" onClick={next} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Next month"><ChevronRight /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(dn => <div key={dn} className="text-center text-xs font-medium py-1" style={{ color: '#94a3b8' }}>{dn}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>

      <div className="mt-3 text-sm" style={{ color: '#5a90a8' }}>
        {startDate && <span>Start: {startDate}</span>}
        {startDate && endDate && <span className="ml-3">End: {endDate}</span>}
        {!startDate && <span style={{ color: '#94a3b8' }}>Click to select start date</span>}
        {startDate && !endDate && <span className="ml-2" style={{ color: '#94a3b8' }}>→ now click end date</span>}
      </div>

      <button
        type="button" disabled={!startDate || !endDate}
        onClick={() => startDate && endDate && onSubmit({
          type: 'date_range', value: `${startDate}/${endDate}`,
          raw: { widget_id: widgetId, start_date: startDate, end_date: endDate },
        })}
        className="mt-4 w-full py-2.5 rounded-xl text-white font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
        style={{ backgroundColor: '#5a90a8' }}
      >
        Confirm Range
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   WIDGET 3 — Compound (constrained single-date)
   ════════════════════════════════════════════════════ */
function CompoundPicker({
  widgetId, label, description, initialYear, initialMonth, minDate, onSubmit,
}: {
  widgetId: string; label: string; description: string;
  initialYear: number; initialMonth: number; minDate?: string;
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const isDisabled = useCallback((y: number, m: number, d: number) => {
    if (minDate && toISO(y, m, d) < minDate) return true;
    return false;
  }, [minDate]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const days = getDaysInMonth(year, month);
  const offset = getFirstDayOfWeek(year, month);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= days; d++) {
    const iso = toISO(year, month, d);
    const dis = isDisabled(year, month, d);
    const sel = selected === iso;
    cells.push(
      <button
        key={d} type="button" disabled={dis}
        onClick={() => !dis && setSelected(iso)}
        className={`h-10 rounded-lg text-sm font-medium transition-colors
          ${dis ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50'}
          ${sel ? 'text-white' : ''}`}
        style={sel ? { backgroundColor: '#5a90a8' } : undefined}
      >
        {d}
      </button>,
    );
  }

  return (
    <div data-widget-id={widgetId} className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#1E293B' }}>{label}</h3>
      <p className="text-sm mb-4" style={{ color: '#64748b' }}>{description}</p>

      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prev} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Previous month"><ChevronLeft /></button>
        <span className="font-semibold text-sm" style={{ color: '#1E293B' }}>{MONTHS[month]} {year}</span>
        <button type="button" onClick={next} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Next month"><ChevronRight /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(dn => <div key={dn} className="text-center text-xs font-medium py-1" style={{ color: '#94a3b8' }}>{dn}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>

      {selected && <p className="mt-3 text-sm font-medium" style={{ color: '#5a90a8' }}>Selected: {selected}</p>}

      <button
        type="button" disabled={!selected}
        onClick={() => selected && onSubmit({ type: 'date', value: selected, raw: { widget_id: widgetId, selected_date: selected } })}
        className="mt-4 w-full py-2.5 rounded-xl text-white font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
        style={{ backgroundColor: '#5a90a8' }}
      >
        Confirm Date
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   PAGE COMPONENT
   ════════════════════════════════════════════════════ */
export default function Page_dental_insurance(props: GeneratedPageProps) {
  const [coverageType, setCoverageType] = useState('individual');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#5a90a8', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* ─── HEADER ─── */}
      <header className="shadow-sm" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="text-xl font-bold" style={{ color: '#1E293B' }}>EchoSure</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {['Quotes', 'Claims', 'Policy', 'Contact'].map(item => (
              <a key={item} href="#" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#1E293B' }}>{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a href="#" className="text-sm font-medium hidden sm:inline" style={{ color: '#5a90a8' }}>Policy Login</a>
            <button className="px-5 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: '#5a90a8' }}>
              Get a Quote
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
          <div className="rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: '#ffffff' }}>
            <div className="relative h-52 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop"
                alt="Family smiling together"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(90,144,168,0.85), rgba(90,144,168,0.3))' }} />
              <div className="absolute inset-0 flex flex-col justify-center px-10">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Protect What Matters</h1>
                <p className="text-white/90 text-lg max-w-md">Dental insurance plans that keep your family smiling — affordable coverage starts here.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SCENARIO CONTEXT ─── */}
      <section className="max-w-6xl mx-auto px-6 pb-6">
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#f7fafb' }}>
          <h2 className="font-semibold text-base mb-1" style={{ color: '#1E293B' }}>Dental Insurance Quote Builder</h2>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Choose your plan start date, claim filing period, and review your combined selections below.
            Each section has its own calendar — select your dates and confirm each one.
          </p>
        </div>
      </section>

      {/* ─── FILTER BAR ─── */}
      <section className="max-w-6xl mx-auto px-6 pb-6">
        <div className="rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-4" style={{ backgroundColor: '#ffffff' }}>
          <span className="text-sm font-semibold" style={{ color: '#1E293B' }}>Coverage Type:</span>
          {['individual', 'family', 'group'].map(t => (
            <button
              key={t} type="button"
              onClick={() => setCoverageType(t)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${coverageType === t ? 'text-white' : ''}`}
              style={coverageType === t ? { backgroundColor: '#5a90a8', color: '#fff' } : { backgroundColor: '#f7fafb', color: '#1E293B' }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-xs" style={{ color: '#94a3b8' }}>Plan: {coverageType}</span>
        </div>
      </section>

      {/* ─── WIDGETS ─── */}
      <section className="max-w-6xl mx-auto px-6 pb-10 space-y-8">
        {/* Widget 1 */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <ConstrainedPicker
            widgetId="plan_start"
            label="Plan Start Date"
            description="Select when your dental plan should begin. Only future dates are available."
            initialYear={2025}
            initialMonth={7}
            minDate="2025-08-01"
            onSubmit={props.onSubmit}
          />
          <div className="rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: '#ffffff' }}>
            <img
              src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=300&fit=crop"
              alt="Dental care"
              className="w-full h-48 object-cover"
            />
            <div className="p-5">
              <h4 className="font-semibold mb-1" style={{ color: '#1E293B' }}>Why Choose EchoSure Dental?</h4>
              <ul className="text-sm space-y-1" style={{ color: '#64748b' }}>
                <li>✓ 100% preventive care covered</li>
                <li>✓ No waiting period for cleanings</li>
                <li>✓ 80% coverage on basic procedures</li>
                <li>✓ Over 200,000 dentists in-network</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Widget 2 */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <RangePicker
            widgetId="claim_period"
            label="Claim Period"
            description="Select the date range for your claim filing window. Click start date, then end date."
            initialYear={2026}
            initialMonth={3}
            onSubmit={props.onSubmit}
          />
          <div className="rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: '#ffffff' }}>
            <img
              src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop"
              alt="Filing a claim"
              className="w-full h-48 object-cover"
            />
            <div className="p-5">
              <h4 className="font-semibold mb-1" style={{ color: '#1E293B' }}>Filing Your Claim</h4>
              <p className="text-sm" style={{ color: '#64748b' }}>
                Select the start and end dates for the treatment period you'd like to claim.
                Claims are processed within 5 business days once submitted.
              </p>
            </div>
          </div>
        </div>

        {/* Widget 3 */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <CompoundPicker
            widgetId="compound"
            label="Plan Start Date + Claim Period"
            description="Combined view — pick a date for your plan enrollment. Only dates from June 2025 onward are available."
            initialYear={2025}
            initialMonth={5}
            minDate="2025-06-01"
            onSubmit={props.onSubmit}
          />
          <div className="rounded-xl p-5 shadow-sm space-y-4" style={{ backgroundColor: '#ffffff' }}>
            <h4 className="font-semibold" style={{ color: '#1E293B' }}>Coverage Comparison</h4>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th className="text-left py-2 font-medium" style={{ color: '#64748b' }}>Feature</th>
                  <th className="text-center py-2 font-medium" style={{ color: '#64748b' }}>Basic</th>
                  <th className="text-center py-2 font-medium" style={{ color: '#64748b' }}>Premium</th>
                </tr>
              </thead>
              <tbody style={{ color: '#1E293B' }}>
                {[
                  ['Cleanings / yr', '2', '4'],
                  ['X-rays', '✓', '✓'],
                  ['Crowns', '50%', '80%'],
                  ['Orthodontia', '—', '50%'],
                  ['Annual max', '$1,000', '$2,500'],
                ].map(([feat, b, p]) => (
                  <tr key={feat} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td className="py-2">{feat}</td>
                    <td className="text-center py-2">{b}</td>
                    <td className="text-center py-2 font-medium" style={{ color: '#5a90a8' }}>{p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="max-w-6xl mx-auto px-6 pb-10">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Sarah M.', text: 'Saved $400 on my root canal — the claims process was seamless.', stars: 5 },
            { name: 'James T.', text: 'Best dental plan I have had. My whole family is covered.', stars: 5 },
            { name: 'Priya K.', text: 'Quick enrollment, great network of dentists near me.', stars: 4 },
          ].map(t => (
            <div key={t.name} className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-sm mb-3" style={{ color: '#64748b' }}>"{t.text}"</p>
              <p className="text-sm font-semibold" style={{ color: '#1E293B' }}>— {t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TRUST BADGES ─── */}
      <section className="max-w-6xl mx-auto px-6 pb-10">
        <div className="rounded-xl p-6 shadow-sm flex flex-wrap justify-center gap-8" style={{ backgroundColor: '#f7fafb' }}>
          {['🏆 A+ Rated', '🔒 256-bit SSL', '📋 HIPAA Compliant', '⭐ 4.9/5 Rating'].map(b => (
            <span key={b} className="text-sm font-medium" style={{ color: '#1E293B' }}>{b}</span>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🛡️</span>
                <span className="font-bold" style={{ color: '#1E293B' }}>EchoSure</span>
              </div>
              <p className="text-xs" style={{ color: '#94a3b8' }}>Dental insurance you can trust. Licensed in all 50 states.</p>
            </div>
            {[
              { title: 'Products', links: ['Individual Plans', 'Family Plans', 'Group Plans'] },
              { title: 'Support', links: ['File a Claim', 'Find a Dentist', 'FAQ'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Accessibility'] },
            ].map(col => (
              <div key={col.title}>
                <h5 className="text-sm font-semibold mb-2" style={{ color: '#1E293B' }}>{col.title}</h5>
                <ul className="space-y-1">
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="text-xs hover:underline" style={{ color: '#64748b' }}>{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-4 text-center text-xs" style={{ color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
            <p>© 2026 EchoSure Insurance Co. All rights reserved. NAIC #12345. Claims: 1-800-555-0199</p>
            <p className="mt-1">Coverage subject to policy terms. Not available in all states. This is a simulated demo.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
