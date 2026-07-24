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
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 15, 30, 45];

function pad(n: number) { return n.toString().padStart(2, '0'); }

function fmt(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

function getFirstDayOfWeek(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}

function parseDate(s: string): [number, number, number] {
  const [y, m, d] = s.split('-').map(Number);
  return [y, m - 1, d];
}

function dateToStr(d: Date): string {
  return fmt(d.getFullYear(), d.getMonth(), d.getDate());
}

function isDateInRange(dateStr: string, minDate: string, maxDate: string): boolean {
  return dateStr >= minDate && dateStr <= maxDate;
}

function isMonthInRange(y: number, m: number, minDate: string, maxDate: string): boolean {
  const [minY, minM] = parseDate(minDate);
  const [maxY, maxM] = parseDate(maxDate);
  const monthVal = y * 12 + m;
  const minVal = minY * 12 + minM;
  const maxVal = maxY * 12 + maxM;
  return monthVal >= minVal && monthVal <= maxVal;
}

/* ================================================================
   WIDGET 1 — Appointment Date & Time (datetime picker)
   ================================================================ */
function AppointmentDateTimePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const MIN_DATE = '2025-03-30';
  const MAX_DATE = '2025-07-03';

  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(5); // June (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }, [viewMonth]);

  const cells: (number | null)[] = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    return c;
  }, [firstDay, daysInMonth]);

  const isDayDisabled = useCallback((day: number) => {
    const ds = fmt(viewYear, viewMonth, day);
    return !isDateInRange(ds, MIN_DATE, MAX_DATE);
  }, [viewYear, viewMonth]);

  const handleDayClick = useCallback((day: number) => {
    if (isDayDisabled(day)) return;
    setSelectedDate(fmt(viewYear, viewMonth, day));
  }, [viewYear, viewMonth, isDayDisabled]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    const h24 = ampm === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    const isoStr = `${selectedDate}T${pad(h24)}:${pad(minute)}:00`;
    onSubmit({
      type: 'datetime',
      value: isoStr,
      raw: {
        widget_id: 'appointment_datetime',
        date: selectedDate,
        hour: h24,
        minute,
        ampm,
        iso: isoStr,
      },
    });
  }, [selectedDate, hour, minute, ampm, onSubmit]);

  return (
    <div data-widget-id="appointment_datetime" className="rounded-2xl p-6" style={{ background: '#ffffff' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#35323e' }}>Appointment Date &amp; Time</h3>
      <p className="text-sm mb-4" style={{ color: '#6b7280' }}>Select a date and time for your office hours appointment.</p>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80" style={{ background: '#f3faf9', color: '#35323e' }}>‹</button>
        <span className="font-medium" style={{ color: '#35323e' }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80" style={{ background: '#f3faf9', color: '#35323e' }}>›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#6b7280' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const ds = fmt(viewYear, viewMonth, day);
          const disabled = isDayDisabled(day);
          const selected = ds === selectedDate;
          return (
            <button
              key={ds}
              onClick={() => handleDayClick(day)}
              disabled={disabled}
              className={`h-9 w-full rounded-full text-sm font-medium transition-colors
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                ${selected ? 'text-white' : ''}`}
              style={{
                background: selected ? '#1D4ED8' : 'transparent',
                color: selected ? '#ffffff' : disabled ? '#9ca3af' : '#35323e',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Time selectors */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1">
          <label className="text-xs font-medium mr-1" style={{ color: '#6b7280' }}>Hour</label>
          <select value={hour} onChange={e => setHour(Number(e.target.value))} className="rounded-full px-3 py-1.5 text-sm border" style={{ borderColor: '#d7e2e2', color: '#35323e', background: '#fffdfd' }}>
            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <label className="text-xs font-medium mr-1" style={{ color: '#6b7280' }}>Min</label>
          <select value={minute} onChange={e => setMinute(Number(e.target.value))} className="rounded-full px-3 py-1.5 text-sm border" style={{ borderColor: '#d7e2e2', color: '#35323e', background: '#fffdfd' }}>
            {MINUTES.map(m => <option key={m} value={m}>{pad(m)}</option>)}
          </select>
        </div>
        <div className="flex rounded-full overflow-hidden border" style={{ borderColor: '#d7e2e2' }}>
          <button onClick={() => setAmpm('AM')} className="px-3 py-1.5 text-sm font-medium transition-colors" style={{ background: ampm === 'AM' ? '#1D4ED8' : '#fffdfd', color: ampm === 'AM' ? '#ffffff' : '#35323e' }}>AM</button>
          <button onClick={() => setAmpm('PM')} className="px-3 py-1.5 text-sm font-medium transition-colors" style={{ background: ampm === 'PM' ? '#1D4ED8' : '#fffdfd', color: ampm === 'PM' ? '#ffffff' : '#35323e' }}>PM</button>
        </div>
      </div>

      {selectedDate && (
        <p className="text-sm mb-3" style={{ color: '#35323e' }}>
          Selected: <strong>{selectedDate}</strong> at <strong>{hour}:{pad(minute)} {ampm}</strong>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="w-full py-2.5 rounded-full text-sm font-semibold text-white transition-opacity"
        style={{ background: selectedDate ? '#1D4ED8' : '#9ca3af', cursor: selectedDate ? 'pointer' : 'not-allowed' }}
      >
        Confirm Appointment
      </button>
    </div>
  );
}

/* ================================================================
   WIDGET 2 — Semester Month (month_year picker)
   ================================================================ */
function SemesterMonthPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const MIN_DATE = '2025-02-10';
  const MAX_DATE = '2025-05-26';

  const [viewYear, setViewYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const isMonthDisabled = useCallback((m: number) => {
    return !isMonthInRange(viewYear, m, MIN_DATE, MAX_DATE);
  }, [viewYear]);

  const handleMonthClick = useCallback((m: number) => {
    if (isMonthDisabled(m)) return;
    setSelectedMonth(m);
    setSelectedYear(viewYear);
  }, [viewYear, isMonthDisabled]);

  const handleSubmit = useCallback(() => {
    if (selectedMonth === null || selectedYear === null) return;
    const isoStr = `${selectedYear}-${pad(selectedMonth + 1)}`;
    onSubmit({
      type: 'month_year',
      value: isoStr,
      raw: {
        widget_id: 'semester_month',
        month: selectedMonth + 1,
        year: selectedYear,
        iso: isoStr,
      },
    });
  }, [selectedMonth, selectedYear, onSubmit]);

  return (
    <div data-widget-id="semester_month" className="rounded-2xl p-6" style={{ background: '#ffffff' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#35323e' }}>Semester Month</h3>
      <p className="text-sm mb-4" style={{ color: '#6b7280' }}>Choose the month for your semester enrollment.</p>

      {/* Year navigation */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => setViewYear(y => y - 1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80" style={{ background: '#f3faf9', color: '#35323e' }}>‹</button>
        <span className="font-medium text-lg" style={{ color: '#35323e' }}>{viewYear}</span>
        <button onClick={() => setViewYear(y => y + 1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80" style={{ background: '#f3faf9', color: '#35323e' }}>›</button>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {MONTHS_SHORT.map((label, m) => {
          const disabled = isMonthDisabled(m);
          const selected = selectedMonth === m && selectedYear === viewYear;
          return (
            <button
              key={m}
              onClick={() => handleMonthClick(m)}
              disabled={disabled}
              className={`py-3 rounded-full text-sm font-medium transition-colors
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                ${selected ? 'text-white' : ''}`}
              style={{
                background: selected ? '#1D4ED8' : '#f3faf9',
                color: selected ? '#ffffff' : disabled ? '#9ca3af' : '#35323e',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {selectedMonth !== null && selectedYear !== null && (
        <p className="text-sm mb-3" style={{ color: '#35323e' }}>
          Selected: <strong>{MONTHS[selectedMonth]} {selectedYear}</strong>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={selectedMonth === null}
        className="w-full py-2.5 rounded-full text-sm font-semibold text-white transition-opacity"
        style={{ background: selectedMonth !== null ? '#1D4ED8' : '#9ca3af', cursor: selectedMonth !== null ? 'pointer' : 'not-allowed' }}
      >
        Confirm Semester
      </button>
    </div>
  );
}

/* ================================================================
   WIDGET 3 — Compound: Appointment Date & Time + Semester Month
   This is a standard date calendar with min/max bounds.
   ================================================================ */
function CompoundPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const MIN_DATE = '2025-04-01';
  const MAX_DATE = '2025-08-25';

  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(5); // June (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }, [viewMonth]);

  const cells: (number | null)[] = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    return c;
  }, [firstDay, daysInMonth]);

  const isDayDisabled = useCallback((day: number) => {
    const ds = fmt(viewYear, viewMonth, day);
    return !isDateInRange(ds, MIN_DATE, MAX_DATE);
  }, [viewYear, viewMonth]);

  const handleDayClick = useCallback((day: number) => {
    if (isDayDisabled(day)) return;
    setSelectedDate(fmt(viewYear, viewMonth, day));
  }, [viewYear, viewMonth, isDayDisabled]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    onSubmit({
      type: 'date',
      value: selectedDate,
      raw: {
        widget_id: 'compound',
        date: selectedDate,
      },
    });
  }, [selectedDate, onSubmit]);

  return (
    <div data-widget-id="compound" className="rounded-2xl p-6" style={{ background: '#ffffff' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#35323e' }}>Appointment Date &amp; Semester Month</h3>
      <p className="text-sm mb-4" style={{ color: '#6b7280' }}>Select a date for your combined scheduling request.</p>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80" style={{ background: '#f3faf9', color: '#35323e' }}>‹</button>
        <span className="font-medium" style={{ color: '#35323e' }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80" style={{ background: '#f3faf9', color: '#35323e' }}>›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#6b7280' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const ds = fmt(viewYear, viewMonth, day);
          const disabled = isDayDisabled(day);
          const selected = ds === selectedDate;
          return (
            <button
              key={ds}
              onClick={() => handleDayClick(day)}
              disabled={disabled}
              className={`h-9 w-full rounded-full text-sm font-medium transition-colors
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                ${selected ? 'text-white' : ''}`}
              style={{
                background: selected ? '#1D4ED8' : 'transparent',
                color: selected ? '#ffffff' : disabled ? '#9ca3af' : '#35323e',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <p className="text-sm mb-3" style={{ color: '#35323e' }}>
          Selected: <strong>{selectedDate}</strong>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="w-full py-2.5 rounded-full text-sm font-semibold text-white transition-opacity"
        style={{ background: selectedDate ? '#1D4ED8' : '#9ca3af', cursor: selectedDate ? 'pointer' : 'not-allowed' }}
      >
        Confirm Date
      </button>
    </div>
  );
}

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */
export default function Page_office_hours(props: GeneratedPageProps) {
  const [activeNav, setActiveNav] = useState('Calendar');
  const [durationFilter, setDurationFilter] = useState(30);
  const [meetingType, setMeetingType] = useState('one-on-one');

  const navItems = ['Calendar', 'Rooms', 'Team', 'Reports'];
  const durations = [15, 30, 60];

  return (
    <div className="min-h-screen" style={{ background: '#35323e', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b" style={{ background: '#35323e', borderColor: '#4a4757' }}>
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
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                  style={{
                    background: activeNav === item ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: activeNav === item ? '#ffffff' : '#a8a4b4',
                  }}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs" style={{ color: '#a8a4b4' }}>UTC-5 (EST)</span>
            <div className="flex rounded-full overflow-hidden border" style={{ borderColor: '#4a4757' }}>
              {['Day', 'Week', 'Month'].map(v => (
                <button key={v} className="px-3 py-1 text-xs font-medium" style={{ background: v === 'Week' ? 'rgba(255,255,255,0.12)' : 'transparent', color: v === 'Week' ? '#ffffff' : '#a8a4b4' }}>
                  {v}
                </button>
              ))}
            </div>
            <button className="relative" style={{ color: '#a8a4b4' }}>
              <span className="text-lg">🔔</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center" style={{ background: '#ef4444' }}>3</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=400&fit=crop"
          alt="Meeting room"
          className="w-full h-48 object-cover"
          style={{ opacity: 0.35 }}
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, rgba(53,50,62,0.6), rgba(53,50,62,0.95))' }}>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>Pick a Time</h1>
            <p className="text-sm" style={{ color: '#d7e2e2' }}>Schedule your office hours, semester enrollment, or combined bookings below.</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-4 mb-8 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: '#a8a4b4' }}>Duration</span>
            <div className="flex rounded-full overflow-hidden border" style={{ borderColor: '#4a4757' }}>
              {durations.map(d => (
                <button
                  key={d}
                  onClick={() => setDurationFilter(d)}
                  className="px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    background: durationFilter === d ? '#1D4ED8' : 'transparent',
                    color: durationFilter === d ? '#ffffff' : '#a8a4b4',
                  }}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: '#a8a4b4' }}>Timezone</span>
            <select className="rounded-full px-3 py-1 text-xs border" style={{ borderColor: '#4a4757', background: '#35323e', color: '#ffffff' }}>
              <option>US/Eastern (EST)</option>
              <option>US/Central (CST)</option>
              <option>US/Pacific (PST)</option>
              <option>Europe/London (GMT)</option>
            </select>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs font-medium" style={{ color: '#a8a4b4' }}>Type</span>
            {['one-on-one', 'group', 'webinar'].map(t => (
              <label key={t} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="meetingType"
                  value={t}
                  checked={meetingType === t}
                  onChange={() => setMeetingType(t)}
                  className="accent-blue-600"
                />
                <span className="text-xs capitalize" style={{ color: '#d7e2e2' }}>{t.replace('-', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Main grid: widgets + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Widgets column */}
          <div className="lg:col-span-2 space-y-8">
            <AppointmentDateTimePicker onSubmit={props.onSubmit} />
            <SemesterMonthPicker onSubmit={props.onSubmit} />
            <CompoundPicker onSubmit={props.onSubmit} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming meetings */}
            <div className="rounded-2xl p-5" style={{ background: '#ffffff' }}>
              <h4 className="font-semibold text-sm mb-4" style={{ color: '#35323e' }}>Upcoming Meetings</h4>
              {[
                { title: 'Design Review', time: '10:00 AM', color: '#1D4ED8' },
                { title: 'Sprint Planning', time: '1:30 PM', color: '#10B981' },
                { title: 'Office Hours', time: '3:00 PM', color: '#f59e0b' },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: '#f3f4f6' }}>
                  <div className="w-1 h-8 rounded-full" style={{ background: m.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#35323e' }}>{m.title}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>{m.time}</p>
                  </div>
                  <div className="flex -space-x-2">
                    {['🧑', '👩', '👨'].slice(0, i + 1).map((a, j) => (
                      <span key={j} className="w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 border-white" style={{ background: '#f3faf9' }}>{a}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Room cards */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff' }}>
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop"
                alt="Calendar desk workspace"
                className="w-full h-36 object-cover"
              />
              <div className="p-4">
                <h4 className="font-semibold text-sm mb-1" style={{ color: '#35323e' }}>Conference Room A</h4>
                <p className="text-xs mb-2" style={{ color: '#6b7280' }}>Capacity: 8 people · AV equipped</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: '#10B981', color: '#ffffff' }}>Available</span>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff' }}>
              <img
                src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop"
                alt="Classroom"
                className="w-full h-36 object-cover"
              />
              <div className="p-4">
                <h4 className="font-semibold text-sm mb-1" style={{ color: '#35323e' }}>Lecture Hall B</h4>
                <p className="text-xs mb-2" style={{ color: '#6b7280' }}>Capacity: 40 people · Projector</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: '#f59e0b', color: '#ffffff' }}>Booked until 2 PM</span>
              </div>
            </div>

            {/* Meeting link preview */}
            <div className="rounded-2xl p-5" style={{ background: '#ffffff' }}>
              <h4 className="font-semibold text-sm mb-3" style={{ color: '#35323e' }}>Meeting Link Preview</h4>
              <div className="rounded-xl p-3" style={{ background: '#f3faf9' }}>
                <p className="text-xs font-mono truncate" style={{ color: '#35323e' }}>https://planit.app/meet/abc-def-ghi</p>
              </div>
              <p className="text-xs mt-2" style={{ color: '#6b7280' }}>Link auto-generated upon confirmation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-12" style={{ borderColor: '#4a4757' }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <h5 className="text-sm font-semibold mb-3" style={{ color: '#ffffff' }}>Calendar Sync</h5>
              {['EchoCal', 'EchoMail', 'EchoDate', 'CalDAV'].map(s => (
                <p key={s} className="text-xs py-1 cursor-pointer hover:underline" style={{ color: '#a8a4b4' }}>{s}</p>
              ))}
            </div>
            <div>
              <h5 className="text-sm font-semibold mb-3" style={{ color: '#ffffff' }}>Notifications</h5>
              {['Email reminders', 'SMS alerts', 'Push notifications', 'EchoChat integration'].map(s => (
                <p key={s} className="text-xs py-1 cursor-pointer hover:underline" style={{ color: '#a8a4b4' }}>{s}</p>
              ))}
            </div>
            <div>
              <h5 className="text-sm font-semibold mb-3" style={{ color: '#ffffff' }}>Integrations</h5>
              {['EchoConf', 'EchoTeam', 'EchoMeet', 'EchoConnect'].map(s => (
                <p key={s} className="text-xs py-1 cursor-pointer hover:underline" style={{ color: '#a8a4b4' }}>{s}</p>
              ))}
            </div>
            <div>
              <h5 className="text-sm font-semibold mb-3" style={{ color: '#ffffff' }}>Help Center</h5>
              {['Getting started', 'FAQ', 'Contact support', 'API docs'].map(s => (
                <p key={s} className="text-xs py-1 cursor-pointer hover:underline" style={{ color: '#a8a4b4' }}>{s}</p>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-4 border-t text-center" style={{ borderColor: '#4a4757' }}>
            <p className="text-xs" style={{ color: '#6b7280' }}>© 2025 EchoPlan. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
