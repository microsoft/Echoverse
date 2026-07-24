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

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function getDaysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

function getFirstDayOfWeek(y: number, m: number): number {
  return new Date(y, m, 1).getDay();
}

/* ─── Range Picker (Widget 1) ─── */
function RangePicker({
  widgetId,
  label,
  description,
  initYear,
  initMonth,
  disabledWeekdays,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  description: string;
  initYear: number;
  initMonth: number;
  disabledWeekdays: number[];
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);

  const prev = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const next = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const isDisabled = (day: number) => {
    const dow = new Date(year, month, day).getDay();
    return disabledWeekdays.includes(dow);
  };

  const inRange = (iso: string) => {
    if (!startDate) return false;
    const end = endDate || hover;
    if (!end) return iso === startDate;
    const lo = startDate < end ? startDate : end;
    const hi = startDate < end ? end : startDate;
    return iso >= lo && iso <= hi;
  };

  const handleClick = (day: number) => {
    if (isDisabled(day)) return;
    const iso = toISO(year, month, day);
    if (!startDate || endDate) {
      setStartDate(iso);
      setEndDate(null);
    } else {
      if (iso < startDate) { setEndDate(startDate); setStartDate(iso); }
      else setEndDate(iso);
    }
  };

  const handleSubmit = () => {
    if (!startDate || !endDate) return;
    onSubmit({
      type: 'date_range',
      value: `${startDate}/${endDate}`,
      raw: { widget_id: widgetId, start: startDate, end: endDate },
    });
  };

  return (
    <div data-widget-id={widgetId} className="rounded-none p-6" style={{ backgroundColor: '#ffffff' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#374151' }}>{label}</h3>
      <p className="text-sm mb-4" style={{ color: '#6B7280' }}>{description}</p>

      <div className="inline-block rounded-none border" style={{ borderColor: '#dce1e7', backgroundColor: '#fefefd' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #dce1e7' }}>
          <button onClick={prev} className="px-2 py-1 text-sm font-medium rounded-none hover:opacity-70" style={{ color: '#374151' }} aria-label="Previous month">◀</button>
          <span className="text-sm font-semibold" style={{ color: '#374151' }}>{MONTHS[month]} {year}</span>
          <button onClick={next} className="px-2 py-1 text-sm font-medium rounded-none hover:opacity-70" style={{ color: '#374151' }} aria-label="Next month">▶</button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-medium px-2 pt-2 pb-1" style={{ color: '#6B7280' }}>
          {DAYS.map(d => <div key={d} className="py-1">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 text-center text-sm px-2 pb-3 gap-y-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const iso = toISO(year, month, day);
            const disabled = isDisabled(day);
            const selected = iso === startDate || iso === endDate;
            const range = inRange(iso);

            return (
              <button
                key={day}
                disabled={disabled}
                onClick={() => handleClick(day)}
                onMouseEnter={() => { if (!disabled && startDate && !endDate) setHover(iso); }}
                onMouseLeave={() => setHover(null)}
                className={`w-9 h-9 mx-auto flex items-center justify-center text-sm rounded-none transition-colors
                  ${disabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer hover:opacity-80'}
                  ${selected ? 'font-bold' : ''}
                  ${range && !selected ? '' : ''}
                `}
                style={{
                  backgroundColor: selected ? '#2563EB' : range ? '#DBEAFE' : 'transparent',
                  color: disabled ? '#9CA3AF' : selected ? '#ffffff' : '#374151',
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 text-xs" style={{ color: '#6B7280' }}>
        {startDate && !endDate && <span>Start: {startDate} — click an end date</span>}
        {startDate && endDate && <span>Range: {startDate} → {endDate}</span>}
        {!startDate && <span>Click a weekday to start your range</span>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!startDate || !endDate}
        className="mt-4 px-5 py-2 text-sm font-medium rounded-none text-white transition-opacity disabled:opacity-40"
        style={{ backgroundColor: '#2563EB' }}
      >
        Submit Available Dates
      </button>
    </div>
  );
}

/* ─── Constrained Picker (Widget 2) ─── */
function ConstrainedPicker({
  widgetId,
  label,
  description,
  initYear,
  initMonth,
  disabledDates,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  description: string;
  initYear: number;
  initMonth: number;
  disabledDates: Set<string>;
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);

  const prev = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const next = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const handleClick = (day: number) => {
    const iso = toISO(year, month, day);
    if (disabledDates.has(iso)) return;
    setSelected(iso);
  };

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit({
      type: 'date',
      value: selected,
      raw: { widget_id: widgetId, selected_date: selected },
    });
  };

  return (
    <div data-widget-id={widgetId} className="rounded-none p-6" style={{ backgroundColor: '#ffffff' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#374151' }}>{label}</h3>
      <p className="text-sm mb-4" style={{ color: '#6B7280' }}>{description}</p>

      <div className="inline-block rounded-none border" style={{ borderColor: '#dce1e7', backgroundColor: '#fefefd' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #dce1e7' }}>
          <button onClick={prev} className="px-2 py-1 text-sm font-medium rounded-none hover:opacity-70" style={{ color: '#374151' }} aria-label="Previous month">◀</button>
          <span className="text-sm font-semibold" style={{ color: '#374151' }}>{MONTHS[month]} {year}</span>
          <button onClick={next} className="px-2 py-1 text-sm font-medium rounded-none hover:opacity-70" style={{ color: '#374151' }} aria-label="Next month">▶</button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-medium px-2 pt-2 pb-1" style={{ color: '#6B7280' }}>
          {DAYS.map(d => <div key={d} className="py-1">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 text-center text-sm px-2 pb-3 gap-y-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const iso = toISO(year, month, day);
            const disabled = disabledDates.has(iso);
            const isSel = iso === selected;

            return (
              <button
                key={day}
                disabled={disabled}
                onClick={() => handleClick(day)}
                className={`w-9 h-9 mx-auto flex items-center justify-center text-sm rounded-none transition-colors
                  ${disabled ? 'cursor-not-allowed line-through opacity-30' : 'cursor-pointer hover:opacity-80'}
                  ${isSel ? 'font-bold' : ''}
                `}
                style={{
                  backgroundColor: isSel ? '#2563EB' : 'transparent',
                  color: disabled ? '#9CA3AF' : isSel ? '#ffffff' : '#374151',
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 text-xs" style={{ color: '#6B7280' }}>
        {selected ? <span>Selected: {selected}</span> : <span>Pick an available date</span>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="mt-4 px-5 py-2 text-sm font-medium rounded-none text-white transition-opacity disabled:opacity-40"
        style={{ backgroundColor: '#2563EB' }}
      >
        Submit Background Check Date
      </button>
    </div>
  );
}

/* ─── Compound Picker (Widget 3) ─── */
function CompoundPicker({
  widgetId,
  label,
  description,
  initYear,
  initMonth,
  disabledWeekdays,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  description: string;
  initYear: number;
  initMonth: number;
  disabledWeekdays: number[];
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);

  const prev = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const next = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const isDisabled = (day: number) => {
    const dow = new Date(year, month, day).getDay();
    return disabledWeekdays.includes(dow);
  };

  const handleClick = (day: number) => {
    if (isDisabled(day)) return;
    setSelected(toISO(year, month, day));
  };

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit({
      type: 'date',
      value: selected,
      raw: { widget_id: widgetId, selected_date: selected },
    });
  };

  return (
    <div data-widget-id={widgetId} className="rounded-none p-6" style={{ backgroundColor: '#ffffff' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#374151' }}>{label}</h3>
      <p className="text-sm mb-4" style={{ color: '#6B7280' }}>{description}</p>

      <div className="inline-block rounded-none border" style={{ borderColor: '#dce1e7', backgroundColor: '#fefefd' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #dce1e7' }}>
          <button onClick={prev} className="px-2 py-1 text-sm font-medium rounded-none hover:opacity-70" style={{ color: '#374151' }} aria-label="Previous month">◀</button>
          <span className="text-sm font-semibold" style={{ color: '#374151' }}>{MONTHS[month]} {year}</span>
          <button onClick={next} className="px-2 py-1 text-sm font-medium rounded-none hover:opacity-70" style={{ color: '#374151' }} aria-label="Next month">▶</button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-medium px-2 pt-2 pb-1" style={{ color: '#6B7280' }}>
          {DAYS.map(d => <div key={d} className="py-1">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 text-center text-sm px-2 pb-3 gap-y-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const iso = toISO(year, month, day);
            const disabled = isDisabled(day);
            const isSel = iso === selected;

            return (
              <button
                key={day}
                disabled={disabled}
                onClick={() => handleClick(day)}
                className={`w-9 h-9 mx-auto flex items-center justify-center text-sm rounded-none transition-colors
                  ${disabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer hover:opacity-80'}
                  ${isSel ? 'font-bold' : ''}
                `}
                style={{
                  backgroundColor: isSel ? '#2563EB' : 'transparent',
                  color: disabled ? '#9CA3AF' : isSel ? '#ffffff' : '#374151',
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 text-xs" style={{ color: '#6B7280' }}>
        {selected ? <span>Selected: {selected}</span> : <span>Pick a weekday</span>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="mt-4 px-5 py-2 text-sm font-medium rounded-none text-white transition-opacity disabled:opacity-40"
        style={{ backgroundColor: '#2563EB' }}
      >
        Submit Compound Date
      </button>
    </div>
  );
}

/* ─── Disabled dates set for Widget 2 ─── */
const DISABLED_DATES_W2 = new Set([
  '2025-10-14','2025-10-17','2025-10-25','2025-10-29','2025-10-30','2025-10-31',
  '2025-11-05','2025-11-08','2025-11-09','2025-11-12',
]);

/* ═══ MAIN PAGE ═══ */
export default function Page_volunteer_signup(props: GeneratedPageProps) {
  const steps = ['Personal Info', 'Availability', 'Background Check', 'Review'];
  const activeStep = 1;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#dce1e7', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <header className="w-full" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #dce1e7' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👤</span>
            <span className="text-base font-semibold" style={{ color: '#374151' }}>EchoID</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: '#6B7280' }}>
            <a href="#" className="hover:opacity-70">Settings</a>
            <a href="#" className="hover:opacity-70">Security</a>
            <a href="#" className="hover:opacity-70">Plan</a>
            <a href="#" className="hover:opacity-70">Help</a>
          </nav>
          <div className="flex items-center gap-4 text-sm" style={{ color: '#6B7280' }}>
            <span className="hidden sm:inline">support@myprofile.org</span>
            <button className="hover:opacity-70">Logout</button>
          </div>
        </div>
      </header>

      {/* ── Breadcrumb ── */}
      <div className="max-w-6xl mx-auto w-full px-6 py-3 text-xs" style={{ color: '#6B7280' }}>
        Dashboard &rsaquo; Volunteer Signup &rsaquo; <span style={{ color: '#374151' }}>Availability</span>
      </div>

      {/* ── Hero ── */}
      <div className="max-w-6xl mx-auto w-full px-6">
        <div className="relative rounded-none overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop"
            alt="Volunteer workspace"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 flex items-end" style={{ background: 'linear-gradient(transparent 30%, rgba(55,65,81,0.7))' }}>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-white">Complete Your Volunteer Profile</h1>
              <p className="text-sm text-white/80 mt-1">
                Tell us when you're available and schedule your background check.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress Steps ── */}
      <div className="max-w-6xl mx-auto w-full px-6 mt-6">
        <div className="flex items-center gap-0 rounded-none p-4" style={{ backgroundColor: '#ffffff' }}>
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full"
                  style={{
                    backgroundColor: i <= activeStep ? '#2563EB' : '#E5E7EB',
                    color: i <= activeStep ? '#ffffff' : '#9CA3AF',
                  }}
                >
                  {i < activeStep ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium whitespace-nowrap" style={{ color: i <= activeStep ? '#374151' : '#9CA3AF' }}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px mx-3" style={{ backgroundColor: i < activeStep ? '#2563EB' : '#E5E7EB' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="max-w-6xl mx-auto w-full px-6 mt-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column: datepickers */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Filter bar */}
            <div className="flex items-center gap-3 rounded-none p-3" style={{ backgroundColor: '#f8f8f8', border: '1px solid #dce1e7' }}>
              <span className="text-xs font-medium" style={{ color: '#374151' }}>Filter:</span>
              <span className="text-xs px-3 py-1 rounded-none" style={{ backgroundColor: '#2563EB', color: '#ffffff' }}>All Sections</span>
              <span className="text-xs px-3 py-1 rounded-none cursor-pointer hover:opacity-70" style={{ backgroundColor: '#ffffff', color: '#6B7280', border: '1px solid #dce1e7' }}>Pending Only</span>
              <span className="text-xs px-3 py-1 rounded-none cursor-pointer hover:opacity-70" style={{ backgroundColor: '#ffffff', color: '#6B7280', border: '1px solid #dce1e7' }}>Completed</span>
            </div>

            {/* Widget 1 — Range */}
            <RangePicker
              widgetId="available_dates"
              label="Available Dates"
              description="Select the date range when you're available to volunteer. Only weekdays (Mon–Fri) are selectable."
              initYear={2025}
              initMonth={6}
              disabledWeekdays={[0, 6]}
              onSubmit={props.onSubmit}
            />

            {/* Widget 2 — Constrained */}
            <ConstrainedPicker
              widgetId="background_check_date"
              label="Background Check Date"
              description="Choose a date for your background check appointment. Grayed-out dates are unavailable."
              initYear={2025}
              initMonth={9}
              disabledDates={DISABLED_DATES_W2}
              onSubmit={props.onSubmit}
            />

            {/* Widget 3 — Compound */}
            <CompoundPicker
              widgetId="compound"
              label="Available Dates + Background Check Date"
              description="Select a single weekday that works for both your availability and background check."
              initYear={2025}
              initMonth={5}
              disabledWeekdays={[0, 6]}
              onSubmit={props.onSubmit}
            />
          </div>

          {/* Right sidebar */}
          <aside className="flex flex-col gap-6">

            {/* Profile summary card */}
            <div className="rounded-none p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #dce1e7' }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Profile Summary</h4>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>V</div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#374151' }}>Volunteer Applicant</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Application in progress</p>
                </div>
              </div>
              <div className="space-y-2 text-xs" style={{ color: '#6B7280' }}>
                <div className="flex justify-between"><span>Name</span><span style={{ color: '#374151' }}>—</span></div>
                <div className="flex justify-between"><span>Email</span><span style={{ color: '#374151' }}>—</span></div>
                <div className="flex justify-between"><span>Phone</span><span style={{ color: '#374151' }}>—</span></div>
              </div>
            </div>

            {/* Requirements checklist */}
            <div className="rounded-none p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #dce1e7' }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Requirements Checklist</h4>
              <ul className="space-y-2 text-xs" style={{ color: '#6B7280' }}>
                {[
                  { label: 'Personal information', done: true },
                  { label: 'Available dates selected', done: false },
                  { label: 'Background check scheduled', done: false },
                  { label: 'ID document uploaded', done: false },
                  { label: 'Review & confirm', done: false },
                ].map(item => (
                  <li key={item.label} className="flex items-center gap-2">
                    <span className="w-4 h-4 flex items-center justify-center rounded-full text-[10px]"
                      style={{ backgroundColor: item.done ? '#2563EB' : '#E5E7EB', color: item.done ? '#fff' : '#9CA3AF' }}>
                      {item.done ? '✓' : ''}
                    </span>
                    <span style={{ color: item.done ? '#374151' : undefined }}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Document upload placeholder */}
            <div className="rounded-none p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #dce1e7' }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Document Upload</h4>
              <img
                src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop"
                alt="ID card document"
                className="w-full h-32 object-cover rounded-none mb-3"
              />
              <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Upload a government-issued photo ID for verification.</p>
              <div className="border-2 border-dashed rounded-none p-4 flex flex-col items-center gap-1" style={{ borderColor: '#dce1e7' }}>
                <span className="text-lg">📄</span>
                <span className="text-xs" style={{ color: '#6B7280' }}>Drag & drop or click to upload</span>
              </div>
            </div>

            {/* Help tooltip card */}
            <div className="rounded-none p-5" style={{ backgroundColor: '#fbfbfb', border: '1px solid #dce1e7' }}>
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#374151' }}>💡 Need Help?</h4>
              <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                Select your preferred dates using the calendars on the left. Grayed-out dates are not available.
                Background checks typically take 3–5 business days to process.
              </p>
            </div>

            {/* Team image */}
            <div className="rounded-none overflow-hidden" style={{ border: '1px solid #dce1e7' }}>
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop"
                alt="Volunteer team meeting"
                className="w-full h-40 object-cover"
              />
              <div className="p-3" style={{ backgroundColor: '#ffffff' }}>
                <p className="text-xs" style={{ color: '#6B7280' }}>Join our growing team of 500+ volunteers across 12 locations.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-10" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #dce1e7' }}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs" style={{ color: '#6B7280' }}>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:opacity-70">Privacy Policy</a>
            <a href="#" className="hover:opacity-70">Data Handling Notice</a>
            <a href="#" className="hover:opacity-70">Accessibility</a>
            <a href="#" className="hover:opacity-70">Contact Support</a>
          </div>
          <span>© 2025 EchoID. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
