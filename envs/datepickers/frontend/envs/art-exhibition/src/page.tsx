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
const MONTH_SHORT = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function pad(n: number) {
  return n < 10 ? '0' + n : '' + n;
}
function toISO(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

// ─── Single Date Picker ──────────────────────────────────────────────
function SingleDatePicker(props: {
  initialMonth: number;
  initialYear: number;
  disabledDates: Set<string>;
  onSelect: (iso: string) => void;
  selected: string | null;
}) {
  const [month, setMonth] = useState(props.initialMonth);
  const [year, setYear] = useState(props.initialYear);

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);

  const cells = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    while (c.length % 7 !== 0) c.push(null);
    return c;
  }, [daysInMonth, firstDay]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center text-sm font-medium"
          style={{ color: '#555' }}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-medium" style={{ color: '#333' }}>
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center text-sm font-medium"
          style={{ color: '#555' }}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs py-1 font-medium" style={{ color: '#888' }}>
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="h-8" />;
          const iso = toISO(year, month, day);
          const disabled = props.disabledDates.has(iso);
          const selected = props.selected === iso;
          return (
            <button
              key={iso}
              disabled={disabled}
              onClick={() => { if (!disabled) props.onSelect(iso); }}
              className={`h-8 text-sm flex items-center justify-center transition-colors ${
                disabled
                  ? 'cursor-not-allowed'
                  : selected
                  ? 'font-semibold'
                  : 'hover:opacity-80 cursor-pointer'
              }`}
              style={{
                color: disabled ? '#bbb' : selected ? '#fff' : '#333',
                backgroundColor: selected ? '#6366F1' : 'transparent',
                borderRadius: 0,
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

// ─── Month/Year Picker ────────────────────────────────────────────────
function MonthYearPicker(props: {
  initialYear: number;
  onSelect: (month: number, year: number) => void;
  selectedMonth: number | null;
  selectedYear: number | null;
}) {
  const [year, setYear] = useState(props.initialYear);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setYear(y => y - 1)}
          className="w-8 h-8 flex items-center justify-center text-sm font-medium"
          style={{ color: '#555' }}
          aria-label="Previous year"
        >
          ‹
        </button>
        <span className="text-sm font-medium" style={{ color: '#333' }}>{year}</span>
        <button
          onClick={() => setYear(y => y + 1)}
          className="w-8 h-8 flex items-center justify-center text-sm font-medium"
          style={{ color: '#555' }}
          aria-label="Next year"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTH_SHORT.map((m, idx) => {
          const selected = props.selectedMonth === idx && props.selectedYear === year;
          return (
            <button
              key={m}
              onClick={() => props.onSelect(idx, year)}
              className={`py-2 text-sm transition-colors ${
                selected ? 'font-semibold' : 'hover:opacity-80 cursor-pointer'
              }`}
              style={{
                color: selected ? '#fff' : '#333',
                backgroundColor: selected ? '#6366F1' : '#f0f0f0',
                borderRadius: 0,
              }}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function Page_art_exhibition(props: GeneratedPageProps) {
  // Widget 1: Visit Date
  const [w1Selected, setW1Selected] = useState<string | null>(null);
  const w1Disabled = useMemo(
    () => new Set(['2025-08-07','2025-08-08','2025-08-21','2025-08-27']),
    [],
  );

  // Widget 2: Exhibition Month
  const [w2Month, setW2Month] = useState<number | null>(null);
  const [w2Year, setW2Year] = useState<number | null>(null);

  // Widget 3: Compound — date part
  const [w3Selected, setW3Selected] = useState<string | null>(null);
  const w3Disabled = useMemo(
    () => new Set(['2025-05-29','2025-05-31','2025-06-06','2025-06-22']),
    [],
  );
  // Widget 3: Compound — month/year part
  const [w3Month, setW3Month] = useState<number | null>(null);
  const [w3Year, setW3Year] = useState<number | null>(null);

  const [promoCode, setPromoCode] = useState('');
  const [ticketQty, setTicketQty] = useState(1);
  const [seatSection, setSeatSection] = useState('general');
  const [filterType, setFilterType] = useState('all');

  const handleW1Submit = useCallback(() => {
    if (!w1Selected) return;
    props.onSubmit({
      type: 'date',
      value: w1Selected,
      raw: { widget_id: 'visit_date', date: w1Selected },
    });
  }, [w1Selected, props.onSubmit]);

  const handleW2Submit = useCallback(() => {
    if (w2Month === null || w2Year === null) return;
    const val = `${w2Year}-${pad(w2Month + 1)}`;
    props.onSubmit({
      type: 'month_year',
      value: val,
      raw: { widget_id: 'exhibition_month', month: w2Month + 1, year: w2Year },
    });
  }, [w2Month, w2Year, props.onSubmit]);

  const handleW3Submit = useCallback(() => {
    if (!w3Selected) return;
    props.onSubmit({
      type: 'date',
      value: w3Selected,
      raw: {
        widget_id: 'compound',
        date: w3Selected,
        month: w3Month !== null ? w3Month + 1 : null,
        year: w3Year,
      },
    });
  }, [w3Selected, w3Month, w3Year, props.onSubmit]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#d2d2d2', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <header className="w-full" style={{ backgroundColor: '#fefefe' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold flex items-center gap-1" style={{ color: '#6366F1' }}>
              🎫 EchoEvents
            </span>
            <nav className="hidden sm:flex gap-4 text-sm" style={{ color: '#555' }}>
              <span className="cursor-pointer hover:opacity-70">Browse</span>
              <span className="cursor-pointer hover:opacity-70">Tickets</span>
              <span className="cursor-pointer hover:opacity-70">Calendar</span>
              <span className="cursor-pointer hover:opacity-70">Saved</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search events..."
              className="border px-3 py-1.5 text-sm w-44"
              style={{ borderColor: '#d2d2d2', borderRadius: 0, backgroundColor: '#fbfcfb' }}
            />
            <select
              className="border px-2 py-1.5 text-sm"
              style={{ borderColor: '#d2d2d2', borderRadius: 0, backgroundColor: '#fbfcfb' }}
            >
              <option>New York</option>
              <option>London</option>
              <option>Paris</option>
            </select>
            <button
              className="px-3 py-1.5 text-sm text-white"
              style={{ backgroundColor: '#6366F1', borderRadius: 0 }}
            >
              Create Event
            </button>
            <div
              className="w-8 h-8 flex items-center justify-center text-sm font-medium text-white"
              style={{ backgroundColor: '#6366F1', borderRadius: 0 }}
            >
              A
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full" style={{ maxHeight: 280, overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop"
          alt="Art exhibition crowd"
          className="w-full object-cover"
          style={{ height: 280 }}
        />
        <div className="absolute inset-0 flex flex-col justify-end p-6" style={{ background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.55))' }}>
          <h1 className="text-2xl font-bold text-white mb-1">Modern Art Exhibition 2025</h1>
          <p className="text-sm text-white opacity-90 mb-3">Explore contemporary works from 200+ international artists</p>
          <button
            className="self-start px-5 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#F97316', borderRadius: 0 }}
          >
            Get Tickets
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Context */}
        <p className="text-sm mb-6" style={{ color: '#555' }}>
          Plan your visit to the Modern Art Exhibition. Choose your preferred visit date, exhibition month, and use the combined picker to finalize your schedule.
        </p>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {['all', 'painting', 'sculpture', 'photography', 'digital'].map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className="px-3 py-1.5 text-xs capitalize"
              style={{
                backgroundColor: filterType === f ? '#6366F1' : '#f0f0f0',
                color: filterType === f ? '#fff' : '#555',
                borderRadius: 0,
              }}
            >
              {f === 'all' ? 'All Types' : f}
            </button>
          ))}
        </div>

        {/* Ticket options row */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: '#555' }}>Tickets:</span>
            <button
              onClick={() => setTicketQty(q => Math.max(1, q - 1))}
              className="w-7 h-7 flex items-center justify-center text-sm"
              style={{ backgroundColor: '#f0f0f0', borderRadius: 0 }}
            >
              −
            </button>
            <span className="text-sm w-6 text-center" style={{ color: '#333' }}>{ticketQty}</span>
            <button
              onClick={() => setTicketQty(q => Math.min(10, q + 1))}
              className="w-7 h-7 flex items-center justify-center text-sm"
              style={{ backgroundColor: '#f0f0f0', borderRadius: 0 }}
            >
              +
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: '#555' }}>Section:</span>
            <select
              value={seatSection}
              onChange={e => setSeatSection(e.target.value)}
              className="border px-2 py-1 text-sm"
              style={{ borderColor: '#d2d2d2', borderRadius: 0, backgroundColor: '#fbfcfb' }}
            >
              <option value="general">General Admission</option>
              <option value="vip">VIP</option>
              <option value="guided">Guided Tour</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: '#555' }}>Promo:</span>
            <input
              type="text"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value)}
              placeholder="Enter code"
              className="border px-2 py-1 text-sm w-28"
              style={{ borderColor: '#d2d2d2', borderRadius: 0, backgroundColor: '#fbfcfb' }}
            />
          </div>
        </div>

        {/* Widgets grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Widget 1: Visit Date */}
          <div
            data-widget-id="visit_date"
            className="p-5"
            style={{ backgroundColor: '#fefefe', borderRadius: 0 }}
          >
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#333' }}>Visit Date</h3>
            <p className="text-xs mb-4" style={{ color: '#888' }}>Select a date to visit the exhibition</p>
            <SingleDatePicker
              initialMonth={7}
              initialYear={2025}
              disabledDates={w1Disabled}
              selected={w1Selected}
              onSelect={setW1Selected}
            />
            {w1Selected && (
              <p className="text-xs mt-3" style={{ color: '#6366F1' }}>
                Selected: {w1Selected}
              </p>
            )}
            <button
              onClick={handleW1Submit}
              disabled={!w1Selected}
              className="mt-4 w-full py-2 text-sm font-medium text-white"
              style={{
                backgroundColor: w1Selected ? '#6366F1' : '#bbb',
                borderRadius: 0,
                cursor: w1Selected ? 'pointer' : 'not-allowed',
              }}
            >
              Confirm Visit Date
            </button>
          </div>

          {/* Widget 2: Exhibition Month */}
          <div
            data-widget-id="exhibition_month"
            className="p-5"
            style={{ backgroundColor: '#fefefe', borderRadius: 0 }}
          >
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#333' }}>Exhibition Month</h3>
            <p className="text-xs mb-4" style={{ color: '#888' }}>Choose which month to attend</p>
            <MonthYearPicker
              initialYear={2026}
              selectedMonth={w2Month}
              selectedYear={w2Year}
              onSelect={(m, y) => { setW2Month(m); setW2Year(y); }}
            />
            {w2Month !== null && w2Year !== null && (
              <p className="text-xs mt-3" style={{ color: '#6366F1' }}>
                Selected: {MONTHS[w2Month]} {w2Year}
              </p>
            )}
            <button
              onClick={handleW2Submit}
              disabled={w2Month === null}
              className="mt-4 w-full py-2 text-sm font-medium text-white"
              style={{
                backgroundColor: w2Month !== null ? '#6366F1' : '#bbb',
                borderRadius: 0,
                cursor: w2Month !== null ? 'pointer' : 'not-allowed',
              }}
            >
              Confirm Exhibition Month
            </button>
          </div>

          {/* Widget 3: Compound */}
          <div
            data-widget-id="compound"
            className="p-5"
            style={{ backgroundColor: '#fefefe', borderRadius: 0 }}
          >
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#333' }}>Visit Date + Exhibition Month</h3>
            <p className="text-xs mb-4" style={{ color: '#888' }}>Select a visit date and preferred month</p>

            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: '#555' }}>Pick a date</p>
              <SingleDatePicker
                initialMonth={5}
                initialYear={2025}
                disabledDates={w3Disabled}
                selected={w3Selected}
                onSelect={setW3Selected}
              />
            </div>

            <div className="mb-2">
              <p className="text-xs font-medium mb-2" style={{ color: '#555' }}>Pick a month</p>
              <MonthYearPicker
                initialYear={2025}
                selectedMonth={w3Month}
                selectedYear={w3Year}
                onSelect={(m, y) => { setW3Month(m); setW3Year(y); }}
              />
            </div>

            {w3Selected && (
              <p className="text-xs mt-2" style={{ color: '#6366F1' }}>
                Date: {w3Selected}
                {w3Month !== null && w3Year !== null && ` · Month: ${MONTHS[w3Month]} ${w3Year}`}
              </p>
            )}
            <button
              onClick={handleW3Submit}
              disabled={!w3Selected}
              className="mt-4 w-full py-2 text-sm font-medium text-white"
              style={{
                backgroundColor: w3Selected ? '#6366F1' : '#bbb',
                borderRadius: 0,
                cursor: w3Selected ? 'pointer' : 'not-allowed',
              }}
            >
              Confirm Selection
            </button>
          </div>
        </div>

        {/* Similar Events */}
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#333' }}>Similar Events</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div style={{ backgroundColor: '#fefefe', borderRadius: 0 }}>
            <img
              src="https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400&h=300&fit=crop"
              alt="Art gallery"
              className="w-full h-36 object-cover"
            />
            <div className="p-3">
              <p className="text-sm font-medium" style={{ color: '#333' }}>Contemporary Gallery Night</p>
              <p className="text-xs" style={{ color: '#888' }}>Sep 12, 2025 · Downtown Gallery</p>
            </div>
          </div>
          <div style={{ backgroundColor: '#fefefe', borderRadius: 0 }}>
            <img
              src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop"
              alt="Conference"
              className="w-full h-36 object-cover"
            />
            <div className="p-3">
              <p className="text-sm font-medium" style={{ color: '#333' }}>Art & Design Conference</p>
              <p className="text-xs" style={{ color: '#888' }}>Oct 5, 2025 · Convention Center</p>
            </div>
          </div>
          <div style={{ backgroundColor: '#fefefe', borderRadius: 0 }}>
            <img
              src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=300&fit=crop"
              alt="Film festival"
              className="w-full h-36 object-cover"
            />
            <div className="p-3">
              <p className="text-sm font-medium" style={{ color: '#333' }}>Independent Film Festival</p>
              <p className="text-xs" style={{ color: '#888' }}>Nov 20, 2025 · Art House Cinema</p>
            </div>
          </div>
        </div>

        {/* Venue Info */}
        <div className="p-5 mb-8" style={{ backgroundColor: '#fefefe', borderRadius: 0 }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#333' }}>Venue Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs" style={{ color: '#555' }}>
                <strong>Metropolitan Arts Center</strong><br />
                250 W 54th Street, New York, NY 10019<br />
                Open daily 10 AM – 8 PM · Free parking available
              </p>
            </div>
            <div
              className="h-32 flex items-center justify-center text-xs"
              style={{ backgroundColor: '#f0f0f0', color: '#888' }}
            >
              Map Placeholder
            </div>
          </div>
        </div>

        {/* Organizer */}
        <div className="p-5 mb-8" style={{ backgroundColor: '#fefefe', borderRadius: 0 }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#333' }}>Organizer</h3>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center text-sm font-medium text-white"
              style={{ backgroundColor: '#6366F1', borderRadius: 0 }}
            >
              MA
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#333' }}>Metropolitan Arts Foundation</p>
              <p className="text-xs" style={{ color: '#888' }}>Curating world-class exhibitions since 1985</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#fefefe' }}>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#333' }}>Policies</p>
              <p className="text-xs" style={{ color: '#888' }}>Terms of Service</p>
              <p className="text-xs" style={{ color: '#888' }}>Privacy Policy</p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#333' }}>Refunds</p>
              <p className="text-xs" style={{ color: '#888' }}>Refund Policy</p>
              <p className="text-xs" style={{ color: '#888' }}>Contact Support</p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#333' }}>Community</p>
              <p className="text-xs" style={{ color: '#888' }}>Guidelines</p>
              <p className="text-xs" style={{ color: '#888' }}>Accessibility</p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#333' }}>Social</p>
              <p className="text-xs" style={{ color: '#888' }}>EchoX · EchoGram</p>
              <p className="text-xs" style={{ color: '#888' }}>EchoBook · EchoTube</p>
            </div>
          </div>
          <p className="text-xs text-center" style={{ color: '#bbb' }}>
            © 2025 EchoEvents. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
