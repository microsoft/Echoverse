import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_OF_WEEK = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/* ──────────────────────────────────────────────
   Widget 1 — Review Date & Time (datetime)
   Weekdays only, calendar + hour/min + AM/PM
   ────────────────────────────────────────────── */
function ReviewDateTimePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(11); // December (0-indexed)
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfWeek(viewYear, viewMonth), [viewYear, viewMonth]);

  const isDisabled = useCallback((y: number, m: number, d: number) => {
    const dow = new Date(y, m, d).getDay();
    return dow === 0 || dow === 6;
  }, []);

  const prevMonth = useCallback(() => {
    setViewMonth(p => { if (p === 0) { setViewYear(y => y - 1); return 11; } return p - 1; });
  }, []);
  const nextMonth = useCallback(() => {
    setViewMonth(p => { if (p === 11) { setViewYear(y => y + 1); return 0; } return p + 1; });
  }, []);

  const handleDayClick = useCallback((d: number) => {
    if (isDisabled(viewYear, viewMonth, d)) return;
    setSelectedDate({ year: viewYear, month: viewMonth, day: d });
  }, [viewYear, viewMonth, isDisabled]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    const h24 = ampm === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    const iso = `${toISO(selectedDate.year, selectedDate.month, selectedDate.day)}T${pad2(h24)}:${pad2(minute)}:00`;
    onSubmit({
      type: 'datetime',
      value: iso,
      raw: { widget_id: 'review_datetime', year: selectedDate.year, month: selectedDate.month + 1, day: selectedDate.day, hour: h24, minute, iso },
    });
  }, [selectedDate, hour, minute, ampm, onSubmit]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="h-9" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const disabled = isDisabled(viewYear, viewMonth, d);
    const sel = selectedDate && selectedDate.year === viewYear && selectedDate.month === viewMonth && selectedDate.day === d;
    cells.push(
      <button key={d} type="button" disabled={disabled} onClick={() => handleDayClick(d)}
        className={`h-9 w-9 flex items-center justify-center text-sm transition-all rounded-full
          ${disabled ? 'opacity-25 cursor-not-allowed line-through' : 'cursor-pointer hover:bg-blue-600 hover:text-white'}
          ${sel ? 'font-bold' : ''}`}
        style={{
          backgroundColor: sel ? '#0A7CFF' : undefined,
          color: sel ? '#fff' : disabled ? '#555' : '#d1d5db',
        }}>
        {d}
      </button>
    );
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div data-widget-id="review_datetime" className="p-4 rounded-lg" style={{ backgroundColor: '#111214', border: '1px solid #2a2c30' }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#e5e7eb' }}>Review Date &amp; Time</h3>
      <p className="text-xs mb-3" style={{ color: '#8b8f96' }}>Select a weekday for the investment review meeting.</p>

      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:opacity-70" style={{ color: '#d1d5db' }}>‹</button>
        <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:opacity-70" style={{ color: '#d1d5db' }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="h-7 flex items-center justify-center text-xs font-medium" style={{ color: '#6b7280' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-3">{cells}</div>

      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs" style={{ color: '#8b8f96' }}>Time:</label>
        <select value={hour} onChange={e => setHour(Number(e.target.value))}
          className="text-xs py-1 px-2 rounded" style={{ backgroundColor: '#1e2024', color: '#d1d5db', border: '1px solid #2a2c30' }}>
          {hours.map(h => <option key={h} value={h}>{pad2(h)}</option>)}
        </select>
        <span style={{ color: '#6b7280' }}>:</span>
        <select value={minute} onChange={e => setMinute(Number(e.target.value))}
          className="text-xs py-1 px-2 rounded" style={{ backgroundColor: '#1e2024', color: '#d1d5db', border: '1px solid #2a2c30' }}>
          {minutes.map(m => <option key={m} value={m}>{pad2(m)}</option>)}
        </select>
        <div className="flex rounded overflow-hidden" style={{ border: '1px solid #2a2c30' }}>
          <button type="button" onClick={() => setAmpm('AM')}
            className="text-xs px-2 py-1 transition-all"
            style={{ backgroundColor: ampm === 'AM' ? '#0A7CFF' : '#1e2024', color: ampm === 'AM' ? '#fff' : '#8b8f96' }}>AM</button>
          <button type="button" onClick={() => setAmpm('PM')}
            className="text-xs px-2 py-1 transition-all"
            style={{ backgroundColor: ampm === 'PM' ? '#0A7CFF' : '#1e2024', color: ampm === 'PM' ? '#fff' : '#8b8f96' }}>PM</button>
        </div>
      </div>

      {selectedDate && (
        <div className="text-xs mb-2" style={{ color: '#8b8f96' }}>
          Selected: {MONTHS[selectedDate.month]} {selectedDate.day}, {selectedDate.year} at {pad2(hour)}:{pad2(minute)} {ampm}
        </div>
      )}

      <button type="button" onClick={handleSubmit} disabled={!selectedDate}
        className={`w-full py-2 text-sm font-semibold rounded-lg transition-all ${selectedDate ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'}`}
        style={{ backgroundColor: '#0A7CFF', color: '#fff' }}>
        Confirm Review Date &amp; Time
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Widget 2 — Account Holder DOB
   Year dropdown 1950-2015, month dropdown, day grid
   Past only (max 2026-04-30)
   ────────────────────────────────────────────── */
function AccountHolderDOBPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(3); // April (0-indexed)
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const [dropdownYear, setDropdownYear] = useState(1990);
  const [dropdownMonth, setDropdownMonth] = useState(0);

  const maxDate = new Date(2026, 3, 30); // April 30, 2026

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfWeek(viewYear, viewMonth), [viewYear, viewMonth]);

  const isDisabled = useCallback((y: number, m: number, d: number) => {
    const date = new Date(y, m, d);
    return date > maxDate;
  }, []);

  const prevMonth = useCallback(() => {
    setViewMonth(p => { if (p === 0) { setViewYear(y => y - 1); return 11; } return p - 1; });
  }, []);
  const nextMonth = useCallback(() => {
    setViewMonth(p => { if (p === 11) { setViewYear(y => y + 1); return 0; } return p + 1; });
  }, []);

  const handleDropdownGo = useCallback(() => {
    setViewYear(dropdownYear);
    setViewMonth(dropdownMonth);
  }, [dropdownYear, dropdownMonth]);

  const handleDayClick = useCallback((d: number) => {
    if (isDisabled(viewYear, viewMonth, d)) return;
    setSelectedDate({ year: viewYear, month: viewMonth, day: d });
  }, [viewYear, viewMonth, isDisabled]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    const iso = toISO(selectedDate.year, selectedDate.month, selectedDate.day);
    onSubmit({
      type: 'dob',
      value: iso,
      raw: { widget_id: 'account_holder_dob', year: selectedDate.year, month: selectedDate.month + 1, day: selectedDate.day, iso },
    });
  }, [selectedDate, onSubmit]);

  const years = Array.from({ length: 2015 - 1950 + 1 }, (_, i) => 1950 + i);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="h-9" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const disabled = isDisabled(viewYear, viewMonth, d);
    const sel = selectedDate && selectedDate.year === viewYear && selectedDate.month === viewMonth && selectedDate.day === d;
    cells.push(
      <button key={d} type="button" disabled={disabled} onClick={() => handleDayClick(d)}
        className={`h-9 w-9 flex items-center justify-center text-sm transition-all rounded-full
          ${disabled ? 'opacity-25 cursor-not-allowed line-through' : 'cursor-pointer hover:bg-blue-600 hover:text-white'}
          ${sel ? 'font-bold' : ''}`}
        style={{
          backgroundColor: sel ? '#0A7CFF' : undefined,
          color: sel ? '#fff' : disabled ? '#555' : '#d1d5db',
        }}>
        {d}
      </button>
    );
  }

  return (
    <div data-widget-id="account_holder_dob" className="p-4 rounded-lg" style={{ backgroundColor: '#111214', border: '1px solid #2a2c30' }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#e5e7eb' }}>Account Holder Date of Birth</h3>
      <p className="text-xs mb-3" style={{ color: '#8b8f96' }}>Provide the primary account holder's date of birth for verification.</p>

      <div className="flex items-center gap-2 mb-3">
        <select value={dropdownYear} onChange={e => setDropdownYear(Number(e.target.value))}
          className="text-xs py-1 px-2 rounded flex-1" style={{ backgroundColor: '#1e2024', color: '#d1d5db', border: '1px solid #2a2c30' }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={dropdownMonth} onChange={e => setDropdownMonth(Number(e.target.value))}
          className="text-xs py-1 px-2 rounded flex-1" style={{ backgroundColor: '#1e2024', color: '#d1d5db', border: '1px solid #2a2c30' }}>
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <button type="button" onClick={handleDropdownGo}
          className="text-xs py-1 px-3 rounded font-medium hover:opacity-80 transition-all"
          style={{ backgroundColor: '#2a2c30', color: '#d1d5db' }}>Go</button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:opacity-70" style={{ color: '#d1d5db' }}>‹</button>
        <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:opacity-70" style={{ color: '#d1d5db' }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="h-7 flex items-center justify-center text-xs font-medium" style={{ color: '#6b7280' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-3">{cells}</div>

      {selectedDate && (
        <div className="text-xs mb-2" style={{ color: '#8b8f96' }}>
          Selected: {MONTHS[selectedDate.month]} {selectedDate.day}, {selectedDate.year}
        </div>
      )}

      <button type="button" onClick={handleSubmit} disabled={!selectedDate}
        className={`w-full py-2 text-sm font-semibold rounded-lg transition-all ${selectedDate ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'}`}
        style={{ backgroundColor: '#0A7CFF', color: '#fff' }}>
        Confirm Date of Birth
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Widget 3 — Compound (standard date calendar)
   Weekdays only (Sat/Sun disabled)
   ────────────────────────────────────────────── */
function CompoundDatePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(5); // June (0-indexed)
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfWeek(viewYear, viewMonth), [viewYear, viewMonth]);

  const isDisabled = useCallback((y: number, m: number, d: number) => {
    const dow = new Date(y, m, d).getDay();
    return dow === 0 || dow === 6;
  }, []);

  const prevMonth = useCallback(() => {
    setViewMonth(p => { if (p === 0) { setViewYear(y => y - 1); return 11; } return p - 1; });
  }, []);
  const nextMonth = useCallback(() => {
    setViewMonth(p => { if (p === 11) { setViewYear(y => y + 1); return 0; } return p + 1; });
  }, []);

  const handleDayClick = useCallback((d: number) => {
    if (isDisabled(viewYear, viewMonth, d)) return;
    setSelectedDate({ year: viewYear, month: viewMonth, day: d });
  }, [viewYear, viewMonth, isDisabled]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    const iso = toISO(selectedDate.year, selectedDate.month, selectedDate.day);
    onSubmit({
      type: 'date',
      value: iso,
      raw: { widget_id: 'compound', year: selectedDate.year, month: selectedDate.month + 1, day: selectedDate.day, iso },
    });
  }, [selectedDate, onSubmit]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="h-9" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const disabled = isDisabled(viewYear, viewMonth, d);
    const sel = selectedDate && selectedDate.year === viewYear && selectedDate.month === viewMonth && selectedDate.day === d;
    cells.push(
      <button key={d} type="button" disabled={disabled} onClick={() => handleDayClick(d)}
        className={`h-9 w-9 flex items-center justify-center text-sm transition-all rounded-full
          ${disabled ? 'opacity-25 cursor-not-allowed line-through' : 'cursor-pointer hover:bg-blue-600 hover:text-white'}
          ${sel ? 'font-bold' : ''}`}
        style={{
          backgroundColor: sel ? '#0A7CFF' : undefined,
          color: sel ? '#fff' : disabled ? '#555' : '#d1d5db',
        }}>
        {d}
      </button>
    );
  }

  return (
    <div data-widget-id="compound" className="p-4 rounded-lg" style={{ backgroundColor: '#111214', border: '1px solid #2a2c30' }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#e5e7eb' }}>Review Date &amp; Account Holder DOB</h3>
      <p className="text-xs mb-3" style={{ color: '#8b8f96' }}>Select a date for the combined review record (weekdays only).</p>

      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:opacity-70" style={{ color: '#d1d5db' }}>‹</button>
        <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:opacity-70" style={{ color: '#d1d5db' }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="h-7 flex items-center justify-center text-xs font-medium" style={{ color: '#6b7280' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-3">{cells}</div>

      {selectedDate && (
        <div className="text-xs mb-2" style={{ color: '#8b8f96' }}>
          Selected: {MONTHS[selectedDate.month]} {selectedDate.day}, {selectedDate.year}
        </div>
      )}

      <button type="button" onClick={handleSubmit} disabled={!selectedDate}
        className={`w-full py-2 text-sm font-semibold rounded-lg transition-all ${selectedDate ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'}`}
        style={{ backgroundColor: '#0A7CFF', color: '#fff' }}>
        Confirm Date
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Transaction rows for realism
   ────────────────────────────────────────────── */
const TRANSACTIONS = [
  { id: 'TXN-90421', desc: 'Wire Transfer — Echo Capital', amount: '-$12,500.00', date: 'Apr 18, 2026', status: 'Completed' },
  { id: 'TXN-90387', desc: 'Dividend Deposit — EchoOne', amount: '+$342.80', date: 'Apr 15, 2026', status: 'Completed' },
  { id: 'TXN-90355', desc: 'Advisory Fee — Q1 2026', amount: '-$1,875.00', date: 'Apr 10, 2026', status: 'Pending' },
  { id: 'TXN-90310', desc: 'ACH Transfer — Checking ****4821', amount: '+$25,000.00', date: 'Apr 05, 2026', status: 'Completed' },
];

/* ══════════════════════════════════════════════
   Main Page Component
   ══════════════════════════════════════════════ */
export default function Page_investment_review(props: GeneratedPageProps) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const filteredTxns = useMemo(() => {
    if (filter === 'all') return TRANSACTIONS;
    return TRANSACTIONS.filter(t => t.status.toLowerCase() === filter);
  }, [filter]);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#000000', color: '#d1d5db' }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: '#0d0e10', borderBottom: '1px solid #1a1c20' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏦</span>
              <span className="text-base font-bold tracking-tight" style={{ color: '#e5e7eb' }}>EchoBank</span>
            </div>
            <nav className="hidden md:flex items-center gap-4 text-xs font-medium" style={{ color: '#8b8f96' }}>
              <a href="#" className="hover:opacity-80 transition-opacity">Accounts</a>
              <a href="#" className="hover:opacity-80 transition-opacity">Transfer</a>
              <a href="#" className="hover:opacity-80 transition-opacity">Cards</a>
              <a href="#" className="hover:opacity-80 transition-opacity">Support</a>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: '#8b8f96' }}>
            <span className="flex items-center gap-1"><span style={{ color: '#22c55e' }}>●</span> Secure Session</span>
            <button className="px-3 py-1 rounded-md hover:opacity-80 transition-opacity" style={{ backgroundColor: '#1a1c20', color: '#d1d5db' }}>Logout</button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: '#0d0e10' }}>
        <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop" alt="Modern bank building exterior" className="w-full h-48 object-cover opacity-30" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-6xl mx-auto px-4 w-full">
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#e5e7eb' }}>Investment Review</h1>
            <p className="text-sm" style={{ color: '#8b8f96' }}>Schedule reviews, verify account details, and manage compliance records.</p>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* ── Dashboard Card ── */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 p-4 rounded-lg" style={{ backgroundColor: '#111214', border: '1px solid #2a2c30' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Portfolio Balance</p>
            <p className="text-2xl font-bold" style={{ color: '#e5e7eb' }}>$1,248,630.52</p>
            <p className="text-xs mt-1" style={{ color: '#22c55e' }}>+2.4% this quarter</p>
          </div>
          <div className="flex-1 p-4 rounded-lg" style={{ backgroundColor: '#111214', border: '1px solid #2a2c30' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Account Number</p>
            <p className="text-base font-semibold" style={{ color: '#e5e7eb' }}>****-****-****-7291</p>
            <p className="text-xs mt-1" style={{ color: '#8b8f96' }}>Investment Brokerage — Active</p>
          </div>
          <div className="flex-1 p-4 rounded-lg" style={{ backgroundColor: '#111214', border: '1px solid #2a2c30' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Next Review Due</p>
            <p className="text-base font-semibold" style={{ color: '#e5e7eb' }}>Schedule Below</p>
            <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>Action required</p>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="flex gap-3 overflow-x-auto">
          {[
            { icon: '📊', label: 'View Portfolio' },
            { icon: '🔄', label: 'Schedule Transfer' },
            { icon: '📋', label: 'Statements' },
            { icon: '⚙️', label: 'Settings' },
          ].map(a => (
            <button key={a.label} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#111214', border: '1px solid #2a2c30', color: '#d1d5db' }}>
              <span>{a.icon}</span>{a.label}
            </button>
          ))}
        </div>

        {/* ── Card Images Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a2c30' }}>
            <img src="https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400&h=300&fit=crop" alt="Credit card on desk" className="w-full h-48 object-cover rounded-lg" />
            <div className="p-3" style={{ backgroundColor: '#111214' }}>
              <p className="text-xs font-semibold" style={{ color: '#e5e7eb' }}>Card Management</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>Manage linked debit and credit cards.</p>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a2c30' }}>
            <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop" alt="Coins and savings jar" className="w-full h-48 object-cover rounded-lg" />
            <div className="p-3" style={{ backgroundColor: '#111214' }}>
              <p className="text-xs font-semibold" style={{ color: '#e5e7eb' }}>Savings Goals</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>Track progress toward your financial targets.</p>
            </div>
          </div>
        </div>

        {/* ── Datepicker Widgets ── */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold" style={{ color: '#e5e7eb' }}>Schedule &amp; Verification</h2>
          <p className="text-xs -mt-3" style={{ color: '#8b8f96' }}>Complete all required date selections below to proceed with the investment review.</p>

          <ReviewDateTimePicker onSubmit={props.onSubmit} />
          <AccountHolderDOBPicker onSubmit={props.onSubmit} />
          <CompoundDatePicker onSubmit={props.onSubmit} />
        </div>

        {/* ── Transaction History with Filters ── */}
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#111214', border: '1px solid #2a2c30' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #2a2c30' }}>
            <h2 className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>Recent Transactions</h2>
            <div className="flex gap-1">
              {(['all', 'completed', 'pending'] as const).map(f => (
                <button key={f} type="button" onClick={() => setFilter(f)}
                  className="text-xs px-3 py-1 rounded-md capitalize transition-all"
                  style={{
                    backgroundColor: filter === f ? '#0A7CFF' : '#1a1c20',
                    color: filter === f ? '#fff' : '#8b8f96',
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2c30', color: '#6b7280' }}>
                <th className="text-left px-4 py-2 font-medium">ID</th>
                <th className="text-left px-4 py-2 font-medium">Description</th>
                <th className="text-right px-4 py-2 font-medium">Amount</th>
                <th className="text-right px-4 py-2 font-medium">Date</th>
                <th className="text-right px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxns.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #1a1c20' }}>
                  <td className="px-4 py-2 font-mono" style={{ color: '#8b8f96' }}>{t.id}</td>
                  <td className="px-4 py-2" style={{ color: '#d1d5db' }}>{t.desc}</td>
                  <td className="px-4 py-2 text-right font-mono" style={{ color: t.amount.startsWith('+') ? '#22c55e' : '#ef4444' }}>{t.amount}</td>
                  <td className="px-4 py-2 text-right" style={{ color: '#8b8f96' }}>{t.date}</td>
                  <td className="px-4 py-2 text-right">
                    <span className="px-2 py-0.5 rounded-full text-xs"
                      style={{ backgroundColor: t.status === 'Completed' ? '#052e16' : '#451a03', color: t.status === 'Completed' ? '#22c55e' : '#f59e0b' }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Transfer Form Context ── */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#111214', border: '1px solid #2a2c30' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#e5e7eb' }}>Schedule Transfer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: '#6b7280' }}>From Account</label>
              <select className="w-full text-xs py-2 px-3 rounded-lg" style={{ backgroundColor: '#1e2024', color: '#d1d5db', border: '1px solid #2a2c30' }}>
                <option>Investment Brokerage ****7291</option>
                <option>Checking ****4821</option>
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#6b7280' }}>To Account</label>
              <select className="w-full text-xs py-2 px-3 rounded-lg" style={{ backgroundColor: '#1e2024', color: '#d1d5db', border: '1px solid #2a2c30' }}>
                <option>Savings ****3105</option>
                <option>Checking ****4821</option>
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#6b7280' }}>Amount (USD)</label>
              <input type="text" placeholder="$0.00" className="w-full text-xs py-2 px-3 rounded-lg" style={{ backgroundColor: '#1e2024', color: '#d1d5db', border: '1px solid #2a2c30' }} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#6b7280' }}>Memo / Reference</label>
              <input type="text" placeholder="Optional note" className="w-full text-xs py-2 px-3 rounded-lg" style={{ backgroundColor: '#1e2024', color: '#d1d5db', border: '1px solid #2a2c30' }} />
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-8 py-6 px-4 text-center" style={{ backgroundColor: '#0d0e10', borderTop: '1px solid #1a1c20' }}>
        <div className="max-w-6xl mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-center gap-4 text-xs" style={{ color: '#6b7280' }}>
            <span>Privacy Policy</span>
            <span>·</span>
            <span>Terms of Service</span>
            <span>·</span>
            <span>Contact Support</span>
          </div>
          <p className="text-xs" style={{ color: '#4b5563' }}>
            EchoBank is a Member FDIC. Equal Housing Lender. NMLS #123456. Deposits are insured up to $250,000 per depositor.
          </p>
          <p className="text-xs" style={{ color: '#374151' }}>
            © 2026 EchoBank, N.A. All rights reserved. Securities and investment products are not bank deposits, not FDIC insured, and may lose value.
          </p>
        </div>
      </footer>
    </div>
  );
}
