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

function pad(n: number) { return n < 10 ? '0' + n : '' + n; }
function toISO(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function getFirstDayOfMonth(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}

function isDateDisabled(
  y: number, m: number, d: number,
  disabledDates: Set<string>,
  disabledWeekdays: Set<number>,
) {
  const dow = new Date(y, m, d).getDay();
  if (disabledWeekdays.has(dow)) return true;
  if (disabledDates.has(toISO(y, m, d))) return true;
  return false;
}

/* ─── Reusable Calendar ─── */
function Calendar({
  widgetId,
  label,
  description,
  initialYear,
  initialMonth,
  disabledDates,
  disabledWeekdays,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  initialMonth: number;
  disabledDates: Set<string>;
  disabledWeekdays: Set<number>;
  onSubmit: GeneratedPageProps['onSubmit'];
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const cells = useMemo(() => {
    const total = getDaysInMonth(year, month);
    const first = getFirstDayOfMonth(year, month);
    const arr: (number | null)[] = Array(first).fill(null);
    for (let d = 1; d <= total; d++) arr.push(d);
    return arr;
  }, [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    onSubmit({
      type: 'date',
      value: selected,
      raw: { widget_id: widgetId, date: selected, year, month: month + 1 },
    });
  }, [selected, widgetId, year, month, onSubmit]);

  return (
    <div data-widget-id={widgetId} className="rounded-2xl p-6" style={{ background: '#f3f3f3' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#0c0b21' }}>{label}</h3>
      <p className="text-sm mb-4" style={{ color: '#495a6b' }}>{description}</p>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold"
          style={{ background: '#c7dce0', color: '#0c0b21' }}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="font-semibold text-sm" style={{ color: '#0c0b21' }}>
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold"
          style={{ background: '#c7dce0', color: '#0c0b21' }}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#495a6b' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const iso = toISO(year, month, day);
          const disabled = isDateDisabled(year, month, day, disabledDates, disabledWeekdays);
          const isSelected = selected === iso;
          return (
            <button
              key={iso}
              disabled={disabled}
              onClick={() => !disabled && setSelected(iso)}
              className={
                'h-9 rounded-full text-sm font-medium transition-colors ' +
                (disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSelected
                  ? 'text-white'
                  : 'hover:opacity-80 cursor-pointer')
              }
              style={
                disabled
                  ? { background: 'transparent' }
                  : isSelected
                  ? { background: '#0c0b21', color: '#fcfcfc' }
                  : { color: '#0c0b21' }
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Selection + submit */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm" style={{ color: '#495a6b' }}>
          {selected ? `Selected: ${selected}` : 'No date selected'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="px-5 py-2 rounded-full text-sm font-semibold transition-opacity"
          style={{
            background: selected ? '#FF9900' : '#c7dce0',
            color: selected ? '#fff' : '#495a6b',
            opacity: selected ? 1 : 0.6,
            cursor: selected ? 'pointer' : 'not-allowed',
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_furniture_delivery(props: GeneratedPageProps) {
  const HOLIDAYS = useMemo(() => new Set(['2025-01-01','2025-07-04','2025-12-25','2025-11-28']), []);
  const WEEKENDS = useMemo(() => new Set([0, 6]), []);
  const NO_DATES = useMemo(() => new Set<string>(), []);
  const NO_DAYS = useMemo(() => new Set<number>(), []);

  return (
    <div className="min-h-screen" style={{ background: '#0c0b21', fontFamily: 'system-ui, sans-serif' }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50" style={{ background: '#131A22' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <span className="text-xl font-bold" style={{ color: '#FF9900' }}>EchoShip</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {['Track', 'Orders', 'Schedule', 'Support'].map(item => (
              <a key={item} href="#" className="text-sm font-medium hover:underline" style={{ color: '#fcfcfc' }}>
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center rounded-full px-3 py-1.5 text-sm" style={{ background: '#fcfcfc' }}>
              <span style={{ color: '#495a6b' }}>Search orders…</span>
            </div>
            <span className="text-xl cursor-pointer" title="Cart">🛒</span>
            <span className="text-xl cursor-pointer" title="Account">👤</span>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: '#131A22' }}>
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=400&fit=crop"
          alt="Package delivery"
          className="w-full h-56 object-cover opacity-40"
        />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-6xl mx-auto px-4 w-full">
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#fcfcfc' }}>
              Schedule Your Furniture Delivery
            </h1>
            <p className="text-base" style={{ color: '#c7dce0' }}>
              Choose your preferred delivery and assembly dates below
            </p>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Calendar widgets */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Delivery speed selector */}
            <div className="rounded-2xl p-5" style={{ background: '#f3f3f3' }}>
              <h2 className="font-semibold text-sm mb-3" style={{ color: '#0c0b21' }}>Delivery Speed</h2>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Standard', sub: '5–7 business days', active: true },
                  { label: 'Express', sub: '2–3 business days', active: false },
                  { label: 'Same-Day', sub: 'Order by 2 PM', active: false },
                ].map(opt => (
                  <div
                    key={opt.label}
                    className="rounded-full px-4 py-2 text-sm font-medium cursor-pointer"
                    style={{
                      background: opt.active ? '#FF9900' : '#c7dce0',
                      color: opt.active ? '#fff' : '#0c0b21',
                    }}
                  >
                    {opt.label} <span className="opacity-70 text-xs ml-1">({opt.sub})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 1: Delivery Date */}
            <Calendar
              widgetId="delivery_date"
              label="📅 Delivery Date"
              description="Select a business day for your furniture delivery (weekends & holidays excluded)."
              initialYear={2025}
              initialMonth={7}
              disabledDates={HOLIDAYS}
              disabledWeekdays={WEEKENDS}
              onSubmit={props.onSubmit}
            />

            {/* Widget 2: Assembly Date */}
            <Calendar
              widgetId="assembly_date"
              label="🔧 Assembly Date"
              description="Choose a weekday for our team to assemble your furniture (Mon–Fri only)."
              initialYear={2025}
              initialMonth={6}
              disabledDates={NO_DATES}
              disabledWeekdays={WEEKENDS}
              onSubmit={props.onSubmit}
            />

            {/* Widget 3: Compound */}
            <Calendar
              widgetId="compound"
              label="📦 Delivery Date + Assembly Date"
              description="Pick a single date for combined delivery and assembly (business days, no holidays)."
              initialYear={2025}
              initialMonth={5}
              disabledDates={HOLIDAYS}
              disabledWeekdays={WEEKENDS}
              onSubmit={props.onSubmit}
            />
          </div>

          {/* Right: Order summary sidebar */}
          <aside className="lg:w-80 flex flex-col gap-5">
            {/* Order summary */}
            <div className="rounded-2xl p-5" style={{ background: '#f3f3f3' }}>
              <h2 className="font-semibold mb-4" style={{ color: '#0c0b21' }}>Order Summary</h2>
              <div className="flex gap-3 mb-3">
                <img
                  src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop"
                  alt="Furniture sofa"
                  className="w-20 h-16 object-cover rounded-lg"
                />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#0c0b21' }}>Modern 3-Seat Sofa</p>
                  <p className="text-xs" style={{ color: '#495a6b' }}>Color: Charcoal Grey</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#FF9900' }}>$849.00</p>
                </div>
              </div>
              <div className="flex gap-3 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=300&fit=crop"
                  alt="Delivery truck"
                  className="w-20 h-16 object-cover rounded-lg"
                />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#0c0b21' }}>White-Glove Delivery</p>
                  <p className="text-xs" style={{ color: '#495a6b' }}>Room of choice + assembly</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#FF9900' }}>$129.00</p>
                </div>
              </div>
              <hr className="my-3 border-gray-200" />
              <div className="flex justify-between text-sm" style={{ color: '#495a6b' }}>
                <span>Subtotal</span><span>$978.00</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: '#495a6b' }}>
                <span>Tax</span><span>$78.24</span>
              </div>
              <div className="flex justify-between text-sm font-bold mt-2" style={{ color: '#0c0b21' }}>
                <span>Total</span><span>$1,056.24</span>
              </div>
            </div>

            {/* Address */}
            <div className="rounded-2xl p-5" style={{ background: '#f3f3f3' }}>
              <h2 className="font-semibold mb-2" style={{ color: '#0c0b21' }}>Delivery Address</h2>
              <p className="text-sm" style={{ color: '#495a6b' }}>
                1234 Elm Street, Apt 5B<br />
                Brooklyn, NY 11201
              </p>
            </div>

            {/* Estimated arrival */}
            <div className="rounded-2xl p-5" style={{ background: '#c7dce0' }}>
              <h2 className="font-semibold mb-2" style={{ color: '#0c0b21' }}>Estimated Arrival</h2>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚚</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#0c0b21' }}>Standard Delivery</p>
                  <p className="text-xs" style={{ color: '#495a6b' }}>Select a date to see your timeline</p>
                </div>
              </div>
            </div>

            {/* Delivery map placeholder */}
            <div
              className="rounded-2xl overflow-hidden h-40 flex items-center justify-center"
              style={{ background: '#f3f3f3' }}
            >
              <div className="text-center">
                <span className="text-3xl">🗺️</span>
                <p className="text-xs mt-1" style={{ color: '#495a6b' }}>Delivery route map</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: '#131A22' }} className="mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#FF9900' }}>Shipping</h4>
              {['Delivery Options', 'Track Order', 'Shipping Rates'].map(t => (
                <a key={t} href="#" className="block text-xs mb-1 hover:underline" style={{ color: '#c7dce0' }}>{t}</a>
              ))}
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#FF9900' }}>Returns</h4>
              {['Return Policy', 'Start a Return', 'Refund Status'].map(t => (
                <a key={t} href="#" className="block text-xs mb-1 hover:underline" style={{ color: '#c7dce0' }}>{t}</a>
              ))}
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#FF9900' }}>Support</h4>
              {['Help Center', 'Contact Us', 'FAQ'].map(t => (
                <a key={t} href="#" className="block text-xs mb-1 hover:underline" style={{ color: '#c7dce0' }}>{t}</a>
              ))}
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#FF9900' }}>Payment</h4>
              <div className="flex gap-2 text-lg">
                <span>💳</span><span>🏦</span><span>📱</span>
              </div>
            </div>
          </div>
          <p className="text-center text-xs" style={{ color: '#495a6b' }}>
            © 2025 EchoShip Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
