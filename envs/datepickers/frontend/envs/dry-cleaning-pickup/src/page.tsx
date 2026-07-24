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
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function pad(n: number) { return n < 10 ? '0' + n : '' + n; }
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

function isWeekend(y: number, m: number, d: number) {
  const dow = new Date(y, m, d).getDay();
  return dow === 0 || dow === 6;
}

/* ─── Widget 1: Pickup Date & Time (weekdays only) ─── */
function PickupDateTimePicker({
  onSubmit,
}: {
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(6); // July = index 6
  const [selectedDate, setSelectedDate] = useState<{ y: number; m: number; d: number } | null>(null);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleSelect = useCallback((d: number) => {
    if (isWeekend(year, month, d)) return;
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
        widget_id: 'pickup_datetime',
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
    <div data-widget-id="pickup_datetime" className="rounded-xl overflow-hidden shadow-md" style={{ backgroundColor: '#fcfdfc', border: '1px solid #bacbeb' }}>
      <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, #4972e8, #3358c5)' }}>
        <h3 className="text-lg font-bold text-white">🕐 Pickup Date & Time</h3>
        <p className="text-sm text-white opacity-90 mt-1">Choose a weekday for garment pickup</p>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm hover:opacity-80" style={{ backgroundColor: '#4972e8' }} aria-label="Previous month">‹</button>
          <span className="text-sm font-bold" style={{ color: '#131A22' }}>{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm hover:opacity-80" style={{ backgroundColor: '#4972e8' }} aria-label="Next month">›</button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: '#4972e8' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={`e-${i}`} />;
            const disabled = isWeekend(year, month, d);
            const sel = isSelected(d);
            return (
              <button
                key={`d-${d}`}
                onClick={() => handleSelect(d)}
                disabled={disabled}
                className={`h-9 rounded-lg text-sm font-medium transition-all ${
                  disabled ? 'text-gray-300 cursor-not-allowed bg-gray-50' :
                  sel ? 'text-white shadow-md' :
                  'hover:bg-blue-50 text-gray-700'
                }`}
                style={sel ? { backgroundColor: '#FF9900' } : undefined}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* Time selectors */}
        <div className="mt-5 pt-4 border-t" style={{ borderColor: '#bacbeb' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#131A22' }}>Preferred Pickup Time</p>
          <div className="flex items-center gap-2">
            <select value={hour} onChange={e => setHour(Number(e.target.value))} className="rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: '#bacbeb' }}>
              {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="text-gray-400">:</span>
            <select value={minute} onChange={e => setMinute(Number(e.target.value))} className="rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: '#bacbeb' }}>
              {MINUTES.map(m => <option key={m} value={m}>{pad(m)}</option>)}
            </select>
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: '#bacbeb' }}>
              <button onClick={() => setAmpm('AM')} className={`px-3 py-1.5 text-xs font-semibold transition-all ${ampm === 'AM' ? 'text-white' : 'text-gray-500 bg-white'}`} style={ampm === 'AM' ? { backgroundColor: '#4972e8' } : undefined}>AM</button>
              <button onClick={() => setAmpm('PM')} className={`px-3 py-1.5 text-xs font-semibold transition-all ${ampm === 'PM' ? 'text-white' : 'text-gray-500 bg-white'}`} style={ampm === 'PM' ? { backgroundColor: '#4972e8' } : undefined}>PM</button>
            </div>
          </div>
        </div>

        {selectedDate && (
          <div className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: '#f8f9fb', color: '#4972e8' }}>
            Selected: {MONTHS[selectedDate.m]} {selectedDate.d}, {selectedDate.y} at {hour}:{pad(minute)} {ampm}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedDate}
          className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{ backgroundColor: '#FF9900' }}
        >
          Confirm Pickup
        </button>
      </div>
    </div>
  );
}

/* ─── Widget 2: Drop-off Date (no constraints) ─── */
function DropOffDatePicker({
  onSubmit,
}: {
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(8); // September = index 8
  const [selected, setSelected] = useState<string | null>(null);

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleSelect = useCallback((d: number) => {
    setSelected(toISO(year, month, d));
  }, [year, month]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    onSubmit({
      type: 'date',
      value: selected,
      raw: { widget_id: 'drop_date', year, month: month + 1, selected },
    });
  }, [selected, onSubmit, year, month]);

  const selectedParts = useMemo(() => {
    if (!selected) return null;
    const [y, m, d] = selected.split('-').map(Number);
    return { y, m, d };
  }, [selected]);

  return (
    <div data-widget-id="drop_date" className="rounded-xl overflow-hidden shadow-md" style={{ backgroundColor: '#fcfdfc', border: '1px solid #bacbeb' }}>
      <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, #4972e8, #3358c5)' }}>
        <h3 className="text-lg font-bold text-white">📅 Drop-off Date</h3>
        <p className="text-sm text-white opacity-90 mt-1">When should we return your clean garments?</p>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm hover:opacity-80" style={{ backgroundColor: '#4972e8' }} aria-label="Previous month">‹</button>
          <span className="text-sm font-bold" style={{ color: '#131A22' }}>{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm hover:opacity-80" style={{ backgroundColor: '#4972e8' }} aria-label="Next month">›</button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: '#4972e8' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={`e-${i}`} />;
            const sel = selectedParts !== null && selectedParts.y === year && (selectedParts.m - 1) === month && selectedParts.d === d;
            return (
              <button
                key={`d-${d}`}
                onClick={() => handleSelect(d)}
                className={`h-9 rounded-lg text-sm font-medium transition-all ${
                  sel ? 'text-white shadow-md' : 'hover:bg-blue-50 text-gray-700'
                }`}
                style={sel ? { backgroundColor: '#FF9900' } : undefined}
              >
                {d}
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: '#f8f9fb', color: '#4972e8' }}>
            Selected: {selectedParts ? `${MONTHS[selectedParts.m - 1]} ${selectedParts.d}, ${selectedParts.y}` : ''}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{ backgroundColor: '#FF9900' }}
        >
          Confirm Drop-off
        </button>
      </div>
    </div>
  );
}

/* ─── Widget 3: Compound — Pickup Date & Time + Drop-off Date ─── */
function CompoundPicker({
  onSubmit,
}: {
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}) {
  // Pickup (datetime, weekdays only)
  const [pYear, setPYear] = useState(2025);
  const [pMonth, setPMonth] = useState(5); // June = index 5
  const [pDate, setPDate] = useState<{ y: number; m: number; d: number } | null>(null);
  const [pHour, setPHour] = useState(9);
  const [pMinute, setPMinute] = useState(0);
  const [pAmpm, setPAmpm] = useState<'AM' | 'PM'>('AM');

  // Drop-off (single date, no constraints)
  const [dYear, setDYear] = useState(2025);
  const [dMonth, setDMonth] = useState(5);
  const [dSelected, setDSelected] = useState<string | null>(null);

  const pCells = useMemo(() => buildCells(pYear, pMonth), [pYear, pMonth]);
  const dCells = useMemo(() => buildCells(dYear, dMonth), [dYear, dMonth]);

  // Pickup nav
  const pPrev = useCallback(() => { if (pMonth === 0) { setPMonth(11); setPYear(y => y - 1); } else setPMonth(m => m - 1); }, [pMonth]);
  const pNext = useCallback(() => { if (pMonth === 11) { setPMonth(0); setPYear(y => y + 1); } else setPMonth(m => m + 1); }, [pMonth]);

  // Drop-off nav
  const dPrev = useCallback(() => { if (dMonth === 0) { setDMonth(11); setDYear(y => y - 1); } else setDMonth(m => m - 1); }, [dMonth]);
  const dNext = useCallback(() => { if (dMonth === 11) { setDMonth(0); setDYear(y => y + 1); } else setDMonth(m => m + 1); }, [dMonth]);

  const handlePSelect = useCallback((d: number) => {
    if (isWeekend(pYear, pMonth, d)) return;
    setPDate({ y: pYear, m: pMonth, d });
  }, [pYear, pMonth]);

  const handleDSelect = useCallback((d: number) => {
    setDSelected(toISO(dYear, dMonth, d));
  }, [dYear, dMonth]);

  const isPSelected = useCallback(
    (d: number) => pDate !== null && pDate.y === pYear && pDate.m === pMonth && pDate.d === d,
    [pDate, pYear, pMonth],
  );

  const dParts = useMemo(() => {
    if (!dSelected) return null;
    const [y, m, d] = dSelected.split('-').map(Number);
    return { y, m, d };
  }, [dSelected]);

  const handleSubmit = useCallback(() => {
    if (!pDate || !dSelected) return;
    const h24 = pAmpm === 'AM' ? (pHour === 12 ? 0 : pHour) : (pHour === 12 ? 12 : pHour + 12);
    const pickupISO = `${pDate.y}-${pad(pDate.m + 1)}-${pad(pDate.d)}T${pad(h24)}:${pad(pMinute)}:00`;
    const compoundValue = `${pickupISO}|${dSelected}`;
    onSubmit({
      type: 'date',
      value: compoundValue,
      raw: {
        widget_id: 'compound',
        pickup: { year: pDate.y, month: pDate.m + 1, day: pDate.d, hour: h24, minute: pMinute, ampm: pAmpm, iso: pickupISO },
        dropoff: { date: dSelected },
      },
    });
  }, [pDate, dSelected, pHour, pMinute, pAmpm, onSubmit]);

  return (
    <div data-widget-id="compound" className="rounded-xl overflow-hidden shadow-md" style={{ backgroundColor: '#fcfdfc', border: '1px solid #bacbeb' }}>
      <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, #4972e8, #3358c5)' }}>
        <h3 className="text-lg font-bold text-white">🔄 Pickup & Drop-off Schedule</h3>
        <p className="text-sm text-white opacity-90 mt-1">Set both pickup and return dates in one step</p>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pickup sub-calendar */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#FF9900' }}>Pickup Date & Time (Weekdays)</p>
            <div className="flex items-center justify-between mb-3">
              <button onClick={pPrev} className="w-7 h-7 flex items-center justify-center rounded-lg text-white font-bold text-xs hover:opacity-80" style={{ backgroundColor: '#4972e8' }} aria-label="Previous month">‹</button>
              <span className="text-sm font-bold" style={{ color: '#131A22' }}>{MONTHS[pMonth]} {pYear}</span>
              <button onClick={pNext} className="w-7 h-7 flex items-center justify-center rounded-lg text-white font-bold text-xs hover:opacity-80" style={{ backgroundColor: '#4972e8' }} aria-label="Next month">›</button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold py-0.5" style={{ color: '#4972e8' }}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {pCells.map((d, i) => {
                if (d === null) return <div key={`pe-${i}`} />;
                const disabled = isWeekend(pYear, pMonth, d);
                const sel = isPSelected(d);
                return (
                  <button
                    key={`pd-${d}`}
                    onClick={() => handlePSelect(d)}
                    disabled={disabled}
                    className={`h-8 rounded-lg text-xs font-medium transition-all ${
                      disabled ? 'text-gray-300 cursor-not-allowed bg-gray-50' :
                      sel ? 'text-white shadow-md' :
                      'hover:bg-blue-50 text-gray-700'
                    }`}
                    style={sel ? { backgroundColor: '#FF9900' } : undefined}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#131A22' }}>Time</p>
              <div className="flex items-center gap-1.5">
                <select value={pHour} onChange={e => setPHour(Number(e.target.value))} className="rounded-lg border px-1.5 py-1 text-xs" style={{ borderColor: '#bacbeb' }}>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="text-gray-400 text-xs">:</span>
                <select value={pMinute} onChange={e => setPMinute(Number(e.target.value))} className="rounded-lg border px-1.5 py-1 text-xs" style={{ borderColor: '#bacbeb' }}>
                  {MINUTES.map(m => <option key={m} value={m}>{pad(m)}</option>)}
                </select>
                <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: '#bacbeb' }}>
                  <button onClick={() => setPAmpm('AM')} className={`px-2 py-1 text-xs font-semibold ${pAmpm === 'AM' ? 'text-white' : 'text-gray-500 bg-white'}`} style={pAmpm === 'AM' ? { backgroundColor: '#4972e8' } : undefined}>AM</button>
                  <button onClick={() => setPAmpm('PM')} className={`px-2 py-1 text-xs font-semibold ${pAmpm === 'PM' ? 'text-white' : 'text-gray-500 bg-white'}`} style={pAmpm === 'PM' ? { backgroundColor: '#4972e8' } : undefined}>PM</button>
                </div>
              </div>
            </div>
            {pDate && (
              <div className="mt-2 text-xs px-2 py-1.5 rounded-lg" style={{ backgroundColor: '#f8f9fb', color: '#4972e8' }}>
                Pickup: {MONTHS[pDate.m]} {pDate.d}, {pDate.y} at {pHour}:{pad(pMinute)} {pAmpm}
              </div>
            )}
          </div>

          {/* Drop-off sub-calendar */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#FF9900' }}>Drop-off Date (Any Day)</p>
            <div className="flex items-center justify-between mb-3">
              <button onClick={dPrev} className="w-7 h-7 flex items-center justify-center rounded-lg text-white font-bold text-xs hover:opacity-80" style={{ backgroundColor: '#4972e8' }} aria-label="Previous month">‹</button>
              <span className="text-sm font-bold" style={{ color: '#131A22' }}>{MONTHS[dMonth]} {dYear}</span>
              <button onClick={dNext} className="w-7 h-7 flex items-center justify-center rounded-lg text-white font-bold text-xs hover:opacity-80" style={{ backgroundColor: '#4972e8' }} aria-label="Next month">›</button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold py-0.5" style={{ color: '#4972e8' }}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {dCells.map((d, i) => {
                if (d === null) return <div key={`de-${i}`} />;
                const sel = dParts !== null && dParts.y === dYear && (dParts.m - 1) === dMonth && dParts.d === d;
                return (
                  <button
                    key={`dd-${d}`}
                    onClick={() => handleDSelect(d)}
                    className={`h-8 rounded-lg text-xs font-medium transition-all ${
                      sel ? 'text-white shadow-md' : 'hover:bg-blue-50 text-gray-700'
                    }`}
                    style={sel ? { backgroundColor: '#FF9900' } : undefined}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            {dSelected && dParts && (
              <div className="mt-2 text-xs px-2 py-1.5 rounded-lg" style={{ backgroundColor: '#f8f9fb', color: '#4972e8' }}>
                Drop-off: {MONTHS[dParts.m - 1]} {dParts.d}, {dParts.y}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!pDate || !dSelected}
          className="mt-5 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{ backgroundColor: '#FF9900' }}
        >
          Confirm Pickup & Drop-off
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_dry_cleaning_pickup(props: GeneratedPageProps) {
  const [deliverySpeed, setDeliverySpeed] = useState('standard');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#131A22' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📦</span>
              <span className="text-white font-bold text-lg">EchoShip</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              {['Track', 'Orders', 'Schedule', 'Support'].map(item => (
                <a key={item} href="#" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">{item}</a>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center rounded-lg px-3 py-1.5" style={{ backgroundColor: '#232f3e' }}>
                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search orders..." className="bg-transparent text-sm text-gray-300 outline-none w-32 placeholder-gray-500" />
              </div>
              <button className="relative text-gray-300 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs text-white flex items-center justify-center" style={{ backgroundColor: '#FF9900' }}>2</span>
              </button>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#FF9900' }}>JD</div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=400&fit=crop"
          alt="Package delivery service"
          className="w-full h-48 sm:h-56 object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(19,26,34,0.85), rgba(73,114,232,0.6))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div>
              <h1 className="text-white text-2xl sm:text-3xl font-bold">Dry Cleaning Pickup</h1>
              <p className="text-gray-200 text-sm mt-2 max-w-lg">Schedule your garment pickup and delivery dates. We'll handle the rest — professional cleaning with free doorstep service.</p>
              <div className="flex items-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#FF9900' }}>Free Pickup</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white bg-opacity-20 text-white">48h Turnaround</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel — Widgets */}
          <div className="lg:col-span-2 space-y-8">
            {/* Delivery Speed Filter */}
            <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#fcfdfc', border: '1px solid #bacbeb' }}>
              <p className="text-sm font-bold mb-3" style={{ color: '#131A22' }}>Delivery Speed</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'standard', label: 'Standard (3-5 days)', price: 'Free' },
                  { id: 'express', label: 'Express (1-2 days)', price: '$4.99' },
                  { id: 'sameday', label: 'Same Day', price: '$9.99' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setDeliverySpeed(opt.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      deliverySpeed === opt.id ? 'text-white border-transparent shadow-md' : 'bg-white text-gray-600'
                    }`}
                    style={deliverySpeed === opt.id ? { backgroundColor: '#4972e8', borderColor: '#4972e8' } : { borderColor: '#bacbeb' }}
                  >
                    {opt.label} <span className="ml-1 font-bold">{opt.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Widget 1 */}
            <PickupDateTimePicker onSubmit={props.onSubmit} />

            {/* Widget 2 */}
            <DropOffDatePicker onSubmit={props.onSubmit} />

            {/* Widget 3 */}
            <CompoundPicker onSubmit={props.onSubmit} />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fcfdfc', border: '1px solid #bacbeb' }}>
              <div className="px-5 py-3" style={{ backgroundColor: '#131A22' }}>
                <h3 className="text-sm font-bold text-white">Order Summary</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop"
                    alt="Professional dry cleaning"
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#131A22' }}>Premium Dry Clean</p>
                    <p className="text-xs text-gray-500">3 items × $12.99</p>
                    <p className="text-sm font-bold mt-1" style={{ color: '#FF9900' }}>$38.97</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=300&fit=crop"
                    alt="Delivery truck"
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#131A22' }}>Doorstep Delivery</p>
                    <p className="text-xs text-gray-500">Pickup & drop-off included</p>
                    <p className="text-sm font-bold mt-1" style={{ color: '#FF9900' }}>FREE</p>
                  </div>
                </div>
                <div className="pt-3 border-t" style={{ borderColor: '#bacbeb' }}>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold" style={{ color: '#131A22' }}>$38.97</span></div>
                  <div className="flex justify-between text-sm mt-1"><span className="text-gray-500">Delivery</span><span className="font-semibold text-green-600">Free</span></div>
                  <div className="flex justify-between text-sm mt-1"><span className="text-gray-500">Tax</span><span className="font-semibold" style={{ color: '#131A22' }}>$3.12</span></div>
                  <div className="flex justify-between text-sm font-bold mt-3 pt-3 border-t" style={{ borderColor: '#bacbeb' }}>
                    <span style={{ color: '#131A22' }}>Total</span><span style={{ color: '#FF9900' }}>$42.09</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#fcfdfc', border: '1px solid #bacbeb' }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#131A22' }}>Delivery Address</h3>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f7f7f8' }}>
                  <svg className="w-4 h-4" style={{ color: '#4972e8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#131A22' }}>John Doe</p>
                  <p className="text-xs text-gray-500 mt-0.5">1234 Market Street, Apt 5B</p>
                  <p className="text-xs text-gray-500">San Francisco, CA 94102</p>
                </div>
              </div>
              <button className="mt-3 text-xs font-semibold" style={{ color: '#4972e8' }}>Change address →</button>
            </div>

            {/* Delivery Map Placeholder */}
            <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid #bacbeb' }}>
              <div className="h-36 flex items-center justify-center" style={{ backgroundColor: '#bacbeb' }}>
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-1 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                  <p className="text-white text-xs font-medium opacity-80">Delivery Route Map</p>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between" style={{ backgroundColor: '#fcfdfc' }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#131A22' }}>Estimated Arrival</p>
                  <p className="text-xs text-gray-500">Within 48 hours of pickup</p>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f7f7f8' }}>
                  <span className="text-sm">🚚</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#131A22' }} className="mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white text-sm font-bold mb-3">Shipping Info</h4>
              <ul className="space-y-2">
                {['Delivery Times', 'Shipping Rates', 'Service Areas', 'Bulk Orders'].map(link => (
                  <li key={link}><a href="#" className="text-gray-400 text-xs hover:text-gray-300">{link}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-bold mb-3">Returns</h4>
              <ul className="space-y-2">
                {['Return Policy', 'Damage Claims', 'Refund Status', 'FAQ'].map(link => (
                  <li key={link}><a href="#" className="text-gray-400 text-xs hover:text-gray-300">{link}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-bold mb-3">Customer Service</h4>
              <ul className="space-y-2">
                {['Contact Us', 'Live Chat', 'Help Center', 'Feedback'].map(link => (
                  <li key={link}><a href="#" className="text-gray-400 text-xs hover:text-gray-300">{link}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-bold mb-3">Payment</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {['💳 EchoPay', '💳 EchoCard', '💳 EchoExpress', '📱 EchoWallet'].map(badge => (
                  <span key={badge} className="px-2 py-1 rounded text-xs text-gray-400" style={{ backgroundColor: '#232f3e' }}>{badge}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📦</span>
              <span className="text-white text-sm font-bold">EchoShip</span>
            </div>
            <p className="text-gray-500 text-xs">© 2025 EchoShip. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
