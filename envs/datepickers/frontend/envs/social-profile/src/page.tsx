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
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => i);

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

function buildCells(year: number, month: number) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const c: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) c.push(null);
  for (let d = 1; d <= daysInMonth; d++) c.push(d);
  while (c.length % 7 !== 0) c.push(null);
  return c;
}

/* ──────────────────── Widget 1: Date of Birth ──────────────────── */

function DOBPicker({
  onSubmit,
}: {
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(6); // July = index 6
  const [selected, setSelected] = useState<number | null>(null);

  const years = useMemo(() => {
    const a: number[] = [];
    for (let y = 1950; y <= 2015; y++) a.push(y);
    return a;
  }, []);

  const cells = useMemo(() => buildCells(year, month), [year, month]);

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
      type: 'dob',
      value: iso,
      raw: { widget_id: 'profile_dob', year, month: month + 1, day: selected, iso },
    });
  }, [selected, year, month, onSubmit]);

  return (
    <div data-widget-id="profile_dob" className="p-6" style={{ background: '#ffffff', border: '1px solid #eeeeef' }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#374151' }}>Date of Birth</h3>
      <p className="text-sm mb-4" style={{ color: '#6b7280' }}>Select your date of birth using the year and month dropdowns below.</p>

      <div className="flex gap-3 mb-4">
        <select
          value={year}
          onChange={handleYearChange}
          className="flex-1 px-3 py-2 text-sm outline-none"
          style={{ border: '1px solid #eeeeef', color: '#374151', background: '#f6f9f7' }}
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={month}
          onChange={handleMonthChange}
          className="flex-1 px-3 py-2 text-sm outline-none"
          style={{ border: '1px solid #eeeeef', color: '#374151', background: '#f6f9f7' }}
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 text-sm font-medium" style={{ background: '#f6f9f7', color: '#374151', border: '1px solid #eeeeef' }} aria-label="Previous month">◀</button>
        <span className="text-sm font-semibold" style={{ color: '#374151' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 text-sm font-medium" style={{ background: '#f6f9f7', color: '#374151', border: '1px solid #eeeeef' }} aria-label="Next month">▶</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
        {DAYS_SHORT.map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const isSel = day === selected;
          return (
            <button
              key={i}
              onClick={() => setSelected(day)}
              className={`py-1.5 transition-colors ${isSel ? 'text-white font-semibold' : 'cursor-pointer'}`}
              style={
                isSel
                  ? { background: '#2563EB', color: '#fff' }
                  : { color: '#374151' }
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="mt-3 text-sm" style={{ color: '#374151' }}>
          Selected: <strong>{MONTHS[month]} {selected}, {year}</strong>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={selected === null}
        className="mt-4 w-full py-2.5 text-sm font-semibold text-white transition-opacity"
        style={{ background: selected !== null ? '#2563EB' : '#d9d8d7', cursor: selected !== null ? 'pointer' : 'not-allowed' }}
      >
        Submit Date of Birth
      </button>
    </div>
  );
}

/* ──────────────────── Widget 2: Account Created (datetime) ──────────────────── */

function DateTimePicker({
  onSubmit,
}: {
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(10); // November = index 10
  const [selectedDate, setSelectedDate] = useState<{ y: number; m: number; d: number } | null>(null);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleSelect = useCallback((d: number) => {
    setSelectedDate({ y: year, m: month, d });
  }, [year, month]);

  const isSelected = (d: number) =>
    selectedDate !== null && selectedDate.y === year && selectedDate.m === month && selectedDate.d === d;

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    const h24 = ampm === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    const iso = `${selectedDate.y}-${pad(selectedDate.m + 1)}-${pad(selectedDate.d)}T${pad(h24)}:${pad(minute)}:00`;
    onSubmit({
      type: 'datetime',
      value: iso,
      raw: {
        widget_id: 'join_datetime',
        year: selectedDate.y,
        month: selectedDate.m + 1,
        day: selectedDate.d,
        hour: h24,
        minute,
        ampm,
        iso,
      },
    });
  }, [selectedDate, hour, minute, ampm, onSubmit]);

  return (
    <div data-widget-id="join_datetime" className="p-6" style={{ background: '#ffffff', border: '1px solid #eeeeef' }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#374151' }}>Account Created</h3>
      <p className="text-sm mb-4" style={{ color: '#6b7280' }}>Select the date and time your account was created.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 text-sm font-medium" style={{ background: '#f6f9f7', color: '#374151', border: '1px solid #eeeeef' }} aria-label="Previous month">◀</button>
        <span className="text-sm font-semibold" style={{ color: '#374151' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 text-sm font-medium" style={{ background: '#f6f9f7', color: '#374151', border: '1px solid #eeeeef' }} aria-label="Next month">▶</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
        {DAYS_SHORT.map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const sel = isSelected(day);
          return (
            <button
              key={i}
              onClick={() => handleSelect(day)}
              className={`py-1.5 transition-colors ${sel ? 'text-white font-semibold' : 'cursor-pointer'}`}
              style={
                sel
                  ? { background: '#2563EB', color: '#fff' }
                  : { color: '#374151' }
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium" style={{ color: '#374151' }}>Time:</label>
        <select
          value={hour}
          onChange={e => setHour(Number(e.target.value))}
          className="px-2 py-1.5 text-sm outline-none"
          style={{ border: '1px solid #eeeeef', color: '#374151', background: '#f6f9f7' }}
        >
          {HOURS_12.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span style={{ color: '#374151' }}>:</span>
        <select
          value={minute}
          onChange={e => setMinute(Number(e.target.value))}
          className="px-2 py-1.5 text-sm outline-none"
          style={{ border: '1px solid #eeeeef', color: '#374151', background: '#f6f9f7' }}
        >
          {MINUTES_60.map(m => (
            <option key={m} value={m}>{pad(m)}</option>
          ))}
        </select>
        <div className="flex overflow-hidden" style={{ border: '1px solid #eeeeef' }}>
          <button
            onClick={() => setAmpm('AM')}
            className="px-3 py-1.5 text-sm font-medium transition-colors"
            style={ampm === 'AM' ? { background: '#2563EB', color: '#fff' } : { background: '#f6f9f7', color: '#6b7280' }}
          >
            AM
          </button>
          <button
            onClick={() => setAmpm('PM')}
            className="px-3 py-1.5 text-sm font-medium transition-colors"
            style={ampm === 'PM' ? { background: '#2563EB', color: '#fff' } : { background: '#f6f9f7', color: '#6b7280' }}
          >
            PM
          </button>
        </div>
      </div>

      {selectedDate && (
        <p className="mt-3 text-sm" style={{ color: '#374151' }}>
          Selected: <strong>{MONTHS[selectedDate.m]} {selectedDate.d}, {selectedDate.y} at {hour}:{pad(minute)} {ampm}</strong>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="mt-4 w-full py-2.5 text-sm font-semibold text-white transition-opacity"
        style={{ background: selectedDate ? '#2563EB' : '#d9d8d7', cursor: selectedDate ? 'pointer' : 'not-allowed' }}
      >
        Submit Account Created Date
      </button>
    </div>
  );
}

/* ──────────────────── Widget 3: Compound (dob+datetime) ──────────────────── */

function CompoundPicker({
  onSubmit,
}: {
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // June = index 5
  const [selected, setSelected] = useState<number | null>(null);

  const cells = useMemo(() => buildCells(year, month), [year, month]);

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
      raw: { widget_id: 'compound', year, month: month + 1, day: selected, iso },
    });
  }, [selected, year, month, onSubmit]);

  return (
    <div data-widget-id="compound" className="p-6" style={{ background: '#ffffff', border: '1px solid #eeeeef' }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#374151' }}>Date of Birth + Account Created</h3>
      <p className="text-sm mb-4" style={{ color: '#6b7280' }}>Select the applicable date to complete both profile fields.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 text-sm font-medium" style={{ background: '#f6f9f7', color: '#374151', border: '1px solid #eeeeef' }} aria-label="Previous month">◀</button>
        <span className="text-sm font-semibold" style={{ color: '#374151' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 text-sm font-medium" style={{ background: '#f6f9f7', color: '#374151', border: '1px solid #eeeeef' }} aria-label="Next month">▶</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
        {DAYS_SHORT.map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const isSel = day === selected;
          return (
            <button
              key={i}
              onClick={() => setSelected(day)}
              className={`py-1.5 transition-colors ${isSel ? 'text-white font-semibold' : 'cursor-pointer'}`}
              style={
                isSel
                  ? { background: '#2563EB', color: '#fff' }
                  : { color: '#374151' }
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="mt-3 text-sm" style={{ color: '#374151' }}>
          Selected: <strong>{MONTHS[month]} {selected}, {year}</strong>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={selected === null}
        className="mt-4 w-full py-2.5 text-sm font-semibold text-white transition-opacity"
        style={{ background: selected !== null ? '#2563EB' : '#d9d8d7', cursor: selected !== null ? 'pointer' : 'not-allowed' }}
      >
        Submit Date
      </button>
    </div>
  );
}

/* ──────────────────── Main Page ──────────────────── */

export default function Page_social_profile(props: GeneratedPageProps) {
  const [filter, setFilter] = useState<'all' | 'dob' | 'datetime' | 'compound'>('all');
  const [step] = useState(2);

  const steps = ['Personal Info', 'Date Details', 'Documents', 'Review'];

  return (
    <div className="min-h-screen" style={{ background: '#d9d8d7', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #eeeeef' }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <span className="text-base font-semibold" style={{ color: '#374151' }}>EchoID</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-xs" style={{ color: '#6b7280' }}>
            <span>Home</span>
            <span className="mx-1">/</span>
            <span>Profile</span>
            <span className="mx-1">/</span>
            <span style={{ color: '#374151' }}>Complete Setup</span>
          </div>
          <nav className="flex items-center gap-5 text-sm" style={{ color: '#6b7280' }}>
            <a href="#" className="hidden sm:inline hover:underline">Settings</a>
            <a href="#" className="hidden sm:inline hover:underline">Security</a>
            <a href="#" className="hidden sm:inline hover:underline">Plan</a>
            <a href="#" className="hidden sm:inline hover:underline">Help</a>
            <button className="px-3 py-1.5 text-sm font-medium" style={{ background: '#f6f9f7', color: '#374151', border: '1px solid #eeeeef' }}>Logout</button>
          </nav>
        </div>
      </header>

      {/* Hero with progress */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop"
          alt="Office workspace"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center" style={{ background: 'linear-gradient(to right, rgba(55,65,81,0.88), rgba(55,65,81,0.3))' }}>
          <div className="max-w-5xl mx-auto px-6 w-full">
            <h1 className="text-white text-2xl font-bold">Complete Your Profile</h1>
            <p className="text-gray-300 text-sm mt-1">Provide the required dates to finish setting up your account.</p>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="max-w-5xl mx-auto px-6 -mt-5 relative z-10">
        <div className="p-4 flex items-center justify-between" style={{ background: '#ffffff', border: '1px solid #eeeeef' }}>
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-7 h-7 flex items-center justify-center text-xs font-semibold"
                style={{
                  background: i < step ? '#2563EB' : i === step ? '#2563EB' : '#eeeeef',
                  color: i <= step ? '#fff' : '#6b7280',
                }}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:inline" style={{ color: i <= step ? '#374151' : '#6b7280' }}>{s}</span>
              {i < steps.length - 1 && (
                <div className="hidden sm:block w-8 h-px mx-2" style={{ background: i < step ? '#2563EB' : '#eeeeef' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Info cards row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-5" style={{ background: '#ffffff', border: '1px solid #eeeeef' }}>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6b7280' }}>Profile Status</p>
            <p className="text-xl font-bold mt-1" style={{ color: '#374151' }}>65%</p>
            <div className="mt-2 h-1.5 w-full" style={{ background: '#eeeeef' }}>
              <div className="h-full" style={{ width: '65%', background: '#2563EB' }} />
            </div>
          </div>
          <div className="p-5" style={{ background: '#ffffff', border: '1px solid #eeeeef' }}>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6b7280' }}>Required Fields</p>
            <p className="text-xl font-bold mt-1" style={{ color: '#374151' }}>3</p>
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Date selections remaining</p>
          </div>
          <div className="p-5" style={{ background: '#ffffff', border: '1px solid #eeeeef' }}>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6b7280' }}>Verification</p>
            <p className="text-xl font-bold mt-1" style={{ color: '#2563EB' }}>Pending</p>
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Awaiting date fields</p>
          </div>
        </div>

        {/* Form context + document area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 p-6" style={{ background: '#ffffff', border: '1px solid #eeeeef' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>First Name</label>
                <input type="text" placeholder="Jane" className="w-full mt-1 px-3 py-2 text-sm outline-none" style={{ border: '1px solid #eeeeef', color: '#374151', background: '#fcfcfc' }} readOnly />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Last Name</label>
                <input type="text" placeholder="Doe" className="w-full mt-1 px-3 py-2 text-sm outline-none" style={{ border: '1px solid #eeeeef', color: '#374151', background: '#fcfcfc' }} readOnly />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Email</label>
                <input type="email" placeholder="jane.doe@email.com" className="w-full mt-1 px-3 py-2 text-sm outline-none" style={{ border: '1px solid #eeeeef', color: '#374151', background: '#fcfcfc' }} readOnly />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Phone</label>
                <input type="tel" placeholder="+1 (555) 123-4567" className="w-full mt-1 px-3 py-2 text-sm outline-none" style={{ border: '1px solid #eeeeef', color: '#374151', background: '#fcfcfc' }} readOnly />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Address</label>
                <input type="text" placeholder="123 Main St, City, State 12345" className="w-full mt-1 px-3 py-2 text-sm outline-none" style={{ border: '1px solid #eeeeef', color: '#374151', background: '#fcfcfc' }} readOnly />
              </div>
            </div>
          </div>

          <div className="p-6" style={{ background: '#ffffff', border: '1px solid #eeeeef' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Document Upload</h3>
            <img
              src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop"
              alt="ID card and documents"
              className="w-full h-32 object-cover mb-3"
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: '#374151' }}>Photo ID</span>
                <span className="px-2 py-0.5 font-medium" style={{ background: '#f6f9f7', color: '#16a34a' }}>Uploaded</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: '#374151' }}>Proof of Address</span>
                <span className="px-2 py-0.5 font-medium" style={{ background: '#f6f9f7', color: '#6b7280' }}>Pending</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: '#374151' }}>Selfie Verification</span>
                <span className="px-2 py-0.5 font-medium" style={{ background: '#f6f9f7', color: '#6b7280' }}>Pending</span>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements checklist + supporting cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="p-5" style={{ background: '#ffffff', border: '1px solid #eeeeef' }}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Requirements Checklist</h4>
            <ul className="space-y-2 text-xs" style={{ color: '#6b7280' }}>
              <li className="flex items-center gap-2"><span style={{ color: '#16a34a' }}>✓</span> Full legal name</li>
              <li className="flex items-center gap-2"><span style={{ color: '#16a34a' }}>✓</span> Valid email address</li>
              <li className="flex items-center gap-2"><span style={{ color: '#d97706' }}>○</span> Date of birth</li>
              <li className="flex items-center gap-2"><span style={{ color: '#d97706' }}>○</span> Account creation date</li>
              <li className="flex items-center gap-2"><span style={{ color: '#d97706' }}>○</span> Compound verification date</li>
              <li className="flex items-center gap-2"><span style={{ color: '#16a34a' }}>✓</span> Photo ID uploaded</li>
            </ul>
          </div>
          <div className="overflow-hidden" style={{ background: '#ffffff', border: '1px solid #eeeeef' }}>
            <img
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop"
              alt="Graduation ceremony"
              className="w-full h-32 object-cover"
            />
            <div className="p-4">
              <h4 className="text-sm font-semibold" style={{ color: '#374151' }}>Why we need your dates</h4>
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                Date of birth is used for age verification and security. Account creation date helps us maintain accurate records and compliance.
              </p>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-sm font-medium" style={{ color: '#374151' }}>Filter:</span>
          {([
            ['all', 'All Widgets'],
            ['dob', 'Date of Birth'],
            ['datetime', 'Account Created'],
            ['compound', 'Compound'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: filter === key ? '#2563EB' : '#ffffff',
                color: filter === key ? '#fff' : '#374151',
                border: filter === key ? '1px solid #2563EB' : '1px solid #eeeeef',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Datepicker Widgets */}
        <div className="space-y-6">
          {(filter === 'all' || filter === 'dob') && (
            <DOBPicker onSubmit={props.onSubmit} />
          )}
          {(filter === 'all' || filter === 'datetime') && (
            <DateTimePicker onSubmit={props.onSubmit} />
          )}
          {(filter === 'all' || filter === 'compound') && (
            <CompoundPicker onSubmit={props.onSubmit} />
          )}
        </div>

        {/* Help tooltips section */}
        <div className="mt-8 p-5" style={{ background: '#ffffff', border: '1px solid #eeeeef' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Need Help?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs" style={{ color: '#6b7280' }}>
            <div>
              <p className="font-medium mb-1" style={{ color: '#374151' }}>💡 Date of Birth</p>
              <p>Use the year and month dropdowns to quickly navigate to your birth year, then select the day.</p>
            </div>
            <div>
              <p className="font-medium mb-1" style={{ color: '#374151' }}>💡 Account Created</p>
              <p>Check your welcome email for the exact date and time your account was created.</p>
            </div>
            <div>
              <p className="font-medium mb-1" style={{ color: '#374151' }}>💡 Compound Date</p>
              <p>This field verifies both your birth date and account creation date together.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-8 px-6" style={{ background: '#ffffff', borderTop: '1px solid #eeeeef' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs" style={{ color: '#6b7280' }}>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: '#374151' }}>Privacy Policy</h4>
              <p>Your personal data is encrypted and stored securely in compliance with GDPR and CCPA regulations.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: '#374151' }}>Data Handling</h4>
              <p>We never share your date of birth or account details with third parties without your consent.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: '#374151' }}>Contact Support</h4>
              <p>support@myprofile.com</p>
              <p className="mt-1">1-800-MY-PROFILE</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: '#374151' }}>Accessibility</h4>
              <p>EchoID is committed to making our platform accessible to all users. WCAG 2.1 AA compliant.</p>
            </div>
          </div>
          <div className="mt-6 pt-4 text-xs" style={{ borderTop: '1px solid #eeeeef', color: '#6b7280' }}>
            © 2026 EchoID Inc. All rights reserved. Terms of Service · Privacy Policy · Cookie Settings
          </div>
        </div>
      </footer>
    </div>
  );
}
