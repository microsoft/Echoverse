import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function firstDayOfWeek(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}
function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function SingleDatePicker({
  minDate,
  maxDate,
  initialYear,
  initialMonth,
  selectedDate,
  onSelect,
  disabledDates,
  disabledWeekdays,
}: {
  minDate?: string;
  maxDate?: string;
  initialYear: number;
  initialMonth: number;
  selectedDate: string;
  onSelect: (iso: string) => void;
  disabledDates?: string[];
  disabledWeekdays?: number[];
}) {
  const [vY, setVY] = useState(initialYear);
  const [vM, setVM] = useState(initialMonth);

  const days = getDaysInMonth(vY, vM);
  const offset = firstDayOfWeek(vY, vM);

  const prev = () => { if (vM === 0) { setVM(11); setVY(vY - 1); } else setVM(vM - 1); };
  const next = () => { if (vM === 11) { setVM(0); setVY(vY + 1); } else setVM(vM + 1); };

  const isDisabled = (d: number) => {
    const iso = toISO(vY, vM, d);
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    if (disabledDates && disabledDates.includes(iso)) return true;
    if (disabledWeekdays && disabledWeekdays.length > 0) {
      const dow = new Date(vY, vM, d).getDay();
      if (disabledWeekdays.includes(dow)) return true;
    }
    return false;
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prev} className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 text-gray-600 text-sm" style={{ borderRadius: '0px' }}>◀</button>
        <span className="text-sm font-semibold" style={{ color: '#374151' }}>{MONTHS[vM]} {vY}</span>
        <button type="button" onClick={next} className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 text-gray-600 text-sm" style={{ borderRadius: '0px' }}>▶</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_SHORT.map(l => (
          <div key={l} className="text-center text-xs font-medium py-1" style={{ color: '#6b7280' }}>{l}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} className="h-8" />;
          const iso = toISO(vY, vM, day);
          const dis = isDisabled(day);
          const sel = iso === selectedDate;
          return (
            <button
              key={iso}
              type="button"
              disabled={dis}
              onClick={() => !dis && onSelect(iso)}
              className={`h-8 text-xs font-medium transition-colors ${
                dis ? 'text-gray-300 cursor-not-allowed' :
                sel ? 'text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
              style={{
                borderRadius: '0px',
                backgroundColor: sel ? '#2563EB' : undefined,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Page_library_card(props: GeneratedPageProps) {
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [compIssue, setCompIssue] = useState('');
  const [compExpiry, setCompExpiry] = useState('');

  const [activeStep] = useState(2);
  const steps = ['Personal Info', 'Contact', 'Library Card', 'Review'];

  const submitIssue = useCallback(() => {
    if (!issueDate) return;
    props.onSubmit({ type: 'date', value: issueDate, raw: { widget_id: 'issue_date', selectedDate: issueDate } });
  }, [issueDate, props.onSubmit]);

  const submitExpiry = useCallback(() => {
    if (!expiryDate) return;
    props.onSubmit({ type: 'date', value: expiryDate, raw: { widget_id: 'expiry_date', selectedDate: expiryDate } });
  }, [expiryDate, props.onSubmit]);

  const submitCompound = useCallback(() => {
    if (!compIssue && !compExpiry) return;
    const value = [compIssue, compExpiry].filter(Boolean).join('|');
    props.onSubmit({ type: 'date', value, raw: { widget_id: 'compound', issue_date: compIssue, expiry_date: compExpiry } });
  }, [compIssue, compExpiry, props.onSubmit]);

  const checkItems = useMemo(() => [
    { label: 'Photo ID uploaded', done: true },
    { label: 'Proof of address uploaded', done: true },
    { label: 'Issue date selected', done: !!issueDate },
    { label: 'Expiry date selected', done: !!expiryDate },
    { label: 'Application signed', done: false },
  ], [issueDate, expiryDate]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#eceaec', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <header style={{ backgroundColor: '#fffdff' }} className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <span className="font-semibold text-sm" style={{ color: '#374151' }}>EchoID</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-xs" style={{ color: '#374151' }}>
            <a href="#" className="hover:underline">Settings</a>
            <a href="#" className="hover:underline">Security</a>
            <a href="#" className="hover:underline">Plan</a>
            <a href="#" className="hover:underline">Help</a>
          </nav>
          <div className="flex items-center gap-4 text-xs" style={{ color: '#6b7280' }}>
            <span>support@myprofile.org</span>
            <button type="button" className="hover:underline">Logout</button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div style={{ backgroundColor: '#fcfafc' }} className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-2 text-xs" style={{ color: '#6b7280' }}>
          Dashboard &rsaquo; Profile &rsaquo; <span style={{ color: '#374151' }}>Library Card</span>
        </div>
      </div>

      {/* Hero */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop"
          alt="office workspace"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center" style={{ backgroundColor: 'rgba(55,65,81,0.55)' }}>
          <div className="max-w-6xl mx-auto px-6 w-full">
            <h1 className="text-white text-2xl font-semibold mb-1">Complete Your Library Card Profile</h1>
            <p className="text-white text-sm opacity-90">Fill in the required dates to finalize your library card application.</p>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div style={{ backgroundColor: '#fffdff' }} className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 flex items-center justify-center text-xs font-semibold"
                    style={{
                      borderRadius: '0px',
                      backgroundColor: i <= activeStep ? '#2563EB' : '#eceaec',
                      color: i <= activeStep ? '#fff' : '#6b7280',
                    }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs font-medium" style={{ color: i <= activeStep ? '#374151' : '#9ca3af' }}>{s}</span>
                </div>
                {i < steps.length - 1 && <div className="flex-1 h-px" style={{ backgroundColor: i < activeStep ? '#2563EB' : '#eceaec' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-medium" style={{ color: '#374151' }}>Filter:</span>
            {['All Fields', 'Required Only', 'Dates Only'].map((f, i) => (
              <button
                key={f}
                type="button"
                className="px-3 py-1 text-xs font-medium border"
                style={{
                  borderRadius: '0px',
                  backgroundColor: i === 2 ? '#2563EB' : '#fffdff',
                  color: i === 2 ? '#fff' : '#374151',
                  borderColor: i === 2 ? '#2563EB' : '#d1d5db',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left column — 2/3 */}
            <div className="lg:col-span-2 space-y-6">

              {/* Context card */}
              <div className="p-6" style={{ backgroundColor: '#fffdff', borderRadius: '0px' }}>
                <h2 className="text-base font-semibold mb-2" style={{ color: '#374151' }}>Library Card Application</h2>
                <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
                  To complete your library card registration, please provide the required dates below.
                  The issue date is when your card will be activated, and the expiry date determines how long
                  your borrowing privileges remain valid. Ensure all dates are correct before submitting.
                </p>
              </div>

              {/* Name / contact fields (decorative) */}
              <div className="p-6" style={{ backgroundColor: '#fffdff', borderRadius: '0px' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>Cardholder Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'First Name', ph: 'Jane' },
                    { label: 'Last Name', ph: 'Doe' },
                    { label: 'Email Address', ph: 'jane.doe@email.com' },
                    { label: 'Phone', ph: '(555) 123-4567' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>{f.label}</label>
                      <input
                        type="text"
                        placeholder={f.ph}
                        className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400"
                        style={{ borderRadius: '0px' }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Mailing Address</label>
                  <input
                    type="text"
                    placeholder="Start typing to autocomplete…"
                    className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400"
                    style={{ borderRadius: '0px' }}
                  />
                </div>
              </div>

              {/* Widget 1: Issue Date */}
              <div data-widget-id="issue_date" className="p-6" style={{ backgroundColor: '#fffdff', borderRadius: '0px' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-green-500 inline-block" style={{ borderRadius: '0px' }} />
                  <h3 className="font-semibold text-sm" style={{ color: '#374151' }}>Issue Date</h3>
                  <span className="text-xs px-2 py-0.5" style={{ backgroundColor: '#f8f5f8', color: '#374151', borderRadius: '0px' }}>Required</span>
                </div>
                <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                  Select the date your library card should be issued. All dates are available.
                </p>
                <div className="max-w-xs">
                  <SingleDatePicker
                    initialYear={2026}
                    initialMonth={0}
                    selectedDate={issueDate}
                    onSelect={setIssueDate}
                  />
                </div>
                {issueDate && <p className="mt-2 text-xs font-medium" style={{ color: '#2563EB' }}>Selected: {issueDate}</p>}
                <button
                  type="button"
                  onClick={submitIssue}
                  disabled={!issueDate}
                  className="mt-4 px-5 py-2 text-sm text-white transition-opacity"
                  style={{ backgroundColor: issueDate ? '#2563EB' : '#9ca3af', borderRadius: '0px' }}
                >
                  Submit Issue Date
                </button>
              </div>

              {/* Widget 2: Expiry Date */}
              <div data-widget-id="expiry_date" className="p-6" style={{ backgroundColor: '#fffdff', borderRadius: '0px' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-red-500 inline-block" style={{ borderRadius: '0px' }} />
                  <h3 className="font-semibold text-sm" style={{ color: '#374151' }}>Expiry Date</h3>
                  <span className="text-xs px-2 py-0.5" style={{ backgroundColor: '#f8f5f8', color: '#374151', borderRadius: '0px' }}>Required</span>
                </div>
                <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                  Select the expiry date for your library card. Only future dates (from September 2025 onwards) are selectable.
                </p>
                <div className="max-w-xs">
                  <SingleDatePicker
                    minDate="2025-09-01"
                    initialYear={2025}
                    initialMonth={8}
                    selectedDate={expiryDate}
                    onSelect={setExpiryDate}
                  />
                </div>
                {expiryDate && <p className="mt-2 text-xs font-medium" style={{ color: '#2563EB' }}>Selected: {expiryDate}</p>}
                <button
                  type="button"
                  onClick={submitExpiry}
                  disabled={!expiryDate}
                  className="mt-4 px-5 py-2 text-sm text-white transition-opacity"
                  style={{ backgroundColor: expiryDate ? '#2563EB' : '#9ca3af', borderRadius: '0px' }}
                >
                  Submit Expiry Date
                </button>
              </div>
            </div>

            {/* Right column — 1/3 */}
            <div className="space-y-6">

              {/* Document upload */}
              <div className="p-5" style={{ backgroundColor: '#fffdff', borderRadius: '0px' }}>
                <h3 className="font-semibold text-sm mb-3" style={{ color: '#374151' }}>Document Upload</h3>
                <img
                  src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop"
                  alt="id card on desk"
                  className="w-full h-32 object-cover mb-3"
                  style={{ borderRadius: '0px' }}
                />
                <div className="border-2 border-dashed border-gray-300 p-4 text-center" style={{ borderRadius: '0px' }}>
                  <p className="text-xs" style={{ color: '#6b7280' }}>Drop your ID scan here or click to upload</p>
                </div>
              </div>

              {/* Requirements checklist */}
              <div className="p-5" style={{ backgroundColor: '#fffdff', borderRadius: '0px' }}>
                <h3 className="font-semibold text-sm mb-3" style={{ color: '#374151' }}>Requirements Checklist</h3>
                <ul className="space-y-2">
                  {checkItems.map(item => (
                    <li key={item.label} className="flex items-center gap-2 text-xs" style={{ color: '#374151' }}>
                      <span style={{ color: item.done ? '#16a34a' : '#d1d5db' }}>{item.done ? '✓' : '○'}</span>
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Help tip */}
              <div className="p-4" style={{ backgroundColor: '#f9f7f9', borderRadius: '0px' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#374151' }}>💡 Need Help?</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  Contact our support team at support@myprofile.org or call 1-800-555-0142.
                </p>
              </div>

              {/* Card image */}
              <div className="overflow-hidden" style={{ borderRadius: '0px' }}>
                <img
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop"
                  alt="graduation ceremony"
                  className="w-full h-32 object-cover"
                />
                <div className="p-3" style={{ backgroundColor: '#fffdff' }}>
                  <p className="text-xs" style={{ color: '#374151' }}>Complete your profile to unlock full borrowing privileges.</p>
                </div>
              </div>

              {/* Widget 3: Compound */}
              <div data-widget-id="compound" className="p-5" style={{ backgroundColor: '#fffdff', borderRadius: '0px' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-orange-500 inline-block" style={{ borderRadius: '0px' }} />
                  <h3 className="font-semibold text-sm" style={{ color: '#374151' }}>Issue Date + Expiry Date</h3>
                </div>
                <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                  Verify both the issue date and expiry date together in one combined step.
                </p>

                {/* Sub-picker A: Issue Date (no constraints) */}
                <div className="mb-5">
                  <p className="text-xs font-medium mb-2" style={{ color: '#374151' }}>Issue Date</p>
                  <SingleDatePicker
                    initialYear={2025}
                    initialMonth={5}
                    selectedDate={compIssue}
                    onSelect={setCompIssue}
                  />
                  {compIssue && <p className="mt-1 text-xs" style={{ color: '#2563EB' }}>Selected: {compIssue}</p>}
                </div>

                {/* Sub-picker B: Expiry Date (future only) */}
                <div className="mb-4">
                  <p className="text-xs font-medium mb-2" style={{ color: '#374151' }}>Expiry Date</p>
                  <SingleDatePicker
                    minDate="2025-09-01"
                    initialYear={2025}
                    initialMonth={5}
                    selectedDate={compExpiry}
                    onSelect={setCompExpiry}
                  />
                  {compExpiry && <p className="mt-1 text-xs" style={{ color: '#2563EB' }}>Selected: {compExpiry}</p>}
                </div>

                <button
                  type="button"
                  onClick={submitCompound}
                  disabled={!compIssue && !compExpiry}
                  className="w-full px-5 py-2 text-sm text-white transition-opacity"
                  style={{ backgroundColor: (compIssue || compExpiry) ? '#2563EB' : '#9ca3af', borderRadius: '0px' }}
                >
                  Submit Combined Dates
                </button>
              </div>

              {/* Document status */}
              <div className="p-5" style={{ backgroundColor: '#fffdff', borderRadius: '0px' }}>
                <h3 className="font-semibold text-sm mb-3" style={{ color: '#374151' }}>Document Status</h3>
                {[
                  { label: 'Photo ID', status: 'Verified', color: '#16a34a' },
                  { label: 'Proof of Address', status: 'Pending', color: '#d97706' },
                  { label: 'Library Card Form', status: 'Incomplete', color: '#dc2626' },
                ].map(d => (
                  <div key={d.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-xs" style={{ color: '#374151' }}>{d.label}</span>
                    <span className="text-xs font-medium" style={{ color: d.color }}>{d.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#fffdff' }} className="border-t border-gray-200 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-wrap justify-between text-xs" style={{ color: '#6b7280' }}>
            <div className="space-x-4">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Data Handling Notice</a>
              <a href="#" className="hover:underline">Contact Support</a>
              <a href="#" className="hover:underline">Accessibility Statement</a>
            </div>
            <p>© 2026 EchoID. All rights reserved.</p>
          </div>
          <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
            Your data is encrypted and handled in accordance with applicable privacy regulations.
          </p>
        </div>
      </footer>
    </div>
  );
}
