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

function pad(n: number) { return n < 10 ? '0' + n : '' + n; }
function toISO(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function getFirstDayOfMonth(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}

function useDaysGrid(year: number, month: number) {
  return useMemo(() => {
    const total = getDaysInMonth(year, month);
    const first = getFirstDayOfMonth(year, month);
    const cells: (number | null)[] = Array(first).fill(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    return cells;
  }, [year, month]);
}

function useMonthNav(month: number, setMonth: (m: number | ((p: number) => number)) => void, setYear: (y: number | ((p: number) => number)) => void) {
  const prev = useCallback(() => {
    if (month === 0) { setMonth(11); setYear((y: number) => y - 1); }
    else setMonth((m: number) => m - 1);
  }, [month, setMonth, setYear]);
  const next = useCallback(() => {
    if (month === 11) { setMonth(0); setYear((y: number) => y + 1); }
    else setMonth((m: number) => m + 1);
  }, [month, setMonth, setYear]);
  return { prev, next };
}

function MonthHeader({ month, year, onPrev, onNext }: { month: number; year: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #bacbeb' }}>
      <button onClick={onPrev} className="w-8 h-8 flex items-center justify-center rounded-lg hover:opacity-80 text-base font-bold" style={{ background: '#f8f9fb', color: '#4972e8' }} aria-label="Previous month">‹</button>
      <span className="font-semibold text-sm" style={{ color: '#131A22' }}>{MONTHS[month]} {year}</span>
      <button onClick={onNext} className="w-8 h-8 flex items-center justify-center rounded-lg hover:opacity-80 text-base font-bold" style={{ background: '#f8f9fb', color: '#4972e8' }} aria-label="Next month">›</button>
    </div>
  );
}

function DayHeaders() {
  return (
    <div className="grid grid-cols-7 gap-0 mb-2">
      {DAYS.map(d => (
        <div key={d} className="text-center text-xs py-1 font-medium" style={{ color: '#8a9cc0' }}>{d}</div>
      ))}
    </div>
  );
}

/* ─── Widget 1: Event Date — single_date, min_max_bounds ─── */
function EventDatePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const MIN = '2025-05-02';
  const MAX = '2025-09-27';
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5);
  const [selected, setSelected] = useState<string | null>(null);

  const days = useDaysGrid(year, month);
  const { prev, next } = useMonthNav(month, setMonth, setYear);

  const isDisabled = useCallback((d: number) => {
    const iso = toISO(year, month, d);
    return iso < MIN || iso > MAX;
  }, [year, month]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    onSubmit({ type: 'date', value: selected, raw: { widget_id: 'event_date', year, month: month + 1, selected } });
  }, [selected, onSubmit, year, month]);

  return (
    <div data-widget-id="event_date" className="rounded-xl overflow-hidden" style={{ background: '#fcfdfc', border: '1px solid #bacbeb' }}>
      <div className="px-5 py-3" style={{ background: '#4972e8' }}>
        <h3 className="text-sm font-semibold text-white">📅 Event Date</h3>
        <p className="text-xs mt-0.5" style={{ color: '#bacbeb' }}>Select the date for your catering event</p>
      </div>
      <MonthHeader month={month} year={year} onPrev={prev} onNext={next} />
      <div className="p-4">
        <DayHeaders />
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (d === null) return <div key={'e' + i} className="h-9" />;
            const iso = toISO(year, month, d);
            const disabled = isDisabled(d);
            const isSel = iso === selected;
            return (
              <button key={i} disabled={disabled} onClick={() => !disabled && setSelected(iso)}
                className={'h-9 w-full text-sm rounded-lg flex items-center justify-center transition-all ' + (disabled ? 'opacity-30 cursor-not-allowed' : isSel ? 'font-bold' : 'hover:bg-blue-50')}
                style={isSel ? { background: '#4972e8', color: '#fff' } : disabled ? { color: '#bacbeb' } : { color: '#131A22' }}>
                {d}
              </button>
            );
          })}
        </div>
      </div>
      {selected && (
        <div className="px-5 pb-2 text-xs" style={{ color: '#8a9cc0' }}>
          Selected: <span className="font-semibold" style={{ color: '#4972e8' }}>{selected}</span>
        </div>
      )}
      <div className="px-5 pb-5 pt-2">
        <button onClick={handleSubmit} disabled={!selected}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{ background: selected ? '#4972e8' : '#bacbeb', color: '#fff', cursor: selected ? 'pointer' : 'not-allowed' }}>
          Confirm Event Date
        </button>
      </div>
    </div>
  );
}

/* ─── Widget 2: Setup Period — range, future_only ─── */
function SetupRangePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const MIN = '2025-07-01';
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(6);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const todayISO = useMemo(() => { const t = new Date(2025, 0, 1); return toISO(t.getFullYear(), t.getMonth(), t.getDate()); }, []);
  const days = useDaysGrid(year, month);
  const { prev, next } = useMonthNav(month, setMonth, setYear);

  const isDisabled = useCallback((d: number) => {
    const iso = toISO(year, month, d);
    return iso < MIN || iso < todayISO;
  }, [year, month, todayISO]);

  const handleClick = useCallback((d: number) => {
    const iso = toISO(year, month, d);
    if (!startDate || (startDate && endDate)) {
      setStartDate(iso);
      setEndDate(null);
    } else {
      if (iso < startDate) { setStartDate(iso); setEndDate(null); }
      else { setEndDate(iso); }
    }
  }, [year, month, startDate, endDate]);

  const isInRange = useCallback((iso: string) => {
    if (startDate && endDate) return iso >= startDate && iso <= endDate;
    if (startDate && !endDate && hoveredDate && hoveredDate >= startDate) return iso >= startDate && iso <= hoveredDate;
    return false;
  }, [startDate, endDate, hoveredDate]);

  const handleSubmit = useCallback(() => {
    if (!startDate || !endDate) return;
    onSubmit({ type: 'date_range', value: `${startDate}/${endDate}`, raw: { widget_id: 'setup_range', startDate, endDate } });
  }, [startDate, endDate, onSubmit]);

  return (
    <div data-widget-id="setup_range" className="rounded-xl overflow-hidden" style={{ background: '#fcfdfc', border: '1px solid #bacbeb' }}>
      <div className="px-5 py-3" style={{ background: '#4972e8' }}>
        <h3 className="text-sm font-semibold text-white">📋 Setup Period</h3>
        <p className="text-xs mt-0.5" style={{ color: '#bacbeb' }}>Select start and end dates for venue setup</p>
      </div>
      <MonthHeader month={month} year={year} onPrev={prev} onNext={next} />
      <div className="p-4">
        <DayHeaders />
        <div className="grid grid-cols-7 gap-0">
          {days.map((d, i) => {
            if (d === null) return <div key={'e' + i} className="h-9" />;
            const iso = toISO(year, month, d);
            const disabled = isDisabled(d);
            const isStart = iso === startDate;
            const isEnd = iso === endDate;
            const inRange = isInRange(iso);
            let rounded = 'rounded-lg';
            if (isStart) rounded = 'rounded-l-lg';
            else if (isEnd) rounded = 'rounded-r-lg';
            else if (inRange) rounded = '';
            return (
              <button key={i} disabled={disabled}
                onClick={() => !disabled && handleClick(d)}
                onMouseEnter={() => setHoveredDate(iso)}
                onMouseLeave={() => setHoveredDate(null)}
                className={'h-9 w-full text-sm flex items-center justify-center transition-all ' + rounded + (disabled ? ' opacity-30 cursor-not-allowed' : ' hover:opacity-80')}
                style={
                  isStart || isEnd ? { background: '#4972e8', color: '#fff', fontWeight: 700 }
                  : inRange ? { background: '#dce4f7', color: '#131A22' }
                  : disabled ? { color: '#bacbeb' }
                  : { color: '#131A22' }
                }>
                {d}
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-5 pb-2 text-xs min-h-[20px]" style={{ color: '#8a9cc0' }}>
        {startDate && !endDate && <>Start: <span className="font-semibold" style={{ color: '#4972e8' }}>{startDate}</span> — now select end date</>}
        {startDate && endDate && <>Range: <span className="font-semibold" style={{ color: '#4972e8' }}>{startDate}</span> → <span className="font-semibold" style={{ color: '#4972e8' }}>{endDate}</span></>}
      </div>
      <div className="px-5 pb-5 pt-2">
        <button onClick={handleSubmit} disabled={!startDate || !endDate}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{ background: startDate && endDate ? '#4972e8' : '#bacbeb', color: '#fff', cursor: startDate && endDate ? 'pointer' : 'not-allowed' }}>
          Confirm Setup Period
        </button>
      </div>
    </div>
  );
}

/* ─── Widget 3: Compound — single_date+range, min_max_bounds+future_only ─── */
function CompoundPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const MIN = '2025-04-24';
  const MAX = '2025-08-28';
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5);
  const [mode, setMode] = useState<'single' | 'range'>('single');
  const [selected, setSelected] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const todayISO = useMemo(() => { const t = new Date(2025, 0, 1); return toISO(t.getFullYear(), t.getMonth(), t.getDate()); }, []);
  const days = useDaysGrid(year, month);
  const { prev, next } = useMonthNav(month, setMonth, setYear);

  const isDisabled = useCallback((d: number) => {
    const iso = toISO(year, month, d);
    return iso < MIN || iso > MAX || iso < todayISO;
  }, [year, month, todayISO]);

  const handleClick = useCallback((d: number) => {
    const iso = toISO(year, month, d);
    if (mode === 'single') {
      setSelected(iso);
    } else {
      if (!startDate || (startDate && endDate)) {
        setStartDate(iso);
        setEndDate(null);
      } else {
        if (iso < startDate) { setStartDate(iso); setEndDate(null); }
        else { setEndDate(iso); }
      }
    }
  }, [year, month, mode, startDate, endDate]);

  const isInRange = useCallback((iso: string) => {
    if (mode !== 'range') return false;
    if (startDate && endDate) return iso >= startDate && iso <= endDate;
    if (startDate && !endDate && hoveredDate && hoveredDate >= startDate) return iso >= startDate && iso <= hoveredDate;
    return false;
  }, [mode, startDate, endDate, hoveredDate]);

  const switchMode = useCallback((m: 'single' | 'range') => {
    setMode(m);
    setSelected(null);
    setStartDate(null);
    setEndDate(null);
    setHoveredDate(null);
  }, []);

  const canSubmit = mode === 'single' ? !!selected : !!(startDate && endDate);

  const handleSubmit = useCallback(() => {
    if (mode === 'single') {
      if (!selected) return;
      onSubmit({ type: 'date', value: selected, raw: { widget_id: 'compound', mode: 'single', selected } });
    } else {
      if (!startDate || !endDate) return;
      onSubmit({ type: 'date', value: `${startDate}/${endDate}`, raw: { widget_id: 'compound', mode: 'range', startDate, endDate } });
    }
  }, [mode, selected, startDate, endDate, onSubmit]);

  return (
    <div data-widget-id="compound" className="rounded-xl overflow-hidden" style={{ background: '#fcfdfc', border: '1px solid #bacbeb' }}>
      <div className="px-5 py-3" style={{ background: '#4972e8' }}>
        <h3 className="text-sm font-semibold text-white">🗓️ Event Date + Setup Period</h3>
        <p className="text-xs mt-0.5" style={{ color: '#bacbeb' }}>Choose a single date or a date range</p>
      </div>
      <div className="flex border-b" style={{ borderColor: '#bacbeb' }}>
        <button onClick={() => switchMode('single')}
          className="flex-1 py-2.5 text-xs font-semibold transition-all"
          style={{ background: mode === 'single' ? '#4972e8' : '#f8f9fb', color: mode === 'single' ? '#fff' : '#8a9cc0', borderBottom: mode === 'single' ? '2px solid #FF9900' : '2px solid transparent' }}>
          Single Date
        </button>
        <button onClick={() => switchMode('range')}
          className="flex-1 py-2.5 text-xs font-semibold transition-all"
          style={{ background: mode === 'range' ? '#4972e8' : '#f8f9fb', color: mode === 'range' ? '#fff' : '#8a9cc0', borderBottom: mode === 'range' ? '2px solid #FF9900' : '2px solid transparent' }}>
          Date Range
        </button>
      </div>
      <MonthHeader month={month} year={year} onPrev={prev} onNext={next} />
      <div className="p-4">
        <DayHeaders />
        <div className="grid grid-cols-7 gap-0">
          {days.map((d, i) => {
            if (d === null) return <div key={'e' + i} className="h-9" />;
            const iso = toISO(year, month, d);
            const disabled = isDisabled(d);
            const isSel = mode === 'single' && iso === selected;
            const isStart = mode === 'range' && iso === startDate;
            const isEnd = mode === 'range' && iso === endDate;
            const inRange = isInRange(iso);
            let rounded = 'rounded-lg';
            if (mode === 'range') {
              if (isStart) rounded = 'rounded-l-lg';
              else if (isEnd) rounded = 'rounded-r-lg';
              else if (inRange) rounded = '';
            }
            return (
              <button key={i} disabled={disabled}
                onClick={() => !disabled && handleClick(d)}
                onMouseEnter={() => setHoveredDate(iso)}
                onMouseLeave={() => setHoveredDate(null)}
                className={'h-9 w-full text-sm flex items-center justify-center transition-all ' + rounded + (disabled ? ' opacity-30 cursor-not-allowed' : ' hover:opacity-80')}
                style={
                  isSel || isStart || isEnd ? { background: '#4972e8', color: '#fff', fontWeight: 700 }
                  : inRange ? { background: '#dce4f7', color: '#131A22' }
                  : disabled ? { color: '#bacbeb' }
                  : { color: '#131A22' }
                }>
                {d}
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-5 pb-2 text-xs min-h-[20px]" style={{ color: '#8a9cc0' }}>
        {mode === 'single' && selected && <>Selected: <span className="font-semibold" style={{ color: '#4972e8' }}>{selected}</span></>}
        {mode === 'range' && startDate && !endDate && <>Start: <span className="font-semibold" style={{ color: '#4972e8' }}>{startDate}</span> — now select end date</>}
        {mode === 'range' && startDate && endDate && <>Range: <span className="font-semibold" style={{ color: '#4972e8' }}>{startDate}</span> → <span className="font-semibold" style={{ color: '#4972e8' }}>{endDate}</span></>}
      </div>
      <div className="px-5 pb-5 pt-2">
        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{ background: canSubmit ? '#4972e8' : '#bacbeb', color: '#fff', cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
          {mode === 'single' ? 'Confirm Event Date' : 'Confirm Setup Period'}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_catering_order(props: GeneratedPageProps) {
  const [speed, setSpeed] = useState<'standard' | 'express' | 'sameday'>('standard');
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div className="min-h-screen" style={{ background: '#f7f7f8', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      {/* ── Header ── */}
      <header style={{ background: '#131A22' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <span className="text-xl font-bold" style={{ color: '#FF9900' }}>EchoShip</span>
          </div>
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <input type="text" placeholder="Search catering orders..." readOnly
              className="w-full px-4 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#232f3e', color: '#ccc', border: '1px solid #3b4a5c' }} />
          </div>
          <nav className="flex items-center gap-5 text-sm" style={{ color: '#ddd' }}>
            {['Track', 'Orders', 'Schedule', 'Support'].map(item => (
              <span key={item} className="hover:underline cursor-pointer transition-colors" style={{ color: '#ddd' }}>{item}</span>
            ))}
            <span className="ml-3 cursor-pointer text-lg">🛒</span>
            <span className="cursor-pointer text-lg">👤</span>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative">
        <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=400&fit=crop" alt="Catering delivery packages" className="w-full h-56 object-cover" />
        <div className="absolute inset-0 flex items-center" style={{ background: 'linear-gradient(90deg, #131A22ee 45%, transparent 100%)' }}>
          <div className="max-w-7xl mx-auto px-6 w-full">
            <h1 className="text-3xl font-bold text-white">Catering Order</h1>
            <p className="text-sm mt-2 max-w-md" style={{ color: '#bacbeb' }}>
              Schedule your event catering delivery. Choose an event date, set up a preparation window, and confirm your order timeline.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF9900' }} />
                <span className="text-xs text-white">Order Placed</span>
              </div>
              <div className="w-8 h-0.5" style={{ background: '#3b4a5c' }} />
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3b4a5c' }} />
                <span className="text-xs" style={{ color: '#8a9cc0' }}>Choose Date</span>
              </div>
              <div className="w-8 h-0.5" style={{ background: '#3b4a5c' }} />
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3b4a5c' }} />
                <span className="text-xs" style={{ color: '#8a9cc0' }}>Confirmed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Left Sidebar — Order Context ── */}
          <div className="lg:col-span-1 space-y-5">
            {/* Delivery speed */}
            <div className="rounded-xl p-5" style={{ background: '#fcfdfc', border: '1px solid #bacbeb' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#131A22' }}>Catering Service Type</h2>
              <div className="space-y-2">
                {([
                  { key: 'standard', label: 'Standard', sub: '3–5 days prep', price: 'Free' },
                  { key: 'express', label: 'Express', sub: '1–2 days prep', price: '+$49' },
                  { key: 'sameday', label: 'Same-Day', sub: 'Rush service', price: '+$129' },
                ] as const).map(opt => (
                  <button key={opt.key} onClick={() => setSpeed(opt.key)}
                    className="w-full rounded-lg px-4 py-3 text-left text-sm transition-all flex justify-between items-center"
                    style={{ background: speed === opt.key ? '#4972e8' : '#f8f9fb', color: speed === opt.key ? '#fff' : '#131A22', border: speed === opt.key ? '1px solid #4972e8' : '1px solid #bacbeb' }}>
                    <div>
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs mt-0.5" style={{ opacity: 0.7 }}>{opt.sub}</div>
                    </div>
                    <span className="text-xs font-semibold">{opt.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Venue address */}
            <div className="rounded-xl p-5" style={{ background: '#fcfdfc', border: '1px solid #bacbeb' }}>
              <h2 className="text-sm font-semibold mb-2" style={{ color: '#131A22' }}>Venue Address</h2>
              <p className="text-xs" style={{ color: '#8a9cc0' }}>
                Grand Ballroom, EchoStay Conference Center<br />
                350 W Mart Center Dr · Chicago, IL 60654
              </p>
            </div>

            {/* Filters */}
            <div className="rounded-xl p-5" style={{ background: '#fcfdfc', border: '1px solid #bacbeb' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#131A22' }}>Filters</h2>
              <div className="flex flex-wrap gap-2">
                {['All', 'Appetizers', 'Entrées', 'Desserts', 'Beverages'].map(tag => (
                  <button key={tag} onClick={() => setActiveFilter(tag)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: activeFilter === tag ? '#4972e8' : '#f8f9fb', color: activeFilter === tag ? '#fff' : '#8a9cc0', border: '1px solid ' + (activeFilter === tag ? '#4972e8' : '#bacbeb') }}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery map placeholder */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #bacbeb' }}>
              <img src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=300&fit=crop" alt="Delivery truck on the road" className="w-full h-48 object-cover rounded-lg" />
              <div className="p-4" style={{ background: '#fcfdfc' }}>
                <p className="text-xs font-medium" style={{ color: '#131A22' }}>Delivery Route</p>
                <p className="text-xs mt-1" style={{ color: '#8a9cc0' }}>Chicago metro — estimated 45 min transit</p>
              </div>
            </div>
          </div>

          {/* ── Center + Right — Datepickers ── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Scenario context */}
            <div className="rounded-xl p-5" style={{ background: '#fcfdfc', border: '1px solid #bacbeb' }}>
              <h2 className="text-lg font-bold" style={{ color: '#131A22' }}>🍽️ Schedule Your Catering Delivery</h2>
              <p className="text-sm mt-2" style={{ color: '#8a9cc0' }}>
                Complete the date selections below to finalize your catering order. Pick your event date, define the setup period for venue preparation, and confirm the combined schedule.
              </p>
            </div>

            {/* Datepicker grid — 3 widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <EventDatePicker onSubmit={props.onSubmit} />
              <SetupRangePicker onSubmit={props.onSubmit} />
              <CompoundPicker onSubmit={props.onSubmit} />
            </div>

            {/* Order items */}
            <div className="rounded-xl p-5" style={{ background: '#fcfdfc', border: '1px solid #bacbeb' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#131A22' }}>Order Items</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Grilled Salmon Platter', qty: 3, price: '$189.00', img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop', alt: 'Meal kit platter' },
                  { name: 'Seasonal Fruit & Cheese Board', qty: 2, price: '$94.00', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop', alt: 'Fresh grocery items' },
                  { name: 'Premium Wine Selection', qty: 1, price: '$156.00', img: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&h=300&fit=crop', alt: 'Wine bottle collection' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid #bacbeb' }}>
                    <img src={item.img} alt={item.alt} className="w-full h-48 object-cover rounded-lg" />
                    <div className="p-4">
                      <p className="text-sm font-medium" style={{ color: '#131A22' }}>{item.name}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs" style={{ color: '#8a9cc0' }}>Qty: {item.qty}</span>
                        <span className="text-sm font-bold" style={{ color: '#FF9900' }}>{item.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order total + estimated arrival */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl p-5" style={{ background: '#fcfdfc', border: '1px solid #bacbeb' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#131A22' }}>Order Total</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between" style={{ color: '#8a9cc0' }}><span>Subtotal</span><span>$439.00</span></div>
                  <div className="flex justify-between" style={{ color: '#8a9cc0' }}><span>Service fee</span><span>$35.00</span></div>
                  <div className="flex justify-between" style={{ color: '#8a9cc0' }}><span>Delivery</span><span>{speed === 'standard' ? 'Free' : speed === 'express' ? '$49.00' : '$129.00'}</span></div>
                  <div className="pt-2 mt-2 flex justify-between font-bold" style={{ borderTop: '1px solid #bacbeb', color: '#131A22' }}>
                    <span>Total</span>
                    <span style={{ color: '#FF9900' }}>${speed === 'standard' ? '474.00' : speed === 'express' ? '523.00' : '603.00'}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-5" style={{ background: '#fcfdfc', border: '1px solid #bacbeb' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#131A22' }}>Estimated Arrival</h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF9900' }} />
                  <span className="text-sm" style={{ color: '#8a9cc0' }}>
                    {speed === 'sameday' ? 'Same-day delivery by 6 PM' : speed === 'express' ? '1–2 business days' : '3–5 business days'}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f8f9fb' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: speed === 'sameday' ? '80%' : speed === 'express' ? '50%' : '25%', background: '#FF9900' }} />
                </div>
                <div className="flex justify-between text-xs mt-2" style={{ color: '#bacbeb' }}>
                  <span>Ordered</span><span>Preparing</span><span>In Transit</span><span>Delivered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: '#131A22', borderTop: '1px solid #3b4a5c' }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs" style={{ color: '#8a9cc0' }}>
            <div>
              <h4 className="font-semibold text-white mb-3">Shipping</h4>
              <p>Free standard delivery</p>
              <p>Express & same-day available</p>
              <p>Temperature-controlled transit</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Returns</h4>
              <p>Full refund if not satisfied</p>
              <p>Cancel up to 48h before</p>
              <p>Quality guaranteed</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <p>24/7 Live Chat</p>
              <p>1-800-QUICKSHIP</p>
              <p>catering@quickship.com</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Payment</h4>
              <p>EchoPay · EchoCard · EchoExpress</p>
              <p>EchoWallet · EchoTap</p>
              <p>Net-30 invoicing</p>
            </div>
          </div>
          <div className="mt-6 pt-4 text-center text-xs" style={{ color: '#3b4a5c', borderTop: '1px solid #3b4a5c' }}>
            © 2025 EchoShip Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
