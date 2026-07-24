import React, { useState } from 'react';

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

/* ─── Single-date calendar ─── */
function SingleDatePicker({
  minDate,
  maxDate,
  initialYear,
  initialMonth,
  selectedDate,
  onSelect,
}: {
  minDate?: string;
  maxDate?: string;
  initialYear: number;
  initialMonth: number;
  selectedDate: string;
  onSelect: (iso: string) => void;
}) {
  const [vY, setVY] = useState(initialYear);
  const [vM, setVM] = useState(initialMonth);

  const days = getDaysInMonth(vY, vM);
  const offset = firstDayOfWeek(vY, vM);

  const prev = () => { if (vM === 0) { setVM(11); setVY(vY - 1); } else setVM(vM - 1); };
  const next = () => { if (vM === 11) { setVM(0); setVY(vY + 1); } else setVM(vM + 1); };

  const disabled = (d: number) => {
    const iso = toISO(vY, vM, d);
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    return false;
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prev} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 text-sm">◀</button>
        <span className="text-sm font-semibold" style={{ color: '#374151' }}>{MONTHS[vM]} {vY}</span>
        <button type="button" onClick={next} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 text-sm">▶</button>
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
          const dis = disabled(day);
          const sel = iso === selectedDate;
          return (
            <button
              key={iso}
              type="button"
              disabled={dis}
              onClick={() => onSelect(iso)}
              className={`h-8 text-sm rounded transition-colors ${
                dis ? 'text-gray-300 cursor-not-allowed'
                : sel ? 'text-white font-semibold' : 'hover:bg-blue-50 text-gray-700'
              }`}
              style={sel ? { backgroundColor: '#2563EB', borderRadius: '4px' } : { borderRadius: '4px' }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── DOB picker with year/month dropdowns ─── */
function DOBPicker({
  minDate,
  maxDate,
  yearMin,
  yearMax,
  initialYear,
  initialMonth,
  selectedDate,
  onSelect,
}: {
  minDate?: string;
  maxDate?: string;
  yearMin: number;
  yearMax: number;
  initialYear: number;
  initialMonth: number;
  selectedDate: string;
  onSelect: (iso: string) => void;
}) {
  const [vY, setVY] = useState(initialYear);
  const [vM, setVM] = useState(initialMonth);

  const days = getDaysInMonth(vY, vM);
  const offset = firstDayOfWeek(vY, vM);

  const disabled = (d: number) => {
    const iso = toISO(vY, vM, d);
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    return false;
  };

  const years: number[] = [];
  for (let y = yearMin; y <= yearMax; y++) years.push(y);

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const prev = () => { if (vM === 0) { setVM(11); setVY(vY - 1); } else setVM(vM - 1); };
  const next = () => { if (vM === 11) { setVM(0); setVY(vY + 1); } else setVM(vM + 1); };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <select
          value={vY}
          onChange={e => setVY(Number(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          style={{ color: '#374151', borderRadius: '4px' }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={vM}
          onChange={e => setVM(Number(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white flex-1"
          style={{ color: '#374151', borderRadius: '4px' }}
        >
          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
      </div>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prev} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 text-sm">◀</button>
        <span className="text-sm font-semibold" style={{ color: '#374151' }}>{MONTHS[vM]} {vY}</span>
        <button type="button" onClick={next} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 text-sm">▶</button>
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
          const dis = disabled(day);
          const sel = iso === selectedDate;
          return (
            <button
              key={iso}
              type="button"
              disabled={dis}
              onClick={() => onSelect(iso)}
              className={`h-8 text-sm rounded transition-colors ${
                dis ? 'text-gray-300 cursor-not-allowed'
                : sel ? 'text-white font-semibold' : 'hover:bg-blue-50 text-gray-700'
              }`}
              style={sel ? { backgroundColor: '#2563EB', borderRadius: '4px' } : { borderRadius: '4px' }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
export default function Page_driver_license(props: GeneratedPageProps) {
  const [licenseDate, setLicenseDate] = useState('');
  const [dobDate, setDobDate] = useState('');
  const [compLicense, setCompLicense] = useState('');
  const [compDob, setCompDob] = useState('');

  const submitLicense = () => {
    if (!licenseDate) return;
    props.onSubmit({ type: 'date', value: licenseDate, raw: { widget_id: 'license_expiry', selectedDate: licenseDate } });
  };
  const submitDob = () => {
    if (!dobDate) return;
    props.onSubmit({ type: 'dob', value: dobDate, raw: { widget_id: 'applicant_dob', selectedDate: dobDate } });
  };
  const submitCompound = () => {
    if (!compLicense && !compDob) return;
    props.onSubmit({
      type: 'date',
      value: compLicense || compDob,
      raw: { widget_id: 'compound', licenseExpiry: compLicense, applicantDob: compDob },
    });
  };

  const checkItems = [
    { label: 'Full name provided', done: true },
    { label: 'License expiry selected', done: !!licenseDate },
    { label: 'Date of birth selected', done: !!dobDate },
    { label: 'Document uploaded', done: false },
    { label: 'Address verified', done: false },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#9393d6', fontFamily: 'sans-serif' }}>
      {/* ── Header ── */}
      <header style={{ backgroundColor: '#fdfdfd' }} className="shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👤</span>
            <span className="text-lg font-semibold" style={{ color: '#374151' }}>EchoID</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: '#374151' }}>
            <span className="cursor-pointer hover:underline">Settings</span>
            <span className="cursor-pointer hover:underline">Security</span>
            <span className="cursor-pointer hover:underline">Plan</span>
            <span className="cursor-pointer hover:underline">Help</span>
          </nav>
          <div className="flex items-center gap-4 text-sm">
            <span style={{ color: '#374151' }} className="cursor-pointer hover:underline">Help</span>
            <button className="px-3 py-1 rounded text-white text-sm" style={{ backgroundColor: '#2563EB', borderRadius: '4px' }}>Logout</button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop"
          alt="office workspace"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="text-center text-white px-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Complete Your Driver License Profile</h1>
            <p className="text-sm opacity-90 mb-3">Step 2 of 4 — Personal Details &amp; Dates</p>
            <div className="w-56 mx-auto rounded-full h-2" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
              <div className="h-2 rounded-full" style={{ width: '50%', backgroundColor: '#2563EB' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div style={{ backgroundColor: '#f8fafb' }} className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-2 text-xs" style={{ color: '#374151' }}>
          Home / Profile / Driver License Application
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left column ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Context card */}
              <div className="rounded p-5" style={{ backgroundColor: '#fdfdfd', borderRadius: '4px' }}>
                <h2 className="text-lg font-semibold mb-1" style={{ color: '#374151' }}>Driver License Application</h2>
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  Please complete all required date fields below to continue processing your driver license application.
                  Ensure your license expiry date and date of birth are accurate as they appear on your official documents.
                </p>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                {['All Fields', 'Required', 'Optional'].map((f, i) => (
                  <button
                    key={f}
                    type="button"
                    className="px-4 py-1.5 text-sm"
                    style={{
                      backgroundColor: i === 0 ? '#2563EB' : '#f2f3f4',
                      color: i === 0 ? '#fff' : '#374151',
                      borderRadius: '4px',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Basic form fields */}
              <div className="rounded p-5 grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ backgroundColor: '#fdfdfd', borderRadius: '4px' }}>
                {[
                  { label: 'Full Name', ph: 'Jane Doe', type: 'text' },
                  { label: 'Email Address', ph: 'jane@example.com', type: 'email' },
                  { label: 'Phone', ph: '+1 (555) 123-4567', type: 'tel' },
                  { label: 'License Number', ph: 'DL-12345678', type: 'text' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.ph}
                      className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400"
                      style={{ borderRadius: '4px' }}
                    />
                  </div>
                ))}
              </div>

              {/* ─── Widget 1: License Expiry Date ─── */}
              <div data-widget-id="license_expiry" className="rounded p-5" style={{ backgroundColor: '#fdfdfd', borderRadius: '4px' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  <h3 className="font-semibold text-sm" style={{ color: '#374151' }}>License Expiry Date</h3>
                  <span className="text-xs px-2 py-0.5" style={{ backgroundColor: '#f2f3f4', color: '#374151', borderRadius: '4px' }}>Required</span>
                </div>
                <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                  Select the expiry date printed on your driver license. Only future dates are available.
                </p>
                <div className="max-w-xs">
                  <SingleDatePicker
                    minDate="2025-06-01"
                    initialYear={2025}
                    initialMonth={5}
                    selectedDate={licenseDate}
                    onSelect={setLicenseDate}
                  />
                </div>
                {licenseDate && <p className="mt-2 text-xs font-medium" style={{ color: '#2563EB' }}>Selected: {licenseDate}</p>}
                <button
                  type="button"
                  onClick={submitLicense}
                  disabled={!licenseDate}
                  className="mt-4 px-5 py-2 text-sm text-white transition-opacity"
                  style={{ backgroundColor: licenseDate ? '#2563EB' : '#9ca3af', borderRadius: '4px' }}
                >
                  Submit License Expiry
                </button>
              </div>

              {/* ─── Widget 2: Applicant DOB ─── */}
              <div data-widget-id="applicant_dob" className="rounded p-5" style={{ backgroundColor: '#fdfdfd', borderRadius: '4px' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  <h3 className="font-semibold text-sm" style={{ color: '#374151' }}>Applicant Date of Birth</h3>
                  <span className="text-xs px-2 py-0.5" style={{ backgroundColor: '#f2f3f4', color: '#374151', borderRadius: '4px' }}>Required</span>
                </div>
                <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                  Use the year and month dropdowns to navigate, then select your date of birth.
                  Valid range: June 23, 1983 – October 4, 1983.
                </p>
                <div className="max-w-xs">
                  <DOBPicker
                    minDate="1983-06-23"
                    maxDate="1983-10-04"
                    yearMin={1950}
                    yearMax={2015}
                    initialYear={1983}
                    initialMonth={5}
                    selectedDate={dobDate}
                    onSelect={setDobDate}
                  />
                </div>
                {dobDate && <p className="mt-2 text-xs font-medium" style={{ color: '#2563EB' }}>Selected: {dobDate}</p>}
                <button
                  type="button"
                  onClick={submitDob}
                  disabled={!dobDate}
                  className="mt-4 px-5 py-2 text-sm text-white transition-opacity"
                  style={{ backgroundColor: dobDate ? '#2563EB' : '#9ca3af', borderRadius: '4px' }}
                >
                  Submit Date of Birth
                </button>
              </div>
            </div>

            {/* ── Right column ── */}
            <div className="space-y-6">

              {/* Document upload */}
              <div className="rounded p-5" style={{ backgroundColor: '#fdfdfd', borderRadius: '4px' }}>
                <h3 className="font-semibold text-sm mb-3" style={{ color: '#374151' }}>Document Upload</h3>
                <img
                  src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop"
                  alt="id card on desk"
                  className="w-full h-32 object-cover mb-3"
                  style={{ borderRadius: '4px' }}
                />
                <div className="border-2 border-dashed border-gray-300 p-4 text-center" style={{ borderRadius: '4px' }}>
                  <p className="text-xs" style={{ color: '#6b7280' }}>Drop your license scan here or click to upload</p>
                </div>
              </div>

              {/* Requirements checklist */}
              <div className="rounded p-5" style={{ backgroundColor: '#fdfdfd', borderRadius: '4px' }}>
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
              <div className="rounded p-4" style={{ backgroundColor: '#f7f8f9', borderRadius: '4px' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#374151' }}>💡 Need Help?</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  Contact our support team at support@myprofile.gov or call 1-800-555-0199.
                </p>
              </div>

              {/* Credential card */}
              <div className="rounded overflow-hidden" style={{ borderRadius: '4px' }}>
                <img
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop"
                  alt="graduation ceremony"
                  className="w-full h-32 object-cover"
                />
                <div className="p-3" style={{ backgroundColor: '#fdfdfd' }}>
                  <p className="text-xs" style={{ color: '#374151' }}>Verify your credentials to unlock all profile features.</p>
                </div>
              </div>

              {/* ─── Widget 3: Compound ─── */}
              <div data-widget-id="compound" className="rounded p-5" style={{ backgroundColor: '#fdfdfd', borderRadius: '4px' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                  <h3 className="font-semibold text-sm" style={{ color: '#374151' }}>Combined Verification</h3>
                </div>
                <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                  Verify both your license expiry and date of birth in one step.
                </p>

                {/* Sub-picker A: license expiry */}
                <div className="mb-5">
                  <p className="text-xs font-medium mb-2" style={{ color: '#374151' }}>License Expiry Date</p>
                  <SingleDatePicker
                    minDate="2025-06-01"
                    initialYear={2025}
                    initialMonth={5}
                    selectedDate={compLicense}
                    onSelect={setCompLicense}
                  />
                  {compLicense && <p className="mt-1 text-xs" style={{ color: '#2563EB' }}>Selected: {compLicense}</p>}
                </div>

                {/* Sub-picker B: DOB */}
                <div className="mb-4">
                  <p className="text-xs font-medium mb-2" style={{ color: '#374151' }}>Applicant Date of Birth</p>
                  <DOBPicker
                    minDate="1983-06-23"
                    maxDate="1983-10-04"
                    yearMin={1950}
                    yearMax={2015}
                    initialYear={1983}
                    initialMonth={5}
                    selectedDate={compDob}
                    onSelect={setCompDob}
                  />
                  {compDob && <p className="mt-1 text-xs" style={{ color: '#2563EB' }}>Selected: {compDob}</p>}
                </div>

                <button
                  type="button"
                  onClick={submitCompound}
                  disabled={!compLicense && !compDob}
                  className="w-full px-5 py-2 text-sm text-white transition-opacity"
                  style={{ backgroundColor: (compLicense || compDob) ? '#2563EB' : '#9ca3af', borderRadius: '4px' }}
                >
                  Submit Combined Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: '#fdfdfd' }} className="border-t border-gray-200 mt-auto">
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
            Your data is encrypted and handled in accordance with federal privacy regulations.
          </p>
        </div>
      </footer>
    </div>
  );
}
