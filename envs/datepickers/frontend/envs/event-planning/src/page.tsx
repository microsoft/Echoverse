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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function pad(n: number) {
  return n < 10 ? '0' + n : '' + n;
}

function buildCalendarCells(year: number, month: number) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

/* ─── Widget 1: Event Date (single_date, specific_disabled) ─── */
function EventDateWidget({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [month, setMonth] = useState(8); // September = index 8
  const [year, setYear] = useState(2025);
  const [selected, setSelected] = useState<number | null>(null);

  const disabledSet = useMemo(() => new Set(['2025-09-10', '2025-09-14', '2025-09-16']), []);
  const cells = useMemo(() => buildCalendarCells(year, month), [year, month]);

  const isDisabled = useCallback((day: number) => {
    return disabledSet.has(toISO(year, month, day));
  }, [year, month, disabledSet]);

  const prev = useCallback(() => {
    setSelected(null);
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);

  const next = useCallback(() => {
    setSelected(null);
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const iso = toISO(year, month, selected);
    onSubmit({ type: 'date', value: iso, raw: { widget_id: 'event_date', year, month: month + 1, day: selected, iso } });
  }, [selected, year, month, onSubmit]);

  return (
    <div data-widget-id="event_date" className="flex flex-col" style={{ background: '#ffffff', borderRadius: '9999px' }}>
      <div className="p-6" style={{ borderRadius: '24px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: '#35323e' }}>📅 Event Date</h3>
          <span className="text-xs px-3 py-1" style={{ background: '#EFF6FF', color: '#1D4ED8', borderRadius: '9999px' }}>Required</span>
        </div>
        <p className="text-sm mb-4" style={{ color: '#6b7280' }}>Select the date for your upcoming event. Some dates are unavailable.</p>

        <div style={{ background: '#f3faf9', borderRadius: '16px' }} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={prev} className="w-8 h-8 flex items-center justify-center text-sm font-bold" style={{ background: '#d7e2e2', borderRadius: '9999px', color: '#35323e' }} aria-label="Previous month">‹</button>
            <span className="font-semibold text-sm" style={{ color: '#35323e' }}>{MONTHS[month]} {year}</span>
            <button onClick={next} className="w-8 h-8 flex items-center justify-center text-sm font-bold" style={{ background: '#d7e2e2', borderRadius: '9999px', color: '#35323e' }} aria-label="Next month">›</button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#6b7280' }}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const disabled = isDisabled(day);
              const isSelected = selected === day;
              return (
                <button
                  key={`d-${i}`}
                  disabled={disabled}
                  onClick={() => !disabled && setSelected(day)}
                  className="w-9 h-9 flex items-center justify-center text-sm transition-colors"
                  style={{
                    borderRadius: '9999px',
                    background: isSelected ? '#1D4ED8' : 'transparent',
                    color: disabled ? '#c4c4c4' : isSelected ? '#ffffff' : '#35323e',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    textDecoration: disabled ? 'line-through' : 'none',
                    opacity: disabled ? 0.4 : 1,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {selected !== null && (
          <p className="text-sm mt-3 text-center font-medium" style={{ color: '#1D4ED8' }}>
            Selected: {MONTHS[month]} {selected}, {year}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full mt-4 py-2.5 text-sm font-semibold transition-colors"
          style={{
            borderRadius: '9999px',
            background: selected !== null ? '#1D4ED8' : '#d7e2e2',
            color: selected !== null ? '#ffffff' : '#9ca3af',
            cursor: selected !== null ? 'pointer' : 'not-allowed',
          }}
        >
          Confirm Event Date
        </button>
      </div>
    </div>
  );
}

/* ─── Widget 2: Vendor Contact DOB (dob, past_only) ─── */
function VendorDobWidget({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [month, setMonth] = useState(11); // December = index 11
  const [year, setYear] = useState(2026);
  const [selected, setSelected] = useState<number | null>(null);

  const maxDate = useMemo(() => new Date(2026, 11, 31), []);
  const years = useMemo(() => Array.from({ length: 2015 - 1950 + 1 }, (_, i) => 1950 + i), []);
  const cells = useMemo(() => buildCalendarCells(year, month), [year, month]);

  const isFuture = useCallback((day: number) => {
    const d = new Date(year, month, day);
    return d > maxDate;
  }, [year, month, maxDate]);

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(Number(e.target.value));
    setSelected(null);
  }, []);

  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(Number(e.target.value));
    setSelected(null);
  }, []);

  const prev = useCallback(() => {
    setSelected(null);
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);

  const next = useCallback(() => {
    setSelected(null);
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const iso = toISO(year, month, selected);
    onSubmit({ type: 'dob', value: iso, raw: { widget_id: 'vendor_dob', year, month: month + 1, day: selected, iso } });
  }, [selected, year, month, onSubmit]);

  return (
    <div data-widget-id="vendor_dob" className="flex flex-col" style={{ background: '#ffffff', borderRadius: '9999px' }}>
      <div className="p-6" style={{ borderRadius: '24px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: '#35323e' }}>🎂 Vendor Contact DOB</h3>
          <span className="text-xs px-3 py-1" style={{ background: '#EFF6FF', color: '#1D4ED8', borderRadius: '9999px' }}>Required</span>
        </div>
        <p className="text-sm mb-4" style={{ color: '#6b7280' }}>Enter the vendor contact's date of birth. Only past dates are selectable.</p>

        <div className="flex gap-3 mb-4">
          <select
            value={year}
            onChange={handleYearChange}
            className="flex-1 px-3 py-2 text-sm border"
            style={{ borderRadius: '9999px', borderColor: '#d7e2e2', color: '#35323e', background: '#f3faf9' }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={month}
            onChange={handleMonthChange}
            className="flex-1 px-3 py-2 text-sm border"
            style={{ borderRadius: '9999px', borderColor: '#d7e2e2', color: '#35323e', background: '#f3faf9' }}
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>

        <div style={{ background: '#f3faf9', borderRadius: '16px' }} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={prev} className="w-8 h-8 flex items-center justify-center text-sm font-bold" style={{ background: '#d7e2e2', borderRadius: '9999px', color: '#35323e' }} aria-label="Previous month">‹</button>
            <span className="font-semibold text-sm" style={{ color: '#35323e' }}>{MONTHS[month]} {year}</span>
            <button onClick={next} className="w-8 h-8 flex items-center justify-center text-sm font-bold" style={{ background: '#d7e2e2', borderRadius: '9999px', color: '#35323e' }} aria-label="Next month">›</button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#6b7280' }}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const disabled = isFuture(day);
              const isSelected = selected === day;
              return (
                <button
                  key={`d-${i}`}
                  disabled={disabled}
                  onClick={() => !disabled && setSelected(day)}
                  className="w-9 h-9 flex items-center justify-center text-sm transition-colors"
                  style={{
                    borderRadius: '9999px',
                    background: isSelected ? '#1D4ED8' : 'transparent',
                    color: disabled ? '#c4c4c4' : isSelected ? '#ffffff' : '#35323e',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.4 : 1,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {selected !== null && (
          <p className="text-sm mt-3 text-center font-medium" style={{ color: '#1D4ED8' }}>
            Selected: {MONTHS[month]} {selected}, {year}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full mt-4 py-2.5 text-sm font-semibold transition-colors"
          style={{
            borderRadius: '9999px',
            background: selected !== null ? '#1D4ED8' : '#d7e2e2',
            color: selected !== null ? '#ffffff' : '#9ca3af',
            cursor: selected !== null ? 'pointer' : 'not-allowed',
          }}
        >
          Confirm Date of Birth
        </button>
      </div>
    </div>
  );
}

/* ─── Widget 3: Compound — Event Date + Vendor DOB ─── */
function CompoundWidget({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [month, setMonth] = useState(5); // June = index 5
  const [year, setYear] = useState(2025);
  const [selected, setSelected] = useState<number | null>(null);

  const disabledSet = useMemo(() => new Set(['2025-06-13', '2025-06-14', '2025-07-01', '2025-07-12']), []);
  const cells = useMemo(() => buildCalendarCells(year, month), [year, month]);

  const isDisabled = useCallback((day: number) => {
    return disabledSet.has(toISO(year, month, day));
  }, [year, month, disabledSet]);

  const prev = useCallback(() => {
    setSelected(null);
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);

  const next = useCallback(() => {
    setSelected(null);
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const iso = toISO(year, month, selected);
    onSubmit({ type: 'date', value: iso, raw: { widget_id: 'compound', year, month: month + 1, day: selected, iso } });
  }, [selected, year, month, onSubmit]);

  return (
    <div data-widget-id="compound" className="flex flex-col" style={{ background: '#ffffff', borderRadius: '9999px' }}>
      <div className="p-6" style={{ borderRadius: '24px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: '#35323e' }}>📋 Event Date + Vendor DOB</h3>
          <span className="text-xs px-3 py-1" style={{ background: '#EFF6FF', color: '#1D4ED8', borderRadius: '9999px' }}>Compound</span>
        </div>
        <p className="text-sm mb-4" style={{ color: '#6b7280' }}>Select a date for combined event and vendor scheduling. Blocked dates are unavailable.</p>

        <div style={{ background: '#f3faf9', borderRadius: '16px' }} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={prev} className="w-8 h-8 flex items-center justify-center text-sm font-bold" style={{ background: '#d7e2e2', borderRadius: '9999px', color: '#35323e' }} aria-label="Previous month">‹</button>
            <span className="font-semibold text-sm" style={{ color: '#35323e' }}>{MONTHS[month]} {year}</span>
            <button onClick={next} className="w-8 h-8 flex items-center justify-center text-sm font-bold" style={{ background: '#d7e2e2', borderRadius: '9999px', color: '#35323e' }} aria-label="Next month">›</button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#6b7280' }}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const disabled = isDisabled(day);
              const isSelected = selected === day;
              return (
                <button
                  key={`d-${i}`}
                  disabled={disabled}
                  onClick={() => !disabled && setSelected(day)}
                  className="w-9 h-9 flex items-center justify-center text-sm transition-colors"
                  style={{
                    borderRadius: '9999px',
                    background: isSelected ? '#1D4ED8' : 'transparent',
                    color: disabled ? '#c4c4c4' : isSelected ? '#ffffff' : '#35323e',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    textDecoration: disabled ? 'line-through' : 'none',
                    opacity: disabled ? 0.4 : 1,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {selected !== null && (
          <p className="text-sm mt-3 text-center font-medium" style={{ color: '#1D4ED8' }}>
            Selected: {MONTHS[month]} {selected}, {year}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full mt-4 py-2.5 text-sm font-semibold transition-colors"
          style={{
            borderRadius: '9999px',
            background: selected !== null ? '#1D4ED8' : '#d7e2e2',
            color: selected !== null ? '#ffffff' : '#9ca3af',
            cursor: selected !== null ? 'pointer' : 'not-allowed',
          }}
        >
          Confirm Date
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_event_planning(props: GeneratedPageProps) {
  const navItems = ['Calendar', 'Rooms', 'Team', 'Reports'];
  const [activeNav, setActiveNav] = useState('Calendar');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [durationFilter, setDurationFilter] = useState(30);

  return (
    <div className="min-h-screen font-sans" style={{ background: '#35323e' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4" style={{ background: '#35323e', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <span className="text-xl font-bold" style={{ color: '#ffffff' }}>EchoPlan</span>
          </div>
          <nav className="flex gap-1">
            {navItems.map(item => (
              <button
                key={item}
                onClick={() => setActiveNav(item)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  borderRadius: '9999px',
                  background: activeNav === item ? 'rgba(29,78,216,0.2)' : 'transparent',
                  color: activeNav === item ? '#93bbff' : 'rgba(255,255,255,0.55)',
                }}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '9999px' }}>
            {(['day', 'week', 'month'] as const).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className="px-3 py-1.5 text-xs font-medium capitalize transition-colors"
                style={{
                  borderRadius: '9999px',
                  background: viewMode === v ? '#1D4ED8' : 'transparent',
                  color: viewMode === v ? '#ffffff' : 'rgba(255,255,255,0.5)',
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>UTC-5 (EST)</span>
          <button className="w-8 h-8 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', color: 'rgba(255,255,255,0.6)' }}>🔔</button>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ height: '220px' }}>
        <img
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=400&fit=crop"
          alt="Modern meeting room"
          className="w-full h-full object-cover"
          style={{ opacity: 0.35 }}
        />
        <div className="absolute inset-0 flex flex-col justify-center px-8" style={{ background: 'linear-gradient(to right, rgba(53,50,62,0.95), rgba(53,50,62,0.5))' }}>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>Pick a Time</h1>
          <p className="text-base max-w-lg" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Schedule your event, manage vendor details, and coordinate all planning dates in one place.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="px-8 py-4 flex items-center gap-4 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Duration:</span>
        {[15, 30, 60].map(d => (
          <button
            key={d}
            onClick={() => setDurationFilter(d)}
            className="px-3 py-1 text-xs font-medium transition-colors"
            style={{
              borderRadius: '9999px',
              background: durationFilter === d ? '#1D4ED8' : 'rgba(255,255,255,0.06)',
              color: durationFilter === d ? '#ffffff' : 'rgba(255,255,255,0.5)',
            }}
          >
            {d} min
          </button>
        ))}
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', height: '20px' }} />
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Type:</span>
        {['In-Person', 'Virtual', 'Hybrid'].map(t => (
          <span key={t} className="px-3 py-1 text-xs" style={{ borderRadius: '9999px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>{t}</span>
        ))}
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Widget 1 */}
          <div style={{ background: '#ffffff', borderRadius: '24px' }} className="overflow-hidden shadow-lg">
            <EventDateWidget onSubmit={props.onSubmit} />
          </div>

          {/* Widget 2 */}
          <div style={{ background: '#ffffff', borderRadius: '24px' }} className="overflow-hidden shadow-lg">
            <VendorDobWidget onSubmit={props.onSubmit} />
          </div>

          {/* Widget 3 */}
          <div style={{ background: '#ffffff', borderRadius: '24px' }} className="overflow-hidden shadow-lg">
            <CompoundWidget onSubmit={props.onSubmit} />
          </div>
        </div>

        {/* Supporting Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Upcoming Meetings */}
          <div className="p-6" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '24px' }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: '#ffffff' }}>Upcoming Meetings</h4>
            {[
              { title: 'Venue Walkthrough', time: 'Sep 12, 10:00 AM', avatars: '👤👤' },
              { title: 'Catering Tasting', time: 'Sep 18, 2:00 PM', avatars: '👤👤👤' },
              { title: 'AV Setup Review', time: 'Sep 22, 11:00 AM', avatars: '👤' },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{m.title}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{m.time}</p>
                </div>
                <span className="text-sm">{m.avatars}</span>
              </div>
            ))}
          </div>

          {/* Room Preview */}
          <div className="overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '24px' }}>
            <img
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop"
              alt="Calendar planning desk"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="p-5">
              <h4 className="text-sm font-semibold" style={{ color: '#ffffff' }}>Grand Ballroom A</h4>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Capacity: 250 • AV Equipped • Catering Ready</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                <span className="text-xs" style={{ color: '#10B981' }}>Available</span>
              </div>
            </div>
          </div>

          {/* Meeting Link Preview */}
          <div className="overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '24px' }}>
            <img
              src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop"
              alt="Classroom setup"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="p-5">
              <h4 className="text-sm font-semibold" style={{ color: '#ffffff' }}>Conference Room B</h4>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Capacity: 50 • Projector • Whiteboard</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                <span className="text-xs" style={{ color: '#10B981' }}>Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-6 mt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h5 className="text-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Calendar Sync</h5>
            {['EchoCal', 'EchoMail', 'EchoDate'].map(s => (
              <p key={s} className="text-xs py-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{s}</p>
            ))}
          </div>
          <div>
            <h5 className="text-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Notifications</h5>
            {['Email Reminders', 'SMS Alerts', 'Push Notifications'].map(s => (
              <p key={s} className="text-xs py-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{s}</p>
            ))}
          </div>
          <div>
            <h5 className="text-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Integrations</h5>
            {['EchoConf', 'EchoChat', 'EchoTeam'].map(s => (
              <p key={s} className="text-xs py-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{s}</p>
            ))}
          </div>
          <div>
            <h5 className="text-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Help Center</h5>
            {['Documentation', 'Support', 'FAQ'].map(s => (
              <p key={s} className="text-xs py-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{s}</p>
            ))}
          </div>
        </div>
        <p className="text-xs mt-6 text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2025 EchoPlan. All rights reserved.</p>
      </footer>
    </div>
  );
}
