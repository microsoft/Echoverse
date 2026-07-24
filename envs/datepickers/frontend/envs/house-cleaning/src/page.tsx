import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const DISABLED_DATES = new Set([
  '2025-01-01','2025-07-04','2025-12-25','2025-11-28',
]);

function pad(n: number) { return n < 10 ? '0' + n : '' + n; }

function toISO(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getStartDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function isWeekend(year: number, month: number, day: number) {
  const dow = new Date(year, month, day).getDay();
  return dow === 0 || dow === 6;
}

function isPast(year: number, month: number, day: number) {
  const today = new Date(2025, 0, 1);
  today.setHours(0, 0, 0, 0);
  return new Date(year, month, day) < today;
}

/* ─── Widget 1: Cleaning Date (single_date, business_days) ─── */
function CleaningDatePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(8); // September 0-indexed
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const startDay = useMemo(() => getStartDayOfWeek(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const isDisabled = useCallback((day: number) => {
    if (isWeekend(year, month, day)) return true;
    if (DISABLED_DATES.has(toISO(year, month, day))) return true;
    return false;
  }, [year, month]);

  const handleSelect = useCallback((day: number) => {
    if (isDisabled(day)) return;
    setSelected(toISO(year, month, day));
  }, [year, month, isDisabled]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    onSubmit({ type: 'date', value: selected, raw: { widget_id: 'cleaning_date', date: selected, year, month: month + 1 } });
  }, [selected, onSubmit, year, month]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDay; i++) cells.push(<div key={`e-${i}`} />);
  for (let d = 1; d <= days; d++) {
    const iso = toISO(year, month, d);
    const disabled = isDisabled(d);
    const isSel = selected === iso;
    cells.push(
      <button
        key={d}
        type="button"
        disabled={disabled}
        onClick={() => handleSelect(d)}
        className={`h-9 w-full text-sm transition-colors ${
          disabled ? 'text-gray-600 cursor-not-allowed opacity-30'
          : isSel ? 'text-white font-medium' : 'text-gray-300 hover:text-white'
        }`}
        style={{ borderRadius: '8px', backgroundColor: isSel ? '#0D9488' : 'transparent' }}
        onMouseEnter={e => { if (!disabled && !isSel) e.currentTarget.style.backgroundColor = '#292d2c'; }}
        onMouseLeave={e => { if (!disabled && !isSel) e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {d}
      </button>
    );
  }

  return (
    <div data-widget-id="cleaning_date" className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-1">Cleaning Date</label>
      <p className="text-xs text-gray-500 mb-3">Select a business day (Mon–Fri, excluding holidays)</p>
      <div style={{ backgroundColor: '#111212', borderRadius: '8px' }} className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth} className="text-gray-400 hover:text-white p-1" aria-label="Previous month">‹</button>
          <span className="text-sm font-medium text-gray-200">{MONTHS[month]} {year}</span>
          <button type="button" onClick={nextMonth} className="text-gray-400 hover:text-white p-1" aria-label="Next month">›</button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (<div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">{cells}</div>
      </div>
      {selected && <p className="text-xs text-gray-400 mt-2">Selected: <span className="text-white">{selected}</span></p>}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selected}
        className={`mt-3 w-full py-2 text-sm font-medium transition-colors ${selected ? 'text-white hover:opacity-90' : 'text-gray-500 cursor-not-allowed'}`}
        style={{ backgroundColor: selected ? '#0D9488' : '#292d2c', borderRadius: '8px' }}
      >
        Confirm Cleaning Date
      </button>
    </div>
  );
}

/* ─── Widget 2: Recurring Service Dates (range, future_only) ─── */
function RecurringRangePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(9); // October 0-indexed
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const startDay = useMemo(() => getStartDayOfWeek(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const minDate = '2025-10-01';

  const isDisabled = useCallback((day: number) => {
    const iso = toISO(year, month, day);
    if (iso < minDate) return true;
    if (isPast(year, month, day)) return true;
    return false;
  }, [year, month]);

  const handleSelect = useCallback((day: number) => {
    if (isDisabled(day)) return;
    const iso = toISO(year, month, day);
    if (!startDate || (startDate && endDate)) {
      setStartDate(iso);
      setEndDate(null);
    } else {
      if (iso < startDate) {
        setStartDate(iso);
        setEndDate(null);
      } else {
        setEndDate(iso);
      }
    }
  }, [year, month, startDate, endDate, isDisabled]);

  const isInRange = useCallback((iso: string) => {
    if (!startDate || !endDate) return false;
    return iso >= startDate && iso <= endDate;
  }, [startDate, endDate]);

  const handleSubmit = useCallback(() => {
    if (!startDate || !endDate) return;
    onSubmit({
      type: 'date_range',
      value: `${startDate}/${endDate}`,
      raw: { widget_id: 'recurring_range', start: startDate, end: endDate, year, month: month + 1 },
    });
  }, [startDate, endDate, onSubmit, year, month]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDay; i++) cells.push(<div key={`e-${i}`} />);
  for (let d = 1; d <= days; d++) {
    const iso = toISO(year, month, d);
    const disabled = isDisabled(d);
    const isStart = startDate === iso;
    const isEnd = endDate === iso;
    const inRange = isInRange(iso);
    const isEdge = isStart || isEnd;

    let bg = 'transparent';
    let textCls = 'text-gray-300 hover:text-white';
    if (disabled) { textCls = 'text-gray-600 cursor-not-allowed opacity-30'; }
    else if (isEdge) { bg = '#0D9488'; textCls = 'text-white font-medium'; }
    else if (inRange) { bg = 'rgba(13,148,136,0.2)'; textCls = 'text-teal-300'; }

    cells.push(
      <button
        key={d}
        type="button"
        disabled={disabled}
        onClick={() => handleSelect(d)}
        className={`h-9 w-full text-sm transition-colors ${textCls}`}
        style={{ borderRadius: '8px', backgroundColor: bg }}
        onMouseEnter={e => { if (!disabled && !isEdge && !inRange) e.currentTarget.style.backgroundColor = '#292d2c'; }}
        onMouseLeave={e => { if (!disabled && !isEdge && !inRange) e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {d}
      </button>
    );
  }

  const ready = startDate && endDate;

  return (
    <div data-widget-id="recurring_range" className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-1">Recurring Service Dates</label>
      <p className="text-xs text-gray-500 mb-3">Click a start date, then an end date to set the service range</p>
      <div style={{ backgroundColor: '#111212', borderRadius: '8px' }} className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth} className="text-gray-400 hover:text-white p-1" aria-label="Previous month">‹</button>
          <span className="text-sm font-medium text-gray-200">{MONTHS[month]} {year}</span>
          <button type="button" onClick={nextMonth} className="text-gray-400 hover:text-white p-1" aria-label="Next month">›</button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (<div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">{cells}</div>
      </div>
      <div className="flex gap-4 mt-2 text-xs text-gray-400">
        <span>Start: <span className="text-white">{startDate ?? '—'}</span></span>
        <span>End: <span className="text-white">{endDate ?? '—'}</span></span>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!ready}
        className={`mt-3 w-full py-2 text-sm font-medium transition-colors ${ready ? 'text-white hover:opacity-90' : 'text-gray-500 cursor-not-allowed'}`}
        style={{ backgroundColor: ready ? '#0D9488' : '#292d2c', borderRadius: '8px' }}
      >
        Confirm Service Range
      </button>
    </div>
  );
}

/* ─── Widget 3: Compound (single_date + range, business_days + future_only) ─── */
function CompoundPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // June 0-indexed
  const [mode, setMode] = useState<'single' | 'range'>('single');
  const [singleDate, setSingleDate] = useState<string | null>(null);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const startDay = useMemo(() => getStartDayOfWeek(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const isDisabled = useCallback((day: number) => {
    if (isWeekend(year, month, day)) return true;
    if (DISABLED_DATES.has(toISO(year, month, day))) return true;
    if (isPast(year, month, day)) return true;
    return false;
  }, [year, month]);

  const handleSelect = useCallback((day: number) => {
    if (isDisabled(day)) return;
    const iso = toISO(year, month, day);
    if (mode === 'single') {
      setSingleDate(iso);
    } else {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(iso);
        setRangeEnd(null);
      } else {
        if (iso < rangeStart) { setRangeStart(iso); setRangeEnd(null); }
        else setRangeEnd(iso);
      }
    }
  }, [year, month, mode, rangeStart, rangeEnd, isDisabled]);

  const isInRange = useCallback((iso: string) => {
    if (mode !== 'range' || !rangeStart || !rangeEnd) return false;
    return iso >= rangeStart && iso <= rangeEnd;
  }, [mode, rangeStart, rangeEnd]);

  const handleSubmit = useCallback(() => {
    if (mode === 'single') {
      if (!singleDate) return;
      onSubmit({ type: 'date', value: singleDate, raw: { widget_id: 'compound', mode: 'single', date: singleDate, year, month: month + 1 } });
    } else {
      if (!rangeStart || !rangeEnd) return;
      onSubmit({ type: 'date', value: `${rangeStart}/${rangeEnd}`, raw: { widget_id: 'compound', mode: 'range', start: rangeStart, end: rangeEnd, year, month: month + 1 } });
    }
  }, [mode, singleDate, rangeStart, rangeEnd, onSubmit, year, month]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDay; i++) cells.push(<div key={`e-${i}`} />);
  for (let d = 1; d <= days; d++) {
    const iso = toISO(year, month, d);
    const disabled = isDisabled(d);
    const isSingleSel = mode === 'single' && singleDate === iso;
    const isRangeEdge = mode === 'range' && (rangeStart === iso || rangeEnd === iso);
    const inRange = isInRange(iso);
    const isHighlight = isSingleSel || isRangeEdge;

    let bg = 'transparent';
    let textCls = 'text-gray-300 hover:text-white';
    if (disabled) { textCls = 'text-gray-600 cursor-not-allowed opacity-30'; }
    else if (isHighlight) { bg = '#0D9488'; textCls = 'text-white font-medium'; }
    else if (inRange) { bg = 'rgba(13,148,136,0.2)'; textCls = 'text-teal-300'; }

    cells.push(
      <button
        key={d}
        type="button"
        disabled={disabled}
        onClick={() => handleSelect(d)}
        className={`h-9 w-full text-sm transition-colors ${textCls}`}
        style={{ borderRadius: '8px', backgroundColor: bg }}
        onMouseEnter={e => { if (!disabled && !isHighlight && !inRange) e.currentTarget.style.backgroundColor = '#292d2c'; }}
        onMouseLeave={e => { if (!disabled && !isHighlight && !inRange) e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {d}
      </button>
    );
  }

  const ready = mode === 'single' ? !!singleDate : (!!rangeStart && !!rangeEnd);

  return (
    <div data-widget-id="compound" className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-1">Cleaning Date + Recurring Service Dates</label>
      <p className="text-xs text-gray-500 mb-3">Toggle between single date or date range selection (business days only, future dates)</p>

      <div className="flex gap-2 mb-3">
        {(['single', 'range'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`text-xs py-1.5 px-4 font-medium transition-colors ${mode === m ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
            style={{
              backgroundColor: mode === m ? '#0D9488' : '#171819',
              borderRadius: '8px',
              border: mode === m ? 'none' : '1px solid #292d2c',
            }}
          >
            {m === 'single' ? 'Single Date' : 'Date Range'}
          </button>
        ))}
      </div>

      <div style={{ backgroundColor: '#111212', borderRadius: '8px' }} className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth} className="text-gray-400 hover:text-white p-1" aria-label="Previous month">‹</button>
          <span className="text-sm font-medium text-gray-200">{MONTHS[month]} {year}</span>
          <button type="button" onClick={nextMonth} className="text-gray-400 hover:text-white p-1" aria-label="Next month">›</button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (<div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">{cells}</div>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        {mode === 'single'
          ? <span>Selected: <span className="text-white">{singleDate ?? '—'}</span></span>
          : <div className="flex gap-4">
              <span>Start: <span className="text-white">{rangeStart ?? '—'}</span></span>
              <span>End: <span className="text-white">{rangeEnd ?? '—'}</span></span>
            </div>
        }
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!ready}
        className={`mt-3 w-full py-2 text-sm font-medium transition-colors ${ready ? 'text-white hover:opacity-90' : 'text-gray-500 cursor-not-allowed'}`}
        style={{ backgroundColor: ready ? '#0D9488' : '#292d2c', borderRadius: '8px' }}
      >
        Confirm Selection
      </button>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_house_cleaning(props: GeneratedPageProps) {
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#0e0f0f', color: '#e5e5e5' }}>
      {/* Header */}
      <header className="w-full" style={{ backgroundColor: '#111212', borderBottom: '1px solid #292d2c' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center text-lg" style={{ width: 36, height: 36, backgroundColor: '#0D9488', borderRadius: '8px' }}>🔧</div>
            <span className="text-sm font-medium text-white tracking-tight">EchoServe</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <span className="text-white cursor-pointer">Home</span>
            <span className="hover:text-white cursor-pointer">Services</span>
            <span className="hover:text-white cursor-pointer">Book</span>
            <span className="hover:text-white cursor-pointer">Contact</span>
          </nav>
          <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
            <input
              type="text"
              placeholder="Search services..."
              className="w-full text-sm py-1.5 px-3 text-gray-300 placeholder-gray-600 outline-none"
              style={{ backgroundColor: '#171819', borderRadius: '8px', border: '1px solid #292d2c' }}
              readOnly
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="hidden sm:inline">📍 10001</span>
            <span className="hover:text-white cursor-pointer">Account</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="w-full relative overflow-hidden" style={{ backgroundColor: '#111212' }}>
        <img
          src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=400&fit=crop"
          alt="Home cleaning service"
          className="w-full h-48 object-cover opacity-30"
        />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-6xl mx-auto px-4 w-full">
            <h1 className="text-xl font-semibold text-white mb-1">Book House Cleaning</h1>
            <p className="text-sm text-gray-400">Schedule professional cleaning services for your home. Pick dates that work best for you.</p>
          </div>
        </div>
      </section>

      {/* Service category icons */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <p className="text-sm text-gray-300 font-medium mb-3">What do you need help with?</p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {['Deep Clean', 'Regular', 'Move-Out', 'Carpet', 'Windows', 'Kitchen', 'Bathroom', 'Office'].map(cat => (
            <div key={cat} className="flex flex-col items-center gap-1.5 cursor-pointer group">
              <div
                className="flex items-center justify-center text-xs text-gray-500 group-hover:text-gray-300 transition-colors"
                style={{ width: 44, height: 44, backgroundColor: '#171819', borderRadius: '8px', border: '1px solid #292d2c' }}
              >
                🧹
              </div>
              <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">{cat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Service request form */}
            <div className="p-5" style={{ backgroundColor: '#111212', borderRadius: '8px', border: '1px solid #292d2c' }}>
              <h2 className="text-sm font-medium text-white mb-4">Service Request</h2>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Describe your cleaning needs</label>
              <textarea
                rows={3}
                placeholder="e.g. 3-bedroom apartment, deep clean, pet-friendly products…"
                className="w-full text-sm py-2 px-3 text-gray-300 placeholder-gray-600 outline-none resize-none"
                style={{ backgroundColor: '#171819', borderRadius: '8px', border: '1px solid #292d2c' }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Location</label>
                  <input
                    type="text"
                    placeholder="Street address or zip code"
                    className="w-full text-sm py-2 px-3 text-gray-300 placeholder-gray-600 outline-none"
                    style={{ backgroundColor: '#171819', borderRadius: '8px', border: '1px solid #292d2c' }}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Urgency</label>
                  <select
                    className="w-full text-sm py-2 px-3 text-gray-300 outline-none appearance-none"
                    style={{ backgroundColor: '#171819', borderRadius: '8px', border: '1px solid #292d2c' }}
                    defaultValue="normal"
                  >
                    <option value="urgent">Urgent — within 24h</option>
                    <option value="normal">Normal — this week</option>
                    <option value="flexible">Flexible — anytime</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Widget 1: Cleaning Date */}
            <div className="p-5" style={{ backgroundColor: '#111212', borderRadius: '8px', border: '1px solid #292d2c' }}>
              <h2 className="text-sm font-medium text-white mb-4">1. One-Time Cleaning Date</h2>
              <CleaningDatePicker onSubmit={props.onSubmit} />
            </div>

            {/* Widget 2: Recurring Range */}
            <div className="p-5" style={{ backgroundColor: '#111212', borderRadius: '8px', border: '1px solid #292d2c' }}>
              <h2 className="text-sm font-medium text-white mb-4">2. Recurring Service Period</h2>
              <RecurringRangePicker onSubmit={props.onSubmit} />
            </div>

            {/* Widget 3: Compound */}
            <div className="p-5" style={{ backgroundColor: '#111212', borderRadius: '8px', border: '1px solid #292d2c' }}>
              <h2 className="text-sm font-medium text-white mb-4">3. Flexible Booking</h2>
              <CompoundPicker onSubmit={props.onSubmit} />
            </div>

            {/* Filters + Provider Table */}
            <div className="p-5" style={{ backgroundColor: '#111212', borderRadius: '8px', border: '1px solid #292d2c' }}>
              <h2 className="text-sm font-medium text-white mb-3">Available Cleaning Pros</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {['All', 'Top Rated', 'Lowest Price', 'Eco-Friendly'].map(f => (
                  <button
                    key={f}
                    type="button"
                    className="text-xs py-1 px-3 text-gray-400 hover:text-white transition-colors"
                    style={{ backgroundColor: f === 'All' ? '#292d2c' : 'transparent', borderRadius: '8px', border: '1px solid #292d2c' }}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500" style={{ borderBottom: '1px solid #292d2c' }}>
                      <th className="pb-2 pr-4 font-medium">Provider</th>
                      <th className="pb-2 pr-4 font-medium">Rating</th>
                      <th className="pb-2 pr-4 font-medium">Jobs</th>
                      <th className="pb-2 font-medium text-right">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'SparkleClean Co.', rating: 4.9, jobs: 412, cost: '$90–$150' },
                      { name: 'Fresh Home Services', rating: 4.8, jobs: 287, cost: '$80–$130' },
                      { name: 'GreenClean Pros', rating: 4.7, jobs: 198, cost: '$100–$180' },
                      { name: 'Tidy Team', rating: 4.6, jobs: 145, cost: '$70–$120' },
                    ].map((p, i) => (
                      <tr key={i} className="text-gray-300 hover:text-white transition-colors" style={{ borderBottom: '1px solid #171819' }}>
                        <td className="py-2.5 pr-4 flex items-center gap-2">
                          <div className="flex-shrink-0 flex items-center justify-center text-xs text-gray-500" style={{ width: 32, height: 32, backgroundColor: '#171819', borderRadius: '8px' }}>👤</div>
                          {p.name}
                        </td>
                        <td className="py-2.5 pr-4"><span style={{ color: '#F59E0B' }}>★</span> {p.rating}</td>
                        <td className="py-2.5 pr-4 text-gray-400">{p.jobs}</td>
                        <td className="py-2.5 text-right">{p.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="space-y-5">
            {/* Provider card with image */}
            <div className="overflow-hidden" style={{ backgroundColor: '#111212', borderRadius: '8px', border: '1px solid #292d2c' }}>
              <img
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop"
                alt="Professional cleaning service"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="p-4">
                <h3 className="text-sm font-medium text-white mb-1">Featured: SparkleClean Co.</h3>
                <p className="text-xs text-gray-400 mb-2"><span style={{ color: '#F59E0B' }}>★</span> 4.9 · 412 completed jobs</p>
                <p className="text-xs text-gray-500">&quot;Exceptional attention to detail. Our home has never looked better.&quot;</p>
              </div>
            </div>

            {/* Before/After gallery */}
            <div className="p-4" style={{ backgroundColor: '#111212', borderRadius: '8px', border: '1px solid #292d2c' }}>
              <h3 className="text-sm font-medium text-white mb-3">Before &amp; After</h3>
              <div className="space-y-3">
                {['Kitchen Deep Clean', 'Bathroom Refresh'].map(label => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 mb-1.5">{label}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-center text-xs text-gray-600" style={{ height: 72, backgroundColor: '#171819', borderRadius: '8px' }}>Before</div>
                      <div className="flex items-center justify-center text-xs text-gray-600" style={{ height: 72, backgroundColor: '#171819', borderRadius: '8px' }}>After</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service guarantee */}
            <div className="p-4" style={{ backgroundColor: '#111212', borderRadius: '8px', border: '1px solid #292d2c' }}>
              <h3 className="text-sm font-medium text-white mb-2">Service Guarantee</h3>
              <ul className="text-xs text-gray-400 space-y-1.5">
                <li>✓ Background-checked professionals</li>
                <li>✓ Insured &amp; bonded providers</li>
                <li>✓ 100% satisfaction guaranteed</li>
                <li>✓ Re-clean if not satisfied</li>
                <li>✓ 24/7 customer support</li>
              </ul>
            </div>

            {/* Price estimates */}
            <div className="p-4" style={{ backgroundColor: '#111212', borderRadius: '8px', border: '1px solid #292d2c' }}>
              <h3 className="text-sm font-medium text-white mb-3">Price Estimates</h3>
              <div className="space-y-2 text-xs">
                {[
                  { svc: 'Studio / 1BR', price: '$70–$100' },
                  { svc: '2–3 BR Apartment', price: '$100–$160' },
                  { svc: '4+ BR House', price: '$160–$250' },
                  { svc: 'Deep Clean Add-on', price: '+$40–$80' },
                ].map(r => (
                  <div key={r.svc} className="flex justify-between text-gray-400">
                    <span>{r.svc}</span>
                    <span className="text-gray-300">{r.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tutoring image card */}
            <div className="overflow-hidden" style={{ backgroundColor: '#111212', borderRadius: '8px', border: '1px solid #292d2c' }}>
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop"
                alt="Team of service professionals"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="p-4">
                <h3 className="text-sm font-medium text-white mb-1">Join Our Pro Network</h3>
                <p className="text-xs text-gray-500">Earn $25–$45/hr cleaning homes in your area.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-6" style={{ backgroundColor: '#111212', borderTop: '1px solid #292d2c' }}>
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-gray-500">
            <div>
              <p className="text-gray-300 font-medium mb-2">Company</p>
              <p>About EchoServe</p>
              <p>Careers</p>
              <p>Press</p>
            </div>
            <div>
              <p className="text-gray-300 font-medium mb-2">Support</p>
              <p>Help Center</p>
              <p>Contact Us</p>
              <p>FAQ</p>
            </div>
            <div>
              <p className="text-gray-300 font-medium mb-2">Legal</p>
              <p>Terms of Service</p>
              <p>Privacy Policy</p>
              <p>Cookie Policy</p>
            </div>
            <div>
              <p className="text-gray-300 font-medium mb-2">Verification</p>
              <p>Provider Standards</p>
              <p>Trust &amp; Safety</p>
              <p>Background Checks</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">© 2025 EchoServe. All rights reserved. All providers are independently verified.</p>
        </div>
      </footer>
    </div>
  );
}
