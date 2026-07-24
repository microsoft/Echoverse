import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTHS_SHORT = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function firstDow(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}
function fmtDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const HOLIDAYS = new Set(['2025-01-01', '2025-07-04', '2025-12-25', '2025-11-28']);

function isSelectable(y: number, m: number, d: number) {
  const dow = new Date(y, m, d).getDay();
  if (dow === 0 || dow === 6) return false;
  if (HOLIDAYS.has(fmtDate(y, m, d))) return false;
  return true;
}

/* ------------------------------------------------------------------ */
/*  Widget 1 — Policy Start Date & Time                               */
/* ------------------------------------------------------------------ */
function DateTimePicker({
  onSubmit,
  widgetId,
}: {
  onSubmit: GeneratedPageProps['onSubmit'];
  widgetId: string;
}) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(8); // Sep = 8
  const [day, setDay] = useState<number | null>(null);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  const dim = useMemo(() => daysInMonth(year, month), [year, month]);
  const fdow = useMemo(() => firstDow(year, month), [year, month]);

  const prev = useCallback(() => {
    setDay(null);
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const next = useCallback(() => {
    setDay(null);
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const submit = useCallback(() => {
    if (day === null) return;
    const h24 = ampm === 'PM' ? (hour === 12 ? 12 : hour + 12) : hour === 12 ? 0 : hour;
    const iso = `${fmtDate(year, month, day)}T${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    onSubmit({
      type: 'datetime',
      value: iso,
      raw: { widget_id: widgetId, year, month: month + 1, day, hour: h24, minute, ampm },
    });
  }, [day, year, month, hour, minute, ampm, onSubmit, widgetId]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < fdow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);

  return (
    <div data-widget-id={widgetId}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#1E293B' }}>
        Policy Start Date &amp; Time
      </h3>
      <p className="text-sm mb-4" style={{ color: '#64748b' }}>
        Select a business day and time for your policy to begin.
      </p>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="px-2 py-1 text-sm font-medium" style={{ color: '#059669' }}>
          ‹ Prev
        </button>
        <span className="font-semibold" style={{ color: '#1E293B' }}>
          {MONTHS[month]} {year}
        </span>
        <button onClick={next} className="px-2 py-1 text-sm font-medium" style={{ color: '#059669' }}>
          Next ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#64748b' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {cells.map((c, i) => {
          if (c === null) return <div key={`e${i}`} />;
          const ok = isSelectable(year, month, c);
          const sel = day === c;
          return (
            <button
              key={c}
              disabled={!ok}
              onClick={() => setDay(c)}
              className={`py-2 text-sm text-center ${
                sel ? 'font-semibold' : ok ? 'hover:opacity-80' : 'opacity-30 cursor-not-allowed'
              }`}
              style={{
                backgroundColor: sel ? '#059669' : 'transparent',
                color: sel ? '#fff' : ok ? '#1E293B' : '#94a3b8',
                borderRadius: 0,
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Time selectors */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-sm font-medium" style={{ color: '#1E293B' }}>Time:</span>
        <select
          value={hour}
          onChange={e => setHour(Number(e.target.value))}
          className="border px-2 py-1 text-sm"
          style={{ borderColor: '#e3e9f1', borderRadius: 0 }}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="text-sm">:</span>
        <select
          value={minute}
          onChange={e => setMinute(Number(e.target.value))}
          className="border px-2 py-1 text-sm"
          style={{ borderColor: '#e3e9f1', borderRadius: 0 }}
        >
          {[0, 15, 30, 45].map(m => (
            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
          ))}
        </select>
        <div className="flex">
          <button
            onClick={() => setAmpm('AM')}
            className="px-3 py-1 text-sm font-medium border"
            style={{
              backgroundColor: ampm === 'AM' ? '#059669' : '#fcfdfd',
              color: ampm === 'AM' ? '#fff' : '#1E293B',
              borderColor: '#e3e9f1',
              borderRadius: 0,
            }}
          >
            AM
          </button>
          <button
            onClick={() => setAmpm('PM')}
            className="px-3 py-1 text-sm font-medium border-t border-b border-r"
            style={{
              backgroundColor: ampm === 'PM' ? '#059669' : '#fcfdfd',
              color: ampm === 'PM' ? '#fff' : '#1E293B',
              borderColor: '#e3e9f1',
              borderRadius: 0,
            }}
          >
            PM
          </button>
        </div>
      </div>

      {day !== null && (
        <p className="text-sm mb-3" style={{ color: '#059669' }}>
          Selected: {MONTHS[month]} {day}, {year} at {hour}:{String(minute).padStart(2, '0')} {ampm}
        </p>
      )}

      <button
        onClick={submit}
        disabled={day === null}
        className="w-full py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: day !== null ? '#059669' : '#94a3b8', borderRadius: 0 }}
      >
        Submit Date &amp; Time
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Widget 2 — Fiscal Year Month                                      */
/* ------------------------------------------------------------------ */
function MonthYearPicker({
  onSubmit,
  widgetId,
}: {
  onSubmit: GeneratedPageProps['onSubmit'];
  widgetId: string;
}) {
  const [year, setYear] = useState(2025);
  const [sel, setSel] = useState<number | null>(null);

  const submit = useCallback(() => {
    if (sel === null) return;
    const iso = `${year}-${String(sel + 1).padStart(2, '0')}`;
    onSubmit({
      type: 'month_year',
      value: iso,
      raw: { widget_id: widgetId, year, month: sel + 1 },
    });
  }, [sel, year, onSubmit, widgetId]);

  return (
    <div data-widget-id={widgetId}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#1E293B' }}>
        Fiscal Year Month
      </h3>
      <p className="text-sm mb-4" style={{ color: '#64748b' }}>
        Choose the month and year for your fiscal year start.
      </p>

      <div className="flex items-center justify-between mb-5">
        <button onClick={() => setYear(y => y - 1)} className="px-2 py-1 text-sm font-medium" style={{ color: '#059669' }}>
          ‹ Prev Year
        </button>
        <span className="text-lg font-semibold" style={{ color: '#1E293B' }}>{year}</span>
        <button onClick={() => setYear(y => y + 1)} className="px-2 py-1 text-sm font-medium" style={{ color: '#059669' }}>
          Next Year ›
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {MONTHS_SHORT.map((m, i) => {
          const active = sel === i;
          return (
            <button
              key={m}
              onClick={() => setSel(i)}
              className="py-3 text-sm font-medium"
              style={{
                backgroundColor: active ? '#059669' : '#f3f6f8',
                color: active ? '#fff' : '#1E293B',
                borderRadius: 0,
              }}
            >
              {m}
            </button>
          );
        })}
      </div>

      {sel !== null && (
        <p className="text-sm mb-3" style={{ color: '#059669' }}>
          Selected: {MONTHS[sel]} {year}
        </p>
      )}

      <button
        onClick={submit}
        disabled={sel === null}
        className="w-full py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: sel !== null ? '#059669' : '#94a3b8', borderRadius: 0 }}
      >
        Submit Month &amp; Year
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Widget 3 — Compound (standard date calendar)                      */
/* ------------------------------------------------------------------ */
function CompoundPicker({
  onSubmit,
  widgetId,
}: {
  onSubmit: GeneratedPageProps['onSubmit'];
  widgetId: string;
}) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // June = 5
  const [day, setDay] = useState<number | null>(null);

  const dim = useMemo(() => daysInMonth(year, month), [year, month]);
  const fdow = useMemo(() => firstDow(year, month), [year, month]);

  const prev = useCallback(() => {
    setDay(null);
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const next = useCallback(() => {
    setDay(null);
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const submit = useCallback(() => {
    if (day === null) return;
    const iso = fmtDate(year, month, day);
    onSubmit({
      type: 'date',
      value: iso,
      raw: { widget_id: widgetId, year, month: month + 1, day },
    });
  }, [day, year, month, onSubmit, widgetId]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < fdow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);

  return (
    <div data-widget-id={widgetId}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#1E293B' }}>
        Policy Start Date &amp; Fiscal Year
      </h3>
      <p className="text-sm mb-4" style={{ color: '#64748b' }}>
        Pick a business day for your combined policy and fiscal calendar.
      </p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="px-2 py-1 text-sm font-medium" style={{ color: '#059669' }}>
          ‹ Prev
        </button>
        <span className="font-semibold" style={{ color: '#1E293B' }}>
          {MONTHS[month]} {year}
        </span>
        <button onClick={next} className="px-2 py-1 text-sm font-medium" style={{ color: '#059669' }}>
          Next ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#64748b' }}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {cells.map((c, i) => {
          if (c === null) return <div key={`e${i}`} />;
          const ok = isSelectable(year, month, c);
          const active = day === c;
          return (
            <button
              key={c}
              disabled={!ok}
              onClick={() => setDay(c)}
              className={`py-2 text-sm text-center ${
                active ? 'font-semibold' : ok ? 'hover:opacity-80' : 'opacity-30 cursor-not-allowed'
              }`}
              style={{
                backgroundColor: active ? '#059669' : 'transparent',
                color: active ? '#fff' : ok ? '#1E293B' : '#94a3b8',
                borderRadius: 0,
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {day !== null && (
        <p className="text-sm mb-3" style={{ color: '#059669' }}>
          Selected: {MONTHS[month]} {day}, {year}
        </p>
      )}

      <button
        onClick={submit}
        disabled={day === null}
        className="w-full py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: day !== null ? '#059669' : '#94a3b8', borderRadius: 0 }}
      >
        Submit Date
      </button>
    </div>
  );
}

/* ================================================================== */
/*  Main Page                                                          */
/* ================================================================== */
export default function Page_business_insurance(props: GeneratedPageProps) {
  const [coverageType, setCoverageType] = useState('general');

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#bfbddf' }}>
      {/* ── Header ── */}
      <header className="w-full" style={{ backgroundColor: '#fcfdfd', borderBottom: '1px solid #e3e9f1' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="text-xl font-semibold" style={{ color: '#059669' }}>EchoSure</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: '#1E293B' }}>
            <a href="#quotes" className="hover:opacity-80">Quotes</a>
            <a href="#claims" className="hover:opacity-80">Claims</a>
            <a href="#policy" className="hover:opacity-80">Policy</a>
            <a href="#contact" className="hover:opacity-80">Contact</a>
          </nav>
          <div className="flex items-center gap-4">
            <a href="#login" className="text-sm font-medium" style={{ color: '#1E293B' }}>Policy Login</a>
            <button
              className="px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: '#059669', borderRadius: 0 }}
            >
              Get a Quote
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative w-full overflow-hidden" style={{ maxHeight: 340 }}>
        <img
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop"
          alt="Family home protected by insurance"
          className="w-full object-cover"
          style={{ height: 340 }}
        />
        <div className="absolute inset-0 flex items-center" style={{ background: 'linear-gradient(to right,rgba(5,150,105,.85) 0%,rgba(5,150,105,.45) 60%,transparent 100%)' }}>
          <div className="max-w-6xl mx-auto px-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Protect What Matters
            </h1>
            <p className="text-white text-base md:text-lg opacity-90 max-w-lg">
              Comprehensive business insurance tailored to your industry. Get covered in minutes.
            </p>
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Context text */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#1E293B' }}>
            Business Insurance Quote
          </h2>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Complete the sections below to configure your policy dates and fiscal calendar. All date fields are required before we can generate your quote.
          </p>
        </div>

        {/* Coverage type filter */}
        <div className="mb-8 p-5" style={{ backgroundColor: '#fcfdfd', border: '1px solid #e3e9f1', borderRadius: 0 }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#1E293B' }}>Coverage Type</p>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'general', label: 'General Liability' },
              { key: 'property', label: 'Commercial Property' },
              { key: 'workers', label: "Workers' Comp" },
              { key: 'professional', label: 'Professional Liability' },
            ].map(ct => (
              <button
                key={ct.key}
                onClick={() => setCoverageType(ct.key)}
                className="px-4 py-2 text-sm font-medium border"
                style={{
                  backgroundColor: coverageType === ct.key ? '#059669' : '#f9f9f9',
                  color: coverageType === ct.key ? '#fff' : '#1E293B',
                  borderColor: coverageType === ct.key ? '#059669' : '#e3e9f1',
                  borderRadius: 0,
                }}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Widget cards ── */}
        <div className="flex flex-col gap-8">
          {/* Widget 1 */}
          <div className="p-6" style={{ backgroundColor: '#fcfdfd', border: '1px solid #e3e9f1', borderRadius: 0 }}>
            <DateTimePicker onSubmit={props.onSubmit} widgetId="policy_datetime" />
          </div>

          {/* Widget 2 */}
          <div className="p-6" style={{ backgroundColor: '#fcfdfd', border: '1px solid #e3e9f1', borderRadius: 0 }}>
            <MonthYearPicker onSubmit={props.onSubmit} widgetId="fiscal_month" />
          </div>

          {/* Widget 3 */}
          <div className="p-6" style={{ backgroundColor: '#fcfdfd', border: '1px solid #e3e9f1', borderRadius: 0 }}>
            <CompoundPicker onSubmit={props.onSubmit} widgetId="compound" />
          </div>
        </div>

        {/* ── Supporting content ── */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="p-5" style={{ backgroundColor: '#fcfdfd', border: '1px solid #e3e9f1', borderRadius: 0 }}>
            <img
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=300&fit=crop"
              alt="Car insurance coverage"
              className="w-full h-48 object-cover mb-4"
              style={{ borderRadius: 0 }}
            />
            <h4 className="font-semibold text-sm mb-1" style={{ color: '#1E293B' }}>Auto Fleet Coverage</h4>
            <p className="text-xs" style={{ color: '#64748b' }}>
              Protect your company vehicles with comprehensive fleet insurance starting at $89/mo.
            </p>
          </div>
          <div className="p-5" style={{ backgroundColor: '#fcfdfd', border: '1px solid #e3e9f1', borderRadius: 0 }}>
            <img
              src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop"
              alt="Business handshake partnership"
              className="w-full h-48 object-cover mb-4"
              style={{ borderRadius: 0 }}
            />
            <h4 className="font-semibold text-sm mb-1" style={{ color: '#1E293B' }}>Liability Protection</h4>
            <p className="text-xs" style={{ color: '#64748b' }}>
              General liability coverage protects against third-party claims of injury or property damage.
            </p>
          </div>
          <div className="p-5" style={{ backgroundColor: '#fcfdfd', border: '1px solid #e3e9f1', borderRadius: 0 }}>
            <img
              src="https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&h=300&fit=crop"
              alt="Umbrella insurance coverage"
              className="w-full h-48 object-cover mb-4"
              style={{ borderRadius: 0 }}
            />
            <h4 className="font-semibold text-sm mb-1" style={{ color: '#1E293B' }}>Umbrella Policy</h4>
            <p className="text-xs" style={{ color: '#64748b' }}>
              Extra liability coverage beyond your standard policies for maximum peace of mind.
            </p>
          </div>
        </div>

        {/* Coverage comparison */}
        <div className="mt-12 overflow-x-auto">
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1E293B' }}>Coverage Comparison</h3>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f6f8' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#1E293B', border: '1px solid #e3e9f1' }}>Feature</th>
                <th className="text-center px-4 py-3 font-semibold" style={{ color: '#1E293B', border: '1px solid #e3e9f1' }}>Basic</th>
                <th className="text-center px-4 py-3 font-semibold" style={{ color: '#1E293B', border: '1px solid #e3e9f1' }}>Standard</th>
                <th className="text-center px-4 py-3 font-semibold" style={{ color: '#1E293B', border: '1px solid #e3e9f1' }}>Premium</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['General Liability', '✓', '✓', '✓'],
                ['Property Damage', '—', '✓', '✓'],
                ['Business Interruption', '—', '—', '✓'],
                ['Cyber Liability', '—', '—', '✓'],
                ['Monthly Premium', '$49', '$129', '$249'],
              ].map((row, ri) => (
                <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? '#fcfdfd' : '#f9f9f9' }}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-4 py-3 ${ci === 0 ? 'text-left font-medium' : 'text-center'}`}
                      style={{ color: '#1E293B', border: '1px solid #e3e9f1' }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Testimonials */}
        <div className="mt-12">
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1E293B' }}>What Our Clients Say</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                quote: 'EchoSure made switching our business insurance painless. The online portal is straightforward and claims are handled quickly.',
                name: 'Maria Gonzalez',
                role: 'Owner, Gonzalez Construction',
              },
              {
                quote: "We saved over 20% compared to our previous provider. The coverage options are flexible and the support team is excellent.",
                name: 'David Chen',
                role: 'CFO, Pacific Logistics',
              },
            ].map((t, i) => (
              <div key={i} className="p-5" style={{ backgroundColor: '#f9f9f9', border: '1px solid #e3e9f1', borderRadius: 0 }}>
                <p className="text-sm italic mb-3" style={{ color: '#1E293B' }}>"{t.quote}"</p>
                <p className="text-sm font-semibold" style={{ color: '#059669' }}>{t.name}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 py-6" style={{ backgroundColor: '#f3f6f8', borderRadius: 0 }}>
          {['A+ BBB Rated', 'Licensed in 50 States', '24/7 Claims Support', '98% Satisfaction'].map(badge => (
            <div key={badge} className="flex items-center gap-2">
              <span style={{ color: '#059669' }}>✓</span>
              <span className="text-sm font-medium" style={{ color: '#1E293B' }}>{badge}</span>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-12" style={{ backgroundColor: '#1E293B' }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <p className="text-sm font-semibold text-white mb-2">EchoSure Insurance</p>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                Licensed and regulated by the Department of Insurance. NAIC #12345. Coverage not available in all states.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-2">Claims Contact</p>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                Phone: 1-800-555-0199<br />
                Email: claims@safeguard-ins.com<br />
                Available 24/7
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-2">Legal</p>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                Privacy Policy · Terms of Service · Accessibility · State Disclosures
              </p>
            </div>
          </div>
          <div className="border-t pt-4" style={{ borderColor: '#334155' }}>
            <p className="text-xs text-center" style={{ color: '#64748b' }}>
              © 2025 EchoSure Insurance Co. All rights reserved. This is a demo page.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
