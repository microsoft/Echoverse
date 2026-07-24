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
const MONTHS_SHORT = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
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

/* ────────── Widget 1: Milestone Date (single_date, future_only) ────────── */

function MilestoneDatePicker({
  onSubmit,
}: {
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [month, setMonth] = useState(10); // Nov = 10 (0-indexed)
  const [year, setYear] = useState(2025);
  const [selected, setSelected] = useState<number | null>(null);

  const minDate = new Date(2025, 10, 1); // 2025-11-01

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
      d.setHours(0, 0, 0, 0);
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      return d < min;
    },
    [year, month],
  );

  const prevMonth = useCallback(() => {
    setSelected(null);
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    setSelected(null);
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const iso = toISO(year, month, selected);
    onSubmit({
      type: 'date',
      value: iso,
      raw: { widget_id: 'milestone_date', year, month: month + 1, day: selected, iso },
    });
  }, [selected, year, month, onSubmit]);

  return (
    <div data-widget-id="milestone_date" className="p-6" style={{ background: '#ffffff', borderRadius: '9999px' === '9999px' ? '16px' : '9999px', border: '1px solid #eeece6' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#4e4c5b' }}>Milestone Date</h3>
      <p className="text-sm mb-4" style={{ color: '#7a7886' }}>Select a future date for your project milestone.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center text-lg font-bold transition-colors" style={{ background: '#f8f8f9', color: '#4e4c5b', borderRadius: '9999px' }} aria-label="Previous month">‹</button>
        <span className="text-base font-semibold" style={{ color: '#4e4c5b' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center text-lg font-bold transition-colors" style={{ background: '#f8f8f9', color: '#4e4c5b', borderRadius: '9999px' }} aria-label="Next month">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-1" style={{ color: '#7a7886' }}>
        {DAYS_SHORT.map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const disabled = isDisabled(day);
          const isSel = day === selected;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => { if (!disabled) setSelected(day); }}
              className={`py-1.5 transition-colors ${disabled ? 'text-gray-300 cursor-not-allowed' : isSel ? 'text-white font-semibold' : 'hover:opacity-80 cursor-pointer'}`}
              style={{
                borderRadius: '9999px',
                background: isSel && !disabled ? '#1D4ED8' : disabled ? 'transparent' : 'transparent',
                color: isSel && !disabled ? '#fff' : disabled ? '#ccc' : '#4e4c5b',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="mt-3 text-sm text-center" style={{ color: '#4e4c5b' }}>
          Selected: <strong>{MONTHS[month]} {selected}, {year}</strong>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={selected === null}
        className="mt-4 w-full py-2.5 text-sm font-semibold text-white transition-opacity"
        style={{
          borderRadius: '9999px',
          background: selected !== null ? '#1D4ED8' : '#a0aec0',
          cursor: selected !== null ? 'pointer' : 'not-allowed',
        }}
      >
        Submit Milestone Date
      </button>
    </div>
  );
}

/* ────────── Widget 2: Review Month (month_year, no constraints) ────────── */

function ReviewMonthPicker({
  onSubmit,
}: {
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const prevYear = useCallback(() => { setYear(y => y - 1); setSelectedMonth(null); }, []);
  const nextYear = useCallback(() => { setYear(y => y + 1); setSelectedMonth(null); }, []);

  const handleSubmit = useCallback(() => {
    if (selectedMonth === null) return;
    const iso = `${year}-${pad(selectedMonth + 1)}`;
    onSubmit({
      type: 'month_year',
      value: iso,
      raw: { widget_id: 'review_month', year, month: selectedMonth + 1, month_name: MONTHS[selectedMonth], iso },
    });
  }, [selectedMonth, year, onSubmit]);

  return (
    <div data-widget-id="review_month" className="p-6" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #eeece6' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#4e4c5b' }}>Review Month</h3>
      <p className="text-sm mb-4" style={{ color: '#7a7886' }}>Select the month and year for your project review.</p>

      <div className="flex items-center justify-between mb-4 px-2">
        <button onClick={prevYear} className="w-9 h-9 flex items-center justify-center text-lg font-bold transition-colors" style={{ background: '#f8f8f9', color: '#4e4c5b', borderRadius: '9999px' }} aria-label="Previous year">‹</button>
        <span className="text-base font-semibold" style={{ color: '#4e4c5b' }}>{year}</span>
        <button onClick={nextYear} className="w-9 h-9 flex items-center justify-center text-lg font-bold transition-colors" style={{ background: '#f8f8f9', color: '#4e4c5b', borderRadius: '9999px' }} aria-label="Next year">›</button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {MONTHS_SHORT.map((m, i) => {
          const isSel = selectedMonth === i;
          return (
            <button
              key={m}
              onClick={() => setSelectedMonth(i)}
              className="py-2.5 text-sm font-medium transition-all"
              style={{
                borderRadius: '9999px',
                background: isSel ? '#1D4ED8' : '#f8f8f9',
                color: isSel ? '#ffffff' : '#4e4c5b',
                border: isSel ? '2px solid #1D4ED8' : '2px solid transparent',
              }}
            >
              {m}
            </button>
          );
        })}
      </div>

      {selectedMonth !== null && (
        <p className="text-sm mb-3 text-center" style={{ color: '#4e4c5b' }}>
          Selected: <strong>{MONTHS[selectedMonth]} {year}</strong>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={selectedMonth === null}
        className="w-full py-2.5 text-sm font-semibold text-white transition-opacity"
        style={{
          borderRadius: '9999px',
          background: selectedMonth !== null ? '#1D4ED8' : '#a0aec0',
          cursor: selectedMonth !== null ? 'pointer' : 'not-allowed',
        }}
      >
        Submit Review Month
      </button>
    </div>
  );
}

/* ────────── Widget 3: Compound (single_date + month_year) ────────── */

function CompoundPicker({
  onSubmit,
}: {
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  // Date picker state
  const [dMonth, setDMonth] = useState(5); // June = 5
  const [dYear, setDYear] = useState(2025);
  const [dSelected, setDSelected] = useState<number | null>(null);

  // Month/year picker state
  const [mYear, setMYear] = useState(2025);
  const [mSelected, setMSelected] = useState<number | null>(null);

  const minDate = new Date(2025, 5, 1); // 2025-06-01

  const daysInMonth = useMemo(() => getDaysInMonth(dYear, dMonth), [dYear, dMonth]);
  const firstDay = useMemo(() => getFirstDayOfWeek(dYear, dMonth), [dYear, dMonth]);

  const cells = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    while (c.length % 7 !== 0) c.push(null);
    return c;
  }, [daysInMonth, firstDay]);

  const isDisabled = useCallback(
    (day: number) => {
      const d = new Date(dYear, dMonth, day);
      d.setHours(0, 0, 0, 0);
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      return d < min;
    },
    [dYear, dMonth],
  );

  const prevMonth = useCallback(() => {
    setDSelected(null);
    if (dMonth === 0) { setDMonth(11); setDYear(y => y - 1); } else setDMonth(m => m - 1);
  }, [dMonth]);
  const nextMonth = useCallback(() => {
    setDSelected(null);
    if (dMonth === 11) { setDMonth(0); setDYear(y => y + 1); } else setDMonth(m => m + 1);
  }, [dMonth]);

  const handleDateSubmit = useCallback(() => {
    if (dSelected === null) return;
    const iso = toISO(dYear, dMonth, dSelected);
    onSubmit({
      type: 'date',
      value: iso,
      raw: { widget_id: 'compound', picker: 'single_date', year: dYear, month: dMonth + 1, day: dSelected, iso },
    });
  }, [dSelected, dYear, dMonth, onSubmit]);

  const handleMonthSubmit = useCallback(() => {
    if (mSelected === null) return;
    const iso = `${mYear}-${pad(mSelected + 1)}`;
    onSubmit({
      type: 'month_year',
      value: iso,
      raw: { widget_id: 'compound', picker: 'month_year', year: mYear, month: mSelected + 1, month_name: MONTHS[mSelected], iso },
    });
  }, [mSelected, mYear, onSubmit]);

  return (
    <div data-widget-id="compound" className="p-6" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #eeece6' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#4e4c5b' }}>Milestone Date + Review Month</h3>
      <p className="text-sm mb-5" style={{ color: '#7a7886' }}>Complete both selections for this compound milestone entry.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Date picker sub-section */}
        <div className="p-4" style={{ background: '#fefefe', borderRadius: '12px', border: '1px solid #eeece6' }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: '#4e4c5b' }}>Select Date</h4>

          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-base font-bold transition-colors" style={{ background: '#f8f8f9', color: '#4e4c5b', borderRadius: '9999px' }} aria-label="Previous month">‹</button>
            <span className="text-sm font-semibold" style={{ color: '#4e4c5b' }}>{MONTHS[dMonth]} {dYear}</span>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-base font-bold transition-colors" style={{ background: '#f8f8f9', color: '#4e4c5b', borderRadius: '9999px' }} aria-label="Next month">›</button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-1" style={{ color: '#7a7886' }}>
            {DAYS_SHORT.map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const disabled = isDisabled(day);
              const isSel = day === dSelected;
              return (
                <button
                  key={i}
                  disabled={disabled}
                  onClick={() => { if (!disabled) setDSelected(day); }}
                  className={`py-1 transition-colors ${disabled ? 'text-gray-300 cursor-not-allowed' : isSel ? 'text-white font-semibold' : 'hover:opacity-80 cursor-pointer'}`}
                  style={{
                    borderRadius: '9999px',
                    background: isSel && !disabled ? '#1D4ED8' : 'transparent',
                    color: isSel && !disabled ? '#fff' : disabled ? '#ccc' : '#4e4c5b',
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {dSelected !== null && (
            <p className="mt-2 text-xs text-center" style={{ color: '#4e4c5b' }}>
              Selected: <strong>{MONTHS[dMonth]} {dSelected}, {dYear}</strong>
            </p>
          )}

          <button
            onClick={handleDateSubmit}
            disabled={dSelected === null}
            className="mt-3 w-full py-2 text-sm font-semibold text-white transition-opacity"
            style={{
              borderRadius: '9999px',
              background: dSelected !== null ? '#1D4ED8' : '#a0aec0',
              cursor: dSelected !== null ? 'pointer' : 'not-allowed',
            }}
          >
            Submit Date
          </button>
        </div>

        {/* Month/year picker sub-section */}
        <div className="p-4" style={{ background: '#fefefe', borderRadius: '12px', border: '1px solid #eeece6' }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: '#4e4c5b' }}>Select Month</h4>

          <div className="flex items-center justify-between mb-3 px-1">
            <button onClick={() => { setMYear(y => y - 1); setMSelected(null); }} className="w-8 h-8 flex items-center justify-center text-base font-bold transition-colors" style={{ background: '#f8f8f9', color: '#4e4c5b', borderRadius: '9999px' }} aria-label="Previous year">‹</button>
            <span className="text-sm font-semibold" style={{ color: '#4e4c5b' }}>{mYear}</span>
            <button onClick={() => { setMYear(y => y + 1); setMSelected(null); }} className="w-8 h-8 flex items-center justify-center text-base font-bold transition-colors" style={{ background: '#f8f8f9', color: '#4e4c5b', borderRadius: '9999px' }} aria-label="Next year">›</button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {MONTHS_SHORT.map((m, i) => {
              const isSel = mSelected === i;
              return (
                <button
                  key={m}
                  onClick={() => setMSelected(i)}
                  className="py-2 text-xs font-medium transition-all"
                  style={{
                    borderRadius: '9999px',
                    background: isSel ? '#1D4ED8' : '#f8f8f9',
                    color: isSel ? '#ffffff' : '#4e4c5b',
                    border: isSel ? '2px solid #1D4ED8' : '2px solid transparent',
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {mSelected !== null && (
            <p className="text-xs mb-2 text-center" style={{ color: '#4e4c5b' }}>
              Selected: <strong>{MONTHS[mSelected]} {mYear}</strong>
            </p>
          )}

          <button
            onClick={handleMonthSubmit}
            disabled={mSelected === null}
            className="w-full py-2 text-sm font-semibold text-white transition-opacity"
            style={{
              borderRadius: '9999px',
              background: mSelected !== null ? '#1D4ED8' : '#a0aec0',
              cursor: mSelected !== null ? 'pointer' : 'not-allowed',
            }}
          >
            Submit Month
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/* MAIN PAGE COMPONENT                                                       */
/* ════════════════════════════════════════════════════════════════════════════ */

export default function Page_project_milestone(props: GeneratedPageProps) {
  const [activeNav, setActiveNav] = useState('Calendar');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [filterType, setFilterType] = useState('all');

  const navItems = ['Calendar', 'Rooms', 'Team', 'Reports'];
  const filterOptions = [
    { value: 'all', label: 'All Milestones' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'review', label: 'In Review' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background: '#4e4c5b' }}>
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 shadow-sm" style={{ background: '#ffffff', borderBottom: '1px solid #eeece6' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <span className="text-xl font-bold" style={{ color: '#4e4c5b' }}>EchoPlan</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item}
                  onClick={() => setActiveNav(item)}
                  className="px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    borderRadius: '9999px',
                    background: activeNav === item ? '#1D4ED8' : 'transparent',
                    color: activeNav === item ? '#ffffff' : '#4e4c5b',
                  }}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <select className="text-sm px-3 py-1.5 border-none outline-none" style={{ background: '#f8f8f9', color: '#4e4c5b', borderRadius: '9999px' }}>
              <option>UTC-8 (PST)</option>
              <option>UTC-5 (EST)</option>
              <option>UTC+0 (GMT)</option>
              <option>UTC+1 (CET)</option>
              <option>UTC+5:30 (IST)</option>
            </select>
            <div className="hidden sm:flex items-center p-0.5" style={{ background: '#f8f8f9', borderRadius: '9999px' }}>
              {(['day', 'week', 'month'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className="px-3 py-1 text-xs font-medium capitalize transition-colors"
                  style={{
                    borderRadius: '9999px',
                    background: viewMode === v ? '#1D4ED8' : 'transparent',
                    color: viewMode === v ? '#fff' : '#4e4c5b',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            <button className="relative w-9 h-9 flex items-center justify-center" style={{ background: '#f8f8f9', borderRadius: '9999px' }} aria-label="Notifications">
              🔔
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=400&fit=crop"
          alt="Meeting room with calendar setup"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(29,78,216,0.55)' }}>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Project Milestone Scheduler</h1>
            <p className="text-white/90 text-base">Set key dates and review periods for your project timeline</p>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Context + Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#ffffff' }}>Pick a Time</h2>
            <p className="text-sm mt-1" style={{ color: '#f8f8f9' }}>
              Configure milestone dates and review windows to keep your project on track.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {filterOptions.map(f => (
              <button
                key={f.value}
                onClick={() => setFilterType(f.value)}
                className="px-4 py-1.5 text-xs font-medium transition-colors"
                style={{
                  borderRadius: '9999px',
                  background: filterType === f.value ? '#ffffff' : 'rgba(255,255,255,0.15)',
                  color: filterType === f.value ? '#4e4c5b' : '#f8f8f9',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column — Datepickers */}
          <div className="lg:col-span-2 space-y-8">
            {/* Form context bar */}
            <div className="flex flex-wrap items-center gap-4 p-4" style={{ background: '#fefefe', borderRadius: '16px', border: '1px solid #eeece6' }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: '#7a7886' }}>Duration:</span>
                <div className="flex p-0.5" style={{ background: '#f8f8f9', borderRadius: '9999px' }}>
                  {[15, 30, 60].map(d => (
                    <button key={d} className="px-3 py-1 text-xs font-medium" style={{ borderRadius: '9999px', background: d === 30 ? '#1D4ED8' : 'transparent', color: d === 30 ? '#fff' : '#4e4c5b' }}>
                      {d} min
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: '#7a7886' }}>Timezone:</span>
                <select className="text-xs px-3 py-1 border-none outline-none" style={{ background: '#f8f8f9', color: '#4e4c5b', borderRadius: '9999px' }}>
                  <option>Pacific Time (PT)</option>
                  <option>Eastern Time (ET)</option>
                  <option>Central European (CET)</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium" style={{ color: '#7a7886' }}>Type:</span>
                {['Video Call', 'In-Person', 'Phone'].map(t => (
                  <label key={t} className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: '#4e4c5b' }}>
                    <input type="radio" name="meetingType" defaultChecked={t === 'Video Call'} className="accent-blue-600" />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <MilestoneDatePicker onSubmit={props.onSubmit} />
            <ReviewMonthPicker onSubmit={props.onSubmit} />
            <CompoundPicker onSubmit={props.onSubmit} />
          </div>

          {/* Right column — Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Meetings */}
            <div className="p-5" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #eeece6' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#4e4c5b' }}>Upcoming Meetings</h3>
              {[
                { title: 'Sprint Planning', time: 'Mon 10:00 AM', avatars: '👩‍💻👨‍💻👩‍🔬', color: '#1D4ED8' },
                { title: 'Design Review', time: 'Tue 2:30 PM', avatars: '🎨👨‍🎨👩‍🎤', color: '#10B981' },
                { title: 'Stakeholder Sync', time: 'Wed 4:00 PM', avatars: '👔👩‍💼👨‍💼', color: '#f59e0b' },
              ].map((meeting, i) => (
                <div key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: i < 2 ? '1px solid #eeece6' : 'none' }}>
                  <div className="w-1 h-10 rounded-full" style={{ background: meeting.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#4e4c5b' }}>{meeting.title}</p>
                    <p className="text-xs" style={{ color: '#7a7886' }}>{meeting.time}</p>
                  </div>
                  <span className="text-base">{meeting.avatars}</span>
                </div>
              ))}
            </div>

            {/* Room card */}
            <div className="overflow-hidden" style={{ borderRadius: '16px', border: '1px solid #eeece6' }}>
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop"
                alt="Calendar desk workspace"
                className="w-full h-48 object-cover"
              />
              <div className="p-4" style={{ background: '#ffffff' }}>
                <h4 className="text-sm font-semibold" style={{ color: '#4e4c5b' }}>Meeting Room A</h4>
                <p className="text-xs mt-1" style={{ color: '#7a7886' }}>Capacity: 12 · AV equipped · Whiteboard</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                  <span className="text-xs font-medium" style={{ color: '#10B981' }}>Available now</span>
                </div>
              </div>
            </div>

            {/* Meeting link preview */}
            <div className="p-4" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #eeece6' }}>
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#4e4c5b' }}>Meeting Link Preview</h4>
              <div className="flex items-center gap-2 p-3" style={{ background: '#f8f8f9', borderRadius: '9999px' }}>
                <span className="text-sm">🔗</span>
                <span className="text-xs flex-1 truncate" style={{ color: '#7a7886' }}>planit.app/meet/proj-milestone-2025</span>
                <button className="text-xs font-medium px-3 py-1" style={{ background: '#1D4ED8', color: '#fff', borderRadius: '9999px' }}>Copy</button>
              </div>
            </div>

            {/* Training room card */}
            <div className="overflow-hidden" style={{ borderRadius: '16px', border: '1px solid #eeece6' }}>
              <img
                src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop"
                alt="Training classroom"
                className="w-full h-48 object-cover"
              />
              <div className="p-4" style={{ background: '#ffffff' }}>
                <h4 className="text-sm font-semibold" style={{ color: '#4e4c5b' }}>Training Room B</h4>
                <p className="text-xs mt-1" style={{ color: '#7a7886' }}>Capacity: 30 · Projector · Podium</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
                  <span className="text-xs font-medium" style={{ color: '#f59e0b' }}>Reserved until 3 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="mt-12" style={{ background: '#3d3b49', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-sm font-semibold mb-3 text-white">Calendar Sync</h4>
              <ul className="space-y-2">
                {['EchoCal', 'EchoMail', 'EchoDate', 'CalDAV'].map(s => (
                  <li key={s} className="text-xs" style={{ color: '#b8b6c1' }}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-white">Notifications</h4>
              <ul className="space-y-2">
                {['Email Reminders', 'SMS Alerts', 'Push Notifications', 'EchoChat Integration'].map(s => (
                  <li key={s} className="text-xs" style={{ color: '#b8b6c1' }}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-white">Integrations</h4>
              <ul className="space-y-2">
                {['EchoConf', 'EchoTeam', 'EchoBoard', 'EchoTasks'].map(s => (
                  <li key={s} className="text-xs" style={{ color: '#b8b6c1' }}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-white">Help Center</h4>
              <ul className="space-y-2">
                {['Getting Started', 'FAQ', 'API Docs', 'Contact Support'].map(s => (
                  <li key={s} className="text-xs" style={{ color: '#b8b6c1' }}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-xs" style={{ color: '#b8b6c1' }}>© 2025 EchoPlan. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
