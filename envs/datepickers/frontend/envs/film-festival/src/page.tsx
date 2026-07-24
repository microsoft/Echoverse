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
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function pad(n: number) {
  return n < 10 ? '0' + n : '' + n;
}
function toDateKey(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

/* ─── Widget 1: Screening Date & Time (datetime picker) ─── */
function ScreeningDatetimePicker(props: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const DISABLED = new Set(['2025-06-30','2025-07-02','2025-07-10','2025-07-15','2025-07-21']);
  const [month, setMonth] = useState(6); // July = index 6
  const [year, setYear] = useState(2025);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('PM');

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);
  const cells = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    while (c.length % 7 !== 0) c.push(null);
    return c;
  }, [daysInMonth, firstDay]);

  const isDisabled = useCallback((day: number) => DISABLED.has(toDateKey(year, month, day)), [year, month]);

  const prevMonth = useCallback(() => {
    setSelectedDay(null);
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    setSelectedDay(null);
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (selectedDay === null) return;
    let h = hour;
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const iso = `${year}-${pad(month + 1)}-${pad(selectedDay)}T${pad(h)}:${pad(minute)}:00`;
    props.onSubmit({
      type: 'datetime',
      value: iso,
      raw: { widget_id: 'screening_datetime', year, month: month + 1, day: selectedDay, hour: h, minute, ampm },
    });
  }, [selectedDay, hour, minute, ampm, year, month, props]);

  return (
    <div data-widget-id="screening_datetime" className="rounded" style={{ background: '#fdfdfd', border: '1px solid #ededed' }}>
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-1" style={{ color: '#333' }}>Screening Date &amp; Time</h3>
        <p className="text-sm mb-4" style={{ color: '#666' }}>Select the date and time for your film screening.</p>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="px-3 py-1 rounded text-sm font-medium" style={{ background: '#f3f3f3' }}>‹ Prev</button>
          <span className="font-medium text-sm">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="px-3 py-1 rounded text-sm font-medium" style={{ background: '#f3f3f3' }}>Next ›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#888' }}>{d}</div>)}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const disabled = isDisabled(day);
            const selected = day === selectedDay;
            return (
              <button
                key={i}
                disabled={disabled}
                onClick={() => !disabled && setSelectedDay(day)}
                className={`py-1.5 text-sm rounded text-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                style={{
                  background: selected ? '#6366F1' : disabled ? '#ededed' : '#f9f9f9',
                  color: selected ? '#fff' : disabled ? '#bbb' : '#333',
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Time selectors */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <label className="text-sm font-medium" style={{ color: '#555' }}>Time:</label>
          <select value={hour} onChange={e => setHour(Number(e.target.value))} className="rounded px-2 py-1 text-sm" style={{ border: '1px solid #ddd', background: '#f9f9f9' }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span className="font-medium">:</span>
          <select value={minute} onChange={e => setMinute(Number(e.target.value))} className="rounded px-2 py-1 text-sm" style={{ border: '1px solid #ddd', background: '#f9f9f9' }}>
            {[0, 15, 30, 45].map(m => <option key={m} value={m}>{pad(m)}</option>)}
          </select>
          <div className="flex rounded overflow-hidden" style={{ border: '1px solid #ddd' }}>
            <button onClick={() => setAmpm('AM')} className="px-3 py-1 text-sm font-medium" style={{ background: ampm === 'AM' ? '#6366F1' : '#f9f9f9', color: ampm === 'AM' ? '#fff' : '#555' }}>AM</button>
            <button onClick={() => setAmpm('PM')} className="px-3 py-1 text-sm font-medium" style={{ background: ampm === 'PM' ? '#6366F1' : '#f9f9f9', color: ampm === 'PM' ? '#fff' : '#555' }}>PM</button>
          </div>
        </div>

        {selectedDay !== null && (
          <p className="text-xs mb-3" style={{ color: '#6366F1' }}>
            Selected: {MONTHS[month]} {selectedDay}, {year} at {hour}:{pad(minute)} {ampm}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={selectedDay === null}
          className="w-full py-2 rounded text-sm font-semibold"
          style={{ background: selectedDay !== null ? '#6366F1' : '#ededed', color: selectedDay !== null ? '#fff' : '#aaa' }}
        >
          Confirm Screening Date &amp; Time
        </button>
      </div>
    </div>
  );
}

/* ─── Widget 2: Festival Month (month_year picker) ─── */
function FestivalMonthPicker(props: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const MIN = new Date(2025, 1, 6);  // Feb 6 2025
  const MAX = new Date(2025, 5, 20); // Jun 20 2025
  const [year, setYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const isMonthInRange = useCallback((m: number) => {
    const start = new Date(year, m, 1);
    const endOfMonth = new Date(year, m + 1, 0);
    return endOfMonth >= MIN && start <= MAX;
  }, [year]);

  const prevYear = useCallback(() => { setSelectedMonth(null); setYear(y => y - 1); }, []);
  const nextYear = useCallback(() => { setSelectedMonth(null); setYear(y => y + 1); }, []);

  const handleSubmit = useCallback(() => {
    if (selectedMonth === null) return;
    const iso = `${year}-${pad(selectedMonth + 1)}`;
    props.onSubmit({
      type: 'month_year',
      value: iso,
      raw: { widget_id: 'festival_month', year, month: selectedMonth + 1 },
    });
  }, [selectedMonth, year, props]);

  return (
    <div data-widget-id="festival_month" className="rounded" style={{ background: '#fdfdfd', border: '1px solid #ededed' }}>
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-1" style={{ color: '#333' }}>Festival Month</h3>
        <p className="text-sm mb-4" style={{ color: '#666' }}>Choose which month of the festival you'd like to attend.</p>

        {/* Year nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevYear} className="px-3 py-1 rounded text-sm font-medium" style={{ background: '#f3f3f3' }}>‹ Prev</button>
          <span className="font-semibold">{year}</span>
          <button onClick={nextYear} className="px-3 py-1 rounded text-sm font-medium" style={{ background: '#f3f3f3' }}>Next ›</button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {MONTH_SHORT.map((label, idx) => {
            const inRange = isMonthInRange(idx);
            const selected = idx === selectedMonth;
            return (
              <button
                key={label}
                disabled={!inRange}
                onClick={() => inRange && setSelectedMonth(idx)}
                className={`py-2 rounded text-sm font-medium text-center ${!inRange ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                style={{
                  background: selected ? '#6366F1' : !inRange ? '#ededed' : '#f9f9f9',
                  color: selected ? '#fff' : !inRange ? '#bbb' : '#333',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {selectedMonth !== null && (
          <p className="text-xs mb-3" style={{ color: '#6366F1' }}>
            Selected: {MONTHS[selectedMonth]} {year}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={selectedMonth === null}
          className="w-full py-2 rounded text-sm font-semibold"
          style={{ background: selectedMonth !== null ? '#6366F1' : '#ededed', color: selectedMonth !== null ? '#fff' : '#aaa' }}
        >
          Confirm Festival Month
        </button>
      </div>
    </div>
  );
}

/* ─── Widget 3: Compound (datetime + month_year → date calendar) ─── */
function CompoundPicker(props: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const DISABLED = new Set(['2025-05-25','2025-05-30','2025-06-08','2025-06-15','2025-06-19','2025-06-20']);
  const [month, setMonth] = useState(5); // June = index 5
  const [year, setYear] = useState(2025);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);
  const cells = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    while (c.length % 7 !== 0) c.push(null);
    return c;
  }, [daysInMonth, firstDay]);

  const isDisabled = useCallback((day: number) => DISABLED.has(toDateKey(year, month, day)), [year, month]);

  const prevMonth = useCallback(() => {
    setSelectedDay(null);
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    setSelectedDay(null);
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (selectedDay === null) return;
    const iso = `${year}-${pad(month + 1)}-${pad(selectedDay)}`;
    props.onSubmit({
      type: 'date',
      value: iso,
      raw: { widget_id: 'compound', year, month: month + 1, day: selectedDay },
    });
  }, [selectedDay, year, month, props]);

  return (
    <div data-widget-id="compound" className="rounded" style={{ background: '#fdfdfd', border: '1px solid #ededed' }}>
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-1" style={{ color: '#333' }}>Screening Date &amp; Festival Month</h3>
        <p className="text-sm mb-4" style={{ color: '#666' }}>Pick a date for combined screening and festival scheduling.</p>

        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="px-3 py-1 rounded text-sm font-medium" style={{ background: '#f3f3f3' }}>‹ Prev</button>
          <span className="font-medium text-sm">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="px-3 py-1 rounded text-sm font-medium" style={{ background: '#f3f3f3' }}>Next ›</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#888' }}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const disabled = isDisabled(day);
            const selected = day === selectedDay;
            return (
              <button
                key={i}
                disabled={disabled}
                onClick={() => !disabled && setSelectedDay(day)}
                className={`py-1.5 text-sm rounded text-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                style={{
                  background: selected ? '#6366F1' : disabled ? '#ededed' : '#f9f9f9',
                  color: selected ? '#fff' : disabled ? '#bbb' : '#333',
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        {selectedDay !== null && (
          <p className="text-xs mb-3" style={{ color: '#6366F1' }}>
            Selected: {MONTHS[month]} {selectedDay}, {year}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={selectedDay === null}
          className="w-full py-2 rounded text-sm font-semibold"
          style={{ background: selectedDay !== null ? '#6366F1' : '#ededed', color: selectedDay !== null ? '#fff' : '#aaa' }}
        >
          Confirm Date
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_film_festival(props: GeneratedPageProps) {
  const [ticketQty, setTicketQty] = useState(1);
  const [seatSection, setSeatSection] = useState('general');
  const [promoCode, setPromoCode] = useState('');
  const [filterGenre, setFilterGenre] = useState('all');

  return (
    <div className="min-h-screen font-sans" style={{ background: '#dddddd' }}>
      {/* Header */}
      <header style={{ background: '#fdfdfd', borderBottom: '1px solid #ededed' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold flex items-center gap-1" style={{ color: '#6366F1' }}>🎫 EchoEvents</span>
            <nav className="hidden md:flex gap-4 text-sm" style={{ color: '#555' }}>
              <a href="#" className="hover:opacity-70">Browse</a>
              <a href="#" className="hover:opacity-70">Tickets</a>
              <a href="#" className="hover:opacity-70">Calendar</a>
              <a href="#" className="hover:opacity-70">Saved</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search events…"
              className="hidden sm:block rounded px-3 py-1.5 text-sm"
              style={{ border: '1px solid #ddd', background: '#f9f9f9', width: 180 }}
            />
            <select className="rounded px-2 py-1.5 text-sm" style={{ border: '1px solid #ddd', background: '#f9f9f9' }}>
              <option>All Cities</option><option>Los Angeles</option><option>New York</option><option>Chicago</option>
            </select>
            <button className="rounded px-3 py-1.5 text-sm font-medium text-white" style={{ background: '#6366F1' }}>Create Event</button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#F97316' }}>U</div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop"
          alt="Film festival crowd"
          className="w-full object-cover"
          style={{ height: 260 }}
        />
        <div className="absolute inset-0 flex flex-col justify-end p-6" style={{ background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.65))' }}>
          <div className="max-w-6xl mx-auto w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">International Film Festival 2025</h1>
            <p className="text-white text-sm opacity-90 mb-3">Celebrating cinema from around the world — screenings, panels, and premieres.</p>
            <button className="rounded px-5 py-2 text-sm font-semibold text-white" style={{ background: '#F97316' }}>Get Tickets</button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Context + filter */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#333' }}>Book Your Experience</h2>
            <p className="text-sm" style={{ color: '#666' }}>Choose your screening date, festival month, or combined event schedule below.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" style={{ color: '#555' }}>Genre:</label>
            <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)} className="rounded px-2 py-1 text-sm" style={{ border: '1px solid #ddd', background: '#f9f9f9' }}>
              <option value="all">All Genres</option>
              <option value="drama">Drama</option>
              <option value="comedy">Comedy</option>
              <option value="documentary">Documentary</option>
              <option value="thriller">Thriller</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Ticket options row */}
            <div className="rounded p-5 flex flex-wrap items-end gap-4" style={{ background: '#fdfdfd', border: '1px solid #ededed' }}>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Tickets</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setTicketQty(q => Math.max(1, q - 1))} className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold" style={{ background: '#f3f3f3' }}>−</button>
                  <span className="text-sm font-semibold w-5 text-center">{ticketQty}</span>
                  <button onClick={() => setTicketQty(q => Math.min(10, q + 1))} className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold" style={{ background: '#f3f3f3' }}>+</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Section</label>
                <select value={seatSection} onChange={e => setSeatSection(e.target.value)} className="rounded px-2 py-1.5 text-sm" style={{ border: '1px solid #ddd', background: '#f9f9f9' }}>
                  <option value="general">General Admission</option>
                  <option value="vip">VIP Front Row</option>
                  <option value="balcony">Balcony</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Promo Code</label>
                <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Enter code" className="rounded px-2 py-1.5 text-sm" style={{ border: '1px solid #ddd', background: '#f9f9f9', width: 130 }} />
              </div>
            </div>

            {/* Widget 1 */}
            <ScreeningDatetimePicker onSubmit={props.onSubmit} />

            {/* Widget 2 */}
            <FestivalMonthPicker onSubmit={props.onSubmit} />

            {/* Widget 3 */}
            <CompoundPicker onSubmit={props.onSubmit} />
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6">
            {/* Venue info */}
            <div className="rounded overflow-hidden" style={{ background: '#fdfdfd', border: '1px solid #ededed' }}>
              <img src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=300&fit=crop" alt="Film festival venue" className="w-full h-40 object-cover" />
              <div className="p-4">
                <h4 className="font-semibold text-sm mb-1" style={{ color: '#333' }}>Grand Cinema Palace</h4>
                <p className="text-xs mb-2" style={{ color: '#666' }}>1200 Sunset Blvd, Los Angeles, CA 90028</p>
                <div className="rounded p-2 text-xs" style={{ background: '#f3f3f3', color: '#555' }}>🗺️ Interactive venue map available at check-in</div>
              </div>
            </div>

            {/* Organizer */}
            <div className="rounded p-4" style={{ background: '#fdfdfd', border: '1px solid #ededed' }}>
              <h4 className="font-semibold text-sm mb-2" style={{ color: '#333' }}>Organizer</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: '#6366F1' }}>FF</div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#333' }}>Film Fest International</p>
                  <p className="text-xs" style={{ color: '#888' }}>Organized 42 events</p>
                </div>
              </div>
            </div>

            {/* Similar events */}
            <div className="rounded p-4" style={{ background: '#fdfdfd', border: '1px solid #ededed' }}>
              <h4 className="font-semibold text-sm mb-3" style={{ color: '#333' }}>Similar Events</h4>
              <div className="flex flex-col gap-3">
                {[
                  { title: 'Art House Showcase', date: 'Aug 12, 2025', img: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400&h=300&fit=crop' },
                  { title: 'Food & Film Expo', date: 'Sep 5, 2025', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop' },
                ].map(evt => (
                  <div key={evt.title} className="flex gap-3 items-center">
                    <img src={evt.img} alt={evt.title} className="w-16 h-12 object-cover rounded" />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#333' }}>{evt.title}</p>
                      <p className="text-xs" style={{ color: '#888' }}>{evt.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#f9f9f9', borderTop: '1px solid #ededed' }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs" style={{ color: '#666' }}>
            <div>
              <h5 className="font-semibold mb-2" style={{ color: '#333' }}>Policies</h5>
              <p>Refund Policy</p><p>Privacy Policy</p><p>Terms of Service</p>
            </div>
            <div>
              <h5 className="font-semibold mb-2" style={{ color: '#333' }}>Community</h5>
              <p>Guidelines</p><p>Accessibility</p><p>Help Center</p>
            </div>
            <div>
              <h5 className="font-semibold mb-2" style={{ color: '#333' }}>Connect</h5>
              <p>EchoX</p><p>EchoGram</p><p>EchoBook</p>
            </div>
            <div>
              <h5 className="font-semibold mb-2" style={{ color: '#333' }}>EchoEvents</h5>
              <p>About Us</p><p>Careers</p><p>Blog</p>
            </div>
          </div>
          <p className="text-xs mt-4 pt-4 text-center" style={{ color: '#aaa', borderTop: '1px solid #ededed' }}>© 2025 EchoEvents. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
