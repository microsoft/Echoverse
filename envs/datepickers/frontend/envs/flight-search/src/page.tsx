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

/* ── Departure Date Picker ── */
function DepartureDatePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // June 2025 (0-indexed)
  const [selected, setSelected] = useState<string | null>(null);

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

  const handleSelect = useCallback((day: number) => {
    setSelected(toISO(year, month, day));
  }, [year, month]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    onSubmit({
      type: 'date',
      value: selected,
      raw: { widget_id: 'departure_date', date: selected, year, month: month + 1 },
    });
  }, [selected, onSubmit, year, month]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDay; i++) cells.push(<div key={`e-${i}`} />);
  for (let d = 1; d <= days; d++) {
    const iso = toISO(year, month, d);
    const isSel = selected === iso;
    cells.push(
      <button
        key={d}
        type="button"
        onClick={() => handleSelect(d)}
        className={`
          h-10 rounded-full text-sm font-medium transition-colors
          ${isSel
            ? 'text-white'
            : 'hover:bg-white/10 text-gray-200'
          }
        `}
        style={isSel ? { backgroundColor: '#febb02', color: '#0c0b20' } : undefined}
      >
        {d}
      </button>
    );
  }

  return (
    <div className="w-full max-w-sm">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-300 text-lg"
        >
          ‹
        </button>
        <span className="text-base font-semibold" style={{ color: '#fefefe' }}>
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-300 text-lg"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#b5b9bc' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">{cells}</div>

      {/* Selected display + submit */}
      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm" style={{ color: '#b5b9bc' }}>
          {selected ? `Selected: ${selected}` : 'No date selected'}
        </span>
        <button
          type="button"
          disabled={!selected}
          onClick={handleSubmit}
          className="px-5 py-2 rounded-full text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{ backgroundColor: '#febb02', color: '#0c0b20' }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function Page_flight_search(props: GeneratedPageProps) {
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [travelers, setTravelers] = useState(1);
  const [cabin, setCabin] = useState('Economy');
  const [showCalendar, setShowCalendar] = useState(true);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#0c0b20', color: '#fefefe' }}>
      {/* ── Header ── */}
      <header className="border-b" style={{ borderColor: '#515556' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold tracking-tight" style={{ color: '#febb02' }}>
              ✈️ EchoWay
            </span>
            <nav className="hidden md:flex gap-5 text-sm font-medium" style={{ color: '#b5b9bc' }}>
              {['Flights', 'Hotels', 'Cars', 'Deals'].map(item => (
                <a key={item} href="#" className="hover:text-white transition-colors">
                  {item}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: '#b5b9bc' }}>
            <span className="hidden sm:inline">USD</span>
            <span className="hidden sm:inline">EN</span>
            <button
              type="button"
              className="px-4 py-1.5 rounded-full text-sm font-medium border"
              style={{ borderColor: '#515556', color: '#fefefe' }}
            >
              Sign in
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=1200&h=400&fit=crop"
          alt="Airport terminal with planes"
          className="w-full h-64 md:h-80 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b20] via-[#0c0b20]/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Where are you going?</h1>
          <p className="text-base" style={{ color: '#b5b9bc' }}>
            Search flights to 3,000+ destinations worldwide
          </p>
        </div>
      </section>

      {/* ── Search Panel ── */}
      <section className="max-w-5xl mx-auto -mt-8 relative z-10 px-4">
        <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#161530', borderColor: '#515556' }}>
          {/* Top row: trip type, travelers, cabin */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {(['one-way', 'round-trip'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTripType(t)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={
                  tripType === t
                    ? { backgroundColor: '#febb02', color: '#0c0b20' }
                    : { backgroundColor: 'transparent', border: '1px solid #515556', color: '#b5b9bc' }
                }
              >
                {t === 'one-way' ? 'One-way' : 'Round-trip'}
              </button>
            ))}

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm" style={{ color: '#b5b9bc' }}>Travelers</label>
              <select
                value={travelers}
                onChange={e => setTravelers(Number(e.target.value))}
                className="rounded-full px-3 py-1.5 text-sm"
                style={{ backgroundColor: '#0c0b20', color: '#fefefe', border: '1px solid #515556' }}
              >
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <select
                value={cabin}
                onChange={e => setCabin(e.target.value)}
                className="rounded-full px-3 py-1.5 text-sm"
                style={{ backgroundColor: '#0c0b20', color: '#fefefe', border: '1px solid #515556' }}
              >
                {['Economy', 'Premium Economy', 'Business', 'First'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* From / To row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: '#0c0b20', border: '1px solid #515556' }}
            >
              <div className="text-xs mb-1" style={{ color: '#b5b9bc' }}>From</div>
              <div className="text-sm font-medium">New York (JFK)</div>
            </div>
            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: '#0c0b20', border: '1px solid #515556' }}
            >
              <div className="text-xs mb-1" style={{ color: '#b5b9bc' }}>To</div>
              <div className="text-sm" style={{ color: '#515556' }}>Select destination</div>
            </div>
          </div>

          {/* ── Departure Date Widget ── */}
          <div data-widget-id="departure_date">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-semibold" style={{ color: '#fefefe' }}>Departure Date</span>
              <button
                type="button"
                onClick={() => setShowCalendar(c => !c)}
                className="text-xs px-3 py-1 rounded-full"
                style={{ backgroundColor: '#0c0b20', border: '1px solid #515556', color: '#b5b9bc' }}
              >
                {showCalendar ? 'Hide calendar' : 'Show calendar'}
              </button>
            </div>
            {showCalendar && <DepartureDatePicker onSubmit={props.onSubmit} />}
          </div>
        </div>
      </section>

      {/* ── Filters Bar ── */}
      <section className="max-w-5xl mx-auto mt-6 px-4">
        <div className="flex flex-wrap gap-2">
          {['Direct flights', 'Flexible dates', 'Baggage included', 'Free cancellation'].map(f => (
            <span
              key={f}
              className="px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#161530', border: '1px solid #515556', color: '#b5b9bc' }}
            >
              {f}
            </span>
          ))}
        </div>
      </section>

      {/* ── Popular Destinations ── */}
      <section className="max-w-5xl mx-auto mt-10 px-4">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#fefefe' }}>Popular destinations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { city: 'Tokyo', price: '$489', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop' },
            { city: 'Bali', price: '$372', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop' },
            { city: 'Dubai', price: '$415', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop' },
          ].map(dest => (
            <div
              key={dest.city}
              className="rounded-2xl overflow-hidden group cursor-pointer"
              style={{ backgroundColor: '#161530', border: '1px solid #515556' }}
            >
              <img
                src={dest.img}
                alt={dest.city}
                className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
              />
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{dest.city}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#b5b9bc' }}>Round-trip from</div>
                </div>
                <span className="font-bold text-sm" style={{ color: '#febb02' }}>{dest.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="max-w-5xl mx-auto mt-10 px-4">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#fefefe' }}>What travelers say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Alex M.', text: 'Found an amazing deal to Tokyo. The flexible dates filter saved me $120!' },
            { name: 'Priya K.', text: 'Super easy to compare flights. Booked my Bali trip in under 5 minutes.' },
            { name: 'James R.', text: 'Great prices and the free cancellation option gives real peace of mind.' },
          ].map(r => (
            <div
              key={r.name}
              className="rounded-2xl p-4"
              style={{ backgroundColor: '#161530', border: '1px solid #515556' }}
            >
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} className="text-sm" style={{ color: '#febb02' }}>★</span>
                ))}
              </div>
              <p className="text-sm mb-3" style={{ color: '#b5b9bc' }}>{r.text}</p>
              <span className="text-xs font-semibold" style={{ color: '#fefefe' }}>{r.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-16 border-t pt-8 pb-10" style={{ borderColor: '#515556' }}>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs" style={{ color: '#b5b9bc' }}>
          <div>
            <div className="font-semibold mb-2" style={{ color: '#fefefe' }}>Company</div>
            {['About', 'Careers', 'Press', 'Blog'].map(l => (
              <div key={l} className="py-0.5 hover:text-white cursor-pointer">{l}</div>
            ))}
          </div>
          <div>
            <div className="font-semibold mb-2" style={{ color: '#fefefe' }}>Support</div>
            {['Help Center', 'Contact Us', 'FAQs', 'Accessibility'].map(l => (
              <div key={l} className="py-0.5 hover:text-white cursor-pointer">{l}</div>
            ))}
          </div>
          <div>
            <div className="font-semibold mb-2" style={{ color: '#fefefe' }}>Legal</div>
            {['Privacy', 'Terms', 'Cookie Policy', 'Sitemap'].map(l => (
              <div key={l} className="py-0.5 hover:text-white cursor-pointer">{l}</div>
            ))}
          </div>
          <div>
            <div className="font-semibold mb-2" style={{ color: '#fefefe' }}>Get the app</div>
            <div className="flex flex-col gap-1">
              <span className="px-3 py-1.5 rounded-full text-center" style={{ border: '1px solid #515556' }}>
                EchoStore
              </span>
              <span className="px-3 py-1.5 rounded-full text-center" style={{ border: '1px solid #515556' }}>
                EchoPlay
              </span>
            </div>
          </div>
        </div>
        <div className="text-center text-xs mt-8" style={{ color: '#515556' }}>
          © 2025 EchoWay. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
