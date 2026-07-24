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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function SingleDatePicker(props: {
  widgetId: string;
  label: string;
  initialYear: number;
  initialMonth: number;
  onSubmit: GeneratedPageProps['onSubmit'];
}) {
  const { widgetId, label, initialYear, initialMonth, onSubmit } = props;
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);

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

  const handleSelect = useCallback((day: number) => {
    setSelected(toISO(year, month, day));
  }, [year, month]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    onSubmit({
      type: 'date',
      value: selected,
      raw: { widget_id: widgetId, selected_date: selected, year, month: month + 1 },
    });
  }, [selected, onSubmit, widgetId, year, month]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div data-widget-id={widgetId} className="rounded-lg p-4" style={{ background: '#1f202b' }}>
      <h3 className="text-sm font-medium mb-3" style={{ color: '#bbbabe' }}>{label}</h3>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-md text-sm hover:opacity-80"
          style={{ background: '#272732', color: '#bbbabe' }}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-medium" style={{ color: '#bbbabe' }}>
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-md text-sm hover:opacity-80"
          style={{ background: '#272732', color: '#bbbabe' }}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs py-1" style={{ color: '#60606a' }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="h-8" />;
          const iso = toISO(year, month, day);
          const isSelected = selected === iso;
          return (
            <button
              key={iso}
              onClick={() => handleSelect(day)}
              className="h-8 rounded-md text-xs flex items-center justify-center transition-colors"
              style={{
                background: isSelected ? '#003580' : 'transparent',
                color: isSelected ? '#ffffff' : '#bbbabe',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs" style={{ color: '#60606a' }}>
          {selected ? `Selected: ${selected}` : 'No date selected'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="px-4 py-1.5 rounded-md text-xs font-medium transition-opacity"
          style={{
            background: selected ? '#003580' : '#272732',
            color: selected ? '#ffffff' : '#60606a',
            cursor: selected ? 'pointer' : 'not-allowed',
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default function Page_train_reservation(props: GeneratedPageProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [travelClass, setTravelClass] = useState('economy');
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [filterSort, setFilterSort] = useState('price');

  return (
    <div className="min-h-screen" style={{ background: '#0c0b21', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: '#1f202b', borderBottom: '1px solid #272732' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-base font-semibold" style={{ color: '#bbbabe' }}>✈️ EchoWay</span>
            <nav className="hidden md:flex items-center gap-4">
              {['Flights', 'Hotels', 'Cars', 'Deals'].map(item => (
                <a
                  key={item}
                  href="#"
                  className="text-xs hover:opacity-80 transition-opacity"
                  style={{ color: item === 'Flights' ? '#febb02' : '#60606a' }}
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: '#60606a' }}>USD</span>
            <span className="text-xs" style={{ color: '#60606a' }}>EN</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: '#272732', color: '#bbbabe' }}>
              U
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=300&fit=crop"
          alt="Train station"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(12,11,33,0.7)' }}>
          <div className="text-center">
            <h1 className="text-xl font-semibold mb-1" style={{ color: '#bbbabe' }}>
              Train Reservation
            </h1>
            <p className="text-xs" style={{ color: '#60606a' }}>
              Find and book your next train journey at the best price
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Form Card */}
        <div className="rounded-lg p-4 mb-6" style={{ background: '#1f202b' }}>
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Trip type toggle */}
            <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid #272732' }}>
              {(['one-way', 'round-trip'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTripType(t)}
                  className="px-3 py-1.5 text-xs capitalize"
                  style={{
                    background: tripType === t ? '#003580' : 'transparent',
                    color: tripType === t ? '#ffffff' : '#60606a',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            {/* Passengers */}
            <select
              value={passengers}
              onChange={e => setPassengers(e.target.value)}
              className="rounded-md px-3 py-1.5 text-xs outline-none"
              style={{ background: '#272732', color: '#bbbabe', border: '1px solid #272732' }}
            >
              {[1,2,3,4,5,6].map(n => (
                <option key={n} value={n}>{n} Traveler{n > 1 ? 's' : ''}</option>
              ))}
            </select>
            {/* Class */}
            <select
              value={travelClass}
              onChange={e => setTravelClass(e.target.value)}
              className="rounded-md px-3 py-1.5 text-xs outline-none"
              style={{ background: '#272732', color: '#bbbabe', border: '1px solid #272732' }}
            >
              {['economy', 'business', 'first'].map(c => (
                <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="From — Origin station"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              className="rounded-md px-3 py-2 text-xs outline-none"
              style={{ background: '#272732', color: '#bbbabe', border: '1px solid #272732' }}
            />
            <input
              type="text"
              placeholder="To — Destination station"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="rounded-md px-3 py-2 text-xs outline-none"
              style={{ background: '#272732', color: '#bbbabe', border: '1px solid #272732' }}
            />
            <div className="flex items-center text-xs px-3 py-2 rounded-md" style={{ background: '#272732', color: '#60606a' }}>
              📅 Select travel date below
            </div>
          </div>
        </div>

        {/* Main content: two-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left panel — Filters + Calendar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Filters */}
            <div className="rounded-lg p-4" style={{ background: '#1f202b' }}>
              <h3 className="text-xs font-medium mb-3" style={{ color: '#bbbabe' }}>Filters</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs" style={{ color: '#60606a' }}>
                  <input type="checkbox" defaultChecked className="rounded" /> Direct trains only
                </label>
                <label className="flex items-center gap-2 text-xs" style={{ color: '#60606a' }}>
                  <input type="checkbox" className="rounded" /> Wi-Fi available
                </label>
                <label className="flex items-center gap-2 text-xs" style={{ color: '#60606a' }}>
                  <input type="checkbox" className="rounded" /> Flexible tickets
                </label>
                <div className="pt-2" style={{ borderTop: '1px solid #272732' }}>
                  <span className="text-xs" style={{ color: '#60606a' }}>Sort by</span>
                  <select
                    value={filterSort}
                    onChange={e => setFilterSort(e.target.value)}
                    className="w-full mt-1 rounded-md px-2 py-1.5 text-xs outline-none"
                    style={{ background: '#272732', color: '#bbbabe', border: '1px solid #272732' }}
                  >
                    <option value="price">Price (Low → High)</option>
                    <option value="duration">Duration</option>
                    <option value="departure">Departure time</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Date Picker Widget */}
            <SingleDatePicker
              widgetId="travel_date"
              label="Travel Date"
              initialYear={2025}
              initialMonth={6}
              onSubmit={props.onSubmit}
            />
          </div>

          {/* Right panel — Results table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg overflow-hidden" style={{ background: '#1f202b' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #272732' }}>
                <h3 className="text-sm font-medium" style={{ color: '#bbbabe' }}>Available Trains</h3>
                <span className="text-xs" style={{ color: '#60606a' }}>Select a date to search</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: '#272732' }}>
                      {['Train', 'Departure', 'Arrival', 'Duration', 'Class', 'Price'].map(h => (
                        <th key={h} className="px-4 py-2 text-left font-medium" style={{ color: '#60606a' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { train: 'Express 101', dep: '06:30', arr: '09:45', dur: '3h 15m', cls: 'Economy', price: '$42' },
                      { train: 'Rapid 204', dep: '08:00', arr: '10:50', dur: '2h 50m', cls: 'Business', price: '$78' },
                      { train: 'Regional 55', dep: '10:15', arr: '14:00', dur: '3h 45m', cls: 'Economy', price: '$31' },
                      { train: 'Express 103', dep: '12:00', arr: '15:10', dur: '3h 10m', cls: 'First', price: '$120' },
                      { train: 'Night 900', dep: '22:30', arr: '06:15', dur: '7h 45m', cls: 'Sleeper', price: '$95' },
                    ].map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #272732' }}>
                        <td className="px-4 py-2.5" style={{ color: '#bbbabe' }}>{r.train}</td>
                        <td className="px-4 py-2.5" style={{ color: '#bbbabe' }}>{r.dep}</td>
                        <td className="px-4 py-2.5" style={{ color: '#bbbabe' }}>{r.arr}</td>
                        <td className="px-4 py-2.5" style={{ color: '#60606a' }}>{r.dur}</td>
                        <td className="px-4 py-2.5" style={{ color: '#60606a' }}>{r.cls}</td>
                        <td className="px-4 py-2.5 font-medium" style={{ color: '#febb02' }}>{r.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Popular Destinations */}
            <div>
              <h3 className="text-sm font-medium mb-3" style={{ color: '#bbbabe' }}>Popular Destinations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { name: 'Tokyo', price: 'From $89', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop' },
                  { name: 'Coastal Beach Line', price: 'From $45', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop' },
                  { name: 'Mountain Express', price: 'From $67', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop' },
                ].map(dest => (
                  <div key={dest.name} className="rounded-lg overflow-hidden" style={{ background: '#272732' }}>
                    <img src={dest.img} alt={dest.name} className="w-full h-28 object-cover" />
                    <div className="p-3">
                      <p className="text-xs font-medium" style={{ color: '#bbbabe' }}>{dest.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#febb02' }}>{dest.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="rounded-lg p-4" style={{ background: '#1f202b' }}>
              <h3 className="text-sm font-medium mb-3" style={{ color: '#bbbabe' }}>Traveler Reviews</h3>
              <div className="space-y-3">
                {[
                  { name: 'Sarah M.', text: 'Smooth booking experience. The express train was comfortable and on time.', rating: 5 },
                  { name: 'James L.', text: 'Great value for business class. Will definitely book again through EchoWay.', rating: 4 },
                ].map((review, i) => (
                  <div key={i} className="p-3 rounded-md" style={{ background: '#272732' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: '#bbbabe' }}>{review.name}</span>
                      <span className="text-xs" style={{ color: '#febb02' }}>
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: '#60606a' }}>{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-6" style={{ background: '#1f202b', borderTop: '1px solid #272732' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            {[
              { title: 'Company', links: ['About', 'Careers', 'Press'] },
              { title: 'Support', links: ['Help Center', 'Contact Us', 'FAQs'] },
              { title: 'Legal', links: ['Terms', 'Privacy', 'Cookies'] },
              { title: 'Download', links: ['Echo App', 'Echo App'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-medium mb-2" style={{ color: '#bbbabe' }}>{col.title}</h4>
                <div className="space-y-1">
                  {col.links.map(link => (
                    <a key={link} href="#" className="block text-xs hover:opacity-80" style={{ color: '#60606a' }}>
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 text-center" style={{ borderTop: '1px solid #272732' }}>
            <span className="text-xs" style={{ color: '#60606a' }}>© 2025 EchoWay. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
