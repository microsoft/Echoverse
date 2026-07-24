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

const DISABLED_DATES_SET = new Set([
  '2025-01-01','2025-07-04','2025-12-25','2025-11-28',
]);

function isWeekend(year: number, month: number, day: number) {
  const dow = new Date(year, month, day).getDay();
  return dow === 0 || dow === 6;
}

function isDisabledHoliday(year: number, month: number, day: number) {
  const key = `${year}-${pad(month + 1)}-${pad(day)}`;
  return DISABLED_DATES_SET.has(key);
}

/* ─── Widget 1: Hearing Date & Time ─── */
function HearingDateTimePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [month, setMonth] = useState(10); // Nov = index 10
  const [year, setYear] = useState(2025);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  const cells = useMemo(() => buildCalendarCells(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    setSelectedDay(null);
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    setSelectedDay(null);
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const isDayDisabled = useCallback((day: number) => {
    return isWeekend(year, month, day) || isDisabledHoliday(year, month, day);
  }, [year, month]);

  const handleDayClick = useCallback((day: number) => {
    if (!isDayDisabled(day)) setSelectedDay(day);
  }, [isDayDisabled]);

  const buildISO = useCallback(() => {
    if (selectedDay === null) return '';
    let h = hour;
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${year}-${pad(month + 1)}-${pad(selectedDay)}T${pad(h)}:${pad(minute)}:00`;
  }, [selectedDay, hour, minute, ampm, year, month]);

  const handleSubmit = useCallback(() => {
    const iso = buildISO();
    if (!iso) return;
    onSubmit({
      type: 'datetime',
      value: iso,
      raw: {
        widget_id: 'hearing_datetime',
        year, month: month + 1, day: selectedDay,
        hour, minute, ampm,
      },
    });
  }, [buildISO, onSubmit, year, month, selectedDay, hour, minute, ampm]);

  return (
    <div data-widget-id="hearing_datetime" className="rounded-xl p-6" style={{ backgroundColor: '#ffffff', border: '1px solid #eeeff0' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#706f7c' }}>Hearing Date &amp; Time</h3>
      <p className="text-sm mb-4" style={{ color: '#706f7c' }}>Select the scheduled court hearing date and time. Only business days are available.</p>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: '#eeeff0', color: '#706f7c' }}>‹ Prev</button>
        <span className="font-semibold" style={{ color: '#706f7c' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: '#eeeff0', color: '#706f7c' }}>Next ›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium mb-1" style={{ color: '#706f7c' }}>
        {DAYS.map(d => <div key={d} className="py-1">{d}</div>)}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 text-center text-sm">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="py-2" />;
          const disabled = isDayDisabled(day);
          const selected = day === selectedDay;
          return (
            <button
              key={i}
              onClick={() => handleDayClick(day)}
              disabled={disabled}
              className={`py-2 rounded-lg transition-colors ${
                disabled ? 'opacity-30 cursor-not-allowed' :
                selected ? 'text-white font-semibold' : 'hover:opacity-70 cursor-pointer'
              }`}
              style={{
                backgroundColor: selected ? '#1D4ED8' : 'transparent',
                color: selected ? '#ffffff' : disabled ? '#706f7c' : '#706f7c',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Time selectors */}
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium" style={{ color: '#706f7c' }}>Time:</label>
        <select value={hour} onChange={e => setHour(Number(e.target.value))} className="rounded-lg px-2 py-1 text-sm" style={{ border: '1px solid #eeeff0', color: '#706f7c' }}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span style={{ color: '#706f7c' }}>:</span>
        <select value={minute} onChange={e => setMinute(Number(e.target.value))} className="rounded-lg px-2 py-1 text-sm" style={{ border: '1px solid #eeeff0', color: '#706f7c' }}>
          {[0, 15, 30, 45].map(m => (
            <option key={m} value={m}>{pad(m)}</option>
          ))}
        </select>
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #eeeff0' }}>
          <button onClick={() => setAmpm('AM')} className="px-3 py-1 text-sm font-medium" style={{ backgroundColor: ampm === 'AM' ? '#1D4ED8' : '#fcfcfc', color: ampm === 'AM' ? '#ffffff' : '#706f7c' }}>AM</button>
          <button onClick={() => setAmpm('PM')} className="px-3 py-1 text-sm font-medium" style={{ backgroundColor: ampm === 'PM' ? '#1D4ED8' : '#fcfcfc', color: ampm === 'PM' ? '#ffffff' : '#706f7c' }}>PM</button>
        </div>
      </div>

      {selectedDay && (
        <p className="mt-3 text-sm" style={{ color: '#10B981' }}>
          Selected: {MONTHS[month]} {selectedDay}, {year} at {hour}:{pad(minute)} {ampm}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={selectedDay === null}
        className="mt-4 w-full py-2 rounded-lg text-sm font-semibold transition-opacity"
        style={{
          backgroundColor: selectedDay !== null ? '#1D4ED8' : '#eeeff0',
          color: selectedDay !== null ? '#ffffff' : '#706f7c',
          cursor: selectedDay !== null ? 'pointer' : 'not-allowed',
        }}
      >
        Submit Hearing Date &amp; Time
      </button>
    </div>
  );
}

/* ─── Widget 2: Filing Date ─── */
function FilingDatePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [month, setMonth] = useState(8); // Sep = index 8
  const [year, setYear] = useState(2025);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const maxDate = new Date(2025, 8, 30); // Sept 30, 2025

  const cells = useMemo(() => buildCalendarCells(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    setSelectedDay(null);
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    setSelectedDay(null);
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const isDayDisabled = useCallback((day: number) => {
    const d = new Date(year, month, day);
    return d > maxDate;
  }, [year, month, maxDate]);

  const handleDayClick = useCallback((day: number) => {
    if (!isDayDisabled(day)) setSelectedDay(day);
  }, [isDayDisabled]);

  const buildISO = useCallback(() => {
    if (selectedDay === null) return '';
    return `${year}-${pad(month + 1)}-${pad(selectedDay)}`;
  }, [selectedDay, year, month]);

  const handleSubmit = useCallback(() => {
    const iso = buildISO();
    if (!iso) return;
    onSubmit({
      type: 'date',
      value: iso,
      raw: {
        widget_id: 'filing_date',
        year, month: month + 1, day: selectedDay,
      },
    });
  }, [buildISO, onSubmit, year, month, selectedDay]);

  return (
    <div data-widget-id="filing_date" className="rounded-xl p-6" style={{ backgroundColor: '#ffffff', border: '1px solid #eeeff0' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#706f7c' }}>Filing Date</h3>
      <p className="text-sm mb-4" style={{ color: '#706f7c' }}>Select the date the case was originally filed. Only past dates up to September 30, 2025 are selectable.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: '#eeeff0', color: '#706f7c' }}>‹ Prev</button>
        <span className="font-semibold" style={{ color: '#706f7c' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: '#eeeff0', color: '#706f7c' }}>Next ›</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium mb-1" style={{ color: '#706f7c' }}>
        {DAYS.map(d => <div key={d} className="py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 text-center text-sm">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="py-2" />;
          const disabled = isDayDisabled(day);
          const selected = day === selectedDay;
          return (
            <button
              key={i}
              onClick={() => handleDayClick(day)}
              disabled={disabled}
              className={`py-2 rounded-lg transition-colors ${
                disabled ? 'opacity-30 cursor-not-allowed' :
                selected ? 'text-white font-semibold' : 'hover:opacity-70 cursor-pointer'
              }`}
              style={{
                backgroundColor: selected ? '#1D4ED8' : 'transparent',
                color: selected ? '#ffffff' : disabled ? '#706f7c' : '#706f7c',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <p className="mt-3 text-sm" style={{ color: '#10B981' }}>
          Selected: {MONTHS[month]} {selectedDay}, {year}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={selectedDay === null}
        className="mt-4 w-full py-2 rounded-lg text-sm font-semibold transition-opacity"
        style={{
          backgroundColor: selectedDay !== null ? '#1D4ED8' : '#eeeff0',
          color: selectedDay !== null ? '#ffffff' : '#706f7c',
          cursor: selectedDay !== null ? 'pointer' : 'not-allowed',
        }}
      >
        Submit Filing Date
      </button>
    </div>
  );
}

/* ─── Widget 3: Compound (Hearing Date & Time + Filing Date) ─── */
function CompoundPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  // Sub-widget A: Hearing datetime
  const [monthA, setMonthA] = useState(5); // Jun = index 5
  const [yearA, setYearA] = useState(2025);
  const [selectedDayA, setSelectedDayA] = useState<number | null>(null);
  const [hourA, setHourA] = useState(9);
  const [minuteA, setMinuteA] = useState(0);
  const [ampmA, setAmpmA] = useState<'AM' | 'PM'>('AM');

  // Sub-widget B: Filing date
  const [monthB, setMonthB] = useState(5);
  const [yearB, setYearB] = useState(2025);
  const [selectedDayB, setSelectedDayB] = useState<number | null>(null);

  const cellsA = useMemo(() => buildCalendarCells(yearA, monthA), [yearA, monthA]);
  const cellsB = useMemo(() => buildCalendarCells(yearB, monthB), [yearB, monthB]);

  const today = useMemo(() => new Date(2025, 0, 1), []);

  const prevMonthA = useCallback(() => { setSelectedDayA(null); if (monthA === 0) { setMonthA(11); setYearA(y => y - 1); } else setMonthA(m => m - 1); }, [monthA]);
  const nextMonthA = useCallback(() => { setSelectedDayA(null); if (monthA === 11) { setMonthA(0); setYearA(y => y + 1); } else setMonthA(m => m + 1); }, [monthA]);
  const prevMonthB = useCallback(() => { setSelectedDayB(null); if (monthB === 0) { setMonthB(11); setYearB(y => y - 1); } else setMonthB(m => m - 1); }, [monthB]);
  const nextMonthB = useCallback(() => { setSelectedDayB(null); if (monthB === 11) { setMonthB(0); setYearB(y => y + 1); } else setMonthB(m => m + 1); }, [monthB]);

  const isDayDisabledA = useCallback((day: number) => {
    return isWeekend(yearA, monthA, day) || isDisabledHoliday(yearA, monthA, day);
  }, [yearA, monthA]);

  const isDayDisabledB = useCallback((day: number) => {
    const d = new Date(yearB, monthB, day);
    return d > today;
  }, [yearB, monthB, today]);

  const handleDayClickA = useCallback((day: number) => { if (!isDayDisabledA(day)) setSelectedDayA(day); }, [isDayDisabledA]);
  const handleDayClickB = useCallback((day: number) => { if (!isDayDisabledB(day)) setSelectedDayB(day); }, [isDayDisabledB]);

  const buildISO = useCallback(() => {
    if (selectedDayA === null || selectedDayB === null) return '';
    let h = hourA;
    if (ampmA === 'PM' && h !== 12) h += 12;
    if (ampmA === 'AM' && h === 12) h = 0;
    const dtA = `${yearA}-${pad(monthA + 1)}-${pad(selectedDayA)}T${pad(h)}:${pad(minuteA)}:00`;
    const dtB = `${yearB}-${pad(monthB + 1)}-${pad(selectedDayB)}`;
    return `${dtA}|${dtB}`;
  }, [selectedDayA, selectedDayB, hourA, minuteA, ampmA, yearA, monthA, yearB, monthB]);

  const handleSubmit = useCallback(() => {
    const iso = buildISO();
    if (!iso) return;
    onSubmit({
      type: 'date',
      value: iso,
      raw: {
        widget_id: 'compound',
        hearing: { year: yearA, month: monthA + 1, day: selectedDayA, hour: hourA, minute: minuteA, ampm: ampmA },
        filing: { year: yearB, month: monthB + 1, day: selectedDayB },
      },
    });
  }, [buildISO, onSubmit, yearA, monthA, selectedDayA, hourA, minuteA, ampmA, yearB, monthB, selectedDayB]);

  const renderCalendar = (
    cells: (number | null)[],
    isDayDisabled: (d: number) => boolean,
    selectedDay: number | null,
    handleClick: (d: number) => void,
  ) => (
    <div className="grid grid-cols-7 text-center text-sm">
      {cells.map((day, i) => {
        if (day === null) return <div key={i} className="py-2" />;
        const disabled = isDayDisabled(day);
        const selected = day === selectedDay;
        return (
          <button
            key={i}
            onClick={() => handleClick(day)}
            disabled={disabled}
            className={`py-2 rounded-lg transition-colors ${
              disabled ? 'opacity-30 cursor-not-allowed' :
              selected ? 'text-white font-semibold' : 'hover:opacity-70 cursor-pointer'
            }`}
            style={{
              backgroundColor: selected ? '#1D4ED8' : 'transparent',
              color: selected ? '#ffffff' : disabled ? '#706f7c' : '#706f7c',
            }}
          >
            {day}
          </button>
        );
      })}
    </div>
  );

  return (
    <div data-widget-id="compound" className="rounded-xl p-6" style={{ backgroundColor: '#ffffff', border: '1px solid #eeeff0' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#706f7c' }}>Hearing Date &amp; Time + Filing Date</h3>
      <p className="text-sm mb-5" style={{ color: '#706f7c' }}>Select both the hearing date/time and the original filing date to complete this compound entry.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sub-widget A: Hearing Date & Time */}
        <div className="rounded-lg p-4" style={{ backgroundColor: '#fcffff', border: '1px solid #eeeff0' }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: '#706f7c' }}>Hearing Date &amp; Time</h4>
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonthA} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: '#eeeff0', color: '#706f7c' }}>‹ Prev</button>
            <span className="text-sm font-semibold" style={{ color: '#706f7c' }}>{MONTHS[monthA]} {yearA}</span>
            <button onClick={nextMonthA} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: '#eeeff0', color: '#706f7c' }}>Next ›</button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-medium mb-1" style={{ color: '#706f7c' }}>
            {DAYS.map(d => <div key={d} className="py-1">{d}</div>)}
          </div>
          {renderCalendar(cellsA, isDayDisabledA, selectedDayA, handleDayClickA)}

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <label className="text-xs font-medium" style={{ color: '#706f7c' }}>Time:</label>
            <select value={hourA} onChange={e => setHourA(Number(e.target.value))} className="rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid #eeeff0', color: '#706f7c' }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span style={{ color: '#706f7c' }}>:</span>
            <select value={minuteA} onChange={e => setMinuteA(Number(e.target.value))} className="rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid #eeeff0', color: '#706f7c' }}>
              {[0, 15, 30, 45].map(m => <option key={m} value={m}>{pad(m)}</option>)}
            </select>
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #eeeff0' }}>
              <button onClick={() => setAmpmA('AM')} className="px-2 py-1 text-xs font-medium" style={{ backgroundColor: ampmA === 'AM' ? '#1D4ED8' : '#fcfcfc', color: ampmA === 'AM' ? '#fff' : '#706f7c' }}>AM</button>
              <button onClick={() => setAmpmA('PM')} className="px-2 py-1 text-xs font-medium" style={{ backgroundColor: ampmA === 'PM' ? '#1D4ED8' : '#fcfcfc', color: ampmA === 'PM' ? '#fff' : '#706f7c' }}>PM</button>
            </div>
          </div>
          {selectedDayA && (
            <p className="mt-2 text-xs" style={{ color: '#10B981' }}>
              {MONTHS[monthA]} {selectedDayA}, {yearA} at {hourA}:{pad(minuteA)} {ampmA}
            </p>
          )}
        </div>

        {/* Sub-widget B: Filing Date */}
        <div className="rounded-lg p-4" style={{ backgroundColor: '#fcffff', border: '1px solid #eeeff0' }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: '#706f7c' }}>Filing Date</h4>
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonthB} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: '#eeeff0', color: '#706f7c' }}>‹ Prev</button>
            <span className="text-sm font-semibold" style={{ color: '#706f7c' }}>{MONTHS[monthB]} {yearB}</span>
            <button onClick={nextMonthB} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: '#eeeff0', color: '#706f7c' }}>Next ›</button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-medium mb-1" style={{ color: '#706f7c' }}>
            {DAYS.map(d => <div key={d} className="py-1">{d}</div>)}
          </div>
          {renderCalendar(cellsB, isDayDisabledB, selectedDayB, handleDayClickB)}
          {selectedDayB && (
            <p className="mt-2 text-xs" style={{ color: '#10B981' }}>
              {MONTHS[monthB]} {selectedDayB}, {yearB}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={selectedDayA === null || selectedDayB === null}
        className="mt-5 w-full py-2 rounded-lg text-sm font-semibold transition-opacity"
        style={{
          backgroundColor: (selectedDayA !== null && selectedDayB !== null) ? '#1D4ED8' : '#eeeff0',
          color: (selectedDayA !== null && selectedDayB !== null) ? '#ffffff' : '#706f7c',
          cursor: (selectedDayA !== null && selectedDayB !== null) ? 'pointer' : 'not-allowed',
        }}
      >
        Submit Compound Selection
      </button>
    </div>
  );
}

/* ─── Main Page Component ─── */
export default function Page_court_hearing(props: GeneratedPageProps) {
  const [activeNav, setActiveNav] = useState('Calendar');
  const [durationFilter, setDurationFilter] = useState(30);
  const [meetingTypeFilter, setMeetingTypeFilter] = useState('hearing');

  const navItems = ['Calendar', 'Rooms', 'Team', 'Reports'];

  const upcomingMeetings = [
    { title: 'Case Review — Smith v. Doe', time: '10:00 AM', participants: ['JK', 'ML', 'ST'], room: 'Courtroom A' },
    { title: 'Pre-trial Conference', time: '2:30 PM', participants: ['AB', 'CD'], room: 'Chamber 3' },
    { title: 'Deposition — Johnson Estate', time: '4:00 PM', participants: ['EF', 'GH', 'IJ', 'KL'], room: 'Room 201' },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#706f7c' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <span className="text-lg font-semibold" style={{ color: '#1D4ED8' }}>EchoPlan</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item}
                  onClick={() => setActiveNav(item)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: activeNav === item ? '#EFF6FF' : 'transparent',
                    color: activeNav === item ? '#1D4ED8' : '#706f7c',
                  }}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs hidden sm:block" style={{ color: '#706f7c' }}>EST (UTC-5)</span>
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #eeeff0' }}>
              {['Day', 'Week', 'Month'].map(v => (
                <button key={v} className="px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: v === 'Month' ? '#1D4ED8' : '#fcfcfc', color: v === 'Month' ? '#fff' : '#706f7c' }}>{v}</button>
              ))}
            </div>
            <button className="relative p-1.5 rounded-lg" style={{ backgroundColor: '#fcffff' }}>
              <span className="text-sm">🔔</span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=400&fit=crop"
          alt="Meeting room with scheduling display"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(to right, rgba(29,78,216,0.7), rgba(29,78,216,0.3))' }}>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Court Hearing Scheduler</h1>
            <p className="text-white text-sm mt-1 opacity-90">Pick a time for your hearing, review filing dates, and manage court schedules</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters bar */}
        <div className="rounded-xl p-4 mb-8 flex flex-wrap items-center gap-6" style={{ backgroundColor: '#ffffff', border: '1px solid #eeeff0' }}>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#706f7c' }}>Duration</label>
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #eeeff0' }}>
              {[15, 30, 60].map(d => (
                <button
                  key={d}
                  onClick={() => setDurationFilter(d)}
                  className="px-3 py-1.5 text-xs font-medium"
                  style={{ backgroundColor: durationFilter === d ? '#1D4ED8' : '#fcfcfc', color: durationFilter === d ? '#fff' : '#706f7c' }}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#706f7c' }}>Hearing Type</label>
            <div className="flex gap-3">
              {['hearing', 'deposition', 'conference'].map(t => (
                <label key={t} className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: '#706f7c' }}>
                  <input
                    type="radio"
                    name="meetingType"
                    checked={meetingTypeFilter === t}
                    onChange={() => setMeetingTypeFilter(t)}
                    className="accent-blue-700"
                  />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#706f7c' }}>Timezone</label>
            <select className="rounded-lg px-3 py-1.5 text-xs" style={{ border: '1px solid #eeeff0', color: '#706f7c' }}>
              <option>Eastern (EST)</option>
              <option>Central (CST)</option>
              <option>Pacific (PST)</option>
            </select>
          </div>
        </div>

        {/* Widgets */}
        <div className="flex flex-col gap-8">
          <HearingDateTimePicker onSubmit={props.onSubmit} />
          <FilingDatePicker onSubmit={props.onSubmit} />
          <CompoundPicker onSubmit={props.onSubmit} />
        </div>

        {/* Supporting content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Upcoming meetings */}
          <div className="md:col-span-2 rounded-xl p-6" style={{ backgroundColor: '#ffffff', border: '1px solid #eeeff0' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#706f7c' }}>Upcoming Hearings</h3>
            <div className="flex flex-col gap-3">
              {upcomingMeetings.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#fcffff', border: '1px solid #eeeff0' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-10 rounded-full" style={{ backgroundColor: '#10B981' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#706f7c' }}>{m.title}</p>
                      <p className="text-xs" style={{ color: '#706f7c' }}>{m.time} · {m.room}</p>
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {m.participants.map((p, j) => (
                      <div key={j} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white" style={{ backgroundColor: '#1D4ED8', border: '2px solid #ffffff' }}>{p}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #eeeff0' }}>
              <img
                src="https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=400&h=300&fit=crop"
                alt="Courtroom interior"
                className="w-full h-48 object-cover"
              />
              <div className="p-4" style={{ backgroundColor: '#ffffff' }}>
                <p className="text-sm font-medium" style={{ color: '#706f7c' }}>Courtroom A — Main Hall</p>
                <p className="text-xs mt-1" style={{ color: '#706f7c' }}>Capacity: 50 · AV equipped · Accessible</p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #eeeff0' }}>
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop"
                alt="Calendar on desk"
                className="w-full h-48 object-cover"
              />
              <div className="p-4" style={{ backgroundColor: '#ffffff' }}>
                <p className="text-sm font-medium" style={{ color: '#706f7c' }}>Meeting Link Preview</p>
                <p className="text-xs mt-1 font-mono" style={{ color: '#1D4ED8' }}>planit.court/hearing/abc123</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-8 px-6" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs" style={{ color: '#706f7c' }}>
            <div>
              <p className="font-semibold mb-2">Calendar Sync</p>
              <p className="mb-1">EchoCal</p>
              <p className="mb-1">EchoMail</p>
              <p>EchoDate</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Notifications</p>
              <p className="mb-1">Email Reminders</p>
              <p className="mb-1">SMS Alerts</p>
              <p>Push Notifications</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Integrations</p>
              <p className="mb-1">EchoConf</p>
              <p className="mb-1">EchoTeam</p>
              <p>EchoChat</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Help</p>
              <p className="mb-1">Help Center</p>
              <p className="mb-1">Contact Support</p>
              <p>Documentation</p>
            </div>
          </div>
          <div className="mt-6 pt-4 text-xs text-center" style={{ borderTop: '1px solid #eeeff0', color: '#706f7c' }}>
            © 2025 EchoPlan Court Scheduling. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
