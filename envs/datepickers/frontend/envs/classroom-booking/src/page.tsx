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
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function getFirstDayOfWeek(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}
function fmt(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function isWeekend(y: number, m: number, d: number) {
  const dow = new Date(y, m, d).getDay();
  return dow === 0 || dow === 6;
}

/* ================================================================
   WIDGET 1 — Class Dates (Range Picker, Weekdays Only)
   ================================================================ */
function RangePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(7); // 0-indexed → August
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleDay = useCallback((day: number) => {
    if (isWeekend(year, month, day)) return;
    const d = fmt(year, month, day);
    if (!startDate || (startDate && endDate)) {
      setStartDate(d);
      setEndDate(null);
    } else {
      if (d < startDate) { setStartDate(d); setEndDate(null); }
      else setEndDate(d);
    }
  }, [year, month, startDate, endDate]);

  const inRange = useCallback((ds: string) => {
    if (startDate && endDate) return ds >= startDate && ds <= endDate;
    if (startDate && !endDate && hovered) {
      const lo = hovered >= startDate ? startDate : hovered;
      const hi = hovered >= startDate ? hovered : startDate;
      return ds >= lo && ds <= hi;
    }
    return false;
  }, [startDate, endDate, hovered]);

  const cells: (number | null)[] = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    return c;
  }, [firstDay, daysInMonth]);

  const handleSubmit = useCallback(() => {
    if (startDate && endDate) {
      onSubmit({
        type: 'date_range',
        value: `${startDate}/${endDate}`,
        raw: { widget_id: 'class_dates', start_date: startDate, end_date: endDate, year, month: month + 1 },
      });
    }
  }, [startDate, endDate, year, month, onSubmit]);

  return (
    <div data-widget-id="class_dates" className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">📚</span>
        <h3 className="text-lg font-semibold" style={{ color: '#4e4c5b' }}>Class Dates</h3>
      </div>
      <p className="text-sm mb-5" style={{ color: '#4e4c5b', opacity: 0.6 }}>
        Select the start and end dates for your class schedule. Only weekdays are available.
      </p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full text-base hover:opacity-70 transition-opacity" style={{ backgroundColor: '#f8f8f9', color: '#4e4c5b' }}>‹</button>
        <span className="text-sm font-semibold" style={{ color: '#4e4c5b' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full text-base hover:opacity-70 transition-opacity" style={{ backgroundColor: '#f8f8f9', color: '#4e4c5b' }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: d === 'Sat' || d === 'Sun' ? '#c5c4c9' : '#4e4c5b' }}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const ds = fmt(year, month, day);
          const wknd = isWeekend(year, month, day);
          const isStart = ds === startDate;
          const isEnd = ds === endDate;
          const range = inRange(ds);
          let bg = 'transparent';
          let fg = '#4e4c5b';
          if (wknd) { fg = '#c5c4c9'; }
          else if (isStart || isEnd) { bg = '#1D4ED8'; fg = '#ffffff'; }
          else if (range) { bg = '#EFF6FF'; fg = '#1D4ED8'; }
          return (
            <button
              key={day}
              disabled={wknd}
              onClick={() => handleDay(day)}
              onMouseEnter={() => !wknd && setHovered(ds)}
              onMouseLeave={() => setHovered(null)}
              className={`w-full aspect-square flex items-center justify-center text-sm rounded-full transition-colors ${wknd ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
              style={{ backgroundColor: bg, color: fg }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs" style={{ color: '#4e4c5b', opacity: 0.6 }}>
          {startDate && endDate ? `${startDate} → ${endDate}` : startDate ? `${startDate} → pick end` : 'Pick start date'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!startDate || !endDate}
          className="px-5 py-2 text-sm font-medium rounded-full transition-colors disabled:opacity-30"
          style={{ backgroundColor: '#1D4ED8', color: '#ffffff' }}
        >
          Submit Range
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   WIDGET 2 — Semester Start Month (Month/Year Picker)
   ================================================================ */
function MonthYearPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const handleSubmit = useCallback(() => {
    if (selectedMonth !== null && selectedYear !== null) {
      onSubmit({
        type: 'month_year',
        value: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`,
        raw: { widget_id: 'semester_month', month: selectedMonth + 1, year: selectedYear },
      });
    }
  }, [selectedMonth, selectedYear, onSubmit]);

  return (
    <div data-widget-id="semester_month" className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🎓</span>
        <h3 className="text-lg font-semibold" style={{ color: '#4e4c5b' }}>Semester Start Month</h3>
      </div>
      <p className="text-sm mb-5" style={{ color: '#4e4c5b', opacity: 0.6 }}>
        Choose the month and year your semester begins.
      </p>

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setYear(y => y - 1)} className="w-8 h-8 flex items-center justify-center rounded-full text-base hover:opacity-70 transition-opacity" style={{ backgroundColor: '#f8f8f9', color: '#4e4c5b' }}>‹</button>
        <span className="text-sm font-semibold" style={{ color: '#4e4c5b' }}>{year}</span>
        <button onClick={() => setYear(y => y + 1)} className="w-8 h-8 flex items-center justify-center rounded-full text-base hover:opacity-70 transition-opacity" style={{ backgroundColor: '#f8f8f9', color: '#4e4c5b' }}>›</button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {MONTHS_SHORT.map((name, i) => {
          const active = selectedMonth === i && selectedYear === year;
          return (
            <button
              key={name}
              onClick={() => { setSelectedMonth(i); setSelectedYear(year); }}
              className="py-3 rounded-full text-sm font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: active ? '#1D4ED8' : '#f8f8f9', color: active ? '#ffffff' : '#4e4c5b' }}
            >
              {name}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs" style={{ color: '#4e4c5b', opacity: 0.6 }}>
          {selectedMonth !== null && selectedYear !== null ? `${MONTHS[selectedMonth]} ${selectedYear}` : 'Pick a month'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={selectedMonth === null}
          className="px-5 py-2 text-sm font-medium rounded-full transition-colors disabled:opacity-30"
          style={{ backgroundColor: '#1D4ED8', color: '#ffffff' }}
        >
          Submit Month
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   WIDGET 3 — Compound (Standard Date Calendar, Weekdays Only)
   ================================================================ */
function CompoundPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // 0-indexed → June
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const cells: (number | null)[] = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    return c;
  }, [firstDay, daysInMonth]);

  const handleSubmit = useCallback(() => {
    if (selectedDate) {
      onSubmit({
        type: 'date',
        value: selectedDate,
        raw: { widget_id: 'compound', selected_date: selectedDate, year, month: month + 1 },
      });
    }
  }, [selectedDate, year, month, onSubmit]);

  return (
    <div data-widget-id="compound" className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">📅</span>
        <h3 className="text-lg font-semibold" style={{ color: '#4e4c5b' }}>Class Date &amp; Semester</h3>
      </div>
      <p className="text-sm mb-5" style={{ color: '#4e4c5b', opacity: 0.6 }}>
        Select a specific date for combined class and semester scheduling (weekdays only).
      </p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full text-base hover:opacity-70 transition-opacity" style={{ backgroundColor: '#f8f8f9', color: '#4e4c5b' }}>‹</button>
        <span className="text-sm font-semibold" style={{ color: '#4e4c5b' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full text-base hover:opacity-70 transition-opacity" style={{ backgroundColor: '#f8f8f9', color: '#4e4c5b' }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: d === 'Sat' || d === 'Sun' ? '#c5c4c9' : '#4e4c5b' }}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const ds = fmt(year, month, day);
          const wknd = isWeekend(year, month, day);
          const isSel = ds === selectedDate;
          let bg = 'transparent';
          let fg = '#4e4c5b';
          if (wknd) { fg = '#c5c4c9'; }
          else if (isSel) { bg = '#1D4ED8'; fg = '#ffffff'; }
          return (
            <button
              key={day}
              disabled={wknd}
              onClick={() => { if (!wknd) setSelectedDate(ds); }}
              className={`w-full aspect-square flex items-center justify-center text-sm rounded-full transition-colors ${wknd ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
              style={{ backgroundColor: bg, color: fg }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs" style={{ color: '#4e4c5b', opacity: 0.6 }}>
          {selectedDate ? `Selected: ${selectedDate}` : 'Pick a date'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!selectedDate}
          className="px-5 py-2 text-sm font-medium rounded-full transition-colors disabled:opacity-30"
          style={{ backgroundColor: '#1D4ED8', color: '#ffffff' }}
        >
          Submit Date
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   PAGE SHELL — Dashboard Layout
   ================================================================ */
export default function Page_classroom_booking(props: GeneratedPageProps) {
  const [activeNav, setActiveNav] = useState('Calendar');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [filterRoom, setFilterRoom] = useState('all');

  const navItems = ['Calendar', 'Rooms', 'Team', 'Reports'];
  const rooms = [
    { name: 'Room 101 — Lecture Hall', time: 'Mon/Wed 9:00 AM', img: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop' },
    { name: 'Room 204 — Seminar', time: 'Tue/Thu 2:00 PM', img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop' },
    { name: 'Room 310 — Lab', time: 'Fri 10:00 AM', img: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=400&h=300&fit=crop' },
  ];
  const upcomingMeetings = [
    { title: 'Faculty Planning Session', date: 'Aug 18, 2025 · 10:00 AM', participants: 4 },
    { title: 'Curriculum Review', date: 'Aug 20, 2025 · 2:30 PM', participants: 6 },
    { title: 'Student Orientation Prep', date: 'Aug 22, 2025 · 9:00 AM', participants: 8 },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#4e4c5b', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md" style={{ backgroundColor: 'rgba(78,76,91,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <span className="text-lg font-bold" style={{ color: '#ffffff' }}>EchoPlan</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item}
                  onClick={() => setActiveNav(item)}
                  className="px-4 py-1.5 text-sm font-medium rounded-full transition-colors"
                  style={{
                    backgroundColor: activeNav === item ? 'rgba(255,255,255,0.15)' : 'transparent',
                    color: activeNav === item ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              UTC-5 · Eastern
            </span>
            <div className="flex rounded-full overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
              {(['day', 'week', 'month'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className="px-3 py-1 text-xs font-medium capitalize transition-colors"
                  style={{
                    backgroundColor: viewMode === v ? 'rgba(255,255,255,0.2)' : 'transparent',
                    color: viewMode === v ? '#ffffff' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }}>
              🔔
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ maxHeight: '260px' }}>
        <img
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=400&fit=crop"
          alt="Modern meeting room with large windows"
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(78,76,91,0.92), rgba(78,76,91,0.5))' }} />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>Classroom Booking</h1>
            <p className="text-base max-w-lg" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Schedule rooms, set semester dates, and manage your class calendar — all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters Bar */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Filter:</span>
          {['all', 'lectures', 'seminars', 'labs'].map(f => (
            <button
              key={f}
              onClick={() => setFilterRoom(f)}
              className="px-4 py-1.5 text-xs font-medium rounded-full capitalize transition-colors"
              style={{
                backgroundColor: filterRoom === f ? '#ffffff' : 'rgba(255,255,255,0.08)',
                color: filterRoom === f ? '#4e4c5b' : 'rgba(255,255,255,0.6)',
              }}
            >
              {f === 'all' ? 'All Rooms' : f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Column: Widgets ── */}
          <div className="lg:col-span-2 space-y-6">
            <RangePicker onSubmit={props.onSubmit} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MonthYearPicker onSubmit={props.onSubmit} />
              <CompoundPicker onSubmit={props.onSubmit} />
            </div>
          </div>

          {/* ── Right Column: Sidebar ── */}
          <div className="space-y-6">
            {/* Upcoming Meetings */}
            <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
              <h4 className="text-sm font-semibold mb-4" style={{ color: '#4e4c5b' }}>Upcoming Sessions</h4>
              <div className="space-y-3">
                {upcomingMeetings.map((m, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl transition-colors" style={{ backgroundColor: '#f8f8f9' }}>
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#10B981' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#4e4c5b' }}>{m.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#4e4c5b', opacity: 0.5 }}>{m.date}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        {Array.from({ length: Math.min(m.participants, 3) }).map((_, j) => (
                          <div key={j} className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium" style={{ backgroundColor: '#eeece6', color: '#4e4c5b', marginLeft: j > 0 ? '-4px' : '0', border: '1px solid #ffffff' }}>
                            {String.fromCharCode(65 + j)}
                          </div>
                        ))}
                        {m.participants > 3 && (
                          <span className="text-xs ml-1" style={{ color: '#4e4c5b', opacity: 0.5 }}>+{m.participants - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Cards */}
            <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
              <h4 className="text-sm font-semibold mb-4" style={{ color: '#4e4c5b' }}>Available Rooms</h4>
              <div className="space-y-3">
                {rooms.map((r, i) => (
                  <div key={i} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#f8f8f9' }}>
                    <img src={r.img} alt={r.name} className="w-full h-28 object-cover" />
                    <div className="p-3">
                      <p className="text-sm font-medium" style={{ color: '#4e4c5b' }}>{r.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#4e4c5b', opacity: 0.5 }}>{r.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Settings */}
            <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: '#4e4c5b' }}>Duration</h4>
              <div className="flex gap-2">
                {['15 min', '30 min', '60 min'].map((d, i) => (
                  <button
                    key={d}
                    className="flex-1 py-2 text-xs font-medium rounded-full transition-colors"
                    style={{ backgroundColor: i === 1 ? '#1D4ED8' : '#f8f8f9', color: i === 1 ? '#ffffff' : '#4e4c5b' }}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <h4 className="text-sm font-semibold mt-4 mb-2" style={{ color: '#4e4c5b' }}>Meeting Type</h4>
              <div className="space-y-2">
                {['In-person', 'Virtual', 'Hybrid'].map((t, i) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ border: `2px solid ${i === 0 ? '#1D4ED8' : '#eeece6'}` }}>
                      {i === 0 && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1D4ED8' }} />}
                    </div>
                    <span className="text-xs" style={{ color: '#4e4c5b' }}>{t}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h5 className="text-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Calendar Sync</h5>
              <ul className="space-y-2">
                {['EchoCal', 'EchoMail', 'EchoDate', 'CalDAV'].map(s => (
                  <li key={s} className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Notifications</h5>
              <ul className="space-y-2">
                {['Email Reminders', 'SMS Alerts', 'Push Notifications', 'EchoChat Integration'].map(s => (
                  <li key={s} className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Integrations</h5>
              <ul className="space-y-2">
                {['EchoConf', 'EchoTeam', 'EchoMeet', 'EchoConnect'].map(s => (
                  <li key={s} className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Help</h5>
              <ul className="space-y-2">
                {['Help Center', 'Documentation', 'Contact Support', 'Status Page'].map(s => (
                  <li key={s} className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>© 2025 EchoPlan — Classroom Booking Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
