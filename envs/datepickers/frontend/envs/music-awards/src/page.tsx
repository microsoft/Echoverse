import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function pad(n: number) {
  return n < 10 ? '0' + n : '' + n;
}

function toISO(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

/* ──────────────────── Widget 1: Ceremony Date (constrained, future_only) ──────────────────── */

function CeremonyDatePicker({
  onSubmit,
}: {
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [month, setMonth] = useState(8); // September = index 8
  const [year, setYear] = useState(2025);
  const [selected, setSelected] = useState<number | null>(null);

  const minDate = new Date(2025, 8, 1); // 2025-09-01

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);

  const cells = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    while (c.length % 7 !== 0) c.push(null);
    return c;
  }, [daysInMonth, firstDay]);

  const isDisabled = useCallback(
    (day: number) => {
      const d = new Date(year, month, day);
      return d < minDate;
    },
    [year, month],
  );

  const prevMonth = useCallback(() => {
    setSelected(null);
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    setSelected(null);
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const iso = toISO(year, month, selected);
    onSubmit({
      type: 'date',
      value: iso,
      raw: { widget_id: 'ceremony_date', year, month: month + 1, day: selected, iso },
    });
  }, [selected, year, month, onSubmit]);

  return (
    <div data-widget-id="ceremony_date" className="p-6" style={{ background: '#fdfdfd', border: '1px solid #d7d7d7' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#333' }}>Ceremony Date</h3>
      <p className="text-sm mb-4" style={{ color: '#777' }}>Select the date for the awards ceremony. Past dates are unavailable.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 text-sm font-medium" style={{ background: '#f0f0f0', color: '#333' }} aria-label="Previous month">◀</button>
        <span className="font-semibold" style={{ color: '#333' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 text-sm font-medium" style={{ background: '#f0f0f0', color: '#333' }} aria-label="Next month">▶</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-1" style={{ color: '#999' }}>
        {DAYS_SHORT.map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const disabled = isDisabled(day);
          const isSelected = day === selected;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => { if (!disabled) setSelected(day); }}
              className={`py-1.5 transition-colors ${
                disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSelected
                  ? 'text-white font-semibold'
                  : 'cursor-pointer'
              }`}
              style={
                isSelected && !disabled
                  ? { background: '#6366F1', color: '#fff' }
                  : disabled
                  ? {}
                  : { color: '#333' }
              }
              onMouseEnter={(e) => { if (!disabled && !isSelected) e.currentTarget.style.background = '#f0f0f0'; }}
              onMouseLeave={(e) => { if (!disabled && !isSelected) e.currentTarget.style.background = ''; }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="mt-3 text-sm" style={{ color: '#6366F1' }}>
          Selected: <strong>{MONTHS[month]} {selected}, {year}</strong>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={selected === null}
        className="mt-4 w-full py-2.5 text-sm font-semibold text-white transition-opacity"
        style={{ background: selected !== null ? '#6366F1' : '#d7d7d7', cursor: selected !== null ? 'pointer' : 'not-allowed' }}
      >
        Confirm Ceremony Date
      </button>
    </div>
  );
}

/* ──────────────────── Widget 2: Nominee DOB (dob, past_only) ──────────────────── */

function NomineeDOBPicker({
  onSubmit,
}: {
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(7); // August = index 7
  const [selected, setSelected] = useState<number | null>(null);

  const maxDate = new Date(2026, 7, 31); // 2026-08-31

  const years = useMemo(() => {
    const a: number[] = [];
    for (let y = 1950; y <= 2015; y++) a.push(y);
    return a;
  }, []);

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);

  const cells = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    while (c.length % 7 !== 0) c.push(null);
    return c;
  }, [daysInMonth, firstDay]);

  const isDisabled = useCallback(
    (day: number) => {
      const d = new Date(year, month, day);
      return d > maxDate;
    },
    [year, month],
  );

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(Number(e.target.value));
    setSelected(null);
  }, []);

  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(Number(e.target.value));
    setSelected(null);
  }, []);

  const prevMonth = useCallback(() => {
    setSelected(null);
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    setSelected(null);
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const iso = toISO(year, month, selected);
    onSubmit({
      type: 'dob',
      value: iso,
      raw: { widget_id: 'nominee_dob', year, month: month + 1, day: selected, iso },
    });
  }, [selected, year, month, onSubmit]);

  return (
    <div data-widget-id="nominee_dob" className="p-6" style={{ background: '#fdfdfd', border: '1px solid #d7d7d7' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#333' }}>Nominee Date of Birth</h3>
      <p className="text-sm mb-4" style={{ color: '#777' }}>Select the nominee's date of birth for eligibility verification.</p>

      <div className="flex gap-3 mb-4">
        <select
          value={year}
          onChange={handleYearChange}
          className="flex-1 px-3 py-2 text-sm"
          style={{ border: '1px solid #d7d7d7', color: '#333', background: '#fafafa' }}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={month}
          onChange={handleMonthChange}
          className="flex-1 px-3 py-2 text-sm"
          style={{ border: '1px solid #d7d7d7', color: '#333', background: '#fafafa' }}
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 text-sm font-medium" style={{ background: '#f0f0f0', color: '#333' }} aria-label="Previous month">◀</button>
        <span className="font-semibold" style={{ color: '#333' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 text-sm font-medium" style={{ background: '#f0f0f0', color: '#333' }} aria-label="Next month">▶</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-1" style={{ color: '#999' }}>
        {DAYS_SHORT.map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const disabled = isDisabled(day);
          const isSelected = day === selected;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => { if (!disabled) setSelected(day); }}
              className={`py-1.5 transition-colors ${
                disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSelected
                  ? 'text-white font-semibold'
                  : 'cursor-pointer'
              }`}
              style={
                isSelected && !disabled
                  ? { background: '#6366F1', color: '#fff' }
                  : disabled
                  ? {}
                  : { color: '#333' }
              }
              onMouseEnter={(e) => { if (!disabled && !isSelected) e.currentTarget.style.background = '#f0f0f0'; }}
              onMouseLeave={(e) => { if (!disabled && !isSelected) e.currentTarget.style.background = ''; }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="mt-3 text-sm" style={{ color: '#6366F1' }}>
          Selected: <strong>{MONTHS[month]} {selected}, {year}</strong>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={selected === null}
        className="mt-4 w-full py-2.5 text-sm font-semibold text-white transition-opacity"
        style={{ background: selected !== null ? '#6366F1' : '#d7d7d7', cursor: selected !== null ? 'pointer' : 'not-allowed' }}
      >
        Submit Date of Birth
      </button>
    </div>
  );
}

/* ──────────────────── Widget 3: Compound (constrained+dob) ──────────────────── */

function CompoundDatepicker({
  onSubmit,
}: {
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [month, setMonth] = useState(5); // June = index 5
  const [year, setYear] = useState(2025);
  const [selected, setSelected] = useState<number | null>(null);

  const minDate = new Date(2025, 5, 1); // 2025-06-01

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);

  const cells = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    while (c.length % 7 !== 0) c.push(null);
    return c;
  }, [daysInMonth, firstDay]);

  const isDisabled = useCallback(
    (day: number) => {
      const d = new Date(year, month, day);
      return d < minDate;
    },
    [year, month],
  );

  const prevMonth = useCallback(() => {
    setSelected(null);
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    setSelected(null);
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const iso = toISO(year, month, selected);
    onSubmit({
      type: 'date',
      value: iso,
      raw: { widget_id: 'compound', year, month: month + 1, day: selected, iso },
    });
  }, [selected, year, month, onSubmit]);

  return (
    <div data-widget-id="compound" className="p-6" style={{ background: '#fdfdfd', border: '1px solid #d7d7d7' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#333' }}>Ceremony Date + Nominee DOB</h3>
      <p className="text-sm mb-4" style={{ color: '#777' }}>Select a date for the combined ceremony and nominee record.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 text-sm font-medium" style={{ background: '#f0f0f0', color: '#333' }} aria-label="Previous month">◀</button>
        <span className="font-semibold" style={{ color: '#333' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 text-sm font-medium" style={{ background: '#f0f0f0', color: '#333' }} aria-label="Next month">▶</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-1" style={{ color: '#999' }}>
        {DAYS_SHORT.map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const disabled = isDisabled(day);
          const isSelected = day === selected;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => { if (!disabled) setSelected(day); }}
              className={`py-1.5 transition-colors ${
                disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSelected
                  ? 'text-white font-semibold'
                  : 'cursor-pointer'
              }`}
              style={
                isSelected && !disabled
                  ? { background: '#6366F1', color: '#fff' }
                  : disabled
                  ? {}
                  : { color: '#333' }
              }
              onMouseEnter={(e) => { if (!disabled && !isSelected) e.currentTarget.style.background = '#f0f0f0'; }}
              onMouseLeave={(e) => { if (!disabled && !isSelected) e.currentTarget.style.background = ''; }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="mt-3 text-sm" style={{ color: '#6366F1' }}>
          Selected: <strong>{MONTHS[month]} {selected}, {year}</strong>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={selected === null}
        className="mt-4 w-full py-2.5 text-sm font-semibold text-white transition-opacity"
        style={{ background: selected !== null ? '#6366F1' : '#d7d7d7', cursor: selected !== null ? 'pointer' : 'not-allowed' }}
      >
        Submit Date
      </button>
    </div>
  );
}

/* ──────────────────── Main Page ──────────────────── */

export default function Page_music_awards(props: GeneratedPageProps) {
  const [filter, setFilter] = useState<'all' | 'ceremony' | 'dob' | 'compound'>('all');

  return (
    <div className="min-h-screen" style={{ background: '#d7d7d7', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header className="w-full" style={{ background: '#fdfdfd', borderBottom: '1px solid #d7d7d7' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎫</span>
            <span className="text-lg font-semibold" style={{ color: '#333' }}>EchoEvents</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: '#555' }}>
            <a href="#" className="hover:underline">Browse</a>
            <a href="#" className="hover:underline">Tickets</a>
            <a href="#" className="hover:underline">Calendar</a>
            <a href="#" className="hover:underline">Saved</a>
          </nav>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search events…"
              className="hidden sm:block px-3 py-1.5 text-sm"
              style={{ border: '1px solid #d7d7d7', background: '#fafafa', color: '#333', width: 180 }}
            />
            <button className="px-3 py-1.5 text-sm font-medium text-white" style={{ background: '#6366F1' }}>
              Create Event
            </button>
            <div className="w-8 h-8 flex items-center justify-center text-sm font-semibold text-white" style={{ background: '#6366F1' }}>
              P
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full" style={{ maxHeight: 320, overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop"
          alt="Concert crowd at music awards"
          className="w-full object-cover"
          style={{ height: 320 }}
        />
        <div className="absolute inset-0 flex flex-col justify-end p-8" style={{ background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.65))' }}>
          <h1 className="text-3xl font-bold text-white mb-1">Music Awards 2025</h1>
          <p className="text-white text-sm opacity-90 mb-3">Celebrating the best in music — nominations, ceremonies, and exclusive events</p>
          <button className="self-start px-5 py-2 text-sm font-semibold text-white" style={{ background: '#F97316' }}>
            Get Tickets
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Context */}
        <div className="mb-6 p-5" style={{ background: '#fafafa', border: '1px solid #d7d7d7' }}>
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#333' }}>Event Date Selection</h2>
          <p className="text-sm" style={{ color: '#555' }}>
            Use the date pickers below to select ceremony dates, provide nominee birth dates, and finalize combined scheduling information for the Music Awards.
          </p>
        </div>

        {/* Form context bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4" style={{ background: '#f7f7f7', border: '1px solid #d7d7d7' }}>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: '#555' }}>Tickets</label>
            <div className="flex items-center" style={{ border: '1px solid #d7d7d7' }}>
              <button className="px-2 py-1 text-sm" style={{ background: '#f0f0f0' }}>−</button>
              <span className="px-3 py-1 text-sm" style={{ background: '#fdfdfd' }}>2</span>
              <button className="px-2 py-1 text-sm" style={{ background: '#f0f0f0' }}>+</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: '#555' }}>Section</label>
            <select className="px-2 py-1 text-sm" style={{ border: '1px solid #d7d7d7', background: '#fdfdfd' }}>
              <option>Orchestra</option>
              <option>Mezzanine</option>
              <option>Balcony</option>
              <option>VIP</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: '#555' }}>Promo</label>
            <input type="text" placeholder="Code" className="px-2 py-1 text-sm" style={{ border: '1px solid #d7d7d7', background: '#fdfdfd', width: 100 }} />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(
            [
              ['all', 'All Widgets'],
              ['ceremony', 'Ceremony Date'],
              ['dob', 'Nominee DOB'],
              ['compound', 'Compound'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                background: filter === key ? '#6366F1' : '#f0f0f0',
                color: filter === key ? '#fff' : '#555',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Datepicker Widgets */}
        <div className="flex flex-col gap-6 mb-8">
          {(filter === 'all' || filter === 'ceremony') && (
            <CeremonyDatePicker onSubmit={props.onSubmit} />
          )}
          {(filter === 'all' || filter === 'dob') && (
            <NomineeDOBPicker onSubmit={props.onSubmit} />
          )}
          {(filter === 'all' || filter === 'compound') && (
            <CompoundDatepicker onSubmit={props.onSubmit} />
          )}
        </div>

        {/* Similar Events Carousel */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#333' }}>Similar Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div style={{ background: '#fdfdfd', border: '1px solid #d7d7d7' }}>
              <img src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop" alt="Music stage" className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="text-sm font-semibold" style={{ color: '#333' }}>Summer Music Fest</h3>
                <p className="text-xs mt-1" style={{ color: '#777' }}>Aug 15 – Aug 17, 2025</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#F97316' }}>From $89</p>
              </div>
            </div>
            <div style={{ background: '#fdfdfd', border: '1px solid #d7d7d7' }}>
              <img src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=300&fit=crop" alt="Film festival" className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="text-sm font-semibold" style={{ color: '#333' }}>Indie Film & Music Night</h3>
                <p className="text-xs mt-1" style={{ color: '#777' }}>Sep 5, 2025</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#F97316' }}>From $45</p>
              </div>
            </div>
            <div style={{ background: '#fdfdfd', border: '1px solid #d7d7d7' }}>
              <img src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop" alt="Conference" className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="text-sm font-semibold" style={{ color: '#333' }}>Music Industry Summit</h3>
                <p className="text-xs mt-1" style={{ color: '#777' }}>Oct 10 – Oct 12, 2025</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#F97316' }}>From $120</p>
              </div>
            </div>
          </div>
        </div>

        {/* Venue Info */}
        <div className="mb-8 p-5" style={{ background: '#fafafa', border: '1px solid #d7d7d7' }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: '#333' }}>Venue Information</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="text-sm" style={{ color: '#555' }}>Grand Music Hall</p>
              <p className="text-xs mt-1" style={{ color: '#777' }}>1200 Broadway Ave, Los Angeles, CA 90015</p>
              <p className="text-xs mt-1" style={{ color: '#777' }}>Capacity: 5,000 · Indoor · Wheelchair Accessible</p>
            </div>
            <div className="flex-1 h-32 flex items-center justify-center text-xs" style={{ background: '#f0f0f0', color: '#999' }}>
              Map placeholder
            </div>
          </div>
        </div>

        {/* Organizer */}
        <div className="mb-8 p-5 flex items-center gap-4" style={{ background: '#fafafa', border: '1px solid #d7d7d7' }}>
          <div className="w-12 h-12 flex items-center justify-center text-lg font-bold text-white" style={{ background: '#6366F1' }}>
            MA
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#333' }}>Music Awards Foundation</p>
            <p className="text-xs" style={{ color: '#777' }}>Organizer · 240 events hosted</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-8" style={{ background: '#fafafa', borderTop: '1px solid #d7d7d7' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs" style={{ color: '#777' }}>
            <div>
              <p className="font-semibold mb-2" style={{ color: '#555' }}>Policies</p>
              <p>Terms of Service</p>
              <p>Privacy Policy</p>
              <p>Cookie Policy</p>
            </div>
            <div>
              <p className="font-semibold mb-2" style={{ color: '#555' }}>Refunds</p>
              <p>Refund Policy</p>
              <p>Cancellation</p>
              <p>Exchanges</p>
            </div>
            <div>
              <p className="font-semibold mb-2" style={{ color: '#555' }}>Community</p>
              <p>Guidelines</p>
              <p>Help Center</p>
              <p>Contact Us</p>
            </div>
            <div>
              <p className="font-semibold mb-2" style={{ color: '#555' }}>Connect</p>
              <p>EchoX</p>
              <p>EchoGram</p>
              <p>EchoBook</p>
            </div>
          </div>
          <p className="text-xs mt-6" style={{ color: '#999' }}>© 2025 EchoEvents. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
