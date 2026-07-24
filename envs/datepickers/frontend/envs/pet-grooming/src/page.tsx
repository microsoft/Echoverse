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

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function pad(n: number): string {
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
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfMonth(viewYear, viewMonth), [viewYear, viewMonth]);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const handleDayClick = useCallback((day: number) => {
    setSelectedDate({ year: viewYear, month: viewMonth, day });
  }, [viewYear, viewMonth]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    let h24 = hour;
    if (ampm === 'PM' && hour !== 12) h24 = hour + 12;
    if (ampm === 'AM' && hour === 12) h24 = 0;
    const iso = `${selectedDate.year}-${pad(selectedDate.month + 1)}-${pad(selectedDate.day)}T${pad(h24)}:${pad(minute)}:00`;
    onSubmit({
      type: 'datetime',
      value: iso,
      raw: {
        widget_id: widgetId,
        year: selectedDate.year,
        month: selectedDate.month + 1,
        day: selectedDate.day,
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

  const isSelected = (day: number) =>
    selectedDate !== null &&
    selectedDate.year === viewYear &&
    selectedDate.month === viewMonth &&
    selectedDate.day === day;

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div data-widget-id={widgetId} className="w-full max-w-md" style={{ background: '#fcfbfa', borderRadius: 0 }}>
      <div className="p-5">
        <h3 className="text-base font-medium mb-3" style={{ color: '#1a1a1a' }}>{label}</h3>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center text-sm"
            style={{ color: '#0D9488' }}
            aria-label="Previous month"
          >
            ◀
          </button>
          <span className="text-sm font-medium" style={{ color: '#333' }}>
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center text-sm"
            style={{ color: '#0D9488' }}
            aria-label="Next month"
          >
            ▶
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs py-1" style={{ color: '#888' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => (
            <div key={idx} className="flex items-center justify-center" style={{ height: 36 }}>
              {day !== null ? (
                <button
                  onClick={() => handleDayClick(day)}
                  className="w-8 h-8 flex items-center justify-center text-sm transition-colors"
                  style={{
                    background: isSelected(day) ? '#0D9488' : 'transparent',
                    color: isSelected(day) ? '#fff' : '#333',
                    borderRadius: 0,
                  }}
                >
                  {day}
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {/* Time selectors */}
        <div className="mt-4 flex items-center gap-2">
          <label className="text-xs" style={{ color: '#666' }}>Time:</label>
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="border text-sm px-2 py-1"
            style={{ borderColor: '#ddd', borderRadius: 0, background: '#fff' }}
          >
            {hours.map((h) => (
              <option key={h} value={h}>{pad(h)}</option>
            ))}
          </select>
          <span className="text-sm" style={{ color: '#666' }}>:</span>
          <select
            value={minute}
            onChange={(e) => setMinute(Number(e.target.value))}
            className="border text-sm px-2 py-1"
            style={{ borderColor: '#ddd', borderRadius: 0, background: '#fff' }}
          >
            {minutes.map((m) => (
              <option key={m} value={m}>{pad(m)}</option>
            ))}
          </select>
          <div className="flex">
            <button
              onClick={() => setAmpm('AM')}
              className="px-2 py-1 text-xs border"
              style={{
                background: ampm === 'AM' ? '#0D9488' : '#fff',
                color: ampm === 'AM' ? '#fff' : '#666',
                borderColor: '#ddd',
                borderRadius: 0,
              }}
            >
              AM
            </button>
            <button
              onClick={() => setAmpm('PM')}
              className="px-2 py-1 text-xs border border-l-0"
              style={{
                background: ampm === 'PM' ? '#0D9488' : '#fff',
                color: ampm === 'PM' ? '#fff' : '#666',
                borderColor: '#ddd',
                borderRadius: 0,
              }}
            >
              PM
            </button>
          </div>
        </div>

        {/* Selected summary */}
        {selectedDate && (
          <div className="mt-3 text-xs" style={{ color: '#666' }}>
            Selected: {MONTHS[selectedDate.month]} {selectedDate.day}, {selectedDate.year} at {pad(hour)}:{pad(minute)} {ampm}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selectedDate}
          className="mt-4 w-full py-2 text-sm font-medium transition-colors"
          style={{
            background: selectedDate ? '#0D9488' : '#ccc',
            color: '#fff',
            borderRadius: 0,
            cursor: selectedDate ? 'pointer' : 'not-allowed',
          }}
        >
          Confirm Date &amp; Time
        </button>
      </div>
    </div>
  );
}

export default function Page_pet_grooming(props: GeneratedPageProps) {
  return (
    <div className="min-h-screen" style={{ background: '#e7e6e5', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header className="w-full" style={{ background: '#fcfbfa', borderBottom: '1px solid #e7e6e5' }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔧</span>
              <span className="text-base font-medium" style={{ color: '#0D9488' }}>EchoServe</span>
            </div>
            <nav className="hidden md:flex items-center gap-5 text-sm" style={{ color: '#555' }}>
              <a href="#" className="hover:opacity-75">Home</a>
              <a href="#" className="hover:opacity-75">Services</a>
              <a href="#" className="hover:opacity-75">Book</a>
              <a href="#" className="hover:opacity-75">Contact</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 text-xs" style={{ color: '#888' }}>
              <span>📍</span>
              <span>10001</span>
            </div>
            <div className="w-7 h-7 flex items-center justify-center text-xs" style={{ background: '#0D9488', color: '#fff', borderRadius: 0 }}>
              A
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative" style={{ height: 220 }}>
        <img
          src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=400&fit=crop"
          alt="Home services"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white mb-1">Pet Grooming Services</h1>
            <p className="text-sm text-white opacity-90">Book professional grooming for your furry friend</p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search / filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8 p-4" style={{ background: '#f8f5f2', borderRadius: 0 }}>
          <input
            type="text"
            placeholder="Search services…"
            className="flex-1 min-w-48 px-3 py-2 text-sm border"
            style={{ borderColor: '#ddd', borderRadius: 0, background: '#fff' }}
            readOnly
          />
          <select className="px-3 py-2 text-sm border" style={{ borderColor: '#ddd', borderRadius: 0, background: '#fff' }}>
            <option>All Categories</option>
            <option>Grooming</option>
            <option>Bathing</option>
            <option>Nail Trim</option>
          </select>
          <select className="px-3 py-2 text-sm border" style={{ borderColor: '#ddd', borderRadius: 0, background: '#fff' }}>
            <option>Sort by: Relevance</option>
            <option>Price: Low to High</option>
            <option>Rating</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: booking form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Context card */}
            <div className="p-5" style={{ background: '#fcfbfa', borderRadius: 0 }}>
              <h2 className="text-lg font-medium mb-2" style={{ color: '#1a1a1a' }}>Book a Grooming Appointment</h2>
              <p className="text-sm" style={{ color: '#666' }}>
                Choose a convenient date and time for your pet's grooming session. Our certified groomers handle all breeds and coat types.
              </p>
            </div>

            {/* Service description */}
            <div className="p-5" style={{ background: '#fcfbfa', borderRadius: 0 }}>
              <label className="block text-sm font-medium mb-2" style={{ color: '#333' }}>Service Description</label>
              <textarea
                className="w-full border px-3 py-2 text-sm"
                style={{ borderColor: '#ddd', borderRadius: 0, background: '#fff', minHeight: 80 }}
                placeholder="Describe what your pet needs (e.g., full groom, bath only, nail trim)…"
                readOnly
              />
              <div className="flex flex-wrap gap-3 mt-3">
                <div className="flex-1 min-w-36">
                  <label className="block text-xs mb-1" style={{ color: '#888' }}>Location</label>
                  <input
                    type="text"
                    placeholder="Your address"
                    className="w-full border px-3 py-2 text-sm"
                    style={{ borderColor: '#ddd', borderRadius: 0, background: '#fff' }}
                    readOnly
                  />
                </div>
                <div className="min-w-28">
                  <label className="block text-xs mb-1" style={{ color: '#888' }}>Urgency</label>
                  <select className="w-full border px-3 py-2 text-sm" style={{ borderColor: '#ddd', borderRadius: 0, background: '#fff' }}>
                    <option>Flexible</option>
                    <option>Within a week</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* DateTime picker widget */}
            <DateTimePicker
              widgetId="grooming_datetime"
              label="Select Grooming Date & Time"
              initialYear={2025}
              initialMonth={6}
              onSubmit={props.onSubmit}
            />
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Provider card 1 */}
            <div style={{ background: '#fcfbfa', borderRadius: 0 }} className="overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&h=300&fit=crop"
                alt="Pet grooming service"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h4 className="text-sm font-medium" style={{ color: '#1a1a1a' }}>Pawsome Groomers</h4>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs" style={{ color: '#F59E0B' }}>★★★★★</span>
                  <span className="text-xs" style={{ color: '#888' }}>4.9 (128 reviews)</span>
                </div>
                <p className="text-xs mt-2" style={{ color: '#666' }}>Full grooming, bathing, nail trim, ear cleaning. All breeds welcome.</p>
                <p className="text-sm font-medium mt-2" style={{ color: '#0D9488' }}>From $45</p>
              </div>
            </div>

            {/* Provider card 2 */}
            <div style={{ background: '#fcfbfa', borderRadius: 0 }} className="overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop"
                alt="Happy pet dog"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h4 className="text-sm font-medium" style={{ color: '#1a1a1a' }}>Happy Tails Spa</h4>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs" style={{ color: '#F59E0B' }}>★★★★☆</span>
                  <span className="text-xs" style={{ color: '#888' }}>4.7 (85 reviews)</span>
                </div>
                <p className="text-xs mt-2" style={{ color: '#666' }}>Luxury pet spa with organic shampoos. Specializes in anxious pets.</p>
                <p className="text-sm font-medium mt-2" style={{ color: '#0D9488' }}>From $55</p>
              </div>
            </div>

            {/* Price estimate */}
            <div className="p-4" style={{ background: '#f8f5f2', borderRadius: 0 }}>
              <h4 className="text-sm font-medium mb-2" style={{ color: '#333' }}>Price Estimates</h4>
              <div className="space-y-2 text-xs" style={{ color: '#666' }}>
                <div className="flex justify-between"><span>Bath &amp; Brush</span><span style={{ color: '#333' }}>$30–$50</span></div>
                <div className="flex justify-between"><span>Full Groom</span><span style={{ color: '#333' }}>$45–$75</span></div>
                <div className="flex justify-between"><span>Nail Trim</span><span style={{ color: '#333' }}>$15–$20</span></div>
                <div className="flex justify-between"><span>De-shedding Treatment</span><span style={{ color: '#333' }}>$40–$60</span></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12" style={{ background: '#fcfbfa', borderTop: '1px solid #e7e6e5' }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs" style={{ color: '#888' }}>
            <div>
              <h5 className="font-medium mb-2" style={{ color: '#333' }}>Service Guarantee</h5>
              <p>All groomers are vetted, insured, and background-checked. Satisfaction guaranteed or your money back.</p>
            </div>
            <div>
              <h5 className="font-medium mb-2" style={{ color: '#333' }}>Provider Verification</h5>
              <p>Every provider completes our certification program and maintains a minimum 4.5 star rating.</p>
            </div>
            <div>
              <h5 className="font-medium mb-2" style={{ color: '#333' }}>Need Help?</h5>
              <p>Visit our Help Center or email support@servicepro.com. Available 7 days a week.</p>
            </div>
          </div>
          <div className="mt-6 pt-4 flex flex-wrap gap-4 text-xs" style={{ borderTop: '1px solid #e7e6e5', color: '#aaa' }}>
            <span>© 2025 EchoServe</span>
            <a href="#" className="hover:opacity-75">Terms of Service</a>
            <a href="#" className="hover:opacity-75">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
