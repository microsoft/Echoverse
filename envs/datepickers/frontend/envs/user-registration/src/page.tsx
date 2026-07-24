import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}
function firstDayOfMonth(month: number, year: number) {
  return new Date(year, month - 1, 1).getDay();
}
function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

const MAX_DATE = { year: 2025, month: 6, day: 30 };
const YEAR_MIN = 1950;
const YEAR_MAX = 2015;
const YEARS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i);

function DOBPicker(props: {
  onSubmit: GeneratedPageProps['onSubmit'];
}) {
  const [viewMonth, setViewMonth] = useState(6);
  const [viewYear, setViewYear] = useState(2025);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const totalDays = useMemo(() => daysInMonth(viewMonth, viewYear), [viewMonth, viewYear]);
  const startDay = useMemo(() => firstDayOfMonth(viewMonth, viewYear), [viewMonth, viewYear]);

  const isDayDisabled = useCallback((day: number) => {
    const y = viewYear; const m = viewMonth;
    if (y > MAX_DATE.year) return true;
    if (y === MAX_DATE.year && m > MAX_DATE.month) return true;
    if (y === MAX_DATE.year && m === MAX_DATE.month && day > MAX_DATE.day) return true;
    return false;
  }, [viewMonth, viewYear]);

  const canGoNext = useMemo(() => {
    if (viewYear < MAX_DATE.year) return true;
    if (viewYear === MAX_DATE.year && viewMonth < MAX_DATE.month) return true;
    return false;
  }, [viewMonth, viewYear]);

  const handlePrev = useCallback(() => {
    setViewMonth(m => {
      if (m === 1) { setViewYear(y => y - 1); return 12; }
      return m - 1;
    });
  }, []);

  const handleNext = useCallback(() => {
    if (!canGoNext) return;
    setViewMonth(m => {
      if (m === 12) { setViewYear(y => y + 1); return 1; }
      return m + 1;
    });
  }, [canGoNext]);

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = parseInt(e.target.value, 10);
    setViewYear(y);
    if (y === MAX_DATE.year && viewMonth > MAX_DATE.month) {
      setViewMonth(MAX_DATE.month);
    }
  }, [viewMonth]);

  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value, 10);
    if (viewYear === MAX_DATE.year && m > MAX_DATE.month) return;
    setViewMonth(m);
  }, [viewYear]);

  const handleDayClick = useCallback((day: number) => {
    if (isDayDisabled(day)) return;
    setSelectedDate(toISO(viewYear, viewMonth, day));
  }, [viewYear, viewMonth, isDayDisabled]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    const [sy, sm, sd] = selectedDate.split('-').map(Number);
    props.onSubmit({
      type: 'dob',
      value: selectedDate,
      raw: {
        widget_id: 'user_dob',
        year: sy,
        month: sm,
        day: sd,
        month_name: MONTH_NAMES[sm - 1],
        iso: selectedDate,
      },
    });
  }, [selectedDate, props]);

  const availableMonths = useMemo(() => {
    if (viewYear === MAX_DATE.year) return MONTH_NAMES.slice(0, MAX_DATE.month);
    return MONTH_NAMES;
  }, [viewYear]);

  const cells: (number | null)[] = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) arr.push(null);
    for (let d = 1; d <= totalDays; d++) arr.push(d);
    return arr;
  }, [startDay, totalDays]);

  return (
    <div data-widget-id="user_dob" className="w-full">
      <label className="block text-sm font-semibold mb-1" style={{ color: '#e2e0e6', fontFamily: 'Georgia, serif' }}>
        Date of Birth
      </label>
      <p className="text-xs mb-3" style={{ color: '#9b97a3' }}>
        Select your date of birth. Only dates up to June 30, 2025 are available.
      </p>

      <div className="rounded-lg p-4" style={{ backgroundColor: '#121629', border: '1px solid #242a3d' }}>
        {/* Dropdowns row */}
        <div className="flex items-center gap-2 mb-3">
          <select
            value={viewYear}
            onChange={handleYearChange}
            className="rounded-md px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ backgroundColor: '#1e2340', color: '#e2e0e6', border: '1px solid #242a3d' }}
            aria-label="Select year"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={viewMonth}
            onChange={handleMonthChange}
            className="rounded-md px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ backgroundColor: '#1e2340', color: '#e2e0e6', border: '1px solid #242a3d' }}
            aria-label="Select month"
          >
            {availableMonths.map((name, i) => (
              <option key={i} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={handlePrev}
            className="w-7 h-7 flex items-center justify-center rounded-md text-sm font-bold transition-colors"
            style={{ color: '#e2e0e6', backgroundColor: '#1e2340' }}
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="text-sm font-semibold" style={{ color: '#e2e0e6', fontFamily: 'Georgia, serif' }}>
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext}
            className="w-7 h-7 flex items-center justify-center rounded-md text-sm font-bold transition-colors"
            style={{
              color: canGoNext ? '#e2e0e6' : '#4a4656',
              backgroundColor: canGoNext ? '#1e2340' : 'transparent',
              cursor: canGoNext ? 'pointer' : 'not-allowed',
            }}
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#7a7586' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} />;
            const iso = toISO(viewYear, viewMonth, day);
            const disabled = isDayDisabled(day);
            const selected = selectedDate === iso;
            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={() => handleDayClick(day)}
                className="h-8 w-full flex items-center justify-center text-sm rounded-md transition-colors"
                style={{
                  color: disabled ? '#3d384a' : selected ? '#ffffff' : '#d0cdd6',
                  backgroundColor: selected ? '#2563EB' : 'transparent',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontWeight: selected ? 600 : 400,
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Selected display */}
        {selectedDate && (
          <div className="mt-3 text-xs text-center" style={{ color: '#9b97a3' }}>
            Selected: <span style={{ color: '#e2e0e6', fontWeight: 600 }}>{selectedDate}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="mt-3 w-full py-2 rounded-md text-sm font-semibold transition-colors"
        style={{
          backgroundColor: selectedDate ? '#2563EB' : '#1e2340',
          color: selectedDate ? '#ffffff' : '#4a4656',
          cursor: selectedDate ? 'pointer' : 'not-allowed',
        }}
      >
        Submit Date of Birth
      </button>
    </div>
  );
}

/* ─── Page ─── */

export default function Page_user_registration(props: GeneratedPageProps) {
  const steps = ['Account', 'Personal Info', 'Verification', 'Review'];
  const currentStep = 1;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#070210', fontFamily: '"Segoe UI", Georgia, serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#0f041c', borderBottom: '1px solid #1e1a2e' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <span className="text-base font-bold" style={{ color: '#e2e0e6', fontFamily: 'Georgia, serif' }}>EchoID</span>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm" style={{ color: '#9b97a3' }}>
            {['Settings','Security','Plan','Help'].map(item => (
              <a key={item} href="#" className="hover:underline" style={{ color: '#9b97a3' }}>{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <a href="#" style={{ color: '#9b97a3' }} className="hover:underline">Help</a>
            <a href="#" style={{ color: '#9b97a3' }} className="hover:underline">Logout</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop"
          alt="Office workspace"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,2,16,0.5), #070210)' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold" style={{ color: '#ffffff', fontFamily: 'Georgia, serif' }}>Complete Your Profile</h1>
            <p className="text-sm mt-1" style={{ color: '#9b97a3' }}>Step 2 of 4 — Personal Information</p>
          </div>
        </div>
      </div>

      {/* Progress steps */}
      <div className="max-w-3xl mx-auto px-4 -mt-4 relative z-10">
        <div className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: '#120c24', border: '1px solid #242a3d' }}>
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: i < currentStep ? '#2563EB' : i === currentStep ? '#2563EB' : '#1e2340',
                  color: i <= currentStep ? '#fff' : '#4a4656',
                }}
              >
                {i < currentStep ? '✓' : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:inline" style={{ color: i <= currentStep ? '#e2e0e6' : '#4a4656' }}>{s}</span>
              {i < steps.length - 1 && (
                <div className="hidden sm:block w-8 h-px mx-1" style={{ backgroundColor: i < currentStep ? '#2563EB' : '#242a3d' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr' }}>

          {/* Form card */}
          <div className="rounded-lg p-5" style={{ backgroundColor: '#120c24', border: '1px solid #242a3d' }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: '#e2e0e6', fontFamily: 'Georgia, serif' }}>Personal Information</h2>
            <p className="text-xs mb-4" style={{ color: '#7a7586' }}>All fields marked with * are required for identity verification.</p>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#9b97a3' }}>First Name *</label>
                <input
                  type="text"
                  placeholder="John"
                  className="w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: '#1e2340', color: '#e2e0e6', border: '1px solid #242a3d' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#9b97a3' }}>Last Name *</label>
                <input
                  type="text"
                  placeholder="Doe"
                  className="w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: '#1e2340', color: '#e2e0e6', border: '1px solid #242a3d' }}
                />
              </div>
            </div>

            {/* Email / Phone */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#9b97a3' }}>Email *</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: '#1e2340', color: '#e2e0e6', border: '1px solid #242a3d' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#9b97a3' }}>Phone</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: '#1e2340', color: '#e2e0e6', border: '1px solid #242a3d' }}
                />
              </div>
            </div>

            {/* Address */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1" style={{ color: '#9b97a3' }}>Address</label>
              <input
                type="text"
                placeholder="Start typing to autocomplete..."
                className="w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: '#1e2340', color: '#e2e0e6', border: '1px solid #242a3d' }}
              />
            </div>

            {/* Date of Birth picker */}
            <div className="mb-4">
              <DOBPicker onSubmit={props.onSubmit} />
            </div>

            {/* Document upload */}
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1" style={{ color: '#9b97a3' }}>Upload ID Document</label>
              <div
                className="rounded-md p-4 flex flex-col items-center justify-center text-center"
                style={{ backgroundColor: '#1e2340', border: '2px dashed #242a3d' }}
              >
                <span className="text-2xl mb-1">📄</span>
                <p className="text-xs" style={{ color: '#7a7586' }}>Drag & drop or click to upload</p>
                <p className="text-xs mt-0.5" style={{ color: '#4a4656' }}>PDF, JPG, PNG up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Requirements & filters sidebar feel (rendered below on single col) */}
          <div className="rounded-lg p-4" style={{ backgroundColor: '#120c24', border: '1px solid #242a3d' }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: '#e2e0e6', fontFamily: 'Georgia, serif' }}>Requirements Checklist</h3>

            {/* Filters row */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {['All','Required','Optional'].map((f, i) => (
                <button
                  key={f}
                  type="button"
                  className="px-3 py-1 rounded-md text-xs font-medium"
                  style={{
                    backgroundColor: i === 0 ? '#2563EB' : '#1e2340',
                    color: i === 0 ? '#ffffff' : '#9b97a3',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Table */}
            <table className="w-full text-xs" style={{ color: '#9b97a3' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #242a3d' }}>
                  <th className="text-left py-1.5 font-medium" style={{ color: '#7a7586' }}>Document</th>
                  <th className="text-left py-1.5 font-medium" style={{ color: '#7a7586' }}>Status</th>
                  <th className="text-right py-1.5 font-medium" style={{ color: '#7a7586' }}>Required</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { doc: 'Government-issued ID', status: 'Pending', req: true },
                  { doc: 'Proof of Address', status: 'Not uploaded', req: true },
                  { doc: 'Profile Photo', status: 'Not uploaded', req: false },
                  { doc: 'Date of Birth', status: 'Pending selection', req: true },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e1a2e' }}>
                    <td className="py-1.5">{row.doc}</td>
                    <td className="py-1.5">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: row.status === 'Pending' ? '#1e2340' : row.status === 'Pending selection' ? '#1e2340' : '#120c24',
                          color: row.status.includes('Pending') ? '#f59e0b' : '#ef4444',
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-1.5 text-right">{row.req ? '✱' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Help card with images */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#120c24', border: '1px solid #242a3d' }}>
              <img
                src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop"
                alt="ID card and documents"
                className="w-full h-28 object-cover"
              />
              <div className="p-3">
                <p className="text-xs font-semibold" style={{ color: '#e2e0e6' }}>ID Verification Guide</p>
                <p className="text-xs mt-1" style={{ color: '#7a7586' }}>Learn which documents are accepted.</p>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#120c24', border: '1px solid #242a3d' }}>
              <img
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop"
                alt="Graduation cap representing education"
                className="w-full h-28 object-cover"
              />
              <div className="p-3">
                <p className="text-xs font-semibold" style={{ color: '#e2e0e6' }}>Why We Need Your DOB</p>
                <p className="text-xs mt-1" style={{ color: '#7a7586' }}>Used for age verification and compliance.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#0f041c', borderTop: '1px solid #1e1a2e' }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between text-xs" style={{ color: '#4a4656' }}>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Data Handling Notice</a>
              <a href="#" className="hover:underline">Contact Support</a>
              <a href="#" className="hover:underline">Accessibility</a>
            </div>
            <span>© 2025 EchoID. All rights reserved.</span>
          </div>
          <p className="text-xs mt-2" style={{ color: '#3d384a' }}>
            Your data is encrypted and stored securely. We comply with GDPR and CCPA regulations.
          </p>
        </div>
      </footer>
    </div>
  );
}
