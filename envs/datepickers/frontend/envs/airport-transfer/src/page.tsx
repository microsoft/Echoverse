import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function DateTimePicker({
  widgetId,
  label,
  initialYear,
  initialMonth,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  initialYear: number;
  initialMonth: number;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<{ y: number; m: number; d: number } | null>(null);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const handleSelect = useCallback((d: number) => {
    setSelectedDate({ y: year, m: month, d });
  }, [year, month]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    const h24 = ampm === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    const iso = `${selectedDate.y}-${pad(selectedDate.m + 1)}-${pad(selectedDate.d)}T${pad(h24)}:${pad(minute)}:00`;
    onSubmit({
      type: 'datetime',
      value: iso,
      raw: {
        widget_id: widgetId,
        year: selectedDate.y,
        month: selectedDate.m + 1,
        day: selectedDate.d,
        hour: h24,
        minute,
        ampm,
        iso,
      },
    });
  }, [selectedDate, hour, minute, ampm, widgetId, onSubmit]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (d: number) =>
    selectedDate !== null && selectedDate.y === year && selectedDate.m === month && selectedDate.d === d;

  return (
    <div data-widget-id={widgetId} className="rounded" style={{ backgroundColor: '#181719', border: '1px solid #3a363a' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #3a363a' }}>
        <h3 className="text-white text-sm font-semibold">{label}</h3>
      </div>

      <div className="p-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white text-sm"
            style={{ backgroundColor: '#0e0d1e' }}
            aria-label="Previous month"
          >
            ◀
          </button>
          <span className="text-white text-sm font-medium">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white text-sm"
            style={{ backgroundColor: '#0e0d1e' }}
            aria-label="Next month"
          >
            ▶
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((d, i) => (
            <div key={i} className="flex items-center justify-center py-1">
              {d !== null ? (
                <button
                  onClick={() => handleSelect(d)}
                  className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                    isSelected(d)
                      ? 'text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  style={
                    isSelected(d)
                      ? { backgroundColor: '#003580' }
                      : { backgroundColor: 'transparent' }
                  }
                >
                  {d}
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {/* Time pickers */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <label className="text-gray-400 text-xs">Time:</label>
          <select
            value={hour}
            onChange={e => setHour(Number(e.target.value))}
            className="rounded px-2 py-1 text-xs text-white outline-none"
            style={{ backgroundColor: '#0e0d1e', border: '1px solid #3a363a' }}
          >
            {HOURS.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <span className="text-gray-400 text-xs">:</span>
          <select
            value={minute}
            onChange={e => setMinute(Number(e.target.value))}
            className="rounded px-2 py-1 text-xs text-white outline-none"
            style={{ backgroundColor: '#0e0d1e', border: '1px solid #3a363a' }}
          >
            {MINUTES.map(m => (
              <option key={m} value={m}>{pad(m)}</option>
            ))}
          </select>
          <div className="flex rounded overflow-hidden" style={{ border: '1px solid #3a363a' }}>
            <button
              onClick={() => setAmpm('AM')}
              className="px-2 py-1 text-xs font-medium transition-colors"
              style={ampm === 'AM' ? { backgroundColor: '#003580', color: '#fff' } : { backgroundColor: '#0e0d1e', color: '#9ca3af' }}
            >
              AM
            </button>
            <button
              onClick={() => setAmpm('PM')}
              className="px-2 py-1 text-xs font-medium transition-colors"
              style={ampm === 'PM' ? { backgroundColor: '#003580', color: '#fff' } : { backgroundColor: '#0e0d1e', color: '#9ca3af' }}
            >
              PM
            </button>
          </div>
        </div>

        {/* Selected summary */}
        {selectedDate && (
          <div className="mt-3 text-xs text-gray-400">
            Selected: {MONTHS[selectedDate.m]} {selectedDate.d}, {selectedDate.y} at {hour}:{pad(minute)} {ampm}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selectedDate}
          className="mt-4 w-full rounded py-2 text-sm font-semibold transition-opacity"
          style={{
            backgroundColor: selectedDate ? '#003580' : '#3a363a',
            color: selectedDate ? '#fff' : '#6b7280',
            cursor: selectedDate ? 'pointer' : 'not-allowed',
          }}
        >
          Confirm Pickup Date & Time
        </button>
      </div>
    </div>
  );
}

/* ─── Popular Destinations ─── */
const DESTINATIONS = [
  { name: 'Bali Beach', price: '$42', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop' },
  { name: 'Tokyo', price: '$68', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop' },
  { name: 'Paris', price: '$55', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop' },
];

/* ─── Transfer table data ─── */
const TRANSFERS = [
  { route: 'JFK → Manhattan', vehicle: 'Sedan', pax: '1–3', price: '$62' },
  { route: 'LAX → Downtown LA', vehicle: 'SUV', pax: '1–5', price: '$78' },
  { route: 'Heathrow → Central London', vehicle: 'Minivan', pax: '1–6', price: '$85' },
  { route: 'CDG → Paris Center', vehicle: 'Sedan', pax: '1–3', price: '$58' },
];

const VEHICLE_TYPES = ['All', 'Sedan', 'SUV', 'Minivan'];

export default function Page_airport_transfer(props: GeneratedPageProps) {
  const [vehicleFilter, setVehicleFilter] = useState('All');

  const filteredTransfers = useMemo(
    () => vehicleFilter === 'All' ? TRANSFERS : TRANSFERS.filter(t => t.vehicle === vehicleFilter),
    [vehicleFilter],
  );

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#040407', color: '#e5e7eb' }}>
      {/* ─── Header ─── */}
      <header className="flex items-center justify-between px-5 py-3" style={{ backgroundColor: '#0c0c10', borderBottom: '1px solid #3a363a' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">✈️</span>
          <span className="text-white text-sm font-bold tracking-wide">EchoWay</span>
        </div>
        <nav className="hidden md:flex items-center gap-5">
          {['Flights', 'Hotels', 'Cars', 'Deals'].map(item => (
            <a key={item} href="#" className="text-gray-400 text-xs hover:text-white transition-colors">{item}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-gray-400 text-xs">
          <span>USD</span>
          <span>EN</span>
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: '#3a363a', color: '#fff' }}>U</span>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=1200&h=400&fit=crop"
          alt="Airport terminal"
          className="w-full h-56 object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'linear-gradient(to bottom, rgba(4,4,7,0.4), rgba(4,4,7,0.85))' }}>
          <h1 className="text-white text-xl md:text-2xl font-bold mb-1">Airport Transfer Booking</h1>
          <p className="text-gray-300 text-xs mb-4">Reliable rides from airport to your destination</p>
          <div className="flex items-center rounded overflow-hidden w-72" style={{ backgroundColor: '#181719', border: '1px solid #3a363a' }}>
            <input
              type="text"
              placeholder="Where are you going?"
              className="flex-1 bg-transparent px-3 py-2 text-xs text-white outline-none placeholder-gray-500"
            />
            <button className="px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: '#003580' }}>Search</button>
          </div>
        </div>
      </section>

      {/* ─── Main ─── */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Context */}
        <div className="rounded p-4" style={{ backgroundColor: '#0e0d1e', border: '1px solid #3a363a' }}>
          <h2 className="text-white text-sm font-semibold mb-1">Book Your Airport Transfer</h2>
          <p className="text-gray-400 text-xs leading-relaxed">
            Select your pickup date and time below. Our drivers will meet you at the arrivals terminal with a name sign.
            Choose from sedan, SUV, or minivan options for your group size.
          </p>
        </div>

        {/* Booking row: trip type / travelers / class */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded overflow-hidden text-xs" style={{ border: '1px solid #3a363a' }}>
            <button className="px-3 py-1.5 font-medium text-white" style={{ backgroundColor: '#003580' }}>One-way</button>
            <button className="px-3 py-1.5 text-gray-400" style={{ backgroundColor: '#181719' }}>Round-trip</button>
          </div>
          <div className="flex items-center gap-1 rounded px-3 py-1.5 text-xs text-gray-300" style={{ backgroundColor: '#181719', border: '1px solid #3a363a' }}>
            <span>👤</span> 1 Traveler
          </div>
          <select className="rounded px-3 py-1.5 text-xs text-gray-300 outline-none" style={{ backgroundColor: '#181719', border: '1px solid #3a363a' }}>
            <option>Economy</option>
            <option>Business</option>
            <option>First Class</option>
          </select>
        </div>

        {/* Datepicker widget */}
        <DateTimePicker
          widgetId="pickup_datetime"
          label="Pickup Date & Time"
          initialYear={2025}
          initialMonth={7}
          onSubmit={props.onSubmit}
        />

        {/* Transfer pricing table with filter */}
        <div className="rounded" style={{ backgroundColor: '#181719', border: '1px solid #3a363a' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #3a363a' }}>
            <h3 className="text-white text-sm font-semibold">Popular Routes</h3>
            <div className="flex items-center gap-1">
              {VEHICLE_TYPES.map(v => (
                <button
                  key={v}
                  onClick={() => setVehicleFilter(v)}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors"
                  style={
                    vehicleFilter === v
                      ? { backgroundColor: '#003580', color: '#fff' }
                      : { backgroundColor: '#0e0d1e', color: '#9ca3af' }
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #3a363a' }}>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Route</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Vehicle</th>
                <th className="text-center px-4 py-2 text-gray-500 font-medium">Passengers</th>
                <th className="text-right px-4 py-2 text-gray-500 font-medium">From</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #3a363a' }}>
                  <td className="px-4 py-2 text-gray-300">{t.route}</td>
                  <td className="px-4 py-2 text-gray-400">{t.vehicle}</td>
                  <td className="px-4 py-2 text-gray-400 text-center">{t.pax}</td>
                  <td className="px-4 py-2 text-white font-semibold text-right">{t.price}</td>
                </tr>
              ))}
              {filteredTransfers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-gray-500 text-center">No routes for this vehicle type.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Popular destinations */}
        <div>
          <h3 className="text-white text-sm font-semibold mb-3">Popular Destinations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DESTINATIONS.map(d => (
              <div key={d.name} className="rounded overflow-hidden" style={{ backgroundColor: '#181719', border: '1px solid #3a363a' }}>
                <img src={d.img} alt={d.name} className="w-full h-32 object-cover" />
                <div className="p-3 flex items-center justify-between">
                  <span className="text-white text-xs font-medium">{d.name}</span>
                  <span className="text-xs font-semibold" style={{ color: '#febb02' }}>from {d.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="rounded p-4" style={{ backgroundColor: '#0e0d1e', border: '1px solid #3a363a' }}>
          <h3 className="text-white text-sm font-semibold mb-2">Traveler Reviews</h3>
          <div className="space-y-2">
            {[
              { name: 'Sarah M.', text: 'Driver was on time and the car was spotless. Great airport pickup experience.' },
              { name: 'James K.', text: 'Very smooth booking process. Will use EchoWay transfers again.' },
            ].map(r => (
              <div key={r.name} className="text-xs">
                <span className="text-white font-medium">{r.name}</span>
                <span className="text-yellow-400 ml-1">★★★★★</span>
                <p className="text-gray-400 mt-0.5">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="mt-6 px-5 py-4 text-xs text-gray-500" style={{ backgroundColor: '#0c0c10', borderTop: '1px solid #3a363a' }}>
        <div className="max-w-3xl mx-auto flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-white font-semibold mb-1">EchoWay</p>
            <p>About Us · Careers · Press</p>
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Support</p>
            <p>Help Center · Safety · Cancellation</p>
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Get the App</p>
            <p>📱 Echo App · Echo App</p>
          </div>
        </div>
        <p className="text-center mt-3 text-gray-600">© 2025 EchoWay Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
