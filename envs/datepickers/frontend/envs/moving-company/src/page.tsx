import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

function firstDow(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function isWeekend(y: number, m: number, d: number) {
  const dow = new Date(y, m, d).getDay();
  return dow === 0 || dow === 6;
}

/* ─── Range Date Picker ─── */
function RangePicker({
  weekdaysOnly,
  initYear,
  initMonth,
  onChange,
}: {
  weekdaysOnly: boolean;
  initYear: number;
  initMonth: number;
  onChange: (s: string | null, e: string | null) => void;
}) {
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const dim = useMemo(() => daysInMonth(year, month), [year, month]);
  const offset = useMemo(() => firstDow(year, month), [year, month]);

  const prev = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const next = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const click = useCallback((day: number) => {
    if (weekdaysOnly && isWeekend(year, month, day)) return;
    const iso = toISO(year, month, day);
    if (!startDate || (startDate && endDate)) {
      setStartDate(iso);
      setEndDate(null);
      onChange(iso, null);
    } else {
      if (iso < startDate) {
        setStartDate(iso);
        setEndDate(null);
        onChange(iso, null);
      } else {
        setEndDate(iso);
        onChange(startDate, iso);
      }
    }
  }, [year, month, startDate, endDate, weekdaysOnly, onChange]);

  const inRange = useCallback((day: number) => {
    const iso = toISO(year, month, day);
    if (startDate && endDate) return iso >= startDate && iso <= endDate;
    if (startDate && !endDate && hover) {
      const lo = startDate < hover ? startDate : hover;
      const hi = startDate < hover ? hover : startDate;
      return iso >= lo && iso <= hi;
    }
    return false;
  }, [year, month, startDate, endDate, hover]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} className="h-9" />);
  for (let d = 1; d <= dim; d++) {
    const iso = toISO(year, month, d);
    const off = weekdaysOnly && isWeekend(year, month, d);
    const isStart = iso === startDate;
    const isEnd = iso === endDate;
    const mid = inRange(d) && !isStart && !isEnd;
    cells.push(
      <button
        key={d}
        disabled={off}
        onClick={() => click(d)}
        onMouseEnter={() => !off && setHover(iso)}
        onMouseLeave={() => setHover(null)}
        className={[
          'h-9 w-full text-sm flex items-center justify-center transition-colors',
          off ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer',
          !off && !isStart && !isEnd && !mid ? 'hover:bg-teal-50' : '',
          mid ? 'bg-teal-50' : '',
        ].join(' ')}
        style={{
          backgroundColor: isStart || isEnd ? '#0D9488' : undefined,
          color: isStart || isEnd ? '#fff' : undefined,
          fontWeight: isStart || isEnd ? 600 : undefined,
          borderRadius: 0,
        }}
      >
        {d}
      </button>,
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <button onClick={prev} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100" style={{ borderRadius: 0 }} aria-label="Previous month">◀</button>
        <span className="text-sm font-medium text-gray-700">{MONTH_NAMES[month]} {year}</span>
        <button onClick={next} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100" style={{ borderRadius: 0 }} aria-label="Next month">▶</button>
      </div>
      <div className="grid grid-cols-7">
        {DAY_LABELS.map(l => (
          <div key={l} className="h-7 flex items-center justify-center text-xs font-medium text-gray-400">{l}</div>
        ))}
        {cells}
      </div>
      {startDate && (
        <p className="mt-2 text-xs text-gray-500 px-1">
          {startDate}{endDate ? ` → ${endDate}` : ' — click an end date'}
        </p>
      )}
    </div>
  );
}

/* ─── Month / Year Picker ─── */
function MonthYearPicker({
  initYear,
  initMonth,
  onChange,
}: {
  initYear: number;
  initMonth: number;
  onChange: (m: number, y: number) => void;
}) {
  const [year, setYear] = useState(initYear);
  const [selMonth, setSelMonth] = useState<number | null>(null);
  const [selYear, setSelYear] = useState<number | null>(null);

  const pick = useCallback((m: number) => {
    setSelMonth(m);
    setSelYear(year);
    onChange(m, year);
  }, [year, onChange]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <button onClick={() => setYear(y => y - 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100" style={{ borderRadius: 0 }} aria-label="Previous year">◀</button>
        <span className="text-sm font-medium text-gray-700">{year}</span>
        <button onClick={() => setYear(y => y + 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100" style={{ borderRadius: 0 }} aria-label="Next year">▶</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTH_SHORT.map((name, i) => {
          const active = selMonth === i && selYear === year;
          return (
            <button
              key={name}
              onClick={() => pick(i)}
              className={[
                'py-2 text-sm transition-colors',
                active ? 'font-semibold' : 'text-gray-700 hover:bg-teal-50',
              ].join(' ')}
              style={{
                backgroundColor: active ? '#0D9488' : undefined,
                color: active ? '#fff' : undefined,
                borderRadius: 0,
              }}
            >
              {name}
            </button>
          );
        })}
      </div>
      {selMonth !== null && selYear !== null && (
        <p className="mt-2 text-xs text-gray-500 px-1">Selected: {MONTH_NAMES[selMonth]} {selYear}</p>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_moving_company(props: GeneratedPageProps) {
  /* Widget 1 state */
  const [w1Start, setW1Start] = useState<string | null>(null);
  const [w1End, setW1End] = useState<string | null>(null);

  /* Widget 2 state */
  const [w2Month, setW2Month] = useState<number | null>(null);
  const [w2Year, setW2Year] = useState<number | null>(null);

  /* Widget 3 compound state */
  const [w3Start, setW3Start] = useState<string | null>(null);
  const [w3End, setW3End] = useState<string | null>(null);
  const [w3Month, setW3Month] = useState<number | null>(null);
  const [w3Year, setW3Year] = useState<number | null>(null);

  /* Filter */
  const [urgency, setUrgency] = useState('standard');

  /* Submitters */
  const submitW1 = useCallback(() => {
    if (!w1Start || !w1End) return;
    props.onSubmit({
      type: 'date_range',
      value: `${w1Start}/${w1End}`,
      raw: { widget_id: 'move_dates', start: w1Start, end: w1End },
    });
  }, [w1Start, w1End, props]);

  const submitW2 = useCallback(() => {
    if (w2Month === null || w2Year === null) return;
    const val = `${w2Year}-${String(w2Month + 1).padStart(2, '0')}`;
    props.onSubmit({
      type: 'month_year',
      value: val,
      raw: { widget_id: 'lease_end_month', month: w2Month + 1, year: w2Year },
    });
  }, [w2Month, w2Year, props]);

  const submitW3 = useCallback(() => {
    const parts: string[] = [];
    if (w3Start && w3End) parts.push(`${w3Start}/${w3End}`);
    if (w3Month !== null && w3Year !== null)
      parts.push(`${w3Year}-${String(w3Month + 1).padStart(2, '0')}`);
    if (parts.length === 0) return;
    props.onSubmit({
      type: 'date',
      value: parts.join('|'),
      raw: {
        widget_id: 'compound',
        range: w3Start && w3End ? { start: w3Start, end: w3End } : null,
        month_year: w3Month !== null && w3Year !== null ? { month: w3Month + 1, year: w3Year } : null,
      },
    });
  }, [w3Start, w3End, w3Month, w3Year, props]);

  const btnBase = 'mt-4 px-5 py-2 text-sm font-medium text-white transition-opacity';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#dcdadc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* ── Header ── */}
      <header style={{ backgroundColor: '#fdfefd' }} className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔧</span>
              <span className="text-lg font-semibold" style={{ color: '#0D9488' }}>EchoServe</span>
            </div>
            <nav className="hidden md:flex items-center gap-5 text-sm text-gray-600">
              <a href="#" className="hover:text-teal-700">Home</a>
              <a href="#" className="hover:text-teal-700">Services</a>
              <a href="#" className="hover:text-teal-700">Book</a>
              <a href="#" className="hover:text-teal-700">Contact</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 text-sm text-gray-500">
              <span>📍</span><span>10001</span>
            </div>
            <button className="text-sm text-gray-600 hover:text-teal-700">Account</button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative" style={{ height: 260 }}>
        <img
          src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=400&fit=crop"
          alt="home repair"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-center" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,.3),rgba(0,0,0,.55))' }}>
          <div className="max-w-5xl mx-auto px-6 w-full">
            <h1 className="text-3xl font-bold text-white mb-1">Plan Your Move with EchoServe</h1>
            <p className="text-white/90 text-base">Schedule moving dates and lease transitions all in one place.</p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Urgency filter */}
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-gray-600">Urgency:</span>
          {(['standard', 'express', 'emergency'] as const).map(u => (
            <button
              key={u}
              onClick={() => setUrgency(u)}
              className={`px-3 py-1 text-xs font-medium border transition-colors ${
                urgency === u ? 'text-white border-transparent' : 'text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: urgency === u ? '#0D9488' : 'transparent', borderRadius: 0 }}
            >
              {u[0].toUpperCase() + u.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Widget 1: Moving Dates ── */}
        <section data-widget-id="move_dates" style={{ backgroundColor: '#fdfefd' }} className="border border-gray-200 p-6">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-2xl leading-none">📦</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Moving Dates</h2>
              <p className="text-sm text-gray-500 mt-1">Select your move-out and move-in dates. Only weekdays are available.</p>
            </div>
          </div>
          <div className="max-w-xs">
            <RangePicker
              weekdaysOnly
              initYear={2025}
              initMonth={7}
              onChange={(s, e) => { setW1Start(s); setW1End(e); }}
            />
          </div>
          <button
            onClick={submitW1}
            disabled={!w1Start || !w1End}
            className={btnBase}
            style={{ backgroundColor: '#0D9488', borderRadius: 0, opacity: !w1Start || !w1End ? 0.4 : 1, cursor: !w1Start || !w1End ? 'not-allowed' : 'pointer' }}
          >
            Confirm Moving Dates
          </button>
        </section>

        {/* ── Widget 2: Lease End Month ── */}
        <section data-widget-id="lease_end_month" style={{ backgroundColor: '#fdfefd' }} className="border border-gray-200 p-6">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-2xl leading-none">🏠</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Lease End Month</h2>
              <p className="text-sm text-gray-500 mt-1">When does your current lease expire? Pick the month and year.</p>
            </div>
          </div>
          <div className="max-w-xs">
            <MonthYearPicker
              initYear={2026}
              initMonth={2}
              onChange={(m, y) => { setW2Month(m); setW2Year(y); }}
            />
          </div>
          <button
            onClick={submitW2}
            disabled={w2Month === null}
            className={btnBase}
            style={{ backgroundColor: '#0D9488', borderRadius: 0, opacity: w2Month === null ? 0.4 : 1, cursor: w2Month === null ? 'not-allowed' : 'pointer' }}
          >
            Confirm Lease End
          </button>
        </section>

        {/* ── Widget 3: Compound ── */}
        <section data-widget-id="compound" style={{ backgroundColor: '#fdfefd' }} className="border border-gray-200 p-6">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-2xl leading-none">📋</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Moving Dates + Lease End Month</h2>
              <p className="text-sm text-gray-500 mt-1">Coordinate your move with your lease end — complete both selections below.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Move Date Range</h3>
              <div className="max-w-xs">
                <RangePicker
                  weekdaysOnly
                  initYear={2025}
                  initMonth={5}
                  onChange={(s, e) => { setW3Start(s); setW3End(e); }}
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Lease End Month</h3>
              <div className="max-w-xs">
                <MonthYearPicker
                  initYear={2025}
                  initMonth={5}
                  onChange={(m, y) => { setW3Month(m); setW3Year(y); }}
                />
              </div>
            </div>
          </div>
          <button
            onClick={submitW3}
            disabled={(!w3Start || !w3End) && w3Month === null}
            className={btnBase}
            style={{ backgroundColor: '#0D9488', borderRadius: 0, opacity: (!w3Start || !w3End) && w3Month === null ? 0.4 : 1, cursor: (!w3Start || !w3End) && w3Month === null ? 'not-allowed' : 'pointer' }}
          >
            Confirm Schedule
          </button>
        </section>

        {/* ── Service Provider Cards ── */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top-Rated Moving Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { img: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=300&fit=crop', alt: 'moving boxes', name: 'QuickMove Logistics', stars: 5, reviews: 234, desc: 'Full-service residential moving. Packing, loading, and delivery.', price: 'From $499' },
              { img: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=300&fit=crop', alt: 'car service', name: 'SafeHaul Transport', stars: 4, reviews: 189, desc: 'Specializing in long-distance and cross-state relocations.', price: 'From $799' },
              { img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop', alt: 'tutoring helpers', name: 'EasyPack Helpers', stars: 5, reviews: 312, desc: 'Affordable packing and labor services. Hourly rates available.', price: 'From $35/hr' },
            ].map(c => (
              <div key={c.name} style={{ backgroundColor: '#fbfbfa' }} className="border border-gray-200 overflow-hidden">
                <img src={c.img} alt={c.alt} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-medium text-gray-800">{c.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-500 text-sm">{'★'.repeat(c.stars)}{'☆'.repeat(5 - c.stars)}</span>
                    <span className="text-xs text-gray-500">({c.reviews})</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{c.desc}</p>
                  <p className="text-sm font-medium mt-2" style={{ color: '#0D9488' }}>{c.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: '#fbfbfa' }} className="border-t border-gray-200 mt-8">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm text-gray-500">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span>🔧</span>
                <span className="font-semibold" style={{ color: '#0D9488' }}>EchoServe</span>
              </div>
              <p className="text-xs">Your trusted partner for professional moving and home services.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Service Guarantee</h4>
              <p className="text-xs">All services backed by our satisfaction guarantee. Licensed and insured providers.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Help Center</h4>
              <ul className="space-y-1 text-xs">
                <li><a href="#" className="hover:text-teal-700">FAQ</a></li>
                <li><a href="#" className="hover:text-teal-700">Contact Support</a></li>
                <li><a href="#" className="hover:text-teal-700">Provider Verification</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Legal</h4>
              <ul className="space-y-1 text-xs">
                <li><a href="#" className="hover:text-teal-700">Terms of Service</a></li>
                <li><a href="#" className="hover:text-teal-700">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-teal-700">Cancellation Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
            © 2025 EchoServe. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
