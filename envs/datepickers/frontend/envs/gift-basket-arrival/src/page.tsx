import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function pad(n: number) { return n.toString().padStart(2, '0'); }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }

function buildCells(y: number, m: number): (number | null)[] {
  const first = getFirstDay(y, m);
  const total = getDaysInMonth(y, m);
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

function isDateBefore(y1: number, m1: number, d1: number, y2: number, m2: number, d2: number) {
  if (y1 < y2) return true;
  if (y1 === y2 && m1 < m2) return true;
  if (y1 === y2 && m1 === m2 && d1 < d2) return true;
  return false;
}

/* ═══════════ Widget 1: Arrival Date (constrained, future_only) ═══════════ */
function ArrivalDatePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // June = index 5
  const [selected, setSelected] = useState<{ y: number; m: number; d: number } | null>(null);

  const minDate = { y: 2025, m: 5, d: 1 }; // 2025-06-01

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const isDisabled = useCallback((d: number) => {
    return isDateBefore(year, month, d, minDate.y, minDate.m, minDate.d);
  }, [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const isSelected = useCallback((d: number) =>
    selected !== null && selected.y === year && selected.m === month && selected.d === d,
  [selected, year, month]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    const iso = toISO(selected.y, selected.m, selected.d);
    onSubmit({ type: 'date', value: iso, raw: { widget_id: 'arrival_date', year: selected.y, month: selected.m + 1, day: selected.d } });
  }, [selected, onSubmit]);

  return (
    <div data-widget-id="arrival_date" style={{ background: '#25223b', borderRadius: '8px' }} className="p-4">
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#849dce', fontFamily: 'Georgia, serif' }}>Select Arrival Date</h3>
      <p className="text-xs mb-3" style={{ color: '#849dce', opacity: 0.7 }}>Only future dates from June 1, 2025 onward</p>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-2 py-1 text-sm font-bold" style={{ color: '#849dce', background: '#3d3d54', borderRadius: '8px' }}>◀</button>
        <span className="text-sm font-semibold" style={{ color: '#849dce' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-2 py-1 text-sm font-bold" style={{ color: '#849dce', background: '#3d3d54', borderRadius: '8px' }}>▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold" style={{ color: '#849dce', opacity: 0.6 }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const disabled = isDisabled(day);
          const sel = isSelected(day);
          return (
            <button
              key={`d-${i}`}
              disabled={disabled}
              onClick={() => !disabled && setSelected({ y: year, m: month, d: day })}
              className="text-center text-xs py-1.5 transition-colors"
              style={{
                borderRadius: '8px',
                background: sel ? '#849dce' : 'transparent',
                color: sel ? '#0c0b21' : disabled ? '#454a61' : '#849dce',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                fontWeight: sel ? 700 : 400,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="text-xs mt-2" style={{ color: '#849dce' }}>
          Selected: {MONTHS[selected.m]} {selected.d}, {selected.y}
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="w-full mt-3 py-2 text-sm font-semibold transition-colors"
        style={{
          borderRadius: '8px',
          background: selected ? '#849dce' : '#3d3d54',
          color: selected ? '#0c0b21' : '#454a61',
          cursor: selected ? 'pointer' : 'not-allowed',
        }}
      >
        Confirm Arrival Date
      </button>
    </div>
  );
}

/* ═══════════ Widget 2: Order Month (month_year selector) ═══════════ */
function OrderMonthPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState<{ y: number; m: number } | null>(null);

  const handleSubmit = useCallback(() => {
    if (!selectedMonth) return;
    const iso = `${selectedMonth.y}-${pad(selectedMonth.m + 1)}`;
    onSubmit({ type: 'month_year', value: iso, raw: { widget_id: 'order_month', year: selectedMonth.y, month: selectedMonth.m + 1 } });
  }, [selectedMonth, onSubmit]);

  return (
    <div data-widget-id="order_month" style={{ background: '#25223b', borderRadius: '8px' }} className="p-4">
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#849dce', fontFamily: 'Georgia, serif' }}>Select Order Month</h3>
      <p className="text-xs mb-3" style={{ color: '#849dce', opacity: 0.7 }}>Choose the month and year for your recurring order</p>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setYear(y => y - 1)} className="px-2 py-1 text-sm font-bold" style={{ color: '#849dce', background: '#3d3d54', borderRadius: '8px' }}>◀</button>
        <span className="text-sm font-semibold" style={{ color: '#849dce' }}>{year}</span>
        <button onClick={() => setYear(y => y + 1)} className="px-2 py-1 text-sm font-bold" style={{ color: '#849dce', background: '#3d3d54', borderRadius: '8px' }}>▶</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTH_SHORT.map((m, idx) => {
          const sel = selectedMonth !== null && selectedMonth.y === year && selectedMonth.m === idx;
          return (
            <button
              key={m}
              onClick={() => setSelectedMonth({ y: year, m: idx })}
              className="py-2 text-sm font-medium transition-colors"
              style={{
                borderRadius: '8px',
                background: sel ? '#849dce' : '#3d3d54',
                color: sel ? '#0c0b21' : '#849dce',
                fontWeight: sel ? 700 : 400,
              }}
            >
              {m}
            </button>
          );
        })}
      </div>
      {selectedMonth && (
        <p className="text-xs mt-3" style={{ color: '#849dce' }}>
          Selected: {MONTHS[selectedMonth.m]} {selectedMonth.y}
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={!selectedMonth}
        className="w-full mt-3 py-2 text-sm font-semibold transition-colors"
        style={{
          borderRadius: '8px',
          background: selectedMonth ? '#849dce' : '#3d3d54',
          color: selectedMonth ? '#0c0b21' : '#454a61',
          cursor: selectedMonth ? 'pointer' : 'not-allowed',
        }}
      >
        Confirm Order Month
      </button>
    </div>
  );
}

/* ═══════════ Widget 3: Compound (constrained date + month_year) ═══════════ */
function CompoundPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // June
  const [selected, setSelected] = useState<{ y: number; m: number; d: number } | null>(null);

  const minDate = { y: 2025, m: 5, d: 1 };
  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const isDisabled = useCallback((d: number) => {
    return isDateBefore(year, month, d, minDate.y, minDate.m, minDate.d);
  }, [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const isSelected = useCallback((d: number) =>
    selected !== null && selected.y === year && selected.m === month && selected.d === d,
  [selected, year, month]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    const iso = toISO(selected.y, selected.m, selected.d);
    onSubmit({ type: 'date', value: iso, raw: { widget_id: 'compound', year: selected.y, month: selected.m + 1, day: selected.d } });
  }, [selected, onSubmit]);

  return (
    <div data-widget-id="compound" style={{ background: '#25223b', borderRadius: '8px' }} className="p-4">
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#849dce', fontFamily: 'Georgia, serif' }}>Arrival Date + Order Month</h3>
      <p className="text-xs mb-3" style={{ color: '#849dce', opacity: 0.7 }}>Select a date for your gift basket delivery</p>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-2 py-1 text-sm font-bold" style={{ color: '#849dce', background: '#3d3d54', borderRadius: '8px' }}>◀</button>
        <span className="text-sm font-semibold" style={{ color: '#849dce' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-2 py-1 text-sm font-bold" style={{ color: '#849dce', background: '#3d3d54', borderRadius: '8px' }}>▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold" style={{ color: '#849dce', opacity: 0.6 }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const disabled = isDisabled(day);
          const sel = isSelected(day);
          return (
            <button
              key={`d-${i}`}
              disabled={disabled}
              onClick={() => !disabled && setSelected({ y: year, m: month, d: day })}
              className="text-center text-xs py-1.5 transition-colors"
              style={{
                borderRadius: '8px',
                background: sel ? '#849dce' : 'transparent',
                color: sel ? '#0c0b21' : disabled ? '#454a61' : '#849dce',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                fontWeight: sel ? 700 : 400,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="text-xs mt-2" style={{ color: '#849dce' }}>
          Selected: {MONTHS[selected.m]} {selected.d}, {selected.y}
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="w-full mt-3 py-2 text-sm font-semibold transition-colors"
        style={{
          borderRadius: '8px',
          background: selected ? '#849dce' : '#3d3d54',
          color: selected ? '#0c0b21' : '#454a61',
          cursor: selected ? 'pointer' : 'not-allowed',
        }}
      >
        Confirm Selection
      </button>
    </div>
  );
}

/* ═══════════ Main Page Component ═══════════ */
export default function Page_gift_basket_arrival(props: GeneratedPageProps) {
  const [speed, setSpeed] = useState<'standard' | 'express' | 'sameday'>('standard');
  const [filter, setFilter] = useState<'all' | 'food' | 'flowers' | 'wine'>('all');

  const orderItems = [
    { name: 'Artisan Cheese Selection', qty: 1, price: 34.99, cat: 'food' },
    { name: 'Premium Flower Bouquet', qty: 1, price: 49.99, cat: 'flowers' },
    { name: 'Red Wine Duo', qty: 1, price: 59.99, cat: 'wine' },
    { name: 'Chocolate Truffle Box', qty: 2, price: 18.99, cat: 'food' },
  ];

  const filteredItems = filter === 'all' ? orderItems : orderItems.filter(it => it.cat === filter);
  const total = orderItems.reduce((s, it) => s + it.price * it.qty, 0);

  return (
    <div className="min-h-screen" style={{ background: '#0c0b21', fontFamily: "'Inter', sans-serif" }}>
      {/* ── Header ── */}
      <header style={{ background: '#131A22' }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <span className="text-lg font-bold" style={{ color: '#FF9900', fontFamily: 'Georgia, serif' }}>EchoShip</span>
          </div>
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <input
              type="text"
              placeholder="Search orders..."
              className="w-full px-3 py-1.5 text-sm"
              style={{ background: '#25223b', color: '#849dce', borderRadius: '8px', border: '1px solid #3d3d54' }}
            />
          </div>
          <nav className="flex items-center gap-4 text-sm" style={{ color: '#849dce' }}>
            {['Track', 'Orders', 'Schedule', 'Support'].map(item => (
              <a key={item} href="#" className="hover:underline" style={{ color: '#849dce' }}>{item}</a>
            ))}
            <span className="text-lg cursor-pointer">🛒</span>
            <span className="text-lg cursor-pointer">👤</span>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=400&fit=crop"
          alt="Gift basket packages"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center" style={{ background: 'linear-gradient(to right, #0c0b21ee, #0c0b2188)' }}>
          <div className="max-w-6xl mx-auto px-4 w-full">
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#849dce', fontFamily: 'Georgia, serif' }}>Gift Basket Arrival</h1>
            <p className="text-sm" style={{ color: '#849dce', opacity: 0.8 }}>Choose delivery dates for your curated gift baskets</p>
            <div className="flex items-center gap-3 mt-3">
              {['Ordered', 'Processing', 'Shipped', 'Delivered'].map((step, i) => (
                <React.Fragment key={step}>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: i < 2 ? '#849dce' : '#3d3d54', color: i < 2 ? '#0c0b21' : '#454a61' }}
                    >
                      {i < 2 ? '✓' : i + 1}
                    </div>
                    <span className="text-xs" style={{ color: i < 2 ? '#849dce' : '#454a61' }}>{step}</span>
                  </div>
                  {i < 3 && <div className="w-6 h-px" style={{ background: i < 1 ? '#849dce' : '#3d3d54' }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Left Column: Widgets ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Delivery Speed Selector */}
            <div style={{ background: '#25223b', borderRadius: '8px' }} className="p-4">
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#849dce', fontFamily: 'Georgia, serif' }}>Delivery Speed</h3>
              <div className="flex gap-2">
                {([
                  { key: 'standard' as const, label: 'Standard', sub: '5-7 days', price: 'Free' },
                  { key: 'express' as const, label: 'Express', sub: '2-3 days', price: '$9.99' },
                  { key: 'sameday' as const, label: 'Same-Day', sub: 'Today', price: '$19.99' },
                ]).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setSpeed(opt.key)}
                    className="flex-1 p-2 text-left transition-colors"
                    style={{
                      borderRadius: '8px',
                      border: `2px solid ${speed === opt.key ? '#849dce' : '#3d3d54'}`,
                      background: speed === opt.key ? '#3d3d54' : 'transparent',
                    }}
                  >
                    <span className="block text-sm font-semibold" style={{ color: '#849dce' }}>{opt.label}</span>
                    <span className="block text-xs" style={{ color: '#454a61' }}>{opt.sub} · {opt.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Address Confirmation */}
            <div style={{ background: '#25223b', borderRadius: '8px' }} className="p-4 flex items-center gap-3">
              <span className="text-xl">📍</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#849dce' }}>Delivery Address</p>
                <p className="text-xs" style={{ color: '#454a61' }}>742 Evergreen Terrace, Springfield, IL 62704</p>
              </div>
              <a href="#" className="ml-auto text-xs underline" style={{ color: '#849dce' }}>Change</a>
            </div>

            {/* Widget 1: Arrival Date */}
            <ArrivalDatePicker onSubmit={props.onSubmit} />

            {/* Widget 2: Order Month */}
            <OrderMonthPicker onSubmit={props.onSubmit} />

            {/* Widget 3: Compound */}
            <CompoundPicker onSubmit={props.onSubmit} />
          </div>

          {/* ── Right Column: Order Summary ── */}
          <div className="flex flex-col gap-4">
            {/* Order Summary Card */}
            <div style={{ background: '#25223b', borderRadius: '8px' }} className="p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#849dce', fontFamily: 'Georgia, serif' }}>Order Summary</h3>
              <div className="flex gap-3 mb-3">
                <img
                  src="https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=300&fit=crop"
                  alt="Flower bouquet in basket"
                  className="w-20 h-16 object-cover rounded-lg"
                />
                <img
                  src="https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&h=300&fit=crop"
                  alt="Wine bottle selection"
                  className="w-20 h-16 object-cover rounded-lg"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-1.5 mb-3">
                {(['all', 'food', 'flowers', 'wine'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="px-2.5 py-1 text-xs capitalize transition-colors"
                    style={{
                      borderRadius: '8px',
                      background: filter === f ? '#849dce' : '#3d3d54',
                      color: filter === f ? '#0c0b21' : '#849dce',
                      fontWeight: filter === f ? 700 : 400,
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Items Table */}
              <table className="w-full text-xs" style={{ color: '#849dce' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #3d3d54' }}>
                    <th className="text-left py-1.5 font-semibold">Item</th>
                    <th className="text-center py-1.5 font-semibold">Qty</th>
                    <th className="text-right py-1.5 font-semibold">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #3d3d54' }}>
                      <td className="py-1.5">{it.name}</td>
                      <td className="text-center py-1.5">{it.qty}</td>
                      <td className="text-right py-1.5">${(it.price * it.qty).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between mt-3 pt-2" style={{ borderTop: '1px solid #3d3d54' }}>
                <span className="text-sm font-semibold" style={{ color: '#849dce' }}>Total</span>
                <span className="text-sm font-bold" style={{ color: '#849dce' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery Map Placeholder */}
            <div style={{ background: '#25223b', borderRadius: '8px' }} className="p-4">
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#849dce', fontFamily: 'Georgia, serif' }}>Delivery Area</h3>
              <img
                src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=300&fit=crop"
                alt="Delivery truck on highway"
                className="w-full h-32 object-cover rounded-lg"
              />
              <p className="text-xs mt-2" style={{ color: '#454a61' }}>Estimated transit: Springfield Distribution Center → Your address</p>
            </div>

            {/* Estimated Arrival Indicator */}
            <div style={{ background: '#25223b', borderRadius: '8px' }} className="p-4">
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#849dce', fontFamily: 'Georgia, serif' }}>Estimated Arrival</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: '#4ade80' }} />
                <span className="text-xs" style={{ color: '#849dce' }}>On schedule — select a date above</span>
              </div>
              <p className="text-xs mt-1.5" style={{ color: '#454a61' }}>Delivery guaranteed by chosen date or full refund.</p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: '#131A22', borderTop: '1px solid #3d3d54' }} className="mt-8">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs" style={{ color: '#454a61' }}>
            <div>
              <p className="font-semibold mb-2" style={{ color: '#849dce' }}>Shipping</p>
              <p>Free standard shipping on orders $50+</p>
              <p>Express & same-day available</p>
              <p>International delivery to 40+ countries</p>
            </div>
            <div>
              <p className="font-semibold mb-2" style={{ color: '#849dce' }}>Returns</p>
              <p>30-day return policy</p>
              <p>Free return shipping</p>
              <p>Full refund guarantee</p>
            </div>
            <div>
              <p className="font-semibold mb-2" style={{ color: '#849dce' }}>Customer Service</p>
              <p>24/7 live chat support</p>
              <p>1-800-ECHOSHIP</p>
              <p>help@echoship.com</p>
            </div>
            <div>
              <p className="font-semibold mb-2" style={{ color: '#849dce' }}>Payment</p>
              <div className="flex gap-2 mt-1">
                {['💳', '🏦', '📱', '🪙'].map((badge, i) => (
                  <span key={i} className="text-base">{badge}</span>
                ))}
              </div>
              <p className="mt-1">Secure checkout with SSL encryption</p>
            </div>
          </div>
          <p className="text-center text-xs mt-4" style={{ color: '#3d3d54' }}>© 2025 EchoShip Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
