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

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isWeekend(year: number, month: number, day: number): boolean {
  const d = new Date(year, month, day).getDay();
  return d === 0 || d === 6;
}

function dateToNum(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return y * 10000 + m * 100 + d;
}

/* ─── Single Date Picker ─── */
function SingleDatePicker({
  widgetId,
  label,
  description,
  initialYear,
  initialMonth,
  disabledWeekdays,
  minDate,
  maxDate,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  initialMonth: number;
  disabledWeekdays: number[];
  minDate?: string;
  maxDate?: string;
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const minNum = minDate ? dateToNum(minDate) : -Infinity;
  const maxNum = maxDate ? dateToNum(maxDate) : Infinity;

  const grid = useMemo(() => {
    const total = daysInMonth(year, month);
    const start = firstDayOfMonth(year, month);
    const cells: (number | null)[] = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    return cells;
  }, [year, month]);

  const isDisabled = useCallback(
    (day: number) => {
      const dow = new Date(year, month, day).getDay();
      if (disabledWeekdays.includes(dow)) return true;
      const num = dateToNum(toISO(year, month, day));
      if (num < minNum || num > maxNum) return true;
      return false;
    },
    [year, month, disabledWeekdays, minNum, maxNum],
  );

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <div data-widget-id={widgetId} style={{ background: '#141313', borderRadius: 0 }} className="p-4">
      <h3 className="text-base font-semibold mb-1" style={{ color: '#e5e5e5' }}>{label}</h3>
      <p className="text-xs mb-3" style={{ color: '#888' }}>{description}</p>

      {/* nav */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={prev} className="px-2 py-1 text-sm" style={{ color: '#ccc', background: '#1b1b1b', borderRadius: 0 }}>◀</button>
        <span className="text-sm font-medium" style={{ color: '#ddd' }}>{MONTHS[month]} {year}</span>
        <button onClick={next} className="px-2 py-1 text-sm" style={{ color: '#ccc', background: '#1b1b1b', borderRadius: 0 }}>▶</button>
      </div>

      {/* header */}
      <div className="grid grid-cols-7 text-center text-xs mb-1" style={{ color: '#777' }}>
        {DAYS.map(d => <div key={d} className="py-1">{d}</div>)}
      </div>

      {/* days */}
      <div className="grid grid-cols-7 text-center text-xs">
        {grid.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const iso = toISO(year, month, day);
          const dis = isDisabled(day);
          const sel = selected === iso;
          return (
            <button
              key={iso}
              disabled={dis}
              onClick={() => !dis && setSelected(iso)}
              className="py-1.5"
              style={{
                color: dis ? '#444' : sel ? '#fff' : '#ccc',
                background: sel ? '#0A7CFF' : 'transparent',
                cursor: dis ? 'not-allowed' : 'pointer',
                borderRadius: 0,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected && (
        <p className="text-xs mt-2" style={{ color: '#0A7CFF' }}>Selected: {selected}</p>
      )}

      <button
        disabled={!selected}
        onClick={() => {
          if (selected) {
            onSubmit({ type: 'date', value: selected, raw: { widget_id: widgetId, selected_date: selected, month, year } });
          }
        }}
        className="mt-3 w-full py-2 text-sm font-medium"
        style={{
          background: selected ? '#0A7CFF' : '#333',
          color: selected ? '#fff' : '#666',
          borderRadius: 0,
          cursor: selected ? 'pointer' : 'not-allowed',
        }}
      >
        Submit {label}
      </button>
    </div>
  );
}

/* ─── Range Date Picker ─── */
function RangeDatePicker({
  widgetId,
  label,
  description,
  initialYear,
  initialMonth,
  minDate,
  maxDate,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  initialMonth: number;
  minDate?: string;
  maxDate?: string;
  onSubmit: (v: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const minNum = minDate ? dateToNum(minDate) : -Infinity;
  const maxNum = maxDate ? dateToNum(maxDate) : Infinity;

  const grid = useMemo(() => {
    const total = daysInMonth(year, month);
    const start = firstDayOfMonth(year, month);
    const cells: (number | null)[] = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    return cells;
  }, [year, month]);

  const isDisabled = useCallback(
    (day: number) => {
      const num = dateToNum(toISO(year, month, day));
      return num < minNum || num > maxNum;
    },
    [year, month, minNum, maxNum],
  );

  const inRange = useCallback(
    (day: number) => {
      if (!rangeStart || !rangeEnd) return false;
      const num = dateToNum(toISO(year, month, day));
      const sn = dateToNum(rangeStart);
      const en = dateToNum(rangeEnd);
      return num >= sn && num <= en;
    },
    [year, month, rangeStart, rangeEnd],
  );

  const handleClick = (day: number) => {
    const iso = toISO(year, month, day);
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(iso);
      setRangeEnd(null);
    } else {
      if (dateToNum(iso) < dateToNum(rangeStart)) {
        setRangeEnd(rangeStart);
        setRangeStart(iso);
      } else {
        setRangeEnd(iso);
      }
    }
  };

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const ready = rangeStart && rangeEnd;

  return (
    <div data-widget-id={widgetId} style={{ background: '#141313', borderRadius: 0 }} className="p-4">
      <h3 className="text-base font-semibold mb-1" style={{ color: '#e5e5e5' }}>{label}</h3>
      <p className="text-xs mb-3" style={{ color: '#888' }}>{description}</p>

      <div className="flex items-center justify-between mb-2">
        <button onClick={prev} className="px-2 py-1 text-sm" style={{ color: '#ccc', background: '#1b1b1b', borderRadius: 0 }}>◀</button>
        <span className="text-sm font-medium" style={{ color: '#ddd' }}>{MONTHS[month]} {year}</span>
        <button onClick={next} className="px-2 py-1 text-sm" style={{ color: '#ccc', background: '#1b1b1b', borderRadius: 0 }}>▶</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs mb-1" style={{ color: '#777' }}>
        {DAYS.map(d => <div key={d} className="py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 text-center text-xs">
        {grid.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const iso = toISO(year, month, day);
          const dis = isDisabled(day);
          const isStart = rangeStart === iso;
          const isEnd = rangeEnd === iso;
          const mid = inRange(day) && !isStart && !isEnd;
          let bg = 'transparent';
          let fg = dis ? '#444' : '#ccc';
          if (isStart || isEnd) { bg = '#0A7CFF'; fg = '#fff'; }
          else if (mid) { bg = 'rgba(10,124,255,0.2)'; fg = '#8cc4ff'; }
          return (
            <button
              key={iso}
              disabled={dis}
              onClick={() => !dis && handleClick(day)}
              className="py-1.5"
              style={{ color: fg, background: bg, cursor: dis ? 'not-allowed' : 'pointer', borderRadius: 0 }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {rangeStart && (
        <p className="text-xs mt-2" style={{ color: '#0A7CFF' }}>
          {rangeEnd ? `Range: ${rangeStart} → ${rangeEnd}` : `Start: ${rangeStart} (pick end date)`}
        </p>
      )}

      <button
        disabled={!ready}
        onClick={() => {
          if (rangeStart && rangeEnd) {
            onSubmit({
              type: 'date_range',
              value: `${rangeStart}/${rangeEnd}`,
              raw: { widget_id: widgetId, start_date: rangeStart, end_date: rangeEnd, month, year },
            });
          }
        }}
        className="mt-3 w-full py-2 text-sm font-medium"
        style={{
          background: ready ? '#0A7CFF' : '#333',
          color: ready ? '#fff' : '#666',
          borderRadius: 0,
          cursor: ready ? 'pointer' : 'not-allowed',
        }}
      >
        Submit {label}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  PAGE                                                              */
/* ═══════════════════════════════════════════════════════════════════ */
export default function Page_mortgage_calculator(props: GeneratedPageProps) {
  const { onSubmit } = props;

  return (
    <div className="min-h-screen" style={{ background: '#0d0d0d', fontFamily: 'system-ui, sans-serif' }}>
      {/* ── Header ── */}
      <header style={{ background: '#1b1b1b' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏦</span>
            <span className="text-base font-semibold" style={{ color: '#e5e5e5' }}>EchoBank</span>
          </div>
          <nav className="hidden sm:flex gap-4 text-xs" style={{ color: '#999' }}>
            <span className="cursor-pointer hover:text-white">Accounts</span>
            <span className="cursor-pointer hover:text-white">Transfer</span>
            <span className="cursor-pointer hover:text-white">Cards</span>
            <span className="cursor-pointer hover:text-white">Support</span>
          </nav>
          <div className="flex items-center gap-3 text-xs" style={{ color: '#888' }}>
            <span>🔒 Secure</span>
            <span className="cursor-pointer hover:text-white">Logout</span>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative" style={{ background: '#141313' }}>
        <img
          src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop"
          alt="bank building"
          className="w-full h-48 object-cover"
          style={{ opacity: 0.35 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>Mortgage Calculator</h1>
            <p className="text-sm mt-1" style={{ color: '#aaa' }}>
              Select dates for your closing, rate lock, and combined scheduling below.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Account summary row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3" style={{ background: '#141313', borderRadius: 0 }}>
            <p className="text-xs" style={{ color: '#777' }}>Estimated Loan</p>
            <p className="text-lg font-bold" style={{ color: '#e5e5e5' }}>$425,000</p>
          </div>
          <div className="p-3" style={{ background: '#141313', borderRadius: 0 }}>
            <p className="text-xs" style={{ color: '#777' }}>Interest Rate</p>
            <p className="text-lg font-bold" style={{ color: '#e5e5e5' }}>6.25%</p>
          </div>
          <div className="p-3" style={{ background: '#141313', borderRadius: 0 }}>
            <p className="text-xs" style={{ color: '#777' }}>Monthly Payment</p>
            <p className="text-lg font-bold" style={{ color: '#e5e5e5' }}>$2,617</p>
          </div>
        </div>

        {/* Context text */}
        <p className="text-xs mb-6" style={{ color: '#888' }}>
          Use the date selectors below to schedule your mortgage closing date, define a rate‑lock window,
          and confirm a combined closing &amp; lock timeline. Weekends are excluded for closing dates
          and the rate lock must fall within the approved window.
        </p>

        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-xs px-3 py-1" style={{ background: '#0A7CFF', color: '#fff', borderRadius: 0 }}>All Widgets</span>
          <span className="text-xs px-3 py-1 cursor-pointer" style={{ background: '#1b1b1b', color: '#999', borderRadius: 0 }}>Closing</span>
          <span className="text-xs px-3 py-1 cursor-pointer" style={{ background: '#1b1b1b', color: '#999', borderRadius: 0 }}>Rate Lock</span>
          <span className="text-xs px-3 py-1 cursor-pointer" style={{ background: '#1b1b1b', color: '#999', borderRadius: 0 }}>Combined</span>
        </div>

        {/* Widgets grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Widget 1 – Closing Date */}
          <SingleDatePicker
            widgetId="closing_date"
            label="Closing Date"
            description="Select a weekday for the mortgage closing. Weekends are unavailable."
            initialYear={2025}
            initialMonth={8}
            disabledWeekdays={[0, 6]}
            onSubmit={onSubmit}
          />

          {/* Widget 2 – Rate Lock Period */}
          <RangeDatePicker
            widgetId="rate_lock_period"
            label="Rate Lock Period"
            description="Choose a start and end date for your rate lock (Jun 2 – Aug 24, 2025)."
            initialYear={2025}
            initialMonth={6}
            minDate="2025-06-02"
            maxDate="2025-08-24"
            onSubmit={onSubmit}
          />

          {/* Widget 3 – Compound */}
          <SingleDatePicker
            widgetId="compound"
            label="Closing Date + Rate Lock Period"
            description="Select a weekday to confirm both closing and lock start."
            initialYear={2025}
            initialMonth={5}
            disabledWeekdays={[0, 6]}
            onSubmit={onSubmit}
          />
        </div>

        {/* Supporting cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div style={{ background: '#141313', borderRadius: 0 }} className="overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop"
              alt="coins savings"
              className="w-full h-36 object-cover"
            />
            <div className="p-3">
              <h4 className="text-sm font-semibold" style={{ color: '#e5e5e5' }}>Down Payment Savings</h4>
              <p className="text-xs mt-1" style={{ color: '#888' }}>Track your savings progress toward the 20% down payment goal.</p>
            </div>
          </div>
          <div style={{ background: '#141313', borderRadius: 0 }} className="overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=400&h=300&fit=crop"
              alt="calculator"
              className="w-full h-36 object-cover"
            />
            <div className="p-3">
              <h4 className="text-sm font-semibold" style={{ color: '#e5e5e5' }}>Amortization Schedule</h4>
              <p className="text-xs mt-1" style={{ color: '#888' }}>View your projected monthly payments over the full loan term.</p>
            </div>
          </div>
        </div>

        {/* Transaction history table */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#e5e5e5' }}>Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ color: '#ccc' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th className="text-left py-2 pr-4" style={{ color: '#777' }}>Date</th>
                  <th className="text-left py-2 pr-4" style={{ color: '#777' }}>Description</th>
                  <th className="text-right py-2" style={{ color: '#777' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: 'Apr 18, 2026', desc: 'Appraisal Fee', amt: '-$450.00' },
                  { date: 'Apr 10, 2026', desc: 'Home Inspection', amt: '-$375.00' },
                  { date: 'Mar 28, 2026', desc: 'Earnest Money Deposit', amt: '-$8,500.00' },
                  { date: 'Mar 15, 2026', desc: 'Application Fee', amt: '-$75.00' },
                ].map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                    <td className="py-2 pr-4">{r.date}</td>
                    <td className="py-2 pr-4">{r.desc}</td>
                    <td className="py-2 text-right" style={{ color: '#f87171' }}>{r.amt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: '#101010', borderTop: '1px solid #222' }} className="px-4 py-6 text-center">
        <p className="text-xs" style={{ color: '#555' }}>
          EchoBank is a member FDIC. Equal Housing Lender. NMLS #123456.
        </p>
        <p className="text-xs mt-1" style={{ color: '#444' }}>
          © 2026 EchoBank. All rights reserved. Rates subject to change. Contact support: 1-800-555-0199.
        </p>
      </footer>
    </div>
  );
}
