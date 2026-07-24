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

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function dateVal(y: number, m: number, d: number) {
  return y * 10000 + m * 100 + d;
}

/* ─── Widget 1 & 3: Constrained Calendar ─── */
function ConstrainedCalendar({
  widgetId, label, description, initialYear, initialMonth, minDate, maxDate, onSubmit, answerType,
}: {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  initialMonth: number;
  minDate?: string;
  maxDate?: string;
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
  answerType: string;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const min = useMemo(() => (minDate ? parseDate(minDate) : null), [minDate]);
  const max = useMemo(() => (maxDate ? parseDate(maxDate) : null), [maxDate]);

  const isDisabled = useCallback(
    (day: number) => {
      const v = dateVal(year, month, day);
      if (min && v < dateVal(min.year, min.month, min.day)) return true;
      if (max && v > dateVal(max.year, max.month, max.day)) return true;
      return false;
    },
    [year, month, min, max],
  );

  const canGoPrev = useMemo(() => {
    if (!min) return true;
    return year > min.year || (year === min.year && month > min.month);
  }, [year, month, min]);

  const canGoNext = useMemo(() => {
    if (!max) return true;
    return year < max.year || (year === max.year && month < max.month);
  }, [year, month, max]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const goPrev = () => {
    if (!canGoPrev) return;
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (!canGoNext) return;
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  };

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit({
      type: answerType,
      value: selected,
      raw: { widget_id: widgetId, selected_date: selected, year, month: month + 1 },
    });
  };

  return (
    <div data-widget-id={widgetId} style={{ backgroundColor: '#ffffff', borderRadius: 0 }} className="p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#134E4A' }}>{label}</h3>
      <p className="text-sm mb-4" style={{ color: '#6b7280' }}>{description}</p>

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goPrev}
          disabled={!canGoPrev}
          className={`px-3 py-1 text-sm font-medium ${canGoPrev ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'}`}
          style={{ color: '#0D9488' }}
        >
          ← Prev
        </button>
        <span className="font-semibold text-sm" style={{ color: '#134E4A' }}>
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={goNext}
          disabled={!canGoNext}
          className={`px-3 py-1 text-sm font-medium ${canGoNext ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'}`}
          style={{ color: '#0D9488' }}
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#6b7280' }}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const iso = toISO(year, month, day);
          const disabled = isDisabled(day);
          const isSel = selected === iso;
          return (
            <button
              key={day}
              onClick={() => { if (!disabled) setSelected(iso); }}
              disabled={disabled}
              className={`py-2 text-sm text-center ${
                disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSel
                  ? 'text-white font-semibold'
                  : 'hover:bg-gray-100 cursor-pointer'
              }`}
              style={
                isSel
                  ? { backgroundColor: '#0D9488', color: '#ffffff' }
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

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm" style={{ color: '#6b7280' }}>
          {selected ? `Selected: ${selected}` : 'No date selected'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className={`px-5 py-2 text-sm font-medium text-white ${selected ? '' : 'opacity-50 cursor-not-allowed'}`}
          style={{ backgroundColor: '#0D9488', borderRadius: 0 }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

/* ─── Widget 2: DOB Calendar ─── */
function DOBCalendar({
  widgetId, label, description, initialMonth, maxDate, onSubmit, answerType, yearMin, yearMax,
}: {
  widgetId: string;
  label: string;
  description: string;
  initialMonth: number;
  maxDate?: string;
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
  answerType: string;
  yearMin: number;
  yearMax: number;
}) {
  const [year, setYear] = useState(yearMax);
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const max = useMemo(() => (maxDate ? parseDate(maxDate) : null), [maxDate]);

  const isDisabled = useCallback(
    (day: number) => {
      if (max) {
        const v = dateVal(year, month, day);
        if (v > dateVal(max.year, max.month, max.day)) return true;
      }
      return false;
    },
    [year, month, max],
  );

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = yearMax; y >= yearMin; y--) arr.push(y);
    return arr;
  }, [yearMin, yearMax]);

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit({
      type: answerType,
      value: selected,
      raw: { widget_id: widgetId, selected_date: selected, year, month: month + 1 },
    });
  };

  return (
    <div data-widget-id={widgetId} style={{ backgroundColor: '#ffffff', borderRadius: 0 }} className="p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#134E4A' }}>{label}</h3>
      <p className="text-sm mb-4" style={{ color: '#6b7280' }}>{description}</p>

      <div className="flex gap-3 mb-4">
        <select
          value={year}
          onChange={(e) => { setYear(Number(e.target.value)); setSelected(null); }}
          className="border px-3 py-2 text-sm flex-1"
          style={{ borderColor: '#d4e0e7', borderRadius: 0, color: '#134E4A' }}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => { setMonth(Number(e.target.value)); setSelected(null); }}
          className="border px-3 py-2 text-sm flex-1"
          style={{ borderColor: '#d4e0e7', borderRadius: 0, color: '#134E4A' }}
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#6b7280' }}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const iso = toISO(year, month, day);
          const disabled = isDisabled(day);
          const isSel = selected === iso;
          return (
            <button
              key={day}
              onClick={() => { if (!disabled) setSelected(iso); }}
              disabled={disabled}
              className={`py-2 text-sm text-center ${
                disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSel
                  ? 'text-white font-semibold'
                  : 'hover:bg-gray-100 cursor-pointer'
              }`}
              style={
                isSel
                  ? { backgroundColor: '#0D9488', color: '#ffffff' }
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

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm" style={{ color: '#6b7280' }}>
          {selected ? `Selected: ${selected}` : 'No date selected'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className={`px-5 py-2 text-sm font-medium text-white ${selected ? '' : 'opacity-50 cursor-not-allowed'}`}
          style={{ backgroundColor: '#0D9488', borderRadius: 0 }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_vaccination_schedule(props: GeneratedPageProps) {
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#d4e0e7' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-3"
        style={{ backgroundColor: '#0D9488' }}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏥</span>
            <span className="text-lg font-semibold text-white">EchoMed</span>
          </div>
          <nav className="hidden sm:flex gap-4 text-sm text-white/80">
            <a href="#" className="hover:text-white">Book</a>
            <a href="#" className="hover:text-white">Records</a>
            <a href="#" className="hover:text-white">Prescriptions</a>
            <a href="#" className="hover:text-white">Help</a>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm text-white">
          <span className="hidden md:inline">Emergency: (800) 555-0199</span>
          <button
            className="px-3 py-1 border border-white/40 text-white text-sm hover:bg-white/10"
            style={{ borderRadius: 0 }}
          >
            Patient Portal
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=400&fit=crop"
          alt="Modern clinic interior"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(13,78,74,0.55)' }}>
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-1">Vaccination Schedule</h1>
            <p className="text-sm opacity-90">Book and manage your family's vaccination appointments</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Doctor profile card */}
        <div className="flex gap-4 overflow-hidden" style={{ backgroundColor: '#ffffff', borderRadius: 0 }}>
          <img
            src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=300&fit=crop"
            alt="Dr. Sarah Chen"
            className="w-36 h-36 object-cover flex-shrink-0"
          />
          <div className="py-4 pr-4">
            <h2 className="font-semibold" style={{ color: '#134E4A' }}>Dr. Sarah Chen, MD</h2>
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
              Pediatric Immunology · Board Certified · 12 yrs experience
            </p>
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>★★★★★ 4.9 (328 reviews)</p>
            <p className="text-sm mt-3" style={{ color: '#0D9488' }}>
              Book your vaccination appointment below
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select
            className="border px-3 py-2 text-sm"
            style={{ borderColor: '#d4e0e7', borderRadius: 0, backgroundColor: '#ffffff', color: '#134E4A' }}
          >
            <option>In-Person Visit</option>
            <option>Telehealth</option>
          </select>
          <select
            className="border px-3 py-2 text-sm"
            style={{ borderColor: '#d4e0e7', borderRadius: 0, backgroundColor: '#ffffff', color: '#134E4A' }}
          >
            <option>Select Insurance</option>
            <option>EchoCare</option>
            <option>EchoBlue</option>
            <option>EchoHealth</option>
            <option>EchoShield</option>
          </select>
          <input
            type="text"
            placeholder="Reason for visit"
            className="border px-3 py-2 text-sm flex-1 min-w-[160px]"
            style={{ borderColor: '#d4e0e7', borderRadius: 0, backgroundColor: '#ffffff', color: '#134E4A' }}
          />
        </div>

        {/* Widget 1 — Vaccination Date */}
        <ConstrainedCalendar
          widgetId="vaccine_date"
          label="Vaccination Date"
          description="Select your preferred vaccination appointment date. Available dates: March 10 – August 31, 2025."
          initialYear={2025}
          initialMonth={5}
          minDate="2025-03-10"
          maxDate="2025-08-31"
          onSubmit={props.onSubmit}
          answerType="date"
        />

        {/* Widget 2 — Child Date of Birth */}
        <DOBCalendar
          widgetId="child_dob"
          label="Child Date of Birth"
          description="Enter your child's date of birth using the year and month dropdowns, then select the day."
          initialMonth={2}
          maxDate="2026-03-31"
          onSubmit={props.onSubmit}
          answerType="dob"
          yearMin={1950}
          yearMax={2015}
        />

        {/* Widget 3 — Compound */}
        <ConstrainedCalendar
          widgetId="compound"
          label="Vaccination Date + Child Date of Birth"
          description="Select a date for the combined vaccination schedule. Available dates: March 28 – July 28, 2025."
          initialYear={2025}
          initialMonth={5}
          minDate="2025-03-28"
          maxDate="2025-07-28"
          onSubmit={props.onSubmit}
          answerType="date"
        />

        {/* Supporting content */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4" style={{ backgroundColor: '#ffffff', borderRadius: 0 }}>
            <img
              src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop"
              alt="Stethoscope on desk"
              className="w-full h-32 object-cover mb-3"
            />
            <h4 className="text-sm font-semibold" style={{ color: '#134E4A' }}>Accepted Insurance</h4>
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
              EchoCare · EchoBlue · EchoHealth · EchoShield · Medicare · Medicaid
            </p>
          </div>
          <div className="p-4" style={{ backgroundColor: '#ffffff', borderRadius: 0 }}>
            <h4 className="text-sm font-semibold" style={{ color: '#134E4A' }}>Office Location</h4>
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
              1250 Wellness Blvd, Suite 300<br />San Francisco, CA 94105
            </p>
            <h4 className="text-sm font-semibold mt-4" style={{ color: '#134E4A' }}>Clinic Hours</h4>
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
              Mon–Fri: 8 am – 6 pm<br />Sat: 9 am – 1 pm · Sun: Closed
            </p>
            <h4 className="text-sm font-semibold mt-4" style={{ color: '#134E4A' }}>Patient Reviews</h4>
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
              "Dr. Chen was incredibly thorough and patient with my toddler." — Maria T.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs" style={{ backgroundColor: '#134E4A', color: '#ffffff' }}>
        <p>© 2025 EchoMed Medical Group. All rights reserved.</p>
        <p className="mt-1 opacity-70">
          HIPAA Compliant · Privacy Policy · Terms of Service · If you are experiencing a medical emergency, call 911 immediately.
        </p>
      </footer>
    </div>
  );
}
