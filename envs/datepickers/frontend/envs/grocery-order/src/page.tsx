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

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

const MIN_DATE = new Date(2025, 5, 1);

function isDateDisabled(year: number, month: number, day: number): boolean {
  const d = new Date(year, month, day);
  d.setHours(0, 0, 0, 0);
  const min = new Date(MIN_DATE);
  min.setHours(0, 0, 0, 0);
  return d < min;
}

function DeliverySlotPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(5);
  const [selectedDate, setSelectedDate] = useState<{ y: number; m: number; d: number } | null>(null);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express' | 'sameday'>('standard');

  const calendarGrid = useMemo(() => {
    const total = daysInMonth(viewYear, viewMonth);
    const start = firstDayOfMonth(viewYear, viewMonth);
    const cells: (number | null)[] = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const prevMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 0) { setViewYear(y => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 11) { setViewYear(y => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const handleDayClick = useCallback((day: number) => {
    if (isDateDisabled(viewYear, viewMonth, day)) return;
    setSelectedDate({ y: viewYear, m: viewMonth, d: day });
  }, [viewYear, viewMonth]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    const h24 = ampm === 'PM' ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    const iso = `${selectedDate.y}-${pad(selectedDate.m + 1)}-${pad(selectedDate.d)}T${pad(h24)}:${pad(minute)}:00`;
    onSubmit({
      type: 'datetime',
      value: iso,
      raw: {
        widget_id: 'delivery_slot',
        year: selectedDate.y,
        month: selectedDate.m + 1,
        day: selectedDate.d,
        hour: h24,
        minute,
        ampm,
        deliverySpeed,
        iso,
      },
    });
  }, [selectedDate, hour, minute, ampm, deliverySpeed, onSubmit]);

  const isToday = (day: number) => {
    const now = new Date(2025, 0, 1);
    return viewYear === now.getFullYear() && viewMonth === now.getMonth() && day === now.getDate();
  };

  const isSelected = (day: number) =>
    selectedDate !== null && selectedDate.y === viewYear && selectedDate.m === viewMonth && selectedDate.d === day;

  return (
    <div data-widget-id="delivery_slot" className="flex flex-col gap-6">
      {/* Delivery speed selector */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium" style={{ color: '#cfcfcc' }}>Delivery Speed</label>
        <div className="flex gap-3">
          {([
            { key: 'standard', label: 'Standard', sub: '3–5 days' },
            { key: 'express', label: 'Express', sub: '1–2 days' },
            { key: 'sameday', label: 'Same-Day', sub: 'Today' },
          ] as const).map(opt => (
            <button
              key={opt.key}
              onClick={() => setDeliverySpeed(opt.key)}
              className="flex-1 py-3 px-4 text-sm font-medium transition-all"
              style={{
                borderRadius: '9999px',
                background: deliverySpeed === opt.key ? '#ffffff' : 'rgba(255,255,255,0.06)',
                color: deliverySpeed === opt.key ? '#28252f' : '#cfcfcc',
                border: deliverySpeed === opt.key ? '2px solid #ffffff' : '2px solid rgba(255,255,255,0.1)',
              }}
            >
              <div>{opt.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="p-5" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '20px' }}>
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center text-lg font-bold transition-colors"
            style={{ borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', color: '#f5f5f6' }}
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="text-base font-semibold" style={{ color: '#ffffff' }}>
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center text-lg font-bold transition-colors"
            style={{ borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', color: '#f5f5f6' }}
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#cfcfcc' }}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarGrid.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} className="h-10" />;
            const disabled = isDateDisabled(viewYear, viewMonth, day);
            const selected = isSelected(day);
            const today = isToday(day);
            return (
              <button
                key={`d-${day}`}
                onClick={() => handleDayClick(day)}
                disabled={disabled}
                className="h-10 w-full flex items-center justify-center text-sm font-medium transition-all"
                style={{
                  borderRadius: '9999px',
                  background: selected ? '#ffffff' : today ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: disabled ? 'rgba(255,255,255,0.15)' : selected ? '#28252f' : '#f5f5f6',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontWeight: selected || today ? 700 : 400,
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time picker */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium" style={{ color: '#cfcfcc' }}>Select Time</label>
        <div className="flex items-center gap-3">
          <select
            value={hour}
            onChange={e => setHour(Number(e.target.value))}
            className="flex-1 py-2.5 px-4 text-sm appearance-none"
            style={{
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.06)',
              color: '#f5f5f6',
              border: '1.5px solid rgba(255,255,255,0.12)',
            }}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
              <option key={h} value={h}>{pad(h)}</option>
            ))}
          </select>
          <span className="text-lg font-bold" style={{ color: '#cfcfcc' }}>:</span>
          <select
            value={minute}
            onChange={e => setMinute(Number(e.target.value))}
            className="flex-1 py-2.5 px-4 text-sm appearance-none"
            style={{
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.06)',
              color: '#f5f5f6',
              border: '1.5px solid rgba(255,255,255,0.12)',
            }}
          >
            {[0, 15, 30, 45].map(m => (
              <option key={m} value={m}>{pad(m)}</option>
            ))}
          </select>
          <div className="flex" style={{ borderRadius: '9999px', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)' }}>
            {(['AM', 'PM'] as const).map(v => (
              <button
                key={v}
                onClick={() => setAmpm(v)}
                className="py-2.5 px-4 text-sm font-medium transition-all"
                style={{
                  borderRadius: '9999px',
                  background: ampm === v ? '#ffffff' : 'transparent',
                  color: ampm === v ? '#28252f' : '#cfcfcc',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected summary */}
      {selectedDate && (
        <div className="py-3 px-5 text-sm" style={{ borderRadius: '9999px', background: 'rgba(255,255,255,0.06)', color: '#f5f5f6' }}>
          📅&nbsp; {MONTHS[selectedDate.m]} {selectedDate.d}, {selectedDate.y} at {pad(hour)}:{pad(minute)} {ampm}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="w-full py-3.5 text-sm font-semibold transition-all"
        style={{
          borderRadius: '9999px',
          background: selectedDate ? '#ffffff' : 'rgba(255,255,255,0.08)',
          color: selectedDate ? '#28252f' : 'rgba(255,255,255,0.25)',
          cursor: selectedDate ? 'pointer' : 'not-allowed',
        }}
      >
        Confirm Delivery Slot
      </button>
    </div>
  );
}

export default function Page_grocery_order(props: GeneratedPageProps) {
  const orderItems = [
    { name: 'Organic Bananas', qty: 1, price: 2.49 },
    { name: 'Almond Milk 64oz', qty: 2, price: 4.99 },
    { name: 'Sourdough Bread', qty: 1, price: 5.29 },
    { name: 'Free-Range Eggs (12ct)', qty: 1, price: 6.49 },
    { name: 'Avocados (4pk)', qty: 1, price: 4.99 },
  ];

  const subtotal = orderItems.reduce((s, it) => s + it.qty * it.price, 0);

  return (
    <div className="min-h-screen font-sans" style={{ background: '#28252f', color: '#f5f5f6' }}>
      {/* Header */}
      <header className="w-full" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center text-lg font-bold" style={{ borderRadius: '9999px', background: '#FF9900', color: '#28252f' }}>G</div>
            <span className="text-base font-semibold" style={{ color: '#ffffff' }}>EchoGrocer</span>
          </div>
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="w-full py-2 px-5 text-sm" style={{ borderRadius: '9999px', background: 'rgba(255,255,255,0.06)', color: '#cfcfcc', border: '1.5px solid rgba(255,255,255,0.1)' }}>
              Search products...
            </div>
          </div>
          <div className="flex items-center gap-5">
            <span className="text-sm" style={{ color: '#cfcfcc' }}>My Account</span>
            <div className="relative">
              <span className="text-sm" style={{ color: '#cfcfcc' }}>Cart</span>
              <span
                className="absolute -top-2 -right-4 w-5 h-5 flex items-center justify-center text-xs font-bold"
                style={{ borderRadius: '9999px', background: '#FF9900', color: '#28252f' }}
              >
                5
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero heading */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>Schedule Your Delivery</h1>
          <p className="text-sm" style={{ color: '#cfcfcc' }}>
            Choose a delivery date and time that works for you. Your items are packed and ready to go.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left column — datepicker + delivery */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            {/* Address confirmation */}
            <div className="p-5" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: '#ffffff' }}>Delivery Address</h3>
                <button className="text-xs font-medium" style={{ color: '#FF9900' }}>Change</button>
              </div>
              <p className="text-sm" style={{ color: '#cfcfcc' }}>1234 Maple Street, Apt 5B</p>
              <p className="text-sm" style={{ color: '#cfcfcc' }}>Portland, OR 97201</p>
            </div>

            {/* Delivery slot widget */}
            <div className="p-6" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-lg font-bold mb-1" style={{ color: '#ffffff' }}>Delivery Slot</h2>
              <p className="text-xs mb-6" style={{ color: '#cfcfcc' }}>
                Pick a date and time for your grocery delivery.
              </p>
              <DeliverySlotPicker onSubmit={props.onSubmit} />
            </div>

            {/* Map placeholder */}
            <div
              className="flex items-center justify-center text-sm font-medium"
              style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.04)', height: 200, color: '#cfcfcc' }}
              role="img"
              aria-label="Delivery map placeholder (400x200)"
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-12 h-12 flex items-center justify-center text-xl"
                  style={{ borderRadius: '9999px', background: 'rgba(255,255,255,0.08)' }}
                  role="img"
                  aria-label="Delivery truck icon (48x48)"
                >
                  🚚
                </div>
                <span>Delivery route map</span>
              </div>
            </div>
          </div>

          {/* Right column — order summary */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Estimated arrival */}
            <div className="p-5" style={{ borderRadius: '20px', background: 'rgba(255,153,0,0.08)', border: '1px solid rgba(255,153,0,0.15)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 flex items-center justify-center text-base"
                  style={{ borderRadius: '9999px', background: 'rgba(255,153,0,0.15)' }}
                >
                  ⏱
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#ffffff' }}>Estimated Arrival</div>
                  <div className="text-xs" style={{ color: '#cfcfcc' }}>Based on selected delivery speed</div>
                </div>
              </div>
              <div className="h-2 mt-3 overflow-hidden" style={{ borderRadius: '9999px', background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full" style={{ width: '45%', borderRadius: '9999px', background: '#FF9900' }} />
              </div>
            </div>

            {/* Order items */}
            <div className="p-5" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#ffffff' }}>Order Items</h3>
              <div className="flex flex-col gap-3">
                {orderItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="flex-shrink-0 flex items-center justify-center text-xs font-medium"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background: `hsl(${i * 55 + 30}, 30%, 25%)`,
                        color: '#cfcfcc',
                      }}
                      role="img"
                      aria-label={`Product thumbnail for ${item.name} (120x120)`}
                    >
                      {item.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate" style={{ color: '#f5f5f6' }}>{item.name}</div>
                      <div className="text-xs" style={{ color: '#cfcfcc' }}>Qty: {item.qty}</div>
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#ffffff' }}>${(item.qty * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: '#cfcfcc' }}>Subtotal</span>
                  <span style={{ color: '#f5f5f6' }}>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: '#cfcfcc' }}>Delivery Fee</span>
                  <span style={{ color: '#f5f5f6' }}>$4.99</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: '#cfcfcc' }}>Tax</span>
                  <span style={{ color: '#f5f5f6' }}>${(subtotal * 0.08).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: '#ffffff' }}>Total</span>
                  <span style={{ color: '#ffffff' }}>${(subtotal + 4.99 + subtotal * 0.08).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Filters card */}
            <div className="p-5" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#ffffff' }}>Delivery Preferences</h3>
              <div className="flex flex-wrap gap-2">
                {['Leave at door', 'Ring bell', 'Contactless', 'Paper bags'].map(tag => (
                  <span
                    key={tag}
                    className="py-1.5 px-4 text-xs font-medium"
                    style={{ borderRadius: '9999px', background: 'rgba(255,255,255,0.06)', color: '#cfcfcc', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: '#cfcfcc' }}>Shipping</h4>
              <div className="flex flex-col gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span>Free over $35</span>
                <span>Same-day available</span>
                <span>Track your order</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: '#cfcfcc' }}>Returns</h4>
              <div className="flex flex-col gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span>Return policy</span>
                <span>Refund info</span>
                <span>Quality guarantee</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: '#cfcfcc' }}>Support</h4>
              <div className="flex flex-col gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span>Help center</span>
                <span>Live chat</span>
                <span>1-800-555-0199</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: '#cfcfcc' }}>Payment</h4>
              <div className="flex gap-2 mt-1">
                {['EchoPay', 'EchoCard', 'EchoExpress', 'EchoWallet'].map(badge => (
                  <span
                    key={badge}
                    className="py-1 px-2.5 text-xs font-medium"
                    style={{ borderRadius: '9999px', background: 'rgba(255,255,255,0.06)', color: '#cfcfcc' }}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © 2025 EchoGrocer. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
