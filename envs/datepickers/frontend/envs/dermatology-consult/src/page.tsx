import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

function startDayOffset(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}

/* ─── Widget 1: Consultation Date (single_date, specific_disabled) ─── */

const CONSULT_DISABLED = new Set([
  '2025-07-17','2025-07-19','2025-07-20','2025-07-22',
  '2025-07-24','2025-07-30','2025-08-03','2025-08-06','2025-08-11',
]);

function ConsultDatePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(6); // July = index 6
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo(() => daysInMonth(year, month), [year, month]);
  const offset = useMemo(() => startDayOffset(year, month), [year, month]);

  const prev = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);
  const next = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit({
      type: 'date',
      value: selected,
      raw: { widget_id: 'consult_date', selected_date: selected, year, month: month + 1 },
    });
  };

  return (
    <div data-widget-id="consult_date" className="rounded" style={{ background: '#fafbfd', border: '1px solid #d8e1e9' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #eef1f6' }}>
        <h3 className="text-lg font-semibold" style={{ color: '#134E4A' }}>Consultation Date</h3>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Select a date for your dermatology consultation. Grayed-out dates are unavailable.</p>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="px-3 py-1 rounded text-sm font-medium" style={{ background: '#eef1f6', color: '#134E4A' }}>←</button>
          <span className="font-semibold" style={{ color: '#134E4A' }}>{MONTHS[month]} {year}</span>
          <button onClick={next} className="px-3 py-1 rounded text-sm font-medium" style={{ background: '#eef1f6', color: '#134E4A' }}>→</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-2" style={{ color: '#6b7280' }}>
          {DAYS.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const d = i + 1;
            const iso = toISO(year, month, d);
            const disabled = CONSULT_DISABLED.has(iso);
            const isSelected = selected === iso;
            return (
              <button
                key={d}
                disabled={disabled}
                onClick={() => !disabled && setSelected(iso)}
                className={`py-2 rounded text-sm ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:opacity-80'}`}
                style={{
                  background: isSelected ? '#0D9488' : disabled ? '#d8e1e9' : '#f6f7fb',
                  color: isSelected ? '#fff' : disabled ? '#9ca3af' : '#134E4A',
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
        {selected && <p className="mt-3 text-sm" style={{ color: '#0D9488' }}>Selected: {selected}</p>}
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="mt-4 w-full py-2 rounded text-sm font-semibold text-white"
          style={{ background: selected ? '#0D9488' : '#9ca3af', cursor: selected ? 'pointer' : 'not-allowed' }}
        >
          Confirm Consultation Date
        </button>
      </div>
    </div>
  );
}

/* ─── Widget 2: Follow-up Window (range, future_only min 2025-08-01) ─── */

function FollowupRangePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(7); // August = index 7
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const minDate = '2025-08-01';

  const days = useMemo(() => daysInMonth(year, month), [year, month]);
  const offset = useMemo(() => startDayOffset(year, month), [year, month]);

  const prev = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);
  const next = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const handleDayClick = (iso: string) => {
    if (!rangeStart || rangeEnd) {
      setRangeStart(iso);
      setRangeEnd(null);
    } else {
      if (iso < rangeStart) {
        setRangeStart(iso);
        setRangeEnd(null);
      } else {
        setRangeEnd(iso);
      }
    }
  };

  const isInRange = (iso: string) => {
    if (!rangeStart) return false;
    if (rangeEnd) return iso >= rangeStart && iso <= rangeEnd;
    return iso === rangeStart;
  };

  const handleSubmit = () => {
    if (!rangeStart || !rangeEnd) return;
    const value = `${rangeStart}/${rangeEnd}`;
    onSubmit({
      type: 'date_range',
      value,
      raw: { widget_id: 'followup_range', start: rangeStart, end: rangeEnd, year, month: month + 1 },
    });
  };

  return (
    <div data-widget-id="followup_range" className="rounded" style={{ background: '#fafbfd', border: '1px solid #d8e1e9' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #eef1f6' }}>
        <h3 className="text-lg font-semibold" style={{ color: '#134E4A' }}>Follow-up Window</h3>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Select a date range for your follow-up visit window. Click a start date, then an end date.</p>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="px-3 py-1 rounded text-sm font-medium" style={{ background: '#eef1f6', color: '#134E4A' }}>←</button>
          <span className="font-semibold" style={{ color: '#134E4A' }}>{MONTHS[month]} {year}</span>
          <button onClick={next} className="px-3 py-1 rounded text-sm font-medium" style={{ background: '#eef1f6', color: '#134E4A' }}>→</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-2" style={{ color: '#6b7280' }}>
          {DAYS.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const d = i + 1;
            const iso = toISO(year, month, d);
            const pastDisabled = iso < minDate;
            const inRange = isInRange(iso);
            const isStart = iso === rangeStart;
            const isEnd = iso === rangeEnd;
            return (
              <button
                key={d}
                disabled={pastDisabled}
                onClick={() => !pastDisabled && handleDayClick(iso)}
                className={`py-2 rounded text-sm ${pastDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:opacity-80'}`}
                style={{
                  background: isStart || isEnd ? '#0D9488' : inRange ? '#CCFBF1' : pastDisabled ? '#d8e1e9' : '#f6f7fb',
                  color: isStart || isEnd ? '#fff' : pastDisabled ? '#9ca3af' : '#134E4A',
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
        <div className="mt-3 text-sm" style={{ color: '#0D9488' }}>
          {rangeStart && <span>Start: {rangeStart}</span>}
          {rangeEnd && <span className="ml-4">End: {rangeEnd}</span>}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!rangeStart || !rangeEnd}
          className="mt-4 w-full py-2 rounded text-sm font-semibold text-white"
          style={{ background: rangeStart && rangeEnd ? '#0D9488' : '#9ca3af', cursor: rangeStart && rangeEnd ? 'pointer' : 'not-allowed' }}
        >
          Confirm Follow-up Window
        </button>
      </div>
    </div>
  );
}

/* ─── Widget 3: Compound — single_date + range (specific_disabled + future_only) ─── */

const COMPOUND_DISABLED = new Set([
  '2025-06-04','2025-06-09','2025-06-14','2025-06-15',
  '2025-06-16','2025-06-24','2025-06-27',
]);

function CompoundPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // June = index 5
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo(() => daysInMonth(year, month), [year, month]);
  const offset = useMemo(() => startDayOffset(year, month), [year, month]);

  const prev = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);
  const next = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit({
      type: 'date',
      value: selected,
      raw: { widget_id: 'compound', selected_date: selected, year, month: month + 1 },
    });
  };

  return (
    <div data-widget-id="compound" className="rounded" style={{ background: '#fafbfd', border: '1px solid #d8e1e9' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #eef1f6' }}>
        <h3 className="text-lg font-semibold" style={{ color: '#134E4A' }}>Consultation Date + Follow-up Window</h3>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Select a date from the calendar. Grayed-out dates are unavailable.</p>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="px-3 py-1 rounded text-sm font-medium" style={{ background: '#eef1f6', color: '#134E4A' }}>←</button>
          <span className="font-semibold" style={{ color: '#134E4A' }}>{MONTHS[month]} {year}</span>
          <button onClick={next} className="px-3 py-1 rounded text-sm font-medium" style={{ background: '#eef1f6', color: '#134E4A' }}>→</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-2" style={{ color: '#6b7280' }}>
          {DAYS.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const d = i + 1;
            const iso = toISO(year, month, d);
            const disabled = COMPOUND_DISABLED.has(iso);
            const isSelected = selected === iso;
            return (
              <button
                key={d}
                disabled={disabled}
                onClick={() => !disabled && setSelected(iso)}
                className={`py-2 rounded text-sm ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:opacity-80'}`}
                style={{
                  background: isSelected ? '#0D9488' : disabled ? '#d8e1e9' : '#f6f7fb',
                  color: isSelected ? '#fff' : disabled ? '#9ca3af' : '#134E4A',
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
        {selected && <p className="mt-3 text-sm" style={{ color: '#0D9488' }}>Selected: {selected}</p>}
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="mt-4 w-full py-2 rounded text-sm font-semibold text-white"
          style={{ background: selected ? '#0D9488' : '#9ca3af', cursor: selected ? 'pointer' : 'not-allowed' }}
        >
          Confirm Date Selection
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function Page_dermatology_consult(props: GeneratedPageProps) {
  const [visitType, setVisitType] = useState('in-person');
  const [insurance, setInsurance] = useState('');

  return (
    <div className="min-h-screen" style={{ background: '#d8e1e9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#fafbfd', borderBottom: '1px solid #d8e1e9' }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏥</span>
              <span className="text-lg font-semibold" style={{ color: '#134E4A' }}>EchoMed</span>
            </div>
            <nav className="hidden md:flex items-center gap-5 text-sm" style={{ color: '#134E4A' }}>
              <a href="#" className="font-medium" style={{ color: '#0D9488' }}>Book</a>
              <a href="#" className="hover:opacity-70">Records</a>
              <a href="#" className="hover:opacity-70">Prescriptions</a>
              <a href="#" className="hover:opacity-70">Help</a>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden sm:inline" style={{ color: '#6b7280' }}>Emergency: <strong style={{ color: '#134E4A' }}>1-800-555-0199</strong></span>
            <button className="px-4 py-1.5 rounded text-sm font-medium text-white" style={{ background: '#0D9488' }}>Patient Portal</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=400&fit=crop"
          alt="Clinic interior"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center" style={{ background: 'rgba(13,148,136,0.55)' }}>
          <div className="max-w-6xl mx-auto px-6">
            <h1 className="text-3xl font-bold text-white">Dermatology Consultation</h1>
            <p className="text-white text-sm mt-1 opacity-90">Book your appointment with our board-certified dermatologists</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Doctor card + filters row */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Doctor profile */}
          <div className="rounded" style={{ background: '#fafbfd', border: '1px solid #eef1f6' }}>
            <img
              src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=300&fit=crop"
              alt="Dr. Sarah Mitchell"
              className="w-full h-48 object-cover rounded-t"
            />
            <div className="p-4">
              <h3 className="font-semibold" style={{ color: '#134E4A' }}>Dr. Sarah Mitchell, MD, FAAD</h3>
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Board-Certified Dermatologist · 14 yrs experience</p>
              <p className="text-xs mt-2" style={{ color: '#6b7280' }}>Specializing in medical and cosmetic dermatology, skin cancer screening, acne management, and eczema treatment.</p>
              <div className="flex items-center gap-1 mt-3">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className="text-sm" style={{ color: s <= 4 ? '#0D9488' : '#d8e1e9' }}>★</span>
                ))}
                <span className="text-xs ml-1" style={{ color: '#6b7280' }}>4.8 (312 reviews)</span>
              </div>
            </div>
          </div>

          {/* Filters / form context */}
          <div className="md:col-span-2 rounded p-6" style={{ background: '#fafbfd', border: '1px solid #eef1f6' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#134E4A' }}>Appointment Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Visit Type</label>
                <select
                  value={visitType}
                  onChange={e => setVisitType(e.target.value)}
                  className="w-full px-3 py-2 rounded text-sm"
                  style={{ background: '#f6f7fb', border: '1px solid #d8e1e9', color: '#134E4A' }}
                >
                  <option value="in-person">In-Person Visit</option>
                  <option value="telehealth">Telehealth / Video</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Insurance Provider</label>
                <select
                  value={insurance}
                  onChange={e => setInsurance(e.target.value)}
                  className="w-full px-3 py-2 rounded text-sm"
                  style={{ background: '#f6f7fb', border: '1px solid #d8e1e9', color: '#134E4A' }}
                >
                  <option value="">Select insurance…</option>
                  <option value="aetna">EchoCare</option>
                  <option value="bcbs">EchoBlue</option>
                  <option value="cigna">EchoHealth</option>
                  <option value="united">EchoShield</option>
                  <option value="medicare">Medicare</option>
                  <option value="self">Self-Pay</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Reason for Visit</label>
                <textarea
                  placeholder="Describe your symptoms or concern…"
                  rows={2}
                  className="w-full px-3 py-2 rounded text-sm resize-none"
                  style={{ background: '#f6f7fb', border: '1px solid #d8e1e9', color: '#134E4A' }}
                />
              </div>
            </div>
            <div className="mt-4 p-3 rounded text-xs" style={{ background: '#F0FDFA', color: '#134E4A' }}>
              <strong>Office Location:</strong> 450 Medical Center Dr, Suite 210 · Mon–Fri 8am–5pm · Accepts most major insurance plans
            </div>
          </div>
        </div>

        {/* Widget Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-1" style={{ color: '#134E4A' }}>Select Your Dates</h2>
          <p className="text-sm mb-6" style={{ color: '#6b7280' }}>Choose from the calendars below. Each section handles a different part of your scheduling.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <ConsultDatePicker onSubmit={props.onSubmit} />
          <FollowupRangePicker onSubmit={props.onSubmit} />
          <CompoundPicker onSubmit={props.onSubmit} />
        </div>

        {/* Supporting content */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="rounded p-5" style={{ background: '#fafbfd', border: '1px solid #eef1f6' }}>
            <img
              src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop"
              alt="Stethoscope and medical equipment"
              className="w-full h-48 object-cover rounded mb-3"
            />
            <h4 className="font-semibold text-sm" style={{ color: '#134E4A' }}>Credentials & Certifications</h4>
            <ul className="text-xs mt-2 space-y-1" style={{ color: '#6b7280' }}>
              <li>• American Board of Dermatology</li>
              <li>• Fellow, American Academy of Dermatology</li>
              <li>• Harvard Medical School, MD 2011</li>
              <li>• NYU Dermatology Residency</li>
            </ul>
          </div>
          <div className="rounded p-5" style={{ background: '#fafbfd', border: '1px solid #eef1f6' }}>
            <h4 className="font-semibold text-sm mb-3" style={{ color: '#134E4A' }}>Patient Reviews</h4>
            {[
              { name: 'M. Torres', text: 'Dr. Mitchell was incredibly thorough. She took time to explain my treatment options.', rating: 5 },
              { name: 'K. Patel', text: 'Very professional and the office staff is friendly. Minimal wait time.', rating: 5 },
              { name: 'R. Chen', text: 'Great telehealth experience. She followed up promptly with my lab results.', rating: 4 },
            ].map((r, i) => (
              <div key={i} className="mb-3 pb-3" style={{ borderBottom: i < 2 ? '1px solid #eef1f6' : 'none' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: '#134E4A' }}>{r.name}</span>
                  <span className="text-xs" style={{ color: '#0D9488' }}>{'★'.repeat(r.rating)}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{r.text}</p>
              </div>
            ))}
          </div>
          <div className="rounded p-5" style={{ background: '#fafbfd', border: '1px solid #eef1f6' }}>
            <h4 className="font-semibold text-sm mb-3" style={{ color: '#134E4A' }}>Accepted Insurance</h4>
            <div className="flex flex-wrap gap-2">
              {['EchoCare','EchoBlue','EchoHealth','EchoShield','Medicare','EchoWell','Tricare','Oxford'].map(ins => (
                <span key={ins} className="px-2 py-1 rounded text-xs" style={{ background: '#f3f3f6', color: '#134E4A' }}>{ins}</span>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-sm mb-2" style={{ color: '#134E4A' }}>Office Hours</h4>
              <div className="text-xs space-y-1" style={{ color: '#6b7280' }}>
                <p>Mon – Fri: 8:00 AM – 5:00 PM</p>
                <p>Saturday: 9:00 AM – 1:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#fafbfd', borderTop: '1px solid #d8e1e9' }}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid sm:grid-cols-3 gap-4 text-xs" style={{ color: '#6b7280' }}>
            <div>
              <p className="font-semibold mb-1" style={{ color: '#134E4A' }}>EchoMed Dermatology</p>
              <p>450 Medical Center Dr, Suite 210</p>
              <p>San Francisco, CA 94102</p>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: '#134E4A' }}>Legal</p>
              <p>HIPAA Notice of Privacy Practices</p>
              <p>Terms of Service · Privacy Policy</p>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: '#134E4A' }}>Emergency</p>
              <p>If you are experiencing a medical emergency, call 911 immediately. This portal is not for emergencies.</p>
            </div>
          </div>
          <p className="text-xs mt-4 text-center" style={{ color: '#9ca3af' }}>© 2025 EchoMed Dermatology. All rights reserved. HIPAA-compliant platform.</p>
        </div>
      </footer>
    </div>
  );
}
