import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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

function pad(n: number) {
  return n < 10 ? '0' + n : '' + n;
}

function toISO(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

/* ──────────────────── Widget 1: Constrained (future only) ──────────────────── */

function ConstrainedDatepicker({
  onSubmit,
}: {
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [month, setMonth] = useState(6); // July = index 6
  const [year, setYear] = useState(2025);
  const [selected, setSelected] = useState<number | null>(null);

  const minDate = new Date(2025, 6, 1); // 2025-07-01

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);

  const cells = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    while (c.length % 7 !== 0) c.push(null);
    return c;
  }, [daysInMonth, firstDay]);

  const isDisabled = useCallback(
    (day: number) => {
      const d = new Date(year, month, day);
      return d < minDate;
    },
    [year, month],
  );

  const prevMonth = useCallback(() => {
    setSelected(null);
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    setSelected(null);
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const iso = toISO(year, month, selected);
    onSubmit({
      type: 'date',
      value: iso,
      raw: { widget_id: 'opening_date', year, month: month + 1, day: selected, iso },
    });
  }, [selected, year, month, onSubmit]);

  return (
    <div data-widget-id="opening_date" className="rounded-lg p-6" style={{ background: '#fcfdfd', border: '1px solid #cfdbea' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#1A3A6B' }}>Account Opening Date</h3>
      <p className="text-sm mb-4" style={{ color: '#5a6a7e' }}>Select a future date for your new account activation.</p>

      {/* Nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 rounded-md text-sm font-medium" style={{ background: '#f3f4f7', color: '#1A3A6B' }} aria-label="Previous month">◀</button>
        <span className="font-semibold" style={{ color: '#1A3A6B' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 rounded-md text-sm font-medium" style={{ background: '#f3f4f7', color: '#1A3A6B' }} aria-label="Next month">▶</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-1" style={{ color: '#5a6a7e' }}>
        {DAYS_SHORT.map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const disabled = isDisabled(day);
          const isSelected = day === selected;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => { if (!disabled) setSelected(day); }}
              className={`py-1.5 rounded-md transition-colors ${
                disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSelected
                  ? 'text-white font-semibold'
                  : 'hover:bg-blue-50 cursor-pointer'
              }`}
              style={
                isSelected && !disabled
                  ? { background: '#0A7CFF', color: '#fff' }
                  : disabled
                  ? {}
                  : { color: '#1A3A6B' }
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="mt-3 text-sm" style={{ color: '#1A3A6B' }}>
          Selected: <strong>{MONTHS[month]} {selected}, {year}</strong>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={selected === null}
        className="mt-4 w-full py-2.5 rounded-md text-sm font-semibold text-white transition-opacity"
        style={{ background: selected !== null ? '#0A7CFF' : '#a0b4cc', cursor: selected !== null ? 'pointer' : 'not-allowed' }}
      >
        Submit Opening Date
      </button>
    </div>
  );
}

/* ──────────────────── Widget 2: DOB picker ──────────────────── */

function DOBDatepicker({
  onSubmit,
}: {
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4); // May = 4
  const [selected, setSelected] = useState<number | null>(null);

  const maxDate = new Date(2026, 4, 31); // 2026-05-31

  const years = useMemo(() => {
    const a: number[] = [];
    for (let y = 1950; y <= 2015; y++) a.push(y);
    return a;
  }, []);

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);

  const cells = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    while (c.length % 7 !== 0) c.push(null);
    return c;
  }, [daysInMonth, firstDay]);

  const isDisabled = useCallback(
    (day: number) => {
      const d = new Date(year, month, day);
      return d > maxDate;
    },
    [year, month],
  );

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(Number(e.target.value));
    setSelected(null);
  }, []);

  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(Number(e.target.value));
    setSelected(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const iso = toISO(year, month, selected);
    onSubmit({
      type: 'dob',
      value: iso,
      raw: { widget_id: 'holder_dob', year, month: month + 1, day: selected, iso },
    });
  }, [selected, year, month, onSubmit]);

  return (
    <div data-widget-id="holder_dob" className="rounded-lg p-6" style={{ background: '#fcfdfd', border: '1px solid #cfdbea' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#1A3A6B' }}>Account Holder Date of Birth</h3>
      <p className="text-sm mb-4" style={{ color: '#5a6a7e' }}>Select your date of birth for identity verification.</p>

      {/* Dropdowns */}
      <div className="flex gap-3 mb-4">
        <select
          value={year}
          onChange={handleYearChange}
          className="flex-1 rounded-md px-3 py-2 text-sm"
          style={{ border: '1px solid #cfdbea', color: '#1A3A6B', background: '#f7f9fa' }}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={month}
          onChange={handleMonthChange}
          className="flex-1 rounded-md px-3 py-2 text-sm"
          style={{ border: '1px solid #cfdbea', color: '#1A3A6B', background: '#f7f9fa' }}
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
      </div>

      {/* Nav arrows */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            setSelected(null);
            if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
          }}
          className="px-3 py-1 rounded-md text-sm font-medium"
          style={{ background: '#f3f4f7', color: '#1A3A6B' }}
          aria-label="Previous month"
        >◀</button>
        <span className="font-semibold" style={{ color: '#1A3A6B' }}>{MONTHS[month]} {year}</span>
        <button
          onClick={() => {
            setSelected(null);
            if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
          }}
          className="px-3 py-1 rounded-md text-sm font-medium"
          style={{ background: '#f3f4f7', color: '#1A3A6B' }}
          aria-label="Next month"
        >▶</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-1" style={{ color: '#5a6a7e' }}>
        {DAYS_SHORT.map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const disabled = isDisabled(day);
          const isSelected = day === selected;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => { if (!disabled) setSelected(day); }}
              className={`py-1.5 rounded-md transition-colors ${
                disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSelected
                  ? 'text-white font-semibold'
                  : 'hover:bg-blue-50 cursor-pointer'
              }`}
              style={
                isSelected && !disabled
                  ? { background: '#0A7CFF', color: '#fff' }
                  : disabled
                  ? {}
                  : { color: '#1A3A6B' }
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="mt-3 text-sm" style={{ color: '#1A3A6B' }}>
          Selected: <strong>{MONTHS[month]} {selected}, {year}</strong>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={selected === null}
        className="mt-4 w-full py-2.5 rounded-md text-sm font-semibold text-white transition-opacity"
        style={{ background: selected !== null ? '#0A7CFF' : '#a0b4cc', cursor: selected !== null ? 'pointer' : 'not-allowed' }}
      >
        Submit Date of Birth
      </button>
    </div>
  );
}

/* ──────────────────── Widget 3: Compound (constrained+dob) ──────────────────── */

function CompoundDatepicker({
  onSubmit,
}: {
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [month, setMonth] = useState(5); // June = 5
  const [year, setYear] = useState(2025);
  const [selected, setSelected] = useState<number | null>(null);

  const minDate = new Date(2025, 5, 1); // 2025-06-01

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);

  const cells = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    while (c.length % 7 !== 0) c.push(null);
    return c;
  }, [daysInMonth, firstDay]);

  const isDisabled = useCallback(
    (day: number) => {
      const d = new Date(year, month, day);
      return d < minDate;
    },
    [year, month],
  );

  const prevMonth = useCallback(() => {
    setSelected(null);
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    setSelected(null);
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const iso = toISO(year, month, selected);
    onSubmit({
      type: 'date',
      value: iso,
      raw: { widget_id: 'compound', year, month: month + 1, day: selected, iso },
    });
  }, [selected, year, month, onSubmit]);

  return (
    <div data-widget-id="compound" className="rounded-lg p-6" style={{ background: '#fcfdfd', border: '1px solid #cfdbea' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#1A3A6B' }}>Account Opening Date + Account Holder DOB</h3>
      <p className="text-sm mb-4" style={{ color: '#5a6a7e' }}>Select the applicable date to complete both fields.</p>

      {/* Nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 rounded-md text-sm font-medium" style={{ background: '#f3f4f7', color: '#1A3A6B' }} aria-label="Previous month">◀</button>
        <span className="font-semibold" style={{ color: '#1A3A6B' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 rounded-md text-sm font-medium" style={{ background: '#f3f4f7', color: '#1A3A6B' }} aria-label="Next month">▶</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-1" style={{ color: '#5a6a7e' }}>
        {DAYS_SHORT.map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const disabled = isDisabled(day);
          const isSelected = day === selected;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => { if (!disabled) setSelected(day); }}
              className={`py-1.5 rounded-md transition-colors ${
                disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSelected
                  ? 'text-white font-semibold'
                  : 'hover:bg-blue-50 cursor-pointer'
              }`}
              style={
                isSelected && !disabled
                  ? { background: '#0A7CFF', color: '#fff' }
                  : disabled
                  ? {}
                  : { color: '#1A3A6B' }
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="mt-3 text-sm" style={{ color: '#1A3A6B' }}>
          Selected: <strong>{MONTHS[month]} {selected}, {year}</strong>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={selected === null}
        className="mt-4 w-full py-2.5 rounded-md text-sm font-semibold text-white transition-opacity"
        style={{ background: selected !== null ? '#0A7CFF' : '#a0b4cc', cursor: selected !== null ? 'pointer' : 'not-allowed' }}
      >
        Submit Date
      </button>
    </div>
  );
}

/* ──────────────────── Main Page ──────────────────── */

export default function Page_account_opening(props: GeneratedPageProps) {
  const [filter, setFilter] = useState<'all' | 'opening' | 'dob' | 'compound'>('all');

  return (
    <div className="min-h-screen" style={{ background: '#cb84b4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#1A3A6B' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏦</span>
            <span className="text-white text-xl font-bold tracking-tight">EchoBank</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-blue-200">
            <a href="#" className="hover:text-white transition-colors">Accounts</a>
            <a href="#" className="hover:text-white transition-colors">Transfer</a>
            <a href="#" className="hover:text-white transition-colors">Cards</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </nav>
          <div className="flex items-center gap-4 text-sm text-blue-200">
            <span className="hidden sm:inline">🔒 Secure Session</span>
            <button className="px-3 py-1.5 rounded-md text-white text-sm" style={{ background: '#0A7CFF' }}>Logout</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop"
          alt="Modern bank building"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center" style={{ background: 'linear-gradient(to right, rgba(26,58,107,0.85), rgba(26,58,107,0.3))' }}>
          <div className="max-w-6xl mx-auto px-6">
            <h1 className="text-white text-2xl md:text-3xl font-bold">Account Opening</h1>
            <p className="text-blue-200 mt-1 text-sm md:text-base">Complete your new account setup by providing the required dates below.</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Dashboard Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-lg p-5" style={{ background: '#fcfdfd', border: '1px solid #cfdbea' }}>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#5a6a7e' }}>Total Balance</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#1A3A6B' }}>$24,580.00</p>
            <p className="text-xs mt-1" style={{ color: '#5a6a7e' }}>Checking ••4821</p>
          </div>
          <div className="rounded-lg p-5" style={{ background: '#fcfdfd', border: '1px solid #cfdbea' }}>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#5a6a7e' }}>Recent Activity</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#1A3A6B' }}>12</p>
            <p className="text-xs mt-1" style={{ color: '#5a6a7e' }}>Transactions this month</p>
          </div>
          <div className="rounded-lg p-5" style={{ background: '#fcfdfd', border: '1px solid #cfdbea' }}>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#5a6a7e' }}>Pending Actions</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#0A7CFF' }}>3</p>
            <p className="text-xs mt-1" style={{ color: '#5a6a7e' }}>Date selections required</p>
          </div>
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-lg overflow-hidden" style={{ background: '#fcfdfd', border: '1px solid #cfdbea' }}>
            <img
              src="https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400&h=300&fit=crop"
              alt="Credit card"
              className="w-full h-36 object-cover"
            />
            <div className="p-4">
              <h4 className="font-semibold text-sm" style={{ color: '#1A3A6B' }}>Schedule a Transfer</h4>
              <p className="text-xs mt-1" style={{ color: '#5a6a7e' }}>Move funds between your accounts or send to others.</p>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ background: '#fcfdfd', border: '1px solid #cfdbea' }}>
            <img
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop"
              alt="Coins and savings"
              className="w-full h-36 object-cover"
            />
            <div className="p-4">
              <h4 className="font-semibold text-sm" style={{ color: '#1A3A6B' }}>Savings Goals</h4>
              <p className="text-xs mt-1" style={{ color: '#5a6a7e' }}>Track your savings progress and set new targets.</p>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-sm font-medium" style={{ color: '#1A3A6B' }}>Filter:</span>
          {([
            ['all', 'All Widgets'],
            ['opening', 'Opening Date'],
            ['dob', 'Date of Birth'],
            ['compound', 'Compound'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                background: filter === key ? '#0A7CFF' : '#f3f4f7',
                color: filter === key ? '#fff' : '#1A3A6B',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Datepicker Widgets */}
        <div className="space-y-6">
          {(filter === 'all' || filter === 'opening') && (
            <ConstrainedDatepicker onSubmit={props.onSubmit} />
          )}
          {(filter === 'all' || filter === 'dob') && (
            <DOBDatepicker onSubmit={props.onSubmit} />
          )}
          {(filter === 'all' || filter === 'compound') && (
            <CompoundDatepicker onSubmit={props.onSubmit} />
          )}
        </div>

        {/* Transaction History Table */}
        <div className="mt-8 rounded-lg overflow-hidden" style={{ background: '#fcfdfd', border: '1px solid #cfdbea' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #cfdbea' }}>
            <h3 className="font-semibold" style={{ color: '#1A3A6B' }}>Recent Transactions</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f7f9fa' }}>
                <th className="text-left px-6 py-3 font-medium" style={{ color: '#5a6a7e' }}>Date</th>
                <th className="text-left px-6 py-3 font-medium" style={{ color: '#5a6a7e' }}>Description</th>
                <th className="text-right px-6 py-3 font-medium" style={{ color: '#5a6a7e' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: 'Apr 22, 2026', desc: 'Direct Deposit — Payroll', amount: '+$3,200.00', positive: true },
                { date: 'Apr 20, 2026', desc: 'Online Transfer — Savings', amount: '-$500.00', positive: false },
                { date: 'Apr 18, 2026', desc: 'POS Purchase — Grocery Store', amount: '-$87.42', positive: false },
                { date: 'Apr 15, 2026', desc: 'Bill Payment — Utilities', amount: '-$142.00', positive: false },
              ].map((tx, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f3f4f7' }}>
                  <td className="px-6 py-3" style={{ color: '#5a6a7e' }}>{tx.date}</td>
                  <td className="px-6 py-3" style={{ color: '#1A3A6B' }}>{tx.desc}</td>
                  <td className="px-6 py-3 text-right font-medium" style={{ color: tx.positive ? '#16a34a' : '#1A3A6B' }}>{tx.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-8 px-6" style={{ background: '#1A3A6B' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-200">
            <div>
              <h4 className="text-white font-semibold mb-2">Security</h4>
              <p>Your connection is encrypted with 256-bit SSL. EchoBank uses multi-factor authentication to protect your accounts.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">FDIC Insured</h4>
              <p>Deposits are insured up to $250,000 per depositor by the Federal Deposit Insurance Corporation.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Contact Support</h4>
              <p>1-800-TRUST-BK (878-7825)</p>
              <p className="mt-1">support@trustbank.com</p>
            </div>
          </div>
          <div className="mt-6 pt-4 text-xs text-blue-300" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            © 2026 EchoBank, N.A. Member FDIC. Equal Housing Lender. All rights reserved. NMLS #123456
          </div>
        </div>
      </footer>
    </div>
  );
}
