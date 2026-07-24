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

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function pad(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function isWeekend(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month, day).getDay();
  return dow === 0 || dow === 6;
}

// ---------- Calendar Grid ----------
function CalendarGrid({
  year,
  month,
  selectedDay,
  onSelectDay,
  isDisabled,
}: {
  year: number;
  month: number;
  selectedDay: number | null;
  onSelectDay: (d: number) => void;
  isDisabled: (y: number, m: number, d: number) => boolean;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#134E4A' }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className="py-1" />;
          const disabled = isDisabled(year, month, day);
          const selected = selectedDay === day;
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelectDay(day)}
              className={
                'py-1.5 text-sm text-center transition-colors ' +
                (disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : selected
                  ? 'font-semibold'
                  : 'hover:opacity-80 cursor-pointer')
              }
              style={
                selected
                  ? { backgroundColor: '#0D9488', color: '#fff', borderRadius: 0 }
                  : disabled
                  ? {}
                  : { color: '#134E4A' }
              }
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Month Navigation ----------
function MonthNav({
  year,
  month,
  onPrev,
  onNext,
}: {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <button
        type="button"
        onClick={onPrev}
        className="px-2 py-1 text-sm font-medium hover:opacity-70"
        style={{ color: '#0D9488' }}
      >
        ← Prev
      </button>
      <span className="text-sm font-semibold" style={{ color: '#134E4A' }}>
        {MONTHS[month]} {year}
      </span>
      <button
        type="button"
        onClick={onNext}
        className="px-2 py-1 text-sm font-medium hover:opacity-70"
        style={{ color: '#0D9488' }}
      >
        Next →
      </button>
    </div>
  );
}

// ---------- Time Selector ----------
function TimeSelector({
  hour,
  minute,
  ampm,
  onHourChange,
  onMinuteChange,
  onAmpmChange,
}: {
  hour: number;
  minute: number;
  ampm: 'AM' | 'PM';
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
  onAmpmChange: (a: 'AM' | 'PM') => void;
}) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="flex items-center gap-2 mt-3">
      <label className="text-xs font-medium" style={{ color: '#134E4A' }}>
        Time:
      </label>
      <select
        value={hour}
        onChange={(e) => onHourChange(Number(e.target.value))}
        className="border text-sm px-2 py-1"
        style={{ borderColor: '#e4e7e8', borderRadius: 0 }}
      >
        {hours.map((h) => (
          <option key={h} value={h}>
            {pad(h)}
          </option>
        ))}
      </select>
      <span style={{ color: '#134E4A' }}>:</span>
      <select
        value={minute}
        onChange={(e) => onMinuteChange(Number(e.target.value))}
        className="border text-sm px-2 py-1"
        style={{ borderColor: '#e4e7e8', borderRadius: 0 }}
      >
        {minutes.map((m) => (
          <option key={m} value={m}>
            {pad(m)}
          </option>
        ))}
      </select>
      <div className="flex">
        {(['AM', 'PM'] as const).map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => onAmpmChange(val)}
            className={'px-2 py-1 text-xs font-medium border ' + (ampm === val ? 'text-white' : '')}
            style={
              ampm === val
                ? { backgroundColor: '#0D9488', borderColor: '#0D9488', borderRadius: 0, color: '#fff' }
                : { borderColor: '#e4e7e8', color: '#134E4A', borderRadius: 0 }
            }
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );
}

// ==============================================
// Widget 1: Exam Date & Time
// ==============================================
function ExamDatetimeWidget({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(7); // August (0-indexed)
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  const handlePrev = useCallback(() => {
    setMonth((m) => {
      if (m === 0) { setYear((y) => y - 1); return 11; }
      return m - 1;
    });
    setSelectedDay(null);
  }, []);

  const handleNext = useCallback(() => {
    setMonth((m) => {
      if (m === 11) { setYear((y) => y + 1); return 0; }
      return m + 1;
    });
    setSelectedDay(null);
  }, []);

  const isDisabledDay = useCallback(
    (y: number, m: number, d: number) => isWeekend(y, m, d),
    []
  );

  const handleSubmit = useCallback(() => {
    if (selectedDay === null) return;
    let h24 = hour % 12;
    if (ampm === 'PM') h24 += 12;
    const iso = `${toISO(year, month, selectedDay)}T${pad(h24)}:${pad(minute)}:00`;
    onSubmit({
      type: 'datetime',
      value: iso,
      raw: {
        widget_id: 'exam_datetime',
        year,
        month: month + 1,
        day: selectedDay,
        hour: h24,
        minute,
        ampm,
      },
    });
  }, [selectedDay, year, month, hour, minute, ampm, onSubmit]);

  return (
    <div data-widget-id="exam_datetime" className="p-6" style={{ backgroundColor: '#fefefe' }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#134E4A' }}>
        Exam Date &amp; Time
      </h3>
      <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
        Select a weekday for your eye exam appointment (weekends unavailable).
      </p>
      <MonthNav year={year} month={month} onPrev={handlePrev} onNext={handleNext} />
      <CalendarGrid
        year={year}
        month={month}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        isDisabled={isDisabledDay}
      />
      <TimeSelector
        hour={hour}
        minute={minute}
        ampm={ampm}
        onHourChange={setHour}
        onMinuteChange={setMinute}
        onAmpmChange={setAmpm}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={selectedDay === null}
        className="mt-4 w-full py-2 text-sm font-medium text-white disabled:opacity-40"
        style={{ backgroundColor: '#0D9488', borderRadius: 0 }}
      >
        Confirm Exam Date &amp; Time
      </button>
    </div>
  );
}

// ==============================================
// Widget 2: Last Exam Date
// ==============================================
function LastExamDateWidget({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // June (0-indexed)
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const maxDate = useMemo(() => new Date(2025, 5, 30), []); // June 30 2025

  const handlePrev = useCallback(() => {
    setMonth((m) => {
      if (m === 0) { setYear((y) => y - 1); return 11; }
      return m - 1;
    });
    setSelectedDay(null);
  }, []);

  const handleNext = useCallback(() => {
    setMonth((m) => {
      if (m === 11) { setYear((y) => y + 1); return 0; }
      return m + 1;
    });
    setSelectedDay(null);
  }, []);

  const isDisabledDay = useCallback(
    (_y: number, _m: number, _d: number) => {
      const date = new Date(_y, _m, _d);
      return date > maxDate;
    },
    [maxDate]
  );

  const handleSubmit = useCallback(() => {
    if (selectedDay === null) return;
    const iso = toISO(year, month, selectedDay);
    onSubmit({
      type: 'date',
      value: iso,
      raw: {
        widget_id: 'last_exam_date',
        year,
        month: month + 1,
        day: selectedDay,
      },
    });
  }, [selectedDay, year, month, onSubmit]);

  return (
    <div data-widget-id="last_exam_date" className="p-6" style={{ backgroundColor: '#fefefe' }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#134E4A' }}>
        Last Exam Date
      </h3>
      <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
        When was your most recent eye exam? Only past dates are available.
      </p>
      <MonthNav year={year} month={month} onPrev={handlePrev} onNext={handleNext} />
      <CalendarGrid
        year={year}
        month={month}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        isDisabled={isDisabledDay}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={selectedDay === null}
        className="mt-4 w-full py-2 text-sm font-medium text-white disabled:opacity-40"
        style={{ backgroundColor: '#0D9488', borderRadius: 0 }}
      >
        Confirm Last Exam Date
      </button>
    </div>
  );
}

// ==============================================
// Widget 3: Compound (datetime + single_date)
// ==============================================
function CompoundWidget({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  // Sub-widget A: datetime (weekdays only)
  const [yearA, setYearA] = useState(2025);
  const [monthA, setMonthA] = useState(5); // June
  const [dayA, setDayA] = useState<number | null>(null);
  const [hourA, setHourA] = useState(9);
  const [minuteA, setMinuteA] = useState(0);
  const [ampmA, setAmpmA] = useState<'AM' | 'PM'>('AM');

  // Sub-widget B: single date (past only, relative to today)
  const [yearB, setYearB] = useState(2025);
  const [monthB, setMonthB] = useState(5);
  const [dayB, setDayB] = useState<number | null>(null);

  const today = useMemo(() => {
    const t = new Date(2025, 0, 1);
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Nav A
  const prevA = useCallback(() => {
    setMonthA((m) => { if (m === 0) { setYearA((y) => y - 1); return 11; } return m - 1; });
    setDayA(null);
  }, []);
  const nextA = useCallback(() => {
    setMonthA((m) => { if (m === 11) { setYearA((y) => y + 1); return 0; } return m + 1; });
    setDayA(null);
  }, []);

  // Nav B
  const prevB = useCallback(() => {
    setMonthB((m) => { if (m === 0) { setYearB((y) => y - 1); return 11; } return m - 1; });
    setDayB(null);
  }, []);
  const nextB = useCallback(() => {
    setMonthB((m) => { if (m === 11) { setYearB((y) => y + 1); return 0; } return m + 1; });
    setDayB(null);
  }, []);

  const isDisabledA = useCallback(
    (y: number, m: number, d: number) => isWeekend(y, m, d),
    []
  );

  const isDisabledB = useCallback(
    (y: number, m: number, d: number) => {
      const date = new Date(y, m, d);
      return date >= today;
    },
    [today]
  );

  const handleSubmit = useCallback(() => {
    if (dayA === null && dayB === null) return;

    let valueA = '';
    if (dayA !== null) {
      let h24 = hourA % 12;
      if (ampmA === 'PM') h24 += 12;
      valueA = `${toISO(yearA, monthA, dayA)}T${pad(h24)}:${pad(minuteA)}:00`;
    }

    let valueB = '';
    if (dayB !== null) {
      valueB = toISO(yearB, monthB, dayB);
    }

    const combined = [valueA, valueB].filter(Boolean).join('|');

    onSubmit({
      type: 'date',
      value: combined,
      raw: {
        widget_id: 'compound',
        exam_datetime: valueA || null,
        last_exam_date: valueB || null,
        yearA,
        monthA: monthA + 1,
        dayA,
        hourA,
        minuteA,
        ampmA,
        yearB,
        monthB: monthB + 1,
        dayB,
      },
    });
  }, [dayA, dayB, yearA, monthA, hourA, minuteA, ampmA, yearB, monthB, onSubmit]);

  return (
    <div data-widget-id="compound" className="p-6" style={{ backgroundColor: '#fefefe' }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#134E4A' }}>
        Exam Date &amp; Time + Last Exam Date
      </h3>
      <p className="text-xs mb-5" style={{ color: '#6b7280' }}>
        Select both your upcoming appointment (weekdays) and your previous exam date (past dates).
      </p>

      {/* Sub-widget A */}
      <div className="mb-5 pb-5" style={{ borderBottom: '1px solid #e4e7e8' }}>
        <h4 className="text-sm font-medium mb-2" style={{ color: '#0D9488' }}>
          Upcoming Appointment (Weekdays Only)
        </h4>
        <MonthNav year={yearA} month={monthA} onPrev={prevA} onNext={nextA} />
        <CalendarGrid year={yearA} month={monthA} selectedDay={dayA} onSelectDay={setDayA} isDisabled={isDisabledA} />
        <TimeSelector hour={hourA} minute={minuteA} ampm={ampmA} onHourChange={setHourA} onMinuteChange={setMinuteA} onAmpmChange={setAmpmA} />
      </div>

      {/* Sub-widget B */}
      <div>
        <h4 className="text-sm font-medium mb-2" style={{ color: '#0D9488' }}>
          Last Exam Date (Past Only)
        </h4>
        <MonthNav year={yearB} month={monthB} onPrev={prevB} onNext={nextB} />
        <CalendarGrid year={yearB} month={monthB} selectedDay={dayB} onSelectDay={setDayB} isDisabled={isDisabledB} />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={dayA === null && dayB === null}
        className="mt-4 w-full py-2 text-sm font-medium text-white disabled:opacity-40"
        style={{ backgroundColor: '#0D9488', borderRadius: 0 }}
      >
        Confirm Both Selections
      </button>
    </div>
  );
}

// ==============================================
// Main Page
// ==============================================
export default function Page_eye_exam(props: GeneratedPageProps) {
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#e4e7e8' }}>
      {/* Header */}
      <header className="w-full" style={{ backgroundColor: '#fefefe', borderBottom: '1px solid #e4e7e8' }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏥</span>
              <span className="text-base font-semibold" style={{ color: '#134E4A' }}>
                EchoMed
              </span>
            </div>
            <nav className="hidden sm:flex items-center gap-5 text-sm" style={{ color: '#134E4A' }}>
              <span className="font-medium" style={{ color: '#0D9488' }}>Book</span>
              <span className="cursor-pointer hover:opacity-70">Records</span>
              <span className="cursor-pointer hover:opacity-70">Prescriptions</span>
              <span className="cursor-pointer hover:opacity-70">Help</span>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: '#134E4A' }}>
            <span className="hidden md:inline">Emergency: (800) 555-0199</span>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium text-white"
              style={{ backgroundColor: '#0D9488', borderRadius: 0 }}
            >
              Patient Portal
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full" style={{ maxHeight: 220, overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=400&fit=crop"
          alt="Clinic interior"
          className="w-full object-cover"
          style={{ height: 220 }}
        />
        <div
          className="absolute inset-0 flex items-center"
          style={{ background: 'linear-gradient(to right, rgba(13,148,136,0.85), transparent)' }}
        >
          <div className="px-6 max-w-5xl mx-auto w-full">
            <h1 className="text-xl font-semibold text-white mb-1">Book Your Eye Exam</h1>
            <p className="text-sm text-white opacity-90">
              Comprehensive vision care — schedule online in minutes.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Doctor Card + Form Context */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Doctor Profile */}
          <div className="md:col-span-1" style={{ backgroundColor: '#fefefe' }}>
            <img
              src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=300&fit=crop"
              alt="Doctor portrait"
              className="w-full h-48 object-cover"
              style={{ borderRadius: 0 }}
            />
            <div className="p-4">
              <h3 className="text-sm font-semibold" style={{ color: '#134E4A' }}>
                Dr. Sarah Mitchell, OD
              </h3>
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                Board-certified Optometrist · 12 yrs experience
              </p>
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                Specializing in comprehensive eye exams, contact lens fittings, and glaucoma screening.
              </p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs" style={{ color: '#0D9488' }}>★★★★★</span>
                <span className="text-xs" style={{ color: '#6b7280' }}>4.9 (328 reviews)</span>
              </div>
            </div>
          </div>

          {/* Form Context */}
          <div className="md:col-span-2 p-6" style={{ backgroundColor: '#fefefe' }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: '#134E4A' }}>
              Appointment Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#134E4A' }}>
                  Visit Type
                </label>
                <select
                  className="w-full border text-sm px-3 py-2"
                  style={{ borderColor: '#e4e7e8', borderRadius: 0, backgroundColor: '#fafafa' }}
                >
                  <option>In-Person Visit</option>
                  <option>Telehealth Consultation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#134E4A' }}>
                  Insurance Provider
                </label>
                <select
                  className="w-full border text-sm px-3 py-2"
                  style={{ borderColor: '#e4e7e8', borderRadius: 0, backgroundColor: '#fafafa' }}
                >
                  <option>EchoVision Vision Care</option>
                  <option>EchoSight</option>
                  <option>EchoBlue</option>
                  <option>EchoCare</option>
                  <option>Self-Pay</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#134E4A' }}>
                Reason for Visit
              </label>
              <textarea
                placeholder="e.g., Annual eye exam, blurry vision, contact lens renewal…"
                className="w-full border text-sm px-3 py-2"
                rows={3}
                style={{ borderColor: '#e4e7e8', borderRadius: 0, backgroundColor: '#fafafa', resize: 'none' }}
              />
            </div>

            {/* Exam image */}
            <div className="mt-4">
              <img
                src="https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=400&h=300&fit=crop"
                alt="Eye exam equipment"
                className="w-full h-48 object-cover"
                style={{ borderRadius: 0 }}
              />
            </div>
          </div>
        </div>

        {/* Datepicker Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ExamDatetimeWidget onSubmit={props.onSubmit} />
          <LastExamDateWidget onSubmit={props.onSubmit} />
        </div>

        <div className="mb-8">
          <CompoundWidget onSubmit={props.onSubmit} />
        </div>

        {/* Supporting Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-5" style={{ backgroundColor: '#fefefe' }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: '#134E4A' }}>
              Office Location
            </h4>
            <p className="text-xs" style={{ color: '#6b7280' }}>
              1200 Vision Center Drive, Suite 300<br />
              San Francisco, CA 94102
            </p>
            <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
              Mon–Fri: 8:00 AM – 6:00 PM<br />
              Sat: 9:00 AM – 1:00 PM
            </p>
          </div>
          <div className="p-5" style={{ backgroundColor: '#fefefe' }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: '#134E4A' }}>
              Accepted Insurance
            </h4>
            <div className="flex flex-wrap gap-2">
              {['EchoVision', 'EchoSight', 'EchoBlue', 'EchoCare', 'EchoShield', 'EchoHealth'].map((ins) => (
                <span
                  key={ins}
                  className="text-xs px-2 py-1"
                  style={{ backgroundColor: '#f5f5f5', color: '#134E4A', borderRadius: 0 }}
                >
                  {ins}
                </span>
              ))}
            </div>
          </div>
          <div className="p-5" style={{ backgroundColor: '#fefefe' }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: '#134E4A' }}>
              Patient Reviews
            </h4>
            <div className="text-xs" style={{ color: '#6b7280' }}>
              <p className="mb-2">
                "Dr. Mitchell was thorough and explained everything clearly. Highly recommend!" — Jane P.
              </p>
              <p>
                "Easy online booking and short wait times. Great experience." — Michael R.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6" style={{ backgroundColor: '#fafafa', borderTop: '1px solid #e4e7e8' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs" style={{ color: '#6b7280' }}>
            <div className="flex items-center gap-4">
              <span>© 2025 EchoMed Vision Center</span>
              <span className="hover:underline cursor-pointer">Privacy Policy</span>
              <span className="hover:underline cursor-pointer">HIPAA Notice</span>
            </div>
            <div>
              <span>
                If you are experiencing a medical emergency, call 911 immediately.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
