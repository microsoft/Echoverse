import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DISABLED_DATES_CLASS = new Set([
  '2025-08-03',
  '2025-08-08',
  '2025-08-09',
  '2025-08-11',
  '2025-08-12',
  '2025-08-14',
  '2025-08-20',
]);

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const rows: { day: number; month: number; year: number; current: boolean }[][] = [];
  let week: { day: number; month: number; year: number; current: boolean }[] = [];

  for (let i = 0; i < firstDay; i++) {
    const d = prevMonthDays - firstDay + 1 + i;
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    week.push({ day: d, month: pm, year: py, current: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    week.push({ day: d, month, year, current: true });
    if (week.length === 7) {
      rows.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    let nextD = 1;
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    while (week.length < 7) {
      week.push({ day: nextD++, month: nm, year: ny, current: false });
    }
    rows.push(week);
  }

  return rows;
}

function ClassDatePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(6); // July (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const rows = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const isDisabled = useCallback((y: number, m: number, d: number) => {
    return DISABLED_DATES_CLASS.has(toDateStr(y, m, d));
  }, []);

  const handleSelect = useCallback((y: number, m: number, d: number) => {
    if (isDisabled(y, m, d)) return;
    setSelectedDate(toDateStr(y, m, d));
  }, [isDisabled]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    onSubmit({
      type: 'date',
      value: selectedDate,
      raw: {
        widget_id: 'class_date',
        selected_date: selectedDate,
        view_month: viewMonth,
        view_year: viewYear,
      },
    });
  }, [selectedDate, onSubmit, viewMonth, viewYear]);

  return (
    <div data-widget-id="class_date">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center text-sm font-medium"
          style={{ color: '#0D9488' }}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-semibold" style={{ color: '#1f2937' }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center text-sm font-medium"
          style={{ color: '#0D9488' }}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#6b7280' }}>
            {d}
          </div>
        ))}
      </div>

      {rows.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((cell, ci) => {
            const dateStr = toDateStr(cell.year, cell.month, cell.day);
            const disabled = isDisabled(cell.year, cell.month, cell.day);
            const selected = selectedDate === dateStr;
            const isCurrent = cell.current;

            return (
              <button
                key={ci}
                onClick={() => isCurrent && handleSelect(cell.year, cell.month, cell.day)}
                disabled={!isCurrent || disabled}
                className={`
                  h-9 w-full text-sm flex items-center justify-center
                  ${!isCurrent ? 'opacity-0 pointer-events-none' : ''}
                  ${isCurrent && disabled ? 'text-gray-300 line-through cursor-not-allowed' : ''}
                  ${isCurrent && !disabled && !selected ? 'hover:bg-gray-100 cursor-pointer' : ''}
                `}
                style={
                  selected
                    ? { backgroundColor: '#0D9488', color: '#ffffff', borderRadius: 0 }
                    : { borderRadius: 0 }
                }
              >
                {isCurrent ? cell.day : ''}
              </button>
            );
          })}
        </div>
      ))}

      {selectedDate && (
        <div className="mt-3 text-xs text-center" style={{ color: '#6b7280' }}>
          Selected: {selectedDate}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="mt-4 w-full py-2 text-sm font-medium text-white disabled:opacity-40"
        style={{ backgroundColor: '#0D9488', borderRadius: 0 }}
      >
        Confirm Class Date
      </button>
    </div>
  );
}

export default function Page_fitness_class(props: GeneratedPageProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e3e6ed', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#ffffff' }} className="shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔧</span>
            <span className="text-base font-semibold" style={{ color: '#0D9488' }}>EchoServe</span>
          </div>
          <nav className="flex items-center gap-6 text-sm" style={{ color: '#4b5563' }}>
            <a href="#" className="hover:underline">Home</a>
            <a href="#" className="hover:underline">Services</a>
            <a href="#" className="hover:underline" style={{ color: '#0D9488', fontWeight: 600 }}>Book</a>
            <a href="#" className="hover:underline">Contact</a>
          </nav>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs" style={{ color: '#6b7280' }}>
              <span>📍</span>
              <span>90210</span>
            </div>
            <div className="w-7 h-7 flex items-center justify-center text-xs font-medium" style={{ backgroundColor: '#0D9488', color: '#ffffff', borderRadius: 0 }}>
              A
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&h=300&fit=crop"
          alt="Fitness class in session"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center" style={{ backgroundColor: 'rgba(13,148,136,0.55)' }}>
          <div className="max-w-6xl mx-auto px-6 w-full">
            <h1 className="text-2xl font-bold text-white">Book a Fitness Class</h1>
            <p className="text-sm text-white mt-1 opacity-90">Find and schedule your next workout session</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Request Card */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: 0 }} className="p-6 shadow-sm">
              <h2 className="text-base font-semibold mb-4" style={{ color: '#1f2937' }}>
                What do you need help with?
              </h2>
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { icon: '🏋️', label: 'Strength' },
                  { icon: '🧘', label: 'Yoga' },
                  { icon: '🚴', label: 'Cycling' },
                  { icon: '🏃', label: 'Cardio' },
                ].map((cat) => (
                  <button
                    key={cat.label}
                    className="flex flex-col items-center gap-1 py-3 text-xs border"
                    style={{ borderColor: '#e3e6ed', backgroundColor: '#feffff', borderRadius: 0, color: '#4b5563' }}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
                Describe your fitness goals
              </label>
              <textarea
                rows={3}
                className="w-full border text-sm p-2 mb-4"
                style={{ borderColor: '#e3e6ed', backgroundColor: '#fcfcfd', borderRadius: 0 }}
                placeholder="e.g. I want to improve flexibility and core strength..."
              />

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Location</label>
                  <input
                    type="text"
                    className="w-full border text-sm p-2"
                    style={{ borderColor: '#e3e6ed', backgroundColor: '#fcfcfd', borderRadius: 0 }}
                    placeholder="Enter your zip code"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Urgency</label>
                  <select
                    className="w-full border text-sm p-2"
                    style={{ borderColor: '#e3e6ed', backgroundColor: '#fcfcfd', borderRadius: 0, color: '#4b5563' }}
                  >
                    <option>Flexible</option>
                    <option>This week</option>
                    <option>ASAP</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Date Picker Widget */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: 0 }} className="p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#1f2937' }}>Select Class Date</h3>
              <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                Grayed-out dates are unavailable. Pick an open date for your session.
              </p>
              <ClassDatePicker onSubmit={props.onSubmit} />
            </div>

            {/* Filters */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: 0 }} className="p-4 shadow-sm">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-medium" style={{ color: '#6b7280' }}>Filters:</span>
                {['Morning', 'Afternoon', 'Evening', 'Beginner', 'Advanced'].map((f) => (
                  <button
                    key={f}
                    className="px-3 py-1 text-xs border"
                    style={{ borderColor: '#e3e6ed', color: '#4b5563', backgroundColor: '#feffff', borderRadius: 0 }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Provider Cards */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: '#1f2937' }}>Top Rated Instructors</h3>
              {[
                {
                  name: 'Sarah K.',
                  specialty: 'Yoga & Pilates',
                  rating: 4.9,
                  reviews: 142,
                  price: '$35/session',
                  img: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&h=300&fit=crop',
                },
                {
                  name: 'Mike R.',
                  specialty: 'Strength Training',
                  rating: 4.8,
                  reviews: 98,
                  price: '$40/session',
                  img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
                },
              ].map((provider) => (
                <div
                  key={provider.name}
                  className="flex gap-4 p-4 shadow-sm"
                  style={{ backgroundColor: '#ffffff', borderRadius: 0 }}
                >
                  <img
                    src={provider.img}
                    alt={provider.specialty}
                    className="w-28 h-20 object-cover"
                    style={{ borderRadius: 0 }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold" style={{ color: '#1f2937' }}>
                        {provider.name}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: '#0D9488' }}>
                        {provider.price}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: '#6b7280' }}>{provider.specialty}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs" style={{ color: '#F59E0B' }}>★</span>
                      <span className="text-xs font-medium" style={{ color: '#1f2937' }}>
                        {provider.rating}
                      </span>
                      <span className="text-xs" style={{ color: '#9ca3af' }}>
                        ({provider.reviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div style={{ backgroundColor: '#ffffff', borderRadius: 0 }} className="p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#1f2937' }}>Before & After</h3>
              <img
                src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=300&fit=crop"
                alt="Fitness transformation"
                className="w-full h-36 object-cover mb-3"
                style={{ borderRadius: 0 }}
              />
              <p className="text-xs" style={{ color: '#6b7280' }}>
                See the results our clients achieve with regular sessions.
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: 0 }} className="p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#1f2937' }}>Why EchoServe?</h3>
              <ul className="space-y-2">
                {[
                  'Verified & certified instructors',
                  'Flexible scheduling',
                  'Satisfaction guarantee',
                  '24/7 support',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs" style={{ color: '#4b5563' }}>
                    <span style={{ color: '#0D9488' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="p-4 border"
              style={{ borderColor: '#F59E0B', backgroundColor: '#FFFBEB', borderRadius: 0 }}
            >
              <p className="text-xs font-medium" style={{ color: '#92400e' }}>
                🛡️ Service Guarantee
              </p>
              <p className="text-xs mt-1" style={{ color: '#78716c' }}>
                Not satisfied? We'll rebook you with another instructor at no extra cost.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#ffffff' }} className="mt-8 border-t" >
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-4 gap-6 mb-4">
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#1f2937' }}>EchoServe</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>
                Connecting you with trusted fitness professionals since 2019.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#1f2937' }}>Support</p>
              <ul className="space-y-1">
                {['Help Center', 'Safety', 'Community'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-xs hover:underline" style={{ color: '#6b7280' }}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#1f2937' }}>Provider Info</p>
              <ul className="space-y-1">
                {['Verification', 'Insurance', 'Background Checks'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-xs hover:underline" style={{ color: '#6b7280' }}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#1f2937' }}>Legal</p>
              <ul className="space-y-1">
                {['Terms of Service', 'Privacy Policy', 'Cookie Policy'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-xs hover:underline" style={{ color: '#6b7280' }}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t pt-3 text-center">
            <p className="text-xs" style={{ color: '#9ca3af' }}>© 2025 EchoServe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
