import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function pad(n: number) { return n < 10 ? '0' + n : '' + n; }

function toISO(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getStartDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function isBefore(dateStr: string, refStr: string) {
  return dateStr < refStr;
}

function isAfter(dateStr: string, refStr: string) {
  return dateStr > refStr;
}

function todayISO() {
  const now = new Date(2025, 0, 1);
  return toISO(now.getFullYear(), now.getMonth(), now.getDate());
}

// ─── Widget 1: Reservation Date & Time ─────────────────────────────────────────
function ReservationDateTimePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(11); // December (0-indexed)
  const [selected, setSelected] = useState<string | null>(null);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('PM');

  const today = todayISO();
  const minDate = '2025-12-01';

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const startDay = useMemo(() => getStartDayOfWeek(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const isDisabled = useCallback((day: number) => {
    const iso = toISO(year, month, day);
    if (isBefore(iso, minDate)) return true;
    if (isBefore(iso, today)) return true;
    return false;
  }, [year, month, today]);

  const handleSelect = useCallback((day: number) => {
    if (isDisabled(day)) return;
    setSelected(toISO(year, month, day));
  }, [year, month, isDisabled]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    let h24 = hour;
    if (ampm === 'PM' && hour !== 12) h24 = hour + 12;
    if (ampm === 'AM' && hour === 12) h24 = 0;
    const timeStr = `${pad(h24)}:${pad(minute)}:00`;
    const datetimeStr = `${selected}T${timeStr}`;
    onSubmit({
      type: 'datetime',
      value: datetimeStr,
      raw: { widget_id: 'reservation_datetime', date: selected, hour, minute, ampm, datetime: datetimeStr },
    });
  }, [selected, hour, minute, ampm, onSubmit]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDay; i++) cells.push(<div key={`e-${i}`} />);
  for (let d = 1; d <= days; d++) {
    const iso = toISO(year, month, d);
    const disabled = isDisabled(d);
    const isSel = selected === iso;
    cells.push(
      <button
        key={d}
        type="button"
        disabled={disabled}
        onClick={() => handleSelect(d)}
        className={`h-9 w-full text-sm transition-colors ${
          disabled
            ? 'text-gray-400 cursor-not-allowed opacity-40'
            : isSel
              ? 'text-white font-semibold'
              : 'text-gray-700 hover:bg-gray-200'
        }`}
        style={{
          borderRadius: '4px',
          backgroundColor: isSel ? '#0D9488' : 'transparent',
        }}
      >
        {d}
      </button>
    );
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 15, 30, 45];

  return (
    <div data-widget-id="reservation_datetime" className="w-full" style={{ backgroundColor: '#f8f9f9', borderRadius: '4px', padding: '20px' }}>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Reservation Date &amp; Time</h3>
      <p className="text-sm text-gray-500 mb-4">Select a future date and time for your restaurant reservation.</p>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #e5e7eb' }} className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth} className="text-gray-500 hover:text-gray-800 p-1 text-lg" aria-label="Previous month">‹</button>
          <span className="text-sm font-semibold text-gray-800">{MONTHS[month]} {year}</span>
          <button type="button" onClick={nextMonth} className="text-gray-500 hover:text-gray-800 p-1 text-lg" aria-label="Next month">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <label className="text-sm text-gray-600">Time:</label>
        <select value={hour} onChange={e => setHour(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-700" style={{ borderRadius: '4px' }}>
          {hours.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span className="text-gray-500">:</span>
        <select value={minute} onChange={e => setMinute(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-700" style={{ borderRadius: '4px' }}>
          {minutes.map(m => <option key={m} value={m}>{pad(m)}</option>)}
        </select>
        <div className="flex" style={{ borderRadius: '4px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <button type="button" onClick={() => setAmpm('AM')} className={`px-3 py-1 text-sm ${ampm === 'AM' ? 'text-white' : 'text-gray-600 bg-white'}`} style={{ backgroundColor: ampm === 'AM' ? '#0D9488' : undefined }}>AM</button>
          <button type="button" onClick={() => setAmpm('PM')} className={`px-3 py-1 text-sm ${ampm === 'PM' ? 'text-white' : 'text-gray-600 bg-white'}`} style={{ backgroundColor: ampm === 'PM' ? '#0D9488' : undefined }}>PM</button>
        </div>
      </div>

      {selected && (
        <p className="text-xs text-gray-500 mt-2">
          Selected: {selected} at {hour}:{pad(minute)} {ampm}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selected}
        className={`mt-4 w-full py-2 text-sm font-semibold text-white transition-colors ${!selected ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
        style={{ backgroundColor: '#0D9488', borderRadius: '4px' }}
      >
        Confirm Reservation
      </button>
    </div>
  );
}

// ─── Widget 2: Private Event Dates (range) ──────────────────────────────────────
function PrivateEventDatesPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(8); // September (0-indexed)
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const minDate = '2025-08-01';
  const maxDate = '2025-10-27';

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const startDay = useMemo(() => getStartDayOfWeek(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const isDisabled = useCallback((day: number) => {
    const iso = toISO(year, month, day);
    if (isBefore(iso, minDate)) return true;
    if (isAfter(iso, maxDate)) return true;
    return false;
  }, [year, month]);

  const handleSelect = useCallback((day: number) => {
    if (isDisabled(day)) return;
    const iso = toISO(year, month, day);
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(iso);
      setRangeEnd(null);
    } else {
      if (isBefore(iso, rangeStart)) {
        setRangeStart(iso);
        setRangeEnd(rangeStart);
      } else {
        setRangeEnd(iso);
      }
    }
  }, [year, month, rangeStart, rangeEnd, isDisabled]);

  const isInRange = useCallback((iso: string) => {
    if (rangeStart && rangeEnd) {
      return iso >= rangeStart && iso <= rangeEnd;
    }
    if (rangeStart && !rangeEnd && hovered) {
      const lo = rangeStart < hovered ? rangeStart : hovered;
      const hi = rangeStart < hovered ? hovered : rangeStart;
      return iso >= lo && iso <= hi;
    }
    return false;
  }, [rangeStart, rangeEnd, hovered]);

  const handleSubmit = useCallback(() => {
    if (!rangeStart || !rangeEnd) return;
    onSubmit({
      type: 'date_range',
      value: `${rangeStart}/${rangeEnd}`,
      raw: { widget_id: 'private_event_dates', start: rangeStart, end: rangeEnd },
    });
  }, [rangeStart, rangeEnd, onSubmit]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDay; i++) cells.push(<div key={`e-${i}`} />);
  for (let d = 1; d <= days; d++) {
    const iso = toISO(year, month, d);
    const disabled = isDisabled(d);
    const isStart = rangeStart === iso;
    const isEnd = rangeEnd === iso;
    const inRange = isInRange(iso);
    const isEndpoint = isStart || isEnd;

    cells.push(
      <button
        key={d}
        type="button"
        disabled={disabled}
        onClick={() => handleSelect(d)}
        onMouseEnter={() => { if (!disabled) setHovered(iso); }}
        onMouseLeave={() => setHovered(null)}
        className={`h-9 w-full text-sm transition-colors ${
          disabled
            ? 'text-gray-400 cursor-not-allowed opacity-40'
            : isEndpoint
              ? 'text-white font-semibold'
              : inRange
                ? 'text-teal-800'
                : 'text-gray-700 hover:bg-gray-200'
        }`}
        style={{
          borderRadius: isEndpoint ? '4px' : '0px',
          backgroundColor: isEndpoint ? '#0D9488' : inRange ? '#ccfbf1' : 'transparent',
        }}
      >
        {d}
      </button>
    );
  }

  return (
    <div data-widget-id="private_event_dates" className="w-full" style={{ backgroundColor: '#f8f9f9', borderRadius: '4px', padding: '20px' }}>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Private Event Dates</h3>
      <p className="text-sm text-gray-500 mb-4">Select a start and end date for your private event booking (Aug 1 – Oct 27, 2025).</p>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #e5e7eb' }} className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth} className="text-gray-500 hover:text-gray-800 p-1 text-lg" aria-label="Previous month">‹</button>
          <span className="text-sm font-semibold text-gray-800">{MONTHS[month]} {year}</span>
          <button type="button" onClick={nextMonth} className="text-gray-500 hover:text-gray-800 p-1 text-lg" aria-label="Next month">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
      </div>

      {rangeStart && (
        <p className="text-xs text-gray-500 mt-3">
          {rangeEnd ? `Range: ${rangeStart} → ${rangeEnd}` : `Start: ${rangeStart} (click an end date)`}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!rangeStart || !rangeEnd}
        className={`mt-4 w-full py-2 text-sm font-semibold text-white transition-colors ${(!rangeStart || !rangeEnd) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
        style={{ backgroundColor: '#F59E0B', borderRadius: '4px' }}
      >
        Book Event Dates
      </button>
    </div>
  );
}

// ─── Widget 3: Compound (datetime + range → date) ──────────────────────────────
function CompoundPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // June (0-indexed)
  const [selected, setSelected] = useState<string | null>(null);

  const today = todayISO();
  const minDate = '2025-06-01';

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const startDay = useMemo(() => getStartDayOfWeek(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const isDisabled = useCallback((day: number) => {
    const iso = toISO(year, month, day);
    if (isBefore(iso, minDate)) return true;
    if (isBefore(iso, today)) return true;
    return false;
  }, [year, month, today]);

  const handleSelect = useCallback((day: number) => {
    if (isDisabled(day)) return;
    setSelected(toISO(year, month, day));
  }, [year, month, isDisabled]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    onSubmit({
      type: 'date',
      value: selected,
      raw: { widget_id: 'compound', date: selected },
    });
  }, [selected, onSubmit]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDay; i++) cells.push(<div key={`e-${i}`} />);
  for (let d = 1; d <= days; d++) {
    const iso = toISO(year, month, d);
    const disabled = isDisabled(d);
    const isSel = selected === iso;
    cells.push(
      <button
        key={d}
        type="button"
        disabled={disabled}
        onClick={() => handleSelect(d)}
        className={`h-9 w-full text-sm transition-colors ${
          disabled
            ? 'text-gray-400 cursor-not-allowed opacity-40'
            : isSel
              ? 'text-white font-semibold'
              : 'text-gray-700 hover:bg-gray-200'
        }`}
        style={{
          borderRadius: '4px',
          backgroundColor: isSel ? '#0D9488' : 'transparent',
        }}
      >
        {d}
      </button>
    );
  }

  return (
    <div data-widget-id="compound" className="w-full" style={{ backgroundColor: '#f8f9f9', borderRadius: '4px', padding: '20px' }}>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Select a Date</h3>
      <p className="text-sm text-gray-500 mb-4">Choose a date for your reservation or event (June 2025 onwards).</p>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #e5e7eb' }} className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth} className="text-gray-500 hover:text-gray-800 p-1 text-lg" aria-label="Previous month">‹</button>
          <span className="text-sm font-semibold text-gray-800">{MONTHS[month]} {year}</span>
          <button type="button" onClick={nextMonth} className="text-gray-500 hover:text-gray-800 p-1 text-lg" aria-label="Next month">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
      </div>

      {selected && <p className="text-xs text-gray-500 mt-3">Selected: {selected}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selected}
        className={`mt-4 w-full py-2 text-sm font-semibold text-white transition-colors ${!selected ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
        style={{ backgroundColor: '#0D9488', borderRadius: '4px' }}
      >
        Confirm Date
      </button>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function Page_restaurant_reservation(props: GeneratedPageProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#d3d7dd', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#0D9488' }} className="shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            <span className="text-lg font-bold text-white tracking-tight">EchoServe</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/90">
            <a href="#" className="hover:text-white">Home</a>
            <a href="#" className="hover:text-white">Services</a>
            <a href="#" className="hover:text-white font-semibold text-white">Book</a>
            <a href="#" className="hover:text-white">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 text-white/80 text-xs">
              <span>📍</span><span>10001</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-semibold">U</div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative" style={{ backgroundColor: '#0D9488' }}>
        <div className="max-w-6xl mx-auto px-4 pb-8 pt-4">
          <div className="relative overflow-hidden" style={{ borderRadius: '4px' }}>
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop"
              alt="Restaurant interior"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Restaurant Reservation</h1>
                <p className="text-sm text-white/80">Book your table, plan private events, and manage dates effortlessly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service search bar */}
      <div className="max-w-6xl mx-auto px-4 -mt-4 relative z-10 mb-6">
        <div className="flex items-center gap-2 p-3" style={{ backgroundColor: '#f8f9f9', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="What do you need help with?"
            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
            readOnly
          />
          <span className="text-xs text-gray-400 hidden sm:inline">📍 10001</span>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {['All Services', 'Dining', 'Events', 'Catering', 'Private Rooms'].map((f, i) => (
            <button
              key={f}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                i === 0 ? 'text-white' : 'text-gray-600'
              }`}
              style={{
                borderRadius: '4px',
                backgroundColor: i === 0 ? '#0D9488' : '#f2f3f3',
                border: i === 0 ? 'none' : '1px solid #e5e7eb',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 pb-12 space-y-6">
        {/* Context */}
        <div style={{ backgroundColor: '#f8f9f9', borderRadius: '4px', border: '1px solid #e5e7eb' }} className="p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-2">How It Works</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Use the tools below to make a restaurant reservation, book private event dates, or select a general date. Each section is independent — fill in the one that matches your needs and click the corresponding button to confirm.
          </p>
        </div>

        {/* Widget 1 */}
        <ReservationDateTimePicker onSubmit={props.onSubmit} />

        {/* Widget 2 */}
        <PrivateEventDatesPicker onSubmit={props.onSubmit} />

        {/* Widget 3 */}
        <CompoundPicker onSubmit={props.onSubmit} />

        {/* Service Provider Cards */}
        <div style={{ backgroundColor: '#f8f9f9', borderRadius: '4px', border: '1px solid #e5e7eb' }} className="p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Featured Venues</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div style={{ borderRadius: '4px', overflow: 'hidden', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
              <img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop"
                alt="Wedding venue"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-800">The Grand Ballroom</h3>
                <p className="text-xs text-gray-500 mt-1">★★★★★ · 128 reviews</p>
                <p className="text-xs text-gray-500 mt-0.5">From $1,200 / event</p>
              </div>
            </div>
            <div style={{ borderRadius: '4px', overflow: 'hidden', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
              <img
                src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=300&fit=crop"
                alt="Photography service"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-800">Sunset Terrace</h3>
                <p className="text-xs text-gray-500 mt-1">★★★★☆ · 87 reviews</p>
                <p className="text-xs text-gray-500 mt-0.5">From $800 / event</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#f2f3f3', borderTop: '1px solid #e5e7eb' }} className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-gray-500">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Service Guarantee</h4>
              <p>All bookings backed by our satisfaction promise. Full refund if service doesn't meet expectations.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Verified Providers</h4>
              <p>Every venue and service provider is background-checked and reviewed by our team.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Help Center</h4>
              <p>FAQ · Support Chat · Call Us<br />Mon–Fri 9am–6pm</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Legal</h4>
              <p>Terms of Service · Privacy Policy · Accessibility</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-300 text-center text-xs text-gray-400">
            © 2025 EchoServe. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
