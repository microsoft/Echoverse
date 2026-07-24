import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function dateToNum(y: number, m: number, d: number): number {
  return y * 10000 + m * 100 + d;
}

function monthToNum(y: number, m: number): number {
  return y * 12 + m;
}

/* ─── DateTime Picker (Widget 1) ─── */
function DateTimePicker(props: {
  widgetId: string;
  label: string;
  description: string;
  initialMonth: number;
  initialYear: number;
  minDate?: string;
  onSubmit: GeneratedPageProps['onSubmit'];
}) {
  const [viewMonth, setViewMonth] = useState(props.initialMonth);
  const [viewYear, setViewYear] = useState(props.initialYear);
  const [selected, setSelected] = useState<string | null>(null);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [submitted, setSubmitted] = useState(false);

  const today = useMemo(() => {
    const n = new Date(2025, 0, 1);
    return { y: n.getFullYear(), m: n.getMonth(), d: n.getDate() };
  }, []);

  const minParsed = useMemo(() => {
    if (!props.minDate) return null;
    const [y, m, d] = props.minDate.split('-').map(Number);
    return { y, m: m - 1, d };
  }, [props.minDate]);

  const isDisabled = useCallback((y: number, m: number, d: number): boolean => {
    const num = dateToNum(y, m, d);
    const todayNum = dateToNum(today.y, today.m, today.d);
    if (num <= todayNum) return true;
    if (minParsed) {
      const minNum = dateToNum(minParsed.y, minParsed.m, minParsed.d);
      if (num < minNum) return true;
    }
    return false;
  }, [today, minParsed]);

  const cells = useMemo(() => {
    const total = daysInMonth(viewYear, viewMonth);
    const start = firstDayOfMonth(viewYear, viewMonth);
    const arr: (number | null)[] = [];
    for (let i = 0; i < start; i++) arr.push(null);
    for (let d = 1; d <= total; d++) arr.push(d);
    return arr;
  }, [viewYear, viewMonth]);

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }, [viewMonth]);

  const handleSubmit = () => {
    if (!selected) return;
    const h24 = ampm === 'PM' ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    const iso = `${selected}T${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    setSubmitted(true);
    props.onSubmit({
      type: 'datetime',
      value: iso,
      raw: { widget_id: props.widgetId, date: selected, hour, minute, ampm, iso },
    });
  };

  return (
    <div data-widget-id={props.widgetId} className="rounded" style={{ background: '#fbfbfb', border: '1px solid #e7e6e8' }}>
      <div className="p-4 border-b" style={{ borderColor: '#e7e6e8' }}>
        <h3 className="text-lg font-semibold" style={{ color: '#374151' }}>{props.label}</h3>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{props.description}</p>
      </div>
      <div className="p-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="px-2 py-1 rounded text-sm font-medium" style={{ background: '#e7e6e8', color: '#374151' }}>◀</button>
          <span className="font-semibold text-sm" style={{ color: '#374151' }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} className="px-2 py-1 rounded text-sm font-medium" style={{ background: '#e7e6e8', color: '#374151' }}>▶</button>
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#6b7280' }}>{d}</div>)}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} />;
            const iso = toISO(viewYear, viewMonth, day);
            const disabled = isDisabled(viewYear, viewMonth, day);
            const isSel = selected === iso;
            return (
              <button
                key={iso}
                disabled={disabled}
                onClick={() => !disabled && setSelected(iso)}
                className="py-1.5 text-sm rounded text-center"
                style={{
                  background: isSel ? '#2563EB' : 'transparent',
                  color: disabled ? '#c1c6d3' : isSel ? '#fff' : '#374151',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontWeight: isSel ? 600 : 400,
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
        {/* Time selectors */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <label className="text-xs font-medium" style={{ color: '#374151' }}>Time:</label>
          <select value={hour} onChange={e => setHour(Number(e.target.value))} className="text-sm rounded px-2 py-1" style={{ border: '1px solid #dbdadd', background: '#fbfbfb', color: '#374151' }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span style={{ color: '#374151' }}>:</span>
          <select value={minute} onChange={e => setMinute(Number(e.target.value))} className="text-sm rounded px-2 py-1" style={{ border: '1px solid #dbdadd', background: '#fbfbfb', color: '#374151' }}>
            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
          </select>
          <div className="flex rounded overflow-hidden" style={{ border: '1px solid #dbdadd' }}>
            <button onClick={() => setAmpm('AM')} className="px-3 py-1 text-sm font-medium" style={{ background: ampm === 'AM' ? '#2563EB' : '#fbfbfb', color: ampm === 'AM' ? '#fff' : '#374151' }}>AM</button>
            <button onClick={() => setAmpm('PM')} className="px-3 py-1 text-sm font-medium" style={{ background: ampm === 'PM' ? '#2563EB' : '#fbfbfb', color: ampm === 'PM' ? '#fff' : '#374151' }}>PM</button>
          </div>
        </div>
        {selected && (
          <p className="mt-2 text-xs" style={{ color: '#6b7280' }}>
            Selected: {selected} at {hour}:{String(minute).padStart(2, '0')} {ampm}
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!selected || submitted}
          className="mt-4 w-full py-2 rounded text-sm font-semibold"
          style={{
            background: !selected ? '#c1c6d3' : submitted ? '#6b7280' : '#2563EB',
            color: '#fff',
            cursor: !selected ? 'not-allowed' : 'pointer',
          }}
        >
          {submitted ? '✓ Submitted' : 'Submit Exam Date & Time'}
        </button>
      </div>
    </div>
  );
}

/* ─── Month/Year Picker (Widget 2) ─── */
function MonthYearPicker(props: {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  minDate?: string;
  onSubmit: GeneratedPageProps['onSubmit'];
}) {
  const [viewYear, setViewYear] = useState(props.initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const today = useMemo(() => {
    const n = new Date(2025, 0, 1);
    return { y: n.getFullYear(), m: n.getMonth() };
  }, []);

  const minParsed = useMemo(() => {
    if (!props.minDate) return null;
    const [y, m] = props.minDate.split('-').map(Number);
    return { y, m: m - 1 };
  }, [props.minDate]);

  const isMonthDisabled = useCallback((m: number): boolean => {
    const num = monthToNum(viewYear, m);
    const todayNum = monthToNum(today.y, today.m);
    if (num <= todayNum) return true;
    if (minParsed) {
      const minNum = monthToNum(minParsed.y, minParsed.m);
      if (num < minNum) return true;
    }
    return false;
  }, [viewYear, today, minParsed]);

  const handleSubmit = () => {
    if (selectedMonth === null || selectedYear === null) return;
    const value = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    setSubmitted(true);
    props.onSubmit({
      type: 'month_year',
      value,
      raw: { widget_id: props.widgetId, month: selectedMonth + 1, year: selectedYear, value },
    });
  };

  return (
    <div data-widget-id={props.widgetId} className="rounded" style={{ background: '#fbfbfb', border: '1px solid #e7e6e8' }}>
      <div className="p-4 border-b" style={{ borderColor: '#e7e6e8' }}>
        <h3 className="text-lg font-semibold" style={{ color: '#374151' }}>{props.label}</h3>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{props.description}</p>
      </div>
      <div className="p-4">
        {/* Year nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setViewYear(y => y - 1)} className="px-2 py-1 rounded text-sm font-medium" style={{ background: '#e7e6e8', color: '#374151' }}>◀</button>
          <span className="font-semibold text-base" style={{ color: '#374151' }}>{viewYear}</span>
          <button onClick={() => setViewYear(y => y + 1)} className="px-2 py-1 rounded text-sm font-medium" style={{ background: '#e7e6e8', color: '#374151' }}>▶</button>
        </div>
        {/* Month grid */}
        <div className="grid grid-cols-4 gap-2">
          {MONTH_SHORT.map((name, idx) => {
            const disabled = isMonthDisabled(idx);
            const isSel = selectedMonth === idx && selectedYear === viewYear;
            return (
              <button
                key={name}
                disabled={disabled}
                onClick={() => { if (!disabled) { setSelectedMonth(idx); setSelectedYear(viewYear); } }}
                className="py-2 rounded text-sm text-center"
                style={{
                  background: isSel ? '#2563EB' : 'transparent',
                  color: disabled ? '#c1c6d3' : isSel ? '#fff' : '#374151',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontWeight: isSel ? 600 : 400,
                  border: isSel ? 'none' : '1px solid #e7e6e8',
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
        {selectedMonth !== null && selectedYear !== null && (
          <p className="mt-3 text-xs" style={{ color: '#6b7280' }}>
            Selected: {MONTH_NAMES[selectedMonth]} {selectedYear}
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={selectedMonth === null || submitted}
          className="mt-4 w-full py-2 rounded text-sm font-semibold"
          style={{
            background: selectedMonth === null ? '#c1c6d3' : submitted ? '#6b7280' : '#2563EB',
            color: '#fff',
            cursor: selectedMonth === null ? 'not-allowed' : 'pointer',
          }}
        >
          {submitted ? '✓ Submitted' : 'Submit Certification Expiry'}
        </button>
      </div>
    </div>
  );
}

/* ─── Standard Date Picker (Widget 3 — Compound) ─── */
function CompoundDatePicker(props: {
  widgetId: string;
  label: string;
  description: string;
  initialMonth: number;
  initialYear: number;
  minDate?: string;
  onSubmit: GeneratedPageProps['onSubmit'];
}) {
  const [viewMonth, setViewMonth] = useState(props.initialMonth);
  const [viewYear, setViewYear] = useState(props.initialYear);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const today = useMemo(() => {
    const n = new Date(2025, 0, 1);
    return { y: n.getFullYear(), m: n.getMonth(), d: n.getDate() };
  }, []);

  const minParsed = useMemo(() => {
    if (!props.minDate) return null;
    const [y, m, d] = props.minDate.split('-').map(Number);
    return { y, m: m - 1, d };
  }, [props.minDate]);

  const isDisabled = useCallback((y: number, m: number, d: number): boolean => {
    const num = dateToNum(y, m, d);
    const todayNum = dateToNum(today.y, today.m, today.d);
    if (num <= todayNum) return true;
    if (minParsed) {
      const minNum = dateToNum(minParsed.y, minParsed.m, minParsed.d);
      if (num < minNum) return true;
    }
    return false;
  }, [today, minParsed]);

  const cells = useMemo(() => {
    const total = daysInMonth(viewYear, viewMonth);
    const start = firstDayOfMonth(viewYear, viewMonth);
    const arr: (number | null)[] = [];
    for (let i = 0; i < start; i++) arr.push(null);
    for (let d = 1; d <= total; d++) arr.push(d);
    return arr;
  }, [viewYear, viewMonth]);

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }, [viewMonth]);

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    props.onSubmit({
      type: 'date',
      value: selected,
      raw: { widget_id: props.widgetId, date: selected },
    });
  };

  return (
    <div data-widget-id={props.widgetId} className="rounded" style={{ background: '#fbfbfb', border: '1px solid #e7e6e8' }}>
      <div className="p-4 border-b" style={{ borderColor: '#e7e6e8' }}>
        <h3 className="text-lg font-semibold" style={{ color: '#374151' }}>{props.label}</h3>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{props.description}</p>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="px-2 py-1 rounded text-sm font-medium" style={{ background: '#e7e6e8', color: '#374151' }}>◀</button>
          <span className="font-semibold text-sm" style={{ color: '#374151' }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} className="px-2 py-1 rounded text-sm font-medium" style={{ background: '#e7e6e8', color: '#374151' }}>▶</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#6b7280' }}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} />;
            const iso = toISO(viewYear, viewMonth, day);
            const disabled = isDisabled(viewYear, viewMonth, day);
            const isSel = selected === iso;
            return (
              <button
                key={iso}
                disabled={disabled}
                onClick={() => !disabled && setSelected(iso)}
                className="py-1.5 text-sm rounded text-center"
                style={{
                  background: isSel ? '#2563EB' : 'transparent',
                  color: disabled ? '#c1c6d3' : isSel ? '#fff' : '#374151',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontWeight: isSel ? 600 : 400,
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
        {selected && (
          <p className="mt-2 text-xs" style={{ color: '#6b7280' }}>Selected: {selected}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!selected || submitted}
          className="mt-4 w-full py-2 rounded text-sm font-semibold"
          style={{
            background: !selected ? '#c1c6d3' : submitted ? '#6b7280' : '#2563EB',
            color: '#fff',
            cursor: !selected ? 'not-allowed' : 'pointer',
          }}
        >
          {submitted ? '✓ Submitted' : 'Submit Date Selection'}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_certification_exam(props: GeneratedPageProps) {
  const [step] = useState(2);

  return (
    <div className="min-h-screen font-sans" style={{ background: '#c1c6d3' }}>
      {/* Header */}
      <header style={{ background: '#fbfbfb', borderBottom: '1px solid #e7e6e8' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👤</span>
            <span className="text-lg font-bold" style={{ color: '#374151' }}>EchoID</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <span className="text-sm font-medium" style={{ color: '#374151' }}>Settings</span>
            <span className="text-sm font-medium" style={{ color: '#374151' }}>Security</span>
            <span className="text-sm font-medium" style={{ color: '#374151' }}>Plan</span>
            <span className="text-sm font-medium" style={{ color: '#374151' }}>Help</span>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: '#6b7280' }}>Help</span>
            <button className="text-sm font-medium px-3 py-1 rounded" style={{ color: '#2563EB' }}>Logout</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop"
          alt="Professional office workspace"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(55,65,81,0.55)' }}>
          <div className="text-center">
            <h1 className="text-white text-2xl font-bold">Certification Exam Portal</h1>
            <p className="text-white text-sm mt-1 opacity-90">Complete your profile to schedule your exam</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="rounded p-4" style={{ background: '#fbfbfb', border: '1px solid #e7e6e8' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: '#374151' }}>Complete Your Profile</span>
            <span className="text-xs" style={{ color: '#6b7280' }}>Step {step} of 4</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex-1 h-2 rounded-full" style={{ background: s <= step ? '#2563EB' : '#e7e6e8' }} />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs" style={{ color: '#6b7280' }}>
            <span>Personal Info</span>
            <span style={{ fontWeight: step === 2 ? 600 : 400, color: step === 2 ? '#2563EB' : '#6b7280' }}>Exam Scheduling</span>
            <span>Documents</span>
            <span>Review</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Context Section */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 rounded p-4" style={{ background: '#fbfbfb', border: '1px solid #e7e6e8' }}>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#374151' }}>Exam Scheduling</h2>
            <p className="text-sm mb-3" style={{ color: '#6b7280' }}>
              Select your preferred exam date and time, and specify when your current certification expires.
              All dates must be in the future.
            </p>
            <div className="text-sm space-y-2" style={{ color: '#6b7280' }}>
              <div className="flex items-start gap-2">
                <span style={{ color: '#2563EB' }}>✓</span>
                <span>Personal information completed</span>
              </div>
              <div className="flex items-start gap-2">
                <span style={{ color: '#2563EB' }}>●</span>
                <span className="font-medium" style={{ color: '#374151' }}>Schedule exam & set expiry (current step)</span>
              </div>
              <div className="flex items-start gap-2">
                <span style={{ color: '#c1c6d3' }}>○</span>
                <span>Upload required documents</span>
              </div>
              <div className="flex items-start gap-2">
                <span style={{ color: '#c1c6d3' }}>○</span>
                <span>Review & submit application</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:block w-56 rounded overflow-hidden" style={{ border: '1px solid #e7e6e8' }}>
            <img
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop"
              alt="Graduation ceremony"
              className="w-full h-32 object-cover"
            />
            <div className="p-3" style={{ background: '#fbfbfb' }}>
              <p className="text-xs font-medium" style={{ color: '#374151' }}>Exam Tip</p>
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Schedule at least 4 weeks in advance for best availability.</p>
            </div>
          </div>
        </div>

        {/* Requirements checklist */}
        <div className="rounded p-3 mb-6 flex items-center gap-4 flex-wrap" style={{ background: '#dedddf', border: '1px solid #dbdadd' }}>
          <span className="text-xs font-semibold" style={{ color: '#374151' }}>Requirements:</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#fbfbfb', color: '#374151' }}>📋 Valid ID required</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#fbfbfb', color: '#374151' }}>📷 Passport photo uploaded</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#fbfbfb', color: '#374151' }}>💳 Payment processed</span>
        </div>

        {/* Widget 1: DateTime Picker */}
        <div className="mb-6">
          <DateTimePicker
            widgetId="exam_datetime"
            label="Exam Date & Time"
            description="Select your preferred exam date and time. Only future dates are available."
            initialMonth={10}
            initialYear={2025}
            minDate="2025-11-01"
            onSubmit={props.onSubmit}
          />
        </div>

        {/* Widget 2: Month/Year Picker */}
        <div className="mb-6">
          <MonthYearPicker
            widgetId="cert_expiry_month"
            label="Certification Expiry Month"
            description="Select the month and year when your current certification expires."
            initialYear={2025}
            minDate="2025-08-01"
            onSubmit={props.onSubmit}
          />
        </div>

        {/* Widget 3: Compound Date Picker */}
        <div className="mb-6">
          <CompoundDatePicker
            widgetId="compound"
            label="Exam Date & Certification Expiry — Combined Selection"
            description="Select a date that works for both your exam and certification timeline."
            initialMonth={5}
            initialYear={2025}
            minDate="2025-06-01"
            onSubmit={props.onSubmit}
          />
        </div>

        {/* Document upload area */}
        <div className="rounded p-4 mb-6" style={{ background: '#fbfbfb', border: '1px solid #e7e6e8' }}>
          <div className="flex items-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop"
              alt="ID card and documents"
              className="w-24 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="text-sm font-semibold" style={{ color: '#374151' }}>Document Upload (Next Step)</h3>
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                After scheduling your exam, you'll need to upload a valid photo ID and proof of eligibility.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded" style={{ background: '#e7e6e8', color: '#6b7280' }}>Pending</span>
            </div>
          </div>
        </div>

        {/* Help tooltip */}
        <div className="rounded p-3 mb-6" style={{ background: '#dedddf', border: '1px solid #dbdadd' }}>
          <p className="text-xs" style={{ color: '#374151' }}>
            <strong>💡 Need help?</strong> Contact support at <span style={{ color: '#2563EB' }}>support@certexam.com</span> or call 1-800-CERT-HELP. Our team is available Mon–Fri 8 AM – 6 PM EST.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#fbfbfb', borderTop: '1px solid #e7e6e8' }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs" style={{ color: '#6b7280' }}>
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Data Handling Notice</span>
              <span>•</span>
              <span>Contact Support</span>
              <span>•</span>
              <span>Accessibility Statement</span>
            </div>
            <p className="text-xs" style={{ color: '#6b7280' }}>
              © 2025 EchoID Certification. Your data is processed in accordance with our privacy policy.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
