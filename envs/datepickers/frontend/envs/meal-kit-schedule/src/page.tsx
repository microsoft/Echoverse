import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const PRIMARY = '#4a8a26';
const SECONDARY = '#2f581e';
const BG = '#000100';
const ACCENT = '#1f2419';
const SURFACE = '#171513';
const NAV_BG = '#131A22';
const TEXT = '#f0f0f0';
const TEXT_MUTED = '#9ca3af';
const BORDER = '#2f581e';
const RADIUS = '8px';

function pad(n: number) { return n.toString().padStart(2, '0'); }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

function isFutureOnly(y: number, m: number, d: number, minDate: string | null): boolean {
  const iso = toISO(y, m, d);
  const today = new Date(2025, 0, 1);
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());
  if (iso < todayISO) return true;
  if (minDate && iso < minDate) return true;
  return false;
}

function buildCells(year: number, month: number): (number | null)[] {
  const f = firstDay(year, month);
  const total = daysInMonth(year, month);
  const arr: (number | null)[] = [];
  for (let i = 0; i < f; i++) arr.push(null);
  for (let d = 1; d <= total; d++) arr.push(d);
  return arr;
}

/* ─── Single Date Picker ─── */
function SingleDateWidget({
  widgetId,
  label,
  description,
  initialYear,
  initialMonth,
  minDate,
  futureOnly,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  initialMonth: number;
  minDate: string | null;
  futureOnly: boolean;
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const prev = useCallback(() => {
    setMonth(m => { if (m === 0) { setYear(y => y - 1); return 11; } return m - 1; });
  }, []);
  const next = useCallback(() => {
    setMonth(m => { if (m === 11) { setYear(y => y + 1); return 0; } return m + 1; });
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    const [sy, sm, sd] = selected.split('-').map(Number);
    onSubmit({ type: 'date', value: selected, raw: { widget_id: widgetId, year: sy, month: sm, day: sd, selectedDate: selected } });
  }, [selected, onSubmit, widgetId]);

  return (
    <div data-widget-id={widgetId} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: RADIUS }} className="p-4">
      <h3 className="text-base font-semibold mb-1" style={{ color: TEXT, fontFamily: 'Georgia, serif' }}>{label}</h3>
      <p className="text-xs mb-3" style={{ color: TEXT_MUTED }}>{description}</p>

      <div className="flex items-center justify-between mb-2">
        <button onClick={prev} className="w-7 h-7 flex items-center justify-center text-sm font-bold" style={{ background: ACCENT, color: TEXT, borderRadius: RADIUS }}>‹</button>
        <span className="text-sm font-medium" style={{ color: TEXT }}>{MONTHS[month]} {year}</span>
        <button onClick={next} className="w-7 h-7 flex items-center justify-center text-sm font-bold" style={{ background: ACCENT, color: TEXT, borderRadius: RADIUS }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-0 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-xs py-1 font-medium" style={{ color: TEXT_MUTED }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const iso = toISO(year, month, day);
          const disabled = futureOnly && isFutureOnly(year, month, day, minDate);
          const sel = selected === iso;
          return (
            <button
              key={iso}
              disabled={disabled}
              onClick={() => !disabled && setSelected(iso)}
              className={`h-8 text-sm flex items-center justify-center ${disabled ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
              style={{ background: sel ? PRIMARY : 'transparent', color: disabled ? '#555' : sel ? '#fff' : TEXT, borderRadius: RADIUS, fontWeight: sel ? 600 : 400 }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected && <p className="text-xs mt-2" style={{ color: PRIMARY }}>Selected: {selected}</p>}
      <button onClick={handleSubmit} disabled={!selected} className="mt-3 w-full py-2 text-sm font-semibold" style={{ background: selected ? PRIMARY : '#333', color: '#fff', borderRadius: RADIUS, opacity: selected ? 1 : 0.5 }}>
        Confirm Date
      </button>
    </div>
  );
}

/* ─── Range Date Picker ─── */
function RangeDateWidget({
  widgetId,
  label,
  description,
  initialYear,
  initialMonth,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  initialMonth: number;
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const prev = useCallback(() => {
    setMonth(m => { if (m === 0) { setYear(y => y - 1); return 11; } return m - 1; });
  }, []);
  const next = useCallback(() => {
    setMonth(m => { if (m === 11) { setYear(y => y + 1); return 0; } return m + 1; });
  }, []);

  const handleDayClick = useCallback((iso: string) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(iso);
      setEndDate(null);
    } else {
      if (iso < startDate) {
        setStartDate(iso);
        setEndDate(null);
      } else {
        setEndDate(iso);
      }
    }
  }, [startDate, endDate]);

  const isInRange = useCallback((iso: string) => {
    if (!startDate || !endDate) return false;
    return iso >= startDate && iso <= endDate;
  }, [startDate, endDate]);

  const handleSubmit = useCallback(() => {
    if (!startDate || !endDate) return;
    const value = `${startDate}_${endDate}`;
    onSubmit({ type: 'date_range', value, raw: { widget_id: widgetId, startDate, endDate } });
  }, [startDate, endDate, onSubmit, widgetId]);

  return (
    <div data-widget-id={widgetId} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: RADIUS }} className="p-4">
      <h3 className="text-base font-semibold mb-1" style={{ color: TEXT, fontFamily: 'Georgia, serif' }}>{label}</h3>
      <p className="text-xs mb-3" style={{ color: TEXT_MUTED }}>{description}</p>

      <div className="flex items-center justify-between mb-2">
        <button onClick={prev} className="w-7 h-7 flex items-center justify-center text-sm font-bold" style={{ background: ACCENT, color: TEXT, borderRadius: RADIUS }}>‹</button>
        <span className="text-sm font-medium" style={{ color: TEXT }}>{MONTHS[month]} {year}</span>
        <button onClick={next} className="w-7 h-7 flex items-center justify-center text-sm font-bold" style={{ background: ACCENT, color: TEXT, borderRadius: RADIUS }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-0 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-xs py-1 font-medium" style={{ color: TEXT_MUTED }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const iso = toISO(year, month, day);
          const isStart = startDate === iso;
          const isEnd = endDate === iso;
          const inRange = isInRange(iso);
          let bg = 'transparent';
          let fg = TEXT;
          let fw = 400;
          if (isStart || isEnd) { bg = PRIMARY; fg = '#fff'; fw = 600; }
          else if (inRange) { bg = SECONDARY; fg = '#fff'; }
          return (
            <button
              key={iso}
              onClick={() => handleDayClick(iso)}
              className="h-8 text-sm flex items-center justify-center cursor-pointer hover:opacity-80"
              style={{ background: bg, color: fg, borderRadius: RADIUS, fontWeight: fw }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 mt-2 text-xs" style={{ color: TEXT_MUTED }}>
        <span>Start: <span style={{ color: startDate ? PRIMARY : TEXT_MUTED }}>{startDate || '—'}</span></span>
        <span>End: <span style={{ color: endDate ? PRIMARY : TEXT_MUTED }}>{endDate || '—'}</span></span>
      </div>
      <button onClick={handleSubmit} disabled={!startDate || !endDate} className="mt-3 w-full py-2 text-sm font-semibold" style={{ background: startDate && endDate ? PRIMARY : '#333', color: '#fff', borderRadius: RADIUS, opacity: startDate && endDate ? 1 : 0.5 }}>
        Confirm Delivery Window
      </button>
    </div>
  );
}

/* ─── Compound Widget (single_date + range) ─── */
function CompoundWidget({
  widgetId,
  label,
  description,
  initialYear,
  initialMonth,
  minDate,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  initialMonth: number;
  minDate: string | null;
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const prev = useCallback(() => {
    setMonth(m => { if (m === 0) { setYear(y => y - 1); return 11; } return m - 1; });
  }, []);
  const next = useCallback(() => {
    setMonth(m => { if (m === 11) { setYear(y => y + 1); return 0; } return m + 1; });
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    const [sy, sm, sd] = selected.split('-').map(Number);
    onSubmit({ type: 'date', value: selected, raw: { widget_id: widgetId, year: sy, month: sm, day: sd, selectedDate: selected } });
  }, [selected, onSubmit, widgetId]);

  return (
    <div data-widget-id={widgetId} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: RADIUS }} className="p-4">
      <h3 className="text-base font-semibold mb-1" style={{ color: TEXT, fontFamily: 'Georgia, serif' }}>{label}</h3>
      <p className="text-xs mb-3" style={{ color: TEXT_MUTED }}>{description}</p>

      <div className="flex items-center justify-between mb-2">
        <button onClick={prev} className="w-7 h-7 flex items-center justify-center text-sm font-bold" style={{ background: ACCENT, color: TEXT, borderRadius: RADIUS }}>‹</button>
        <span className="text-sm font-medium" style={{ color: TEXT }}>{MONTHS[month]} {year}</span>
        <button onClick={next} className="w-7 h-7 flex items-center justify-center text-sm font-bold" style={{ background: ACCENT, color: TEXT, borderRadius: RADIUS }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-0 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-xs py-1 font-medium" style={{ color: TEXT_MUTED }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const iso = toISO(year, month, day);
          const disabled = isFutureOnly(year, month, day, minDate);
          const sel = selected === iso;
          return (
            <button
              key={iso}
              disabled={disabled}
              onClick={() => !disabled && setSelected(iso)}
              className={`h-8 text-sm flex items-center justify-center ${disabled ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
              style={{ background: sel ? PRIMARY : 'transparent', color: disabled ? '#555' : sel ? '#fff' : TEXT, borderRadius: RADIUS, fontWeight: sel ? 600 : 400 }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected && <p className="text-xs mt-2" style={{ color: PRIMARY }}>Selected: {selected}</p>}
      <button onClick={handleSubmit} disabled={!selected} className="mt-3 w-full py-2 text-sm font-semibold" style={{ background: selected ? PRIMARY : '#333', color: '#fff', borderRadius: RADIUS, opacity: selected ? 1 : 0.5 }}>
        Confirm Selection
      </button>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_meal_kit_schedule(props: GeneratedPageProps) {
  const [speed, setSpeed] = useState<string>('standard');
  const [filter, setFilter] = useState<string>('all');

  const orderItems = [
    { name: 'Mediterranean Bowl Kit', qty: 2, price: '$24.99', img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    { name: 'Farm Fresh Grocery Box', qty: 1, price: '$34.50', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop' },
    { name: 'Seasonal Flower Arrangement', qty: 1, price: '$19.99', img: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=300&fit=crop' },
  ];

  const filteredItems = filter === 'all' ? orderItems : orderItems.filter((_, i) => (filter === 'food' ? i < 2 : i === 2));

  return (
    <div style={{ background: BG, minHeight: '100vh', color: TEXT }}>
      {/* ─── NAV ─── */}
      <nav style={{ background: NAV_BG }} className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📦</span>
          <span className="text-lg font-bold" style={{ color: '#FF9900', fontFamily: 'Georgia, serif' }}>EchoShip</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-sm" style={{ color: TEXT_MUTED }}>
          <a href="#" className="hover:underline">Track</a>
          <a href="#" className="hover:underline">Orders</a>
          <a href="#" className="hover:underline" style={{ color: '#FF9900' }}>Schedule</a>
          <a href="#" className="hover:underline">Support</a>
        </div>
        <div className="flex items-center gap-3 text-sm" style={{ color: TEXT_MUTED }}>
          <span className="cursor-pointer">🔍</span>
          <span className="cursor-pointer">🛒</span>
          <span className="cursor-pointer">👤</span>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=400&fit=crop"
          alt="Package delivery"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center" style={{ background: 'linear-gradient(to right, rgba(0,1,0,0.85), transparent)' }}>
          <div className="px-6">
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: TEXT }}>Meal Kit Schedule</h1>
            <p className="text-sm" style={{ color: TEXT_MUTED }}>Choose your delivery dates and subscription window</p>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-3xl mx-auto px-4 py-4">

        {/* ─── Delivery Speed Selector ─── */}
        <div className="mb-4 p-3" style={{ background: SURFACE, borderRadius: RADIUS, border: `1px solid ${BORDER}` }}>
          <h2 className="text-sm font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Delivery Speed</h2>
          <div className="flex gap-2">
            {(['standard','express','same-day'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className="px-3 py-1.5 text-xs font-medium capitalize"
                style={{ background: speed === s ? PRIMARY : ACCENT, color: speed === s ? '#fff' : TEXT_MUTED, borderRadius: RADIUS }}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: TEXT_MUTED }}>
            <span>📍 123 Elm Street, Brooklyn, NY 11201</span>
            <span>|</span>
            <span style={{ color: PRIMARY }}>Order Total: $79.48</span>
          </div>
        </div>

        {/* ─── Estimated Arrival ─── */}
        <div className="mb-4 p-3 flex items-center gap-3" style={{ background: ACCENT, borderRadius: RADIUS }}>
          <img src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=300&fit=crop" alt="Delivery truck" className="w-16 h-12 object-cover" style={{ borderRadius: RADIUS }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: PRIMARY }}>Estimated Arrival</p>
            <p className="text-xs" style={{ color: TEXT_MUTED }}>
              {speed === 'same-day' ? 'Today by 9 PM' : speed === 'express' ? '1–2 business days' : '3–5 business days'}
            </p>
          </div>
        </div>

        {/* ─── WIDGET 1: Subscription Start ─── */}
        <div className="mb-4">
          <SingleDateWidget
            widgetId="start_date"
            label="📅 Subscription Start Date"
            description="Select when your meal kit subscription begins. Only future dates are available."
            initialYear={2025}
            initialMonth={6}
            minDate="2025-07-01"
            futureOnly={true}
            onSubmit={props.onSubmit}
          />
        </div>

        {/* ─── WIDGET 2: Delivery Window ─── */}
        <div className="mb-4">
          <RangeDateWidget
            widgetId="delivery_range"
            label="📦 Delivery Window"
            description="Click a start date, then click an end date to define your preferred delivery window."
            initialYear={2026}
            initialMonth={0}
            onSubmit={props.onSubmit}
          />
        </div>

        {/* ─── WIDGET 3: Compound ─── */}
        <div className="mb-4">
          <CompoundWidget
            widgetId="compound"
            label="🗓️ Subscription Start + Delivery Window"
            description="Pick a date from the calendar below."
            initialYear={2025}
            initialMonth={5}
            minDate="2025-06-01"
            onSubmit={props.onSubmit}
          />
        </div>

        {/* ─── Filter ─── */}
        <div className="mb-3 flex gap-2">
          {(['all','food','other'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className="px-3 py-1 text-xs capitalize" style={{ background: filter === f ? PRIMARY : ACCENT, color: filter === f ? '#fff' : TEXT_MUTED, borderRadius: RADIUS }}>
              {f}
            </button>
          ))}
        </div>

        {/* ─── Order Items Table ─── */}
        <div className="mb-4" style={{ background: SURFACE, borderRadius: RADIUS, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: ACCENT }}>
                <th className="text-left p-2 font-medium" style={{ color: TEXT_MUTED }}>Item</th>
                <th className="text-center p-2 font-medium" style={{ color: TEXT_MUTED }}>Qty</th>
                <th className="text-right p-2 font-medium" style={{ color: TEXT_MUTED }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${ACCENT}` }}>
                  <td className="p-2 flex items-center gap-2">
                    <img src={item.img} alt={item.name} className="w-8 h-8 object-cover" style={{ borderRadius: '4px' }} />
                    <span style={{ color: TEXT }}>{item.name}</span>
                  </td>
                  <td className="p-2 text-center" style={{ color: TEXT_MUTED }}>{item.qty}</td>
                  <td className="p-2 text-right" style={{ color: PRIMARY }}>{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── Delivery Map Placeholder ─── */}
        <div className="mb-4 p-3" style={{ background: SURFACE, borderRadius: RADIUS, border: `1px solid ${BORDER}` }}>
          <p className="text-xs font-semibold mb-1" style={{ color: TEXT, fontFamily: 'Georgia, serif' }}>Delivery Zone</p>
          <div className="flex items-center justify-center h-24" style={{ background: ACCENT, borderRadius: RADIUS }}>
            <span className="text-xs" style={{ color: TEXT_MUTED }}>📍 Brooklyn, NY — Zone A (map view)</span>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: NAV_BG }} className="px-4 py-4 mt-4">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-xs" style={{ color: TEXT_MUTED }}>
          <div>
            <p className="font-semibold mb-1" style={{ color: TEXT }}>Shipping</p>
            <p>Free on orders $50+</p>
            <p>Same-day available</p>
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: TEXT }}>Returns</p>
            <p>30-day guarantee</p>
            <p>Easy online returns</p>
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: TEXT }}>Support</p>
            <p>1-800-ECHOSHIP</p>
            <p>help@echoship.com</p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-3 pt-3 flex items-center justify-between text-xs" style={{ borderTop: `1px solid ${ACCENT}`, color: TEXT_MUTED }}>
          <span>© 2025 EchoShip Inc.</span>
          <div className="flex gap-2">
            <span>💳 EchoPay</span>
            <span>💳 EchoCard</span>
            <span>💳 EchoExpress</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
