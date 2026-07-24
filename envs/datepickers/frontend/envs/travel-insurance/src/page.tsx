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

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function inRange(d: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const t = d.getTime();
  return t > start.getTime() && t < end.getTime();
}

function RangePicker({
  widgetId,
  label,
  description,
  initialMonth,
  initialYear,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  description: string;
  initialMonth: number;
  initialYear: number;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const firstDow = useMemo(() => new Date(year, month, 1).getDay(), [year, month]);

  const cells = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [firstDow, daysInMonth]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const handleClick = useCallback((day: number) => {
    const d = new Date(year, month, day);
    if (!startDate || (startDate && endDate)) {
      setStartDate(d);
      setEndDate(null);
    } else {
      if (d.getTime() < startDate.getTime()) {
        setStartDate(d);
        setEndDate(startDate);
      } else {
        setEndDate(d);
      }
    }
  }, [year, month, startDate, endDate]);

  const handleHover = useCallback((day: number) => {
    setHoverDate(new Date(year, month, day));
  }, [year, month]);

  const effectiveEnd = endDate || (startDate && hoverDate && hoverDate.getTime() >= startDate.getTime() ? hoverDate : null);
  const effectiveStart = !endDate && startDate && hoverDate && hoverDate.getTime() < startDate.getTime() ? hoverDate : startDate;

  const handleSubmit = useCallback(() => {
    if (!startDate || !endDate) return;
    const val = `${toISO(startDate)}/${toISO(endDate)}`;
    onSubmit({
      type: 'date_range',
      value: val,
      raw: {
        widget_id: widgetId,
        start_date: toISO(startDate),
        end_date: toISO(endDate),
        month,
        year,
      },
    });
  }, [startDate, endDate, widgetId, month, year, onSubmit]);

  return (
    <div data-widget-id={widgetId} className="rounded-lg p-5" style={{ background: '#25223b' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#849dce' }}>{label}</h3>
      <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>{description}</p>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-md text-sm font-bold hover:opacity-80"
          style={{ background: '#3d3d54', color: '#849dce' }}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-md text-sm font-bold hover:opacity-80"
          style={{ background: '#3d3d54', color: '#849dce' }}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs py-1 font-medium" style={{ color: '#6b7280' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7" onMouseLeave={() => setHoverDate(null)}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="h-9" />;
          const d = new Date(year, month, day);
          const isStart = sameDay(d, effectiveStart);
          const isEnd = sameDay(d, effectiveEnd);
          const isMid = inRange(d, effectiveStart, effectiveEnd);
          const selected = isStart || isEnd;

          let bg = 'transparent';
          let textColor = '#e2e8f0';
          if (selected) { bg = '#849dce'; textColor = '#0c0b21'; }
          else if (isMid) { bg = 'rgba(132,157,206,0.2)'; textColor = '#849dce'; }

          return (
            <button
              key={day}
              onClick={() => handleClick(day)}
              onMouseEnter={() => handleHover(day)}
              className="h-9 flex items-center justify-center text-sm rounded-md transition-colors"
              style={{
                background: bg,
                color: textColor,
                fontWeight: selected ? 600 : 400,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Selection summary */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs" style={{ color: '#9ca3af' }}>
          {startDate && endDate
            ? `${toISO(startDate)} → ${toISO(endDate)}`
            : startDate
            ? `Start: ${toISO(startDate)} — select end date`
            : 'Click to select start date'}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!startDate || !endDate}
          className="px-4 py-1.5 rounded-md text-sm font-medium transition-opacity"
          style={{
            background: startDate && endDate ? '#849dce' : '#3d3d54',
            color: startDate && endDate ? '#0c0b21' : '#6b7280',
            cursor: startDate && endDate ? 'pointer' : 'not-allowed',
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default function Page_travel_insurance(props: GeneratedPageProps) {
  return (
    <div className="min-h-screen" style={{ background: '#0c0b21', color: '#e2e8f0', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* Header */}
      <header className="border-b" style={{ background: '#25223b', borderColor: '#3d3d54' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <span className="text-lg font-bold" style={{ color: '#849dce' }}>EchoSure</span>
            </div>
            <nav className="hidden md:flex items-center gap-5 text-sm" style={{ color: '#9ca3af' }}>
              <a href="#" className="hover:opacity-80" style={{ color: '#849dce' }}>Quotes</a>
              <a href="#" className="hover:opacity-80">Claims</a>
              <a href="#" className="hover:opacity-80">Policy</a>
              <a href="#" className="hover:opacity-80">Contact</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-xs px-3 py-1.5 rounded-md" style={{ color: '#9ca3af', border: '1px solid #3d3d54' }}>Policy Login</button>
            <button className="text-xs px-3 py-1.5 rounded-md font-medium" style={{ background: '#849dce', color: '#0c0b21' }}>Get a Quote</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop"
          alt="Family home protection"
          className="w-full h-48 object-cover"
          style={{ opacity: 0.3 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#849dce' }}>
              Protect What Matters
            </h1>
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              Travel insurance plans tailored to your journey
            </p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left column — form + datepicker */}
          <div className="md:col-span-2 space-y-5">
            {/* Coverage type */}
            <div className="rounded-lg p-5" style={{ background: '#25223b' }}>
              <h2 className="text-base font-semibold mb-3" style={{ color: '#849dce' }}>Coverage Type</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '✈️', label: 'Single Trip' },
                  { icon: '🔄', label: 'Annual Multi-Trip' },
                  { icon: '👨‍👩‍👧‍👦', label: 'Family Plan' },
                ].map(c => (
                  <label
                    key={c.label}
                    className="flex flex-col items-center gap-1 p-3 rounded-md cursor-pointer text-center text-xs"
                    style={{ border: '1px solid #3d3d54', color: '#9ca3af' }}
                  >
                    <span className="text-lg">{c.icon}</span>
                    {c.label}
                    <input type="radio" name="coverage" className="mt-1" defaultChecked={c.label === 'Single Trip'} />
                  </label>
                ))}
              </div>
            </div>

            {/* Personal info */}
            <div className="rounded-lg p-5" style={{ background: '#25223b' }}>
              <h2 className="text-base font-semibold mb-3" style={{ color: '#849dce' }}>Traveler Information</h2>
              <div className="grid grid-cols-2 gap-3">
                {['Full Name', 'Email Address', 'Phone Number', 'Destination'].map(f => (
                  <div key={f}>
                    <label className="block text-xs mb-1" style={{ color: '#9ca3af' }}>{f}</label>
                    <input
                      type="text"
                      placeholder={f}
                      className="w-full text-sm px-3 py-2 rounded-md outline-none"
                      style={{ background: '#0c0b21', border: '1px solid #3d3d54', color: '#e2e8f0' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Date picker widget */}
            <RangePicker
              widgetId="trip_dates"
              label="Trip Dates"
              description="Select your departure and return dates for coverage."
              initialMonth={6}
              initialYear={2025}
              onSubmit={props.onSubmit}
            />
          </div>

          {/* Right column — sidebar */}
          <div className="space-y-5">
            {/* Coverage card */}
            <div className="rounded-lg overflow-hidden" style={{ background: '#25223b' }}>
              <img
                src="https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&h=300&fit=crop"
                alt="Travel protection umbrella"
                className="w-full h-36 object-cover"
              />
              <div className="p-4">
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#849dce' }}>Why EchoSure?</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>
                  Rated #1 in customer satisfaction for travel insurance. 24/7 worldwide assistance and fast claims.
                </p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="rounded-lg p-4" style={{ background: '#25223b' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#849dce' }}>Trusted By</h3>
              <div className="space-y-2">
                {['🏆 A+ BBB Rating', '⭐ 4.8/5 Trustpilot', '🔒 256-bit Encryption'].map(b => (
                  <div key={b} className="text-xs py-1.5 px-3 rounded-md" style={{ background: '#0c0b21', color: '#9ca3af' }}>{b}</div>
                ))}
              </div>
            </div>

            {/* Testimonial */}
            <div className="rounded-lg p-4" style={{ background: '#25223b' }}>
              <img
                src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop"
                alt="Customer handshake"
                className="w-full h-28 object-cover rounded-md mb-3"
              />
              <p className="text-xs italic leading-relaxed" style={{ color: '#9ca3af' }}>
                "EchoSure made our claim process effortless. We were reimbursed within 48 hours."
              </p>
              <p className="text-xs mt-2 font-medium" style={{ color: '#849dce' }}>— Sarah K., Verified Customer</p>
            </div>
          </div>
        </div>

        {/* Coverage comparison table */}
        <section className="mt-8">
          <h2 className="text-base font-semibold mb-4" style={{ color: '#849dce' }}>Compare Plans</h2>
          <div className="rounded-lg overflow-hidden" style={{ background: '#25223b' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#3d3d54' }}>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: '#849dce' }}>Feature</th>
                  <th className="text-center px-4 py-2 font-medium" style={{ color: '#849dce' }}>Basic</th>
                  <th className="text-center px-4 py-2 font-medium" style={{ color: '#849dce' }}>Standard</th>
                  <th className="text-center px-4 py-2 font-medium" style={{ color: '#849dce' }}>Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Trip Cancellation', '$1,000', '$5,000', '$10,000'],
                  ['Medical Emergency', '$25,000', '$100,000', '$250,000'],
                  ['Baggage Loss', '$500', '$1,500', '$3,000'],
                  ['Flight Delay', '6h / $200', '4h / $500', '2h / $1,000'],
                  ['24/7 Assistance', '✓', '✓', '✓'],
                  ['Price / trip', '$29', '$69', '$129'],
                ].map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #3d3d54' }}>
                    <td className="px-4 py-2 text-xs" style={{ color: '#e2e8f0' }}>{row[0]}</td>
                    <td className="px-4 py-2 text-xs text-center" style={{ color: '#9ca3af' }}>{row[1]}</td>
                    <td className="px-4 py-2 text-xs text-center" style={{ color: '#9ca3af' }}>{row[2]}</td>
                    <td className="px-4 py-2 text-xs text-center font-medium" style={{ color: '#849dce' }}>{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Savings calculator */}
        <section className="mt-8 rounded-lg p-5" style={{ background: '#25223b' }}>
          <h2 className="text-base font-semibold mb-1" style={{ color: '#849dce' }}>Savings Calculator</h2>
          <p className="text-xs mb-4" style={{ color: '#9ca3af' }}>
            Estimate how much you could save compared to out-of-pocket costs.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Avg. Medical Bill', val: '$12,400' },
              { label: 'Premium Plan Cost', val: '$129' },
              { label: 'You Save', val: '$12,271' },
            ].map(s => (
              <div key={s.label} className="rounded-md p-3" style={{ background: '#0c0b21' }}>
                <div className="text-lg font-bold" style={{ color: '#849dce' }}>{s.val}</div>
                <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-10" style={{ borderColor: '#3d3d54', background: '#25223b' }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid md:grid-cols-4 gap-6 text-xs" style={{ color: '#9ca3af' }}>
            <div>
              <span className="font-semibold block mb-2" style={{ color: '#849dce' }}>EchoSure Insurance</span>
              <p className="leading-relaxed">Licensed in all 50 states. NAIC #12345. Underwritten by EchoSure Assurance Co.</p>
            </div>
            <div>
              <span className="font-semibold block mb-2" style={{ color: '#849dce' }}>Claims</span>
              <p>📞 1-800-555-0199</p>
              <p>📧 claims@safeguard.example</p>
            </div>
            <div>
              <span className="font-semibold block mb-2" style={{ color: '#849dce' }}>Legal</span>
              <p>Privacy Policy</p>
              <p>Terms of Service</p>
              <p>State Disclosures</p>
            </div>
            <div>
              <span className="font-semibold block mb-2" style={{ color: '#849dce' }}>Accessibility</span>
              <p>WCAG 2.1 AA Compliant</p>
              <p>Screen reader friendly</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-center" style={{ color: '#6b7280' }}>
            © 2025 EchoSure Insurance. All rights reserved. This is a demo page.
          </div>
        </div>
      </footer>
    </div>
  );
}
