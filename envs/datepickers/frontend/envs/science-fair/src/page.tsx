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

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

function firstDayOfWeek(y: number, m: number): number {
  return new Date(y, m, 1).getDay();
}

function isSameDay(a: string, b: string): boolean {
  return a === b;
}

function isBetween(d: string, start: string, end: string): boolean {
  return d >= start && d <= end;
}

/* ── Range Picker (Widget 1) ─────────────────────────────────── */
function RangePicker(props: {
  widgetId: string;
  label: string;
  description: string;
  initYear: number;
  initMonth: number;
  minDate?: string;
  maxDate?: string;
  onSubmit: GeneratedPageProps['onSubmit'];
}) {
  const { widgetId, label, description, initYear, initMonth, minDate, maxDate, onSubmit } = props;
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const days = useMemo(() => daysInMonth(year, month), [year, month]);
  const offset = useMemo(() => firstDayOfWeek(year, month), [year, month]);

  const isDisabled = useCallback(
    (ds: string) => {
      if (minDate && ds < minDate) return true;
      if (maxDate && ds > maxDate) return true;
      return false;
    },
    [minDate, maxDate],
  );

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const handleClick = (ds: string) => {
    if (isDisabled(ds)) return;
    if (!startDate || (startDate && endDate)) {
      setStartDate(ds);
      setEndDate(null);
    } else {
      if (ds < startDate) {
        setStartDate(ds);
        setEndDate(null);
      } else {
        setEndDate(ds);
      }
    }
  };

  const inRange = (ds: string) => {
    if (startDate && endDate) return isBetween(ds, startDate, endDate);
    if (startDate && hover && !endDate) {
      const lo = hover >= startDate ? startDate : hover;
      const hi = hover >= startDate ? hover : startDate;
      return isBetween(ds, lo, hi);
    }
    return false;
  };

  const handleSubmit = () => {
    if (!startDate || !endDate) return;
    onSubmit({
      type: 'date_range',
      value: `${startDate}/${endDate}`,
      raw: { widget_id: widgetId, start_date: startDate, end_date: endDate },
    });
  };

  return (
    <div data-widget-id={widgetId} className="rounded-xl p-6" style={{ background: '#ffffff' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#6366F1' }}>{label}</h3>
      <p className="text-sm mb-4" style={{ color: '#64748b' }}>{description}</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: '#eeebeb' }} aria-label="Previous month">‹</button>
        <span className="font-medium text-sm">{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: '#eeebeb' }} aria-label="Next month">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
        {DAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const ds = toDateStr(year, month, day);
          const disabled = isDisabled(ds);
          const isStart = startDate && isSameDay(ds, startDate);
          const isEnd = endDate && isSameDay(ds, endDate);
          const range = inRange(ds);

          let bg = 'transparent';
          let color = '#334155';
          if (disabled) { color = '#cbd5e1'; }
          else if (isStart || isEnd) { bg = '#6366F1'; color = '#ffffff'; }
          else if (range) { bg = '#e0e7ff'; color = '#4338ca'; }

          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => handleClick(ds)}
              onMouseEnter={() => setHover(ds)}
              onMouseLeave={() => setHover(null)}
              className="h-9 rounded-lg transition-colors"
              style={{ background: bg, color, cursor: disabled ? 'default' : 'pointer' }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs" style={{ color: '#64748b' }}>
          {startDate && endDate
            ? `${startDate} → ${endDate}`
            : startDate
            ? `Start: ${startDate} (pick end)`
            : 'Click a start date'}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!startDate || !endDate}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity"
          style={{ background: startDate && endDate ? '#6366F1' : '#a5b4fc', cursor: startDate && endDate ? 'pointer' : 'default' }}
        >
          Submit Range
        </button>
      </div>
    </div>
  );
}

/* ── Single Date Picker (Widget 2) ───────────────────────────── */
function SinglePicker(props: {
  widgetId: string;
  label: string;
  description: string;
  initYear: number;
  initMonth: number;
  minDate?: string;
  maxDate?: string;
  futureOnly?: boolean;
  onSubmit: GeneratedPageProps['onSubmit'];
}) {
  const { widgetId, label, description, initYear, initMonth, minDate, maxDate, futureOnly, onSubmit } = props;
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const today = useMemo(() => {
    const n = new Date(2025, 0, 1);
    return toDateStr(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const days = useMemo(() => daysInMonth(year, month), [year, month]);
  const offset = useMemo(() => firstDayOfWeek(year, month), [year, month]);

  const isDisabled = useCallback(
    (ds: string) => {
      if (futureOnly && ds <= today) return true;
      if (minDate && ds < minDate) return true;
      if (maxDate && ds > maxDate) return true;
      return false;
    },
    [minDate, maxDate, futureOnly, today],
  );

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit({
      type: 'date',
      value: selected,
      raw: { widget_id: widgetId, selected_date: selected },
    });
  };

  return (
    <div data-widget-id={widgetId} className="rounded-xl p-6" style={{ background: '#ffffff' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#6366F1' }}>{label}</h3>
      <p className="text-sm mb-4" style={{ color: '#64748b' }}>{description}</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: '#eeebeb' }} aria-label="Previous month">‹</button>
        <span className="font-medium text-sm">{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: '#eeebeb' }} aria-label="Next month">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
        {DAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const ds = toDateStr(year, month, day);
          const disabled = isDisabled(ds);
          const isSel = selected && isSameDay(ds, selected);
          const isToday = isSameDay(ds, today);

          let bg = 'transparent';
          let color = '#334155';
          if (disabled) { color = '#cbd5e1'; }
          else if (isSel) { bg = '#6366F1'; color = '#ffffff'; }
          else if (isToday) { bg = '#e0e7ff'; color = '#4338ca'; }

          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => { if (!disabled) setSelected(ds); }}
              className="h-9 rounded-lg transition-colors"
              style={{ background: bg, color, cursor: disabled ? 'default' : 'pointer' }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs" style={{ color: '#64748b' }}>
          {selected ? `Selected: ${selected}` : 'No date selected'}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity"
          style={{ background: selected ? '#6366F1' : '#a5b4fc', cursor: selected ? 'pointer' : 'default' }}
        >
          Submit Date
        </button>
      </div>
    </div>
  );
}

/* ── Compound Picker (Widget 3 — range + single) ─────────────── */
function CompoundPicker(props: {
  widgetId: string;
  label: string;
  description: string;
  initYear: number;
  initMonth: number;
  minDate?: string;
  maxDate?: string;
  futureOnly?: boolean;
  onSubmit: GeneratedPageProps['onSubmit'];
}) {
  const { widgetId, label, description, initYear, initMonth, minDate, maxDate, futureOnly, onSubmit } = props;
  const [mode, setMode] = useState<'range' | 'single'>('range');

  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [singleDate, setSingleDate] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const today = useMemo(() => {
    const n = new Date(2025, 0, 1);
    return toDateStr(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const days = useMemo(() => daysInMonth(year, month), [year, month]);
  const offset = useMemo(() => firstDayOfWeek(year, month), [year, month]);

  const isDisabled = useCallback(
    (ds: string) => {
      if (futureOnly && ds <= today) return true;
      if (minDate && ds < minDate) return true;
      if (maxDate && ds > maxDate) return true;
      return false;
    },
    [minDate, maxDate, futureOnly, today],
  );

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const handleClick = (ds: string) => {
    if (isDisabled(ds)) return;
    if (mode === 'single') {
      setSingleDate(ds);
    } else {
      if (!startDate || (startDate && endDate)) {
        setStartDate(ds);
        setEndDate(null);
      } else {
        if (ds < startDate) { setStartDate(ds); setEndDate(null); }
        else { setEndDate(ds); }
      }
    }
  };

  const inRange = (ds: string) => {
    if (mode !== 'range') return false;
    if (startDate && endDate) return isBetween(ds, startDate, endDate);
    if (startDate && hover && !endDate) {
      const lo = hover >= startDate ? startDate : hover;
      const hi = hover >= startDate ? hover : startDate;
      return isBetween(ds, lo, hi);
    }
    return false;
  };

  const handleSubmit = () => {
    if (mode === 'single') {
      if (!singleDate) return;
      onSubmit({
        type: 'date',
        value: singleDate,
        raw: { widget_id: widgetId, mode: 'single', selected_date: singleDate },
      });
    } else {
      if (!startDate || !endDate) return;
      onSubmit({
        type: 'date',
        value: `${startDate}/${endDate}`,
        raw: { widget_id: widgetId, mode: 'range', start_date: startDate, end_date: endDate },
      });
    }
  };

  const canSubmit = mode === 'single' ? !!singleDate : !!(startDate && endDate);

  return (
    <div data-widget-id={widgetId} className="rounded-xl p-6" style={{ background: '#ffffff' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#6366F1' }}>{label}</h3>
      <p className="text-sm mb-4" style={{ color: '#64748b' }}>{description}</p>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('range')}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: mode === 'range' ? '#6366F1' : '#eeebeb', color: mode === 'range' ? '#fff' : '#334155' }}
        >
          Date Range
        </button>
        <button
          onClick={() => setMode('single')}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: mode === 'single' ? '#6366F1' : '#eeebeb', color: mode === 'single' ? '#fff' : '#334155' }}
        >
          Single Date
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: '#eeebeb' }} aria-label="Previous month">‹</button>
        <span className="font-medium text-sm">{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: '#eeebeb' }} aria-label="Next month">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
        {DAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const ds = toDateStr(year, month, day);
          const disabled = isDisabled(ds);
          const isStart = mode === 'range' && startDate && isSameDay(ds, startDate);
          const isEnd = mode === 'range' && endDate && isSameDay(ds, endDate);
          const isSel = mode === 'single' && singleDate && isSameDay(ds, singleDate);
          const range = inRange(ds);
          const isToday = isSameDay(ds, today);

          let bg = 'transparent';
          let color = '#334155';
          if (disabled) { color = '#cbd5e1'; }
          else if (isStart || isEnd || isSel) { bg = '#6366F1'; color = '#ffffff'; }
          else if (range) { bg = '#e0e7ff'; color = '#4338ca'; }
          else if (isToday) { bg = '#fafafa'; color = '#6366F1'; }

          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => handleClick(ds)}
              onMouseEnter={() => setHover(ds)}
              onMouseLeave={() => setHover(null)}
              className="h-9 rounded-lg transition-colors"
              style={{ background: bg, color, cursor: disabled ? 'default' : 'pointer' }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs" style={{ color: '#64748b' }}>
          {mode === 'single'
            ? singleDate ? `Selected: ${singleDate}` : 'No date selected'
            : startDate && endDate
            ? `${startDate} → ${endDate}`
            : startDate
            ? `Start: ${startDate} (pick end)`
            : 'Click a start date'}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity"
          style={{ background: canSubmit ? '#6366F1' : '#a5b4fc', cursor: canSubmit ? 'pointer' : 'default' }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────── */
export default function Page_science_fair(props: GeneratedPageProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  return (
    <div className="min-h-screen font-sans" style={{ background: '#c28a85' }}>
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 shadow-sm" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold flex items-center gap-2" style={{ color: '#6366F1' }}>
              🎫 EchoEvents
            </span>
            <nav className="hidden md:flex gap-5 text-sm font-medium" style={{ color: '#64748b' }}>
              <a href="#" className="hover:opacity-80">Browse</a>
              <a href="#" className="hover:opacity-80">Tickets</a>
              <a href="#" className="hover:opacity-80">Calendar</a>
              <a href="#" className="hover:opacity-80">Saved</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center rounded-lg px-3 py-1.5 text-sm" style={{ background: '#fafafa', color: '#64748b' }}>
              <span className="mr-2">🔍</span>
              <span>Search events…</span>
            </div>
            <button className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: '#6366F1' }}>
              + Create Event
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: '#F97316' }}>A</div>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop"
          alt="Science Fair banner with crowd"
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-8" style={{ background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.65))' }}>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">🔬 Science Fair 2025</h1>
          <p className="text-white/80 text-sm max-w-xl">Select your preferred dates for the fair, set your submission deadline, and plan your schedule.</p>
          <button className="mt-3 self-start px-6 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#F97316' }}>
            Get Tickets
          </button>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ─── Context text ─── */}
        <div className="rounded-xl p-5 mb-6" style={{ background: '#feffff' }}>
          <h2 className="text-lg font-semibold mb-1" style={{ color: '#334155' }}>Event Scheduling</h2>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Use the datepickers below to select the fair exhibition dates, set your project submission deadline, and configure the combined schedule. Each picker operates independently.
          </p>
        </div>

        {/* ─── Filters ─── */}
        <div className="flex gap-2 mb-6">
          {(['all', 'upcoming', 'past'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors"
              style={{ background: filter === f ? '#6366F1' : '#eeebeb', color: filter === f ? '#fff' : '#334155' }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ─── Widget Grid ─── */}
        <div className="flex flex-col gap-6">
          {/* ─ Widget 1: Fair Dates (range) ─ */}
          <div className="grid md:grid-cols-2 gap-6">
            <RangePicker
              widgetId="fair_dates"
              label="Fair Dates"
              description="Select the start and end dates for the exhibition. Dates are limited to May 6 – Oct 11, 2025."
              initYear={2025}
              initMonth={7}
              minDate="2025-05-06"
              maxDate="2025-10-11"
              onSubmit={props.onSubmit}
            />
            {/* Side info */}
            <div className="rounded-xl p-5 flex flex-col justify-between" style={{ background: '#feffff' }}>
              <div>
                <h4 className="font-semibold text-sm mb-2" style={{ color: '#334155' }}>Ticket Details</h4>
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-xs" style={{ color: '#64748b' }}>Qty</label>
                  <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid #eeebeb' }}>
                    <button className="px-3 py-1 text-sm" style={{ background: '#fafafa' }}>−</button>
                    <span className="px-4 py-1 text-sm">2</span>
                    <button className="px-3 py-1 text-sm" style={{ background: '#fafafa' }}>+</button>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs block mb-1" style={{ color: '#64748b' }}>Seat Section</label>
                  <select className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#fafafa', border: '1px solid #eeebeb' }}>
                    <option>General Admission</option>
                    <option>VIP Front Row</option>
                    <option>Balcony</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#64748b' }}>Promo Code</label>
                  <input type="text" placeholder="Enter code" className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#fafafa', border: '1px solid #eeebeb' }} />
                </div>
              </div>
              <img
                src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop"
                alt="Conference venue"
                className="w-full h-32 object-cover rounded-lg mt-4"
              />
            </div>
          </div>

          {/* ─ Widget 2: Submission Deadline (single) ─ */}
          <div className="grid md:grid-cols-2 gap-6">
            <SinglePicker
              widgetId="submission_deadline"
              label="Submission Deadline"
              description="Choose the final date for project submissions. Only future dates starting Oct 1, 2025 are available."
              initYear={2025}
              initMonth={9}
              minDate="2025-10-01"
              futureOnly
              onSubmit={props.onSubmit}
            />
            {/* Venue card */}
            <div className="rounded-xl p-5" style={{ background: '#feffff' }}>
              <h4 className="font-semibold text-sm mb-2" style={{ color: '#334155' }}>Venue Info</h4>
              <img
                src="https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400&h=300&fit=crop"
                alt="Art gallery venue"
                className="w-full h-36 object-cover rounded-lg mb-3"
              />
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>📍 Convention Center, Hall B</p>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>🕒 Doors open 8:00 AM</p>
              <p className="text-xs" style={{ color: '#64748b' }}>🎟️ Free entry for students</p>
              <div className="mt-3 rounded-lg p-3" style={{ background: '#fafafa' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#334155' }}>Organizer</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#6366F1' }}>S</div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#334155' }}>Science Foundation</p>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>12 events hosted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─ Widget 3: Compound ─ */}
          <CompoundPicker
            widgetId="compound"
            label="Fair Dates + Submission Deadline"
            description="Combined scheduling: pick a date range for the fair or a single submission date. Dates limited to Mar 31 – Aug 13, 2025."
            initYear={2025}
            initMonth={5}
            minDate="2025-03-31"
            maxDate="2025-08-13"
            futureOnly
            onSubmit={props.onSubmit}
          />
        </div>

        {/* ─── Similar Events Carousel ─── */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#ffffff' }}>Similar Events</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: 'Tech Innovation Expo', date: 'Nov 12, 2025', img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=300&fit=crop', alt: 'Film festival screening' },
              { title: 'Young Inventors Fair', date: 'Dec 3, 2025', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', alt: 'Food expo showcase' },
              { title: 'STEM Workshop Series', date: 'Jan 18, 2026', img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop', alt: 'Music stage event' },
            ].map((ev) => (
              <div key={ev.title} className="rounded-xl overflow-hidden" style={{ background: '#ffffff' }}>
                <img src={ev.img} alt={ev.alt} className="w-full h-36 object-cover" />
                <div className="p-4">
                  <p className="text-sm font-semibold" style={{ color: '#334155' }}>{ev.title}</p>
                  <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{ev.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="mt-12 py-8 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto grid sm:grid-cols-4 gap-6 text-xs" style={{ color: '#64748b' }}>
          <div>
            <p className="font-semibold mb-2" style={{ color: '#334155' }}>EchoEvents</p>
            <p>Your one-stop platform for discovering, scheduling, and attending events.</p>
          </div>
          <div>
            <p className="font-semibold mb-2" style={{ color: '#334155' }}>Policies</p>
            <p>Event Cancellation</p>
            <p>Refund Policy</p>
            <p>Privacy Statement</p>
          </div>
          <div>
            <p className="font-semibold mb-2" style={{ color: '#334155' }}>Community</p>
            <p>Guidelines</p>
            <p>Help Center</p>
            <p>Blog</p>
          </div>
          <div>
            <p className="font-semibold mb-2" style={{ color: '#334155' }}>Connect</p>
            <p>EchoX · EchoBook · EchoGram</p>
            <p className="mt-2">© 2025 EchoEvents Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
