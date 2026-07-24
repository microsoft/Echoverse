import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTH_SHORT = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];

function pad(n: number) { return n < 10 ? '0' + n : '' + n; }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const HOLIDAYS = new Set(['2025-01-01','2025-07-04','2025-12-25','2025-11-28']);

function isWeekend(dayOfWeek: number) { return dayOfWeek === 0 || dayOfWeek === 6; }

/* ───────── Widget 1: Constrained Date Calendar ───────── */
function RenewalDatePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(9); // October = index 9
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo(() => {
    const total = getDaysInMonth(year, month);
    const first = getFirstDayOfWeek(year, month);
    const cells: Array<{ day: number; iso: string; disabled: boolean } | null> = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= total; d++) {
      const iso = toISO(year, month, d);
      const dow = new Date(year, month, d).getDay();
      const disabled = isWeekend(dow) || HOLIDAYS.has(iso);
      cells.push({ day: d, iso, disabled });
    }
    return cells;
  }, [year, month]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div data-widget-id="renewal_date" style={{ background: '#fcfdfc', borderRadius: 0 }} className="p-5">
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#374151' }}>Renewal Date</h3>
      <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
        Select an available business day for your passport renewal appointment.
      </p>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="px-2 py-1 text-sm font-medium" style={{ color: '#2563EB' }} aria-label="Previous month">← Prev</button>
        <span className="font-medium" style={{ color: '#374151' }}>{MONTH_NAMES[month]} {year}</span>
        <button onClick={next} className="px-2 py-1 text-sm font-medium" style={{ color: '#2563EB' }} aria-label="Next month">Next →</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
        {DAYS.map(d => <div key={d} className="py-1">{d}</div>)}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 text-center text-sm">
        {days.map((cell, i) => {
          if (!cell) return <div key={'e' + i} />;
          const isSelected = selected === cell.iso;
          return (
            <button
              key={cell.iso}
              disabled={cell.disabled}
              onClick={() => setSelected(cell.iso)}
              className={
                'py-1.5 m-0.5 transition-colors ' +
                (cell.disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSelected
                    ? 'font-semibold'
                    : 'hover:opacity-80 cursor-pointer')
              }
              style={
                isSelected
                  ? { background: '#2563EB', color: '#fff', borderRadius: 0 }
                  : cell.disabled
                    ? {}
                    : { color: '#374151' }
              }
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {selected && (
        <p className="mt-3 text-sm" style={{ color: '#374151' }}>
          Selected: <span className="font-medium">{selected}</span>
        </p>
      )}

      <button
        disabled={!selected}
        onClick={() => {
          if (selected) {
            onSubmit({
              type: 'date',
              value: selected,
              raw: { widget_id: 'renewal_date', year, month: month + 1, selected },
            });
          }
        }}
        className="mt-4 w-full py-2 text-sm font-medium transition-colors"
        style={{
          background: selected ? '#2563EB' : '#e7e8eb',
          color: selected ? '#fff' : '#9ca3af',
          borderRadius: 0,
          cursor: selected ? 'pointer' : 'not-allowed',
        }}
      >
        Submit Renewal Date
      </button>
    </div>
  );
}

/* ───────── Widget 2: Month/Year Selector ───────── */
function IssueMonthPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const maxYear = 2025;
  const maxMonth = 9; // October index (0-based)

  const isDisabled = useCallback((m: number) => {
    if (year > maxYear) return true;
    if (year === maxYear && m > maxMonth) return true;
    return false;
  }, [year]);

  const handleSelect = (m: number) => {
    if (isDisabled(m)) return;
    setSelectedMonth(m);
    setSelectedYear(year);
  };

  const selectedLabel = selectedMonth !== null && selectedYear !== null
    ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
    : null;
  const selectedValue = selectedMonth !== null && selectedYear !== null
    ? `${selectedYear}-${pad(selectedMonth + 1)}`
    : null;

  return (
    <div data-widget-id="issue_month" style={{ background: '#fcfdfc', borderRadius: 0 }} className="p-5">
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#374151' }}>Issue Month</h3>
      <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
        Select the month and year your current passport was issued.
      </p>

      {/* Year nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setYear(y => y - 1)} className="px-2 py-1 text-sm font-medium" style={{ color: '#2563EB' }} aria-label="Previous year">← Prev</button>
        <span className="font-medium" style={{ color: '#374151' }}>{year}</span>
        <button
          onClick={() => { if (year < maxYear) setYear(y => y + 1); }}
          className="px-2 py-1 text-sm font-medium"
          style={{ color: year >= maxYear ? '#9ca3af' : '#2563EB' }}
          disabled={year >= maxYear}
          aria-label="Next year"
        >
          Next →
        </button>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 gap-2">
        {MONTH_SHORT.map((label, idx) => {
          const disabled = isDisabled(idx);
          const active = selectedMonth === idx && selectedYear === year;
          return (
            <button
              key={label}
              disabled={disabled}
              onClick={() => handleSelect(idx)}
              className={
                'py-2 text-sm transition-colors ' +
                (disabled ? 'text-gray-300 cursor-not-allowed' : active ? 'font-semibold' : 'hover:opacity-80 cursor-pointer')
              }
              style={
                active
                  ? { background: '#2563EB', color: '#fff', borderRadius: 0 }
                  : disabled
                    ? { background: '#f6f7f7', borderRadius: 0 }
                    : { background: '#ecedf0', color: '#374151', borderRadius: 0 }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {selectedLabel && (
        <p className="mt-3 text-sm" style={{ color: '#374151' }}>
          Selected: <span className="font-medium">{selectedLabel}</span>
        </p>
      )}

      <button
        disabled={!selectedValue}
        onClick={() => {
          if (selectedValue && selectedMonth !== null && selectedYear !== null) {
            onSubmit({
              type: 'month_year',
              value: selectedValue,
              raw: { widget_id: 'issue_month', year: selectedYear, month: selectedMonth + 1 },
            });
          }
        }}
        className="mt-4 w-full py-2 text-sm font-medium transition-colors"
        style={{
          background: selectedValue ? '#2563EB' : '#e7e8eb',
          color: selectedValue ? '#fff' : '#9ca3af',
          borderRadius: 0,
          cursor: selectedValue ? 'pointer' : 'not-allowed',
        }}
      >
        Submit Issue Month
      </button>
    </div>
  );
}

/* ───────── Widget 3: Compound Date Calendar ───────── */
function CompoundPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // June = index 5
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo(() => {
    const total = getDaysInMonth(year, month);
    const first = getFirstDayOfWeek(year, month);
    const cells: Array<{ day: number; iso: string; disabled: boolean } | null> = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= total; d++) {
      const iso = toISO(year, month, d);
      const dow = new Date(year, month, d).getDay();
      const disabled = isWeekend(dow) || HOLIDAYS.has(iso);
      cells.push({ day: d, iso, disabled });
    }
    return cells;
  }, [year, month]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div data-widget-id="compound" style={{ background: '#fcfdfc', borderRadius: 0 }} className="p-5">
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#374151' }}>Renewal Date + Issue Month</h3>
      <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
        Select a date from the calendar below. Weekends and holidays are unavailable.
      </p>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="px-2 py-1 text-sm font-medium" style={{ color: '#2563EB' }} aria-label="Previous month">← Prev</button>
        <span className="font-medium" style={{ color: '#374151' }}>{MONTH_NAMES[month]} {year}</span>
        <button onClick={next} className="px-2 py-1 text-sm font-medium" style={{ color: '#2563EB' }} aria-label="Next month">Next →</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
        {DAYS.map(d => <div key={d} className="py-1">{d}</div>)}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 text-center text-sm">
        {days.map((cell, i) => {
          if (!cell) return <div key={'e' + i} />;
          const isSelected = selected === cell.iso;
          return (
            <button
              key={cell.iso}
              disabled={cell.disabled}
              onClick={() => setSelected(cell.iso)}
              className={
                'py-1.5 m-0.5 transition-colors ' +
                (cell.disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSelected
                    ? 'font-semibold'
                    : 'hover:opacity-80 cursor-pointer')
              }
              style={
                isSelected
                  ? { background: '#2563EB', color: '#fff', borderRadius: 0 }
                  : cell.disabled
                    ? {}
                    : { color: '#374151' }
              }
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {selected && (
        <p className="mt-3 text-sm" style={{ color: '#374151' }}>
          Selected: <span className="font-medium">{selected}</span>
        </p>
      )}

      <button
        disabled={!selected}
        onClick={() => {
          if (selected) {
            onSubmit({
              type: 'date',
              value: selected,
              raw: { widget_id: 'compound', year, month: month + 1, selected },
            });
          }
        }}
        className="mt-4 w-full py-2 text-sm font-medium transition-colors"
        style={{
          background: selected ? '#2563EB' : '#e7e8eb',
          color: selected ? '#fff' : '#9ca3af',
          borderRadius: 0,
          cursor: selected ? 'pointer' : 'not-allowed',
        }}
      >
        Submit Date
      </button>
    </div>
  );
}

/* ───────── Main Page ───────── */
export default function Page_passport_renewal(props: GeneratedPageProps) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { key: 'all', label: 'All Fields' },
    { key: 'dates', label: 'Date Selection' },
    { key: 'docs', label: 'Documents' },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background: '#dedee5' }}>
      {/* ── Header ── */}
      <header style={{ background: '#fcfdfc', borderBottom: '1px solid #e7e8eb' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <span className="font-semibold" style={{ color: '#374151' }}>EchoID</span>
          </div>
          <nav className="hidden sm:flex items-center gap-5 text-sm" style={{ color: '#6b7280' }}>
            <a href="#" className="hover:opacity-70">Settings</a>
            <a href="#" className="hover:opacity-70">Security</a>
            <a href="#" className="hover:opacity-70">Plan</a>
            <a href="#" className="hover:opacity-70">Help</a>
          </nav>
          <div className="flex items-center gap-3 text-sm" style={{ color: '#6b7280' }}>
            <span className="hidden sm:inline">Help</span>
            <button className="hover:opacity-70">Logout</button>
          </div>
        </div>
      </header>

      {/* ── Breadcrumb ── */}
      <div style={{ background: '#f6f7f7', borderBottom: '1px solid #e7e8eb' }}>
        <div className="max-w-5xl mx-auto px-4 py-2 text-xs" style={{ color: '#6b7280' }}>
          Profile → Documents → <span style={{ color: '#374151' }}>Passport Renewal</span>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop"
          alt="Professional office workspace"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'rgba(55,65,81,0.55)' }} />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-4 w-full">
            <h1 className="text-2xl font-semibold text-white">Passport Renewal</h1>
            <p className="text-sm text-gray-200 mt-1">Complete your profile to schedule a passport renewal appointment</p>
          </div>
        </div>
      </div>

      {/* ── Progress ── */}
      <div style={{ background: '#fcfdfc', borderBottom: '1px solid #e7e8eb' }}>
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: '#6b7280' }}>
            <span className="flex items-center gap-1"><span className="w-5 h-5 flex items-center justify-center text-white text-xs" style={{ background: '#2563EB', borderRadius: 0 }}>✓</span> Personal Info</span>
            <span style={{ color: '#dedee5' }}>—</span>
            <span className="flex items-center gap-1"><span className="w-5 h-5 flex items-center justify-center text-white text-xs" style={{ background: '#2563EB', borderRadius: 0 }}>2</span> Date Selection</span>
            <span style={{ color: '#dedee5' }}>—</span>
            <span className="flex items-center gap-1"><span className="w-5 h-5 flex items-center justify-center text-xs" style={{ background: '#e7e8eb', color: '#9ca3af', borderRadius: 0 }}>3</span> Review</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column - main content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Filters */}
            <div className="flex gap-2">
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className="px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: activeFilter === f.key ? '#2563EB' : '#ecedf0',
                    color: activeFilter === f.key ? '#fff' : '#374151',
                    borderRadius: 0,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Context */}
            <div style={{ background: '#fcfdfc', borderRadius: 0, border: '1px solid #e7e8eb' }} className="p-5">
              <h2 className="text-base font-semibold mb-2" style={{ color: '#374151' }}>Complete Your Profile</h2>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                To process your passport renewal, we need a few key dates. Please select your preferred
                renewal appointment date, the month your current passport was issued, and confirm
                the combined date for verification purposes.
              </p>
            </div>

            {/* Widget 1 */}
            <div style={{ border: '1px solid #e7e8eb', borderRadius: 0 }}>
              <RenewalDatePicker onSubmit={props.onSubmit} />
            </div>

            {/* Widget 2 */}
            <div style={{ border: '1px solid #e7e8eb', borderRadius: 0 }}>
              <IssueMonthPicker onSubmit={props.onSubmit} />
            </div>

            {/* Widget 3 */}
            <div style={{ border: '1px solid #e7e8eb', borderRadius: 0 }}>
              <CompoundPicker onSubmit={props.onSubmit} />
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Requirements */}
            <div style={{ background: '#fcfdfc', border: '1px solid #e7e8eb', borderRadius: 0 }} className="p-4">
              <h4 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Requirements Checklist</h4>
              <ul className="space-y-2 text-xs" style={{ color: '#6b7280' }}>
                <li className="flex items-start gap-2"><span style={{ color: '#2563EB' }}>✓</span> Valid government-issued ID</li>
                <li className="flex items-start gap-2"><span style={{ color: '#2563EB' }}>✓</span> Current passport (original)</li>
                <li className="flex items-start gap-2"><span style={{ color: '#9ca3af' }}>○</span> Renewal date selected</li>
                <li className="flex items-start gap-2"><span style={{ color: '#9ca3af' }}>○</span> Issue month confirmed</li>
                <li className="flex items-start gap-2"><span style={{ color: '#9ca3af' }}>○</span> Passport-size photo uploaded</li>
              </ul>
            </div>

            {/* Document status */}
            <div style={{ background: '#fcfdfc', border: '1px solid #e7e8eb', borderRadius: 0 }} className="p-4">
              <h4 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Document Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: '#6b7280' }}>Photo ID</span>
                  <span className="px-2 py-0.5" style={{ background: '#dcfce7', color: '#166534', borderRadius: 0 }}>Verified</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: '#6b7280' }}>Passport Copy</span>
                  <span className="px-2 py-0.5" style={{ background: '#fef9c3', color: '#854d0e', borderRadius: 0 }}>Pending</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: '#6b7280' }}>Passport Photo</span>
                  <span className="px-2 py-0.5" style={{ background: '#ecedf0', color: '#6b7280', borderRadius: 0 }}>Not uploaded</span>
                </div>
              </div>
            </div>

            {/* Help card with image */}
            <div style={{ background: '#fcfdfc', border: '1px solid #e7e8eb', borderRadius: 0 }} className="overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop"
                alt="ID card and documents"
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <h4 className="text-sm font-semibold mb-1" style={{ color: '#374151' }}>Need Help?</h4>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  Visit your nearest passport office or call our support line for assistance with your renewal application.
                </p>
              </div>
            </div>

            {/* Upload area */}
            <div
              style={{ background: '#f6f7f7', border: '2px dashed #e7e8eb', borderRadius: 0 }}
              className="p-5 text-center"
            >
              <p className="text-xs" style={{ color: '#9ca3af' }}>📎 Drag &amp; drop your passport photo here or click to browse</p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: '#fcfdfc', borderTop: '1px solid #e7e8eb' }} className="mt-8">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs" style={{ color: '#9ca3af' }}>
            <div className="flex gap-4">
              <a href="#" className="hover:opacity-70">Privacy Policy</a>
              <a href="#" className="hover:opacity-70">Data Handling Notice</a>
              <a href="#" className="hover:opacity-70">Contact Support</a>
              <a href="#" className="hover:opacity-70">Accessibility</a>
            </div>
            <span>© 2025 EchoID. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
