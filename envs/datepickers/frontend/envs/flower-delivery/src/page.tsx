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
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const YEARS_DOB = Array.from({ length: 2015 - 1950 + 1 }, (_, i) => 1950 + i);

function pad(n: number) { return n.toString().padStart(2, '0'); }
function toISO(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }

function buildCells(y: number, m: number): (number | null)[] {
  const first = getFirstDay(y, m);
  const total = getDaysInMonth(y, m);
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

/* ─── Widget 1: Delivery Date & Time ─── */
function DeliveryDateTimePicker({
  onSubmit,
}: {
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(7); // August = index 7
  const [selectedDate, setSelectedDate] = useState<{ y: number; m: number; d: number } | null>(null);
  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  const cells = useMemo(() => buildCells(year, month), [year, month]);

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

  const isSelected = useCallback(
    (d: number) => selectedDate !== null && selectedDate.y === year && selectedDate.m === month && selectedDate.d === d,
    [selectedDate, year, month],
  );

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    const h24 = ampm === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    const iso = `${selectedDate.y}-${pad(selectedDate.m + 1)}-${pad(selectedDate.d)}T${pad(h24)}:${pad(minute)}:00`;
    onSubmit({
      type: 'datetime',
      value: iso,
      raw: {
        widget_id: 'delivery_datetime',
        year: selectedDate.y,
        month: selectedDate.m + 1,
        day: selectedDate.d,
        hour: h24,
        minute,
        ampm,
        iso,
      },
    });
  }, [selectedDate, hour, minute, ampm, onSubmit]);

  return (
    <div data-widget-id="delivery_datetime" className="rounded-xl overflow-hidden" style={{ backgroundColor: '#f9fafa', border: '2px solid #e4e1ee' }}>
      <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, #8c71ce, #2a0870)' }}>
        <h3 className="text-lg font-bold text-white">📅 Delivery Date & Time</h3>
        <p className="text-sm text-white opacity-90 mt-1">Select when you'd like your flowers delivered</p>
      </div>

      <div className="p-5">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm hover:opacity-80"
            style={{ backgroundColor: '#8c71ce' }}
            aria-label="Previous month"
          >‹</button>
          <span className="text-sm font-bold" style={{ color: '#2a0870' }}>{MONTHS[month]} {year}</span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm hover:opacity-80"
            style={{ backgroundColor: '#8c71ce' }}
            aria-label="Next month"
          >›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#8c71ce' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            if (d === null) return <div key={'e' + i} className="h-9" />;
            const sel = isSelected(d);
            return (
              <div key={i} className="flex items-center justify-center py-0.5">
                <button
                  onClick={() => handleSelect(d)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    sel ? 'text-white' : 'hover:opacity-80'
                  }`}
                  style={
                    sel
                      ? { backgroundColor: '#8c71ce', color: '#fff' }
                      : { color: '#2a0870' }
                  }
                >
                  {d}
                </button>
              </div>
            );
          })}
        </div>

        {/* Time selectors */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <label className="text-xs font-semibold" style={{ color: '#2a0870' }}>Time:</label>
          <select
            value={hour}
            onChange={e => setHour(Number(e.target.value))}
            className="rounded-lg px-2 py-1.5 text-sm outline-none"
            style={{ backgroundColor: '#f1f2f4', border: '1px solid #e4e1ee', color: '#2a0870' }}
          >
            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span className="text-sm font-bold" style={{ color: '#8c71ce' }}>:</span>
          <select
            value={minute}
            onChange={e => setMinute(Number(e.target.value))}
            className="rounded-lg px-2 py-1.5 text-sm outline-none"
            style={{ backgroundColor: '#f1f2f4', border: '1px solid #e4e1ee', color: '#2a0870' }}
          >
            {MINUTES.map(m => <option key={m} value={m}>{pad(m)}</option>)}
          </select>
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e4e1ee' }}>
            <button
              onClick={() => setAmpm('AM')}
              className="px-3 py-1.5 text-xs font-semibold transition-colors"
              style={ampm === 'AM' ? { backgroundColor: '#8c71ce', color: '#fff' } : { backgroundColor: '#f1f2f4', color: '#8c71ce' }}
            >AM</button>
            <button
              onClick={() => setAmpm('PM')}
              className="px-3 py-1.5 text-xs font-semibold transition-colors"
              style={ampm === 'PM' ? { backgroundColor: '#8c71ce', color: '#fff' } : { backgroundColor: '#f1f2f4', color: '#8c71ce' }}
            >PM</button>
          </div>
        </div>

        {selectedDate && (
          <div className="mt-3 text-xs" style={{ color: '#8c71ce' }}>
            Selected: <span className="font-semibold" style={{ color: '#2a0870' }}>
              {MONTHS[selectedDate.m]} {selectedDate.d}, {selectedDate.y} at {hour}:{pad(minute)} {ampm}
            </span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedDate}
          className="mt-4 w-full rounded-lg py-2.5 text-sm font-bold transition-opacity"
          style={{
            backgroundColor: selectedDate ? '#8c71ce' : '#e4e1ee',
            color: selectedDate ? '#fff' : '#999',
            cursor: selectedDate ? 'pointer' : 'not-allowed',
          }}
        >
          Confirm Delivery Date & Time
        </button>
      </div>
    </div>
  );
}

/* ─── Widget 2: Recipient Birthday (DOB) ─── */
function RecipientDOBPicker({
  onSubmit,
}: {
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}) {
  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(11); // December = index 11
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const maxD = useMemo(() => new Date(2025, 11, 31), []);

  const cells = useMemo(() => buildCells(viewYear, viewMonth), [viewYear, viewMonth]);

  const isDisabled = useCallback(
    (day: number) => {
      const d = new Date(viewYear, viewMonth, day);
      return d.getTime() > maxD.getTime();
    },
    [viewYear, viewMonth, maxD],
  );

  const handleYearChange = useCallback((y: number) => {
    setViewYear(y);
    setSelectedYear(y);
    setSelectedDay(null);
  }, []);

  const handleMonthChange = useCallback((m: number) => {
    setViewMonth(m);
    setSelectedMonth(m);
    setSelectedDay(null);
  }, []);

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  }, [viewMonth]);

  const handleDayClick = useCallback(
    (day: number) => {
      if (isDisabled(day)) return;
      setSelectedDay(day);
      setSelectedMonth(viewMonth);
      setSelectedYear(viewYear);
    },
    [isDisabled, viewMonth, viewYear],
  );

  const isSelected = useCallback(
    (day: number) => selectedDay === day && selectedMonth === viewMonth && selectedYear === viewYear,
    [selectedDay, selectedMonth, selectedYear, viewMonth, viewYear],
  );

  const selectedISO = useMemo(() => {
    if (selectedYear !== null && selectedMonth !== null && selectedDay !== null) {
      return toISO(selectedYear, selectedMonth, selectedDay);
    }
    return '';
  }, [selectedYear, selectedMonth, selectedDay]);

  const handleSubmit = useCallback(() => {
    if (!selectedISO) return;
    onSubmit({
      type: 'dob',
      value: selectedISO,
      raw: {
        widget_id: 'recipient_dob',
        year: selectedYear,
        month: selectedMonth !== null ? selectedMonth + 1 : null,
        day: selectedDay,
        iso: selectedISO,
      },
    });
  }, [selectedISO, selectedYear, selectedMonth, selectedDay, onSubmit]);

  return (
    <div data-widget-id="recipient_dob" className="rounded-xl overflow-hidden" style={{ backgroundColor: '#f9fafa', border: '2px solid #e4e1ee' }}>
      <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, #8c71ce, #2a0870)' }}>
        <h3 className="text-lg font-bold text-white">🎂 Recipient Birthday</h3>
        <p className="text-sm text-white opacity-90 mt-1">Enter the recipient's date of birth for a personalized card</p>
      </div>

      <div className="p-5">
        {/* Year & Month dropdowns */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1" style={{ color: '#2a0870' }}>Year</label>
            <select
              value={viewYear}
              onChange={e => handleYearChange(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: '#e4e1ee', color: '#2a0870' }}
            >
              {YEARS_DOB.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1" style={{ color: '#2a0870' }}>Month</label>
            <select
              value={viewMonth}
              onChange={e => handleMonthChange(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: '#e4e1ee', color: '#2a0870' }}
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm hover:opacity-80"
            style={{ backgroundColor: '#8c71ce' }}
            aria-label="Previous month"
          >‹</button>
          <span className="text-sm font-bold" style={{ color: '#2a0870' }}>{MONTHS[viewMonth]} {viewYear}</span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm hover:opacity-80"
            style={{ backgroundColor: '#8c71ce' }}
            aria-label="Next month"
          >›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#8c71ce' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            if (d === null) return <div key={'e' + i} className="h-9" />;
            const disabled = isDisabled(d);
            const sel = isSelected(d);
            return (
              <div key={i} className="flex items-center justify-center py-0.5">
                <button
                  disabled={disabled}
                  onClick={() => handleDayClick(d)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    disabled
                      ? 'opacity-30 cursor-not-allowed line-through'
                      : sel
                        ? 'text-white'
                        : 'hover:opacity-80'
                  }`}
                  style={
                    disabled
                      ? { color: '#999' }
                      : sel
                        ? { backgroundColor: '#8c71ce', color: '#fff' }
                        : { color: '#2a0870' }
                  }
                >
                  {d}
                </button>
              </div>
            );
          })}
        </div>

        {selectedISO && (
          <div className="mt-3 text-xs" style={{ color: '#8c71ce' }}>
            Selected: <span className="font-semibold" style={{ color: '#2a0870' }}>{selectedISO}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedISO}
          className="mt-4 w-full rounded-lg py-2.5 text-sm font-bold transition-opacity"
          style={{
            backgroundColor: selectedISO ? '#8c71ce' : '#e4e1ee',
            color: selectedISO ? '#fff' : '#999',
            cursor: selectedISO ? 'pointer' : 'not-allowed',
          }}
        >
          Confirm Birthday
        </button>
      </div>
    </div>
  );
}

/* ─── Widget 3: Compound (Date-only calendar) ─── */
function CompoundDatePicker({
  onSubmit,
}: {
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // June = index 5
  const [selected, setSelected] = useState<string | null>(null);

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const handleSelect = useCallback((d: number) => {
    setSelected(toISO(year, month, d));
  }, [year, month]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    onSubmit({
      type: 'date',
      value: selected,
      raw: {
        widget_id: 'compound',
        year,
        month: month + 1,
        selected,
      },
    });
  }, [selected, year, month, onSubmit]);

  return (
    <div data-widget-id="compound" className="rounded-xl overflow-hidden" style={{ backgroundColor: '#f9fafa', border: '2px solid #e4e1ee' }}>
      <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, #8c71ce, #2a0870)' }}>
        <h3 className="text-lg font-bold text-white">📋 Delivery & Birthday Summary</h3>
        <p className="text-sm text-white opacity-90 mt-1">Pick a preferred date for combined scheduling</p>
      </div>

      <div className="p-5">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm hover:opacity-80"
            style={{ backgroundColor: '#8c71ce' }}
            aria-label="Previous month"
          >‹</button>
          <span className="text-sm font-bold" style={{ color: '#2a0870' }}>{MONTHS[month]} {year}</span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm hover:opacity-80"
            style={{ backgroundColor: '#8c71ce' }}
            aria-label="Next month"
          >›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#8c71ce' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            if (d === null) return <div key={'e' + i} className="h-9" />;
            const iso = toISO(year, month, d);
            const sel = iso === selected;
            return (
              <div key={i} className="flex items-center justify-center py-0.5">
                <button
                  onClick={() => handleSelect(d)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    sel ? 'text-white' : 'hover:opacity-80'
                  }`}
                  style={
                    sel
                      ? { backgroundColor: '#8c71ce', color: '#fff' }
                      : { color: '#2a0870' }
                  }
                >
                  {d}
                </button>
              </div>
            );
          })}
        </div>

        {selected && (
          <div className="mt-3 text-xs" style={{ color: '#8c71ce' }}>
            Selected: <span className="font-semibold" style={{ color: '#2a0870' }}>{selected}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="mt-4 w-full rounded-lg py-2.5 text-sm font-bold transition-opacity"
          style={{
            backgroundColor: selected ? '#8c71ce' : '#e4e1ee',
            color: selected ? '#fff' : '#999',
            cursor: selected ? 'pointer' : 'not-allowed',
          }}
        >
          Confirm Date
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_flower_delivery(props: GeneratedPageProps) {
  const [speed, setSpeed] = useState<'standard' | 'express' | 'sameday'>('standard');
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Roses', 'Bouquets', 'Birthday', 'Sympathy'];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#2a0870', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* ── Header ── */}
      <header style={{ backgroundColor: '#131A22' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <span className="text-lg font-bold" style={{ color: '#FF9900' }}>EchoShip</span>
          </div>
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <input
              type="text"
              placeholder="Search flowers, bouquets..."
              className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: '#f1f2f4', color: '#2a0870', border: '1px solid #e4e1ee' }}
              readOnly
            />
          </div>
          <nav className="flex items-center gap-4 text-sm" style={{ color: '#ccc' }}>
            {['Track', 'Orders', 'Schedule', 'Support'].map(item => (
              <span key={item} className="hover:underline cursor-pointer">{item}</span>
            ))}
            <span className="ml-2 cursor-pointer">🛒</span>
            <span className="cursor-pointer">👤</span>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=400&fit=crop"
          alt="Package delivery"
          className="w-full h-56 object-cover"
        />
        <div className="absolute inset-0 flex items-center" style={{ background: 'linear-gradient(90deg, #2a0870ee 45%, transparent)' }}>
          <div className="max-w-6xl mx-auto px-4 w-full">
            <h1 className="text-3xl font-bold text-white">Choose Your Delivery Date</h1>
            <p className="text-sm mt-2" style={{ color: '#e4e1ee' }}>
              Fresh flowers delivered right to your door — schedule delivery, personalize with a birthday card, and more.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF9900' }} />
              <div className="h-0.5 w-16" style={{ backgroundColor: '#FF9900' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#e4e1ee' }} />
              <div className="h-0.5 w-16" style={{ backgroundColor: '#e4e1ee', opacity: 0.4 }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#e4e1ee', opacity: 0.4 }} />
              <span className="text-xs ml-2" style={{ color: '#e4e1ee' }}>Order → Schedule → Deliver</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Column: Context + Widgets ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery speed */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#f9fafa', border: '1px solid #e4e1ee' }}>
              <h2 className="text-sm font-bold mb-3" style={{ color: '#2a0870' }}>Delivery Speed</h2>
              <div className="flex gap-3">
                {([
                  { key: 'standard', label: 'Standard', sub: '3–5 days', price: 'Free' },
                  { key: 'express', label: 'Express', sub: '1–2 days', price: '$9.99' },
                  { key: 'sameday', label: 'Same-Day', sub: 'Today', price: '$19.99' },
                ] as const).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setSpeed(opt.key)}
                    className="flex-1 rounded-lg px-4 py-3 text-left text-sm transition-colors"
                    style={{
                      backgroundColor: speed === opt.key ? '#8c71ce' : '#f1f2f4',
                      color: speed === opt.key ? '#fff' : '#2a0870',
                      border: speed === opt.key ? '2px solid #8c71ce' : '1px solid #e4e1ee',
                    }}
                  >
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-xs opacity-80">{opt.sub}</div>
                    <div className="text-xs font-bold mt-1">{opt.price}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Address confirmation */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#f9fafa', border: '1px solid #e4e1ee' }}>
              <h2 className="text-sm font-bold mb-2" style={{ color: '#2a0870' }}>Delivery Address</h2>
              <p className="text-xs" style={{ color: '#8c71ce' }}>
                456 Bloom Street, Suite 2A · Portland, OR 97201
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: activeFilter === f ? '#8c71ce' : '#f1f2f4',
                    color: activeFilter === f ? '#fff' : '#8c71ce',
                    border: '1px solid #e4e1ee',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Widget 1: Delivery Date & Time */}
            <DeliveryDateTimePicker onSubmit={props.onSubmit} />

            {/* Widget 2: Recipient Birthday */}
            <RecipientDOBPicker onSubmit={props.onSubmit} />

            {/* Widget 3: Compound */}
            <CompoundDatePicker onSubmit={props.onSubmit} />

            {/* Delivery map placeholder */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e4e1ee' }}>
              <img
                src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=300&fit=crop"
                alt="Delivery truck on road"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="p-4" style={{ backgroundColor: '#f9fafa' }}>
                <p className="text-xs font-semibold" style={{ color: '#2a0870' }}>Estimated Delivery Route</p>
                <p className="text-xs mt-1" style={{ color: '#8c71ce' }}>Portland metro area — flowers kept fresh in climate-controlled transit</p>
              </div>
            </div>
          </div>

          {/* ── Right Column: Order Summary ── */}
          <div className="space-y-6">
            {/* Order summary */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#f9fafa', border: '1px solid #e4e1ee' }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#2a0870' }}>Order Summary</h3>
              <div className="space-y-3">
                {[
                  { name: 'Spring Rose Bouquet', qty: 1, price: '$49.99' },
                  { name: 'Lavender Arrangement', qty: 1, price: '$34.99' },
                  { name: 'Birthday Card Add-on', qty: 1, price: '$4.99' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-xs" style={{ color: '#2a0870', borderBottom: '1px solid #e4e1ee', paddingBottom: '8px' }}>
                    <span>{item.name} × {item.qty}</span>
                    <span className="font-semibold">{item.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 flex justify-between text-sm font-bold" style={{ borderTop: '2px solid #e4e1ee', color: '#2a0870' }}>
                <span>Total</span>
                <span style={{ color: '#FF9900' }}>$89.97</span>
              </div>
            </div>

            {/* Order items gallery */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e4e1ee' }}>
              <img
                src="https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=300&fit=crop"
                alt="Fresh flower bouquet"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="p-4" style={{ backgroundColor: '#f9fafa' }}>
                <p className="text-xs font-semibold" style={{ color: '#2a0870' }}>Spring Rose Bouquet</p>
                <p className="text-xs mt-1" style={{ color: '#8c71ce' }}>Hand-picked fresh roses, arranged beautifully</p>
              </div>
            </div>

            {/* Estimated arrival */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#f9fafa', border: '1px solid #e4e1ee' }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: '#2a0870' }}>Estimated Arrival</h3>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#FF9900' }} />
                <span className="text-xs" style={{ color: '#8c71ce' }}>
                  {speed === 'sameday' ? 'Today by 7 PM' : speed === 'express' ? 'Within 1–2 days' : 'Within 3–5 days'}
                </span>
              </div>
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#e4e1ee' }}>
                <div className="h-full rounded-full" style={{ width: speed === 'sameday' ? '80%' : speed === 'express' ? '50%' : '25%', backgroundColor: '#FF9900' }} />
              </div>
              <div className="flex justify-between text-xs mt-1" style={{ color: '#8c71ce' }}>
                <span>Ordered</span>
                <span>In Transit</span>
                <span>Delivered</span>
              </div>
            </div>

            {/* Wine add-on card */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e4e1ee' }}>
              <img
                src="https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&h=300&fit=crop"
                alt="Wine bottles"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="p-4" style={{ backgroundColor: '#f9fafa' }}>
                <p className="text-xs font-semibold" style={{ color: '#2a0870' }}>Add a Bottle of Wine?</p>
                <p className="text-xs mt-1" style={{ color: '#8c71ce' }}>Pair your flowers with premium wine — from $24.99</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: '#131A22', borderTop: '1px solid #e4e1ee' }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs" style={{ color: '#e4e1ee' }}>
            <div>
              <h4 className="font-bold text-white mb-2">Shipping</h4>
              <p>Free over $50</p>
              <p>Same-day available</p>
              <p>Climate-controlled</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Returns</h4>
              <p>Freshness guarantee</p>
              <p>Free replacements</p>
              <p>Refund in 3–5 days</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Support</h4>
              <p>24/7 Chat</p>
              <p>1-800-ECHO</p>
              <p>help@echoship.com</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Payment</h4>
              <p>EchoPay · EchoCard</p>
              <p>EchoWallet · EchoTap</p>
              <p>EchoLater available</p>
            </div>
          </div>
          <div className="mt-6 pt-4 text-center text-xs" style={{ color: '#8c71ce', borderTop: '1px solid #e4e1ee' }}>
            © 2025 EchoShip Flowers Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
