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

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

function firstDayOfMonth(y: number, m: number): number {
  return new Date(y, m, 1).getDay();
}

interface DatepickerProps {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  initialMonth: number;
  disabledDates: Set<string>;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

function Datepicker({
  widgetId,
  label,
  description,
  initialYear,
  initialMonth,
  disabledDates,
  onSubmit,
}: DatepickerProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const prevMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 0) { setYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 11) { setYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const days = useMemo(() => {
    const total = daysInMonth(year, month);
    const start = firstDayOfMonth(year, month);
    const cells: Array<{ day: number; iso: string; disabled: boolean } | null> = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= total; d++) {
      const iso = toISO(year, month, d);
      cells.push({ day: d, iso, disabled: disabledDates.has(iso) });
    }
    return cells;
  }, [year, month, disabledDates]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    onSubmit({
      type: 'date',
      value: selected,
      raw: {
        widget_id: widgetId,
        selected_date: selected,
        year,
        month: month + 1,
      },
    });
  }, [selected, widgetId, year, month, onSubmit]);

  return (
    <div data-widget-id={widgetId} style={{ background: '#fefefe', borderRadius: 0 }} className="p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#1A3A6B' }}>{label}</h3>
      <p className="text-sm mb-4" style={{ color: '#6b7280' }}>{description}</p>

      <div style={{ background: '#f9f8f6', borderRadius: 0 }} className="p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center text-sm font-medium hover:opacity-70"
            style={{ color: '#1A3A6B' }}
            aria-label="Previous month"
          >
            ◀
          </button>
          <span className="font-semibold text-sm" style={{ color: '#1A3A6B' }}>
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center text-sm font-medium hover:opacity-70"
            style={{ color: '#1A3A6B' }}
            aria-label="Next month"
          >
            ▶
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#6b7280' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((cell, i) => {
            if (!cell) return <div key={`e-${i}`} className="h-9" />;
            const isSelected = selected === cell.iso;
            const isDisabled = cell.disabled;
            return (
              <button
                key={cell.iso}
                disabled={isDisabled}
                onClick={() => !isDisabled && setSelected(cell.iso)}
                className={
                  'h-9 text-sm font-normal flex items-center justify-center transition-colors ' +
                  (isDisabled
                    ? 'text-gray-300 cursor-not-allowed line-through'
                    : isSelected
                    ? 'text-white font-medium'
                    : 'hover:opacity-80 cursor-pointer')
                }
                style={
                  isDisabled
                    ? { background: '#f5f5f5', borderRadius: 0 }
                    : isSelected
                    ? { background: '#1A3A6B', borderRadius: 0 }
                    : { background: '#fefefe', borderRadius: 0, color: '#1A3A6B' }
                }
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected display + submit */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm" style={{ color: '#6b7280' }}>
          {selected ? `Selected: ${selected}` : 'No date selected'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className={
            'px-5 py-2 text-sm font-medium transition-colors ' +
            (selected ? 'text-white hover:opacity-90 cursor-pointer' : 'text-gray-400 cursor-not-allowed')
          }
          style={{
            background: selected ? '#1A3A6B' : '#e7e5e3',
            borderRadius: 0,
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default function Page_tax_filing(props: GeneratedPageProps) {
  const filingDeadlineDisabled = useMemo(
    () =>
      new Set([
        '2025-07-15','2025-07-16','2025-07-18','2025-07-21','2025-07-22',
        '2025-07-25','2025-08-05','2025-08-08',
      ]),
    []
  );

  return (
    <div className="min-h-screen font-sans" style={{ background: '#e7e5e3' }}>
      {/* Header */}
      <header style={{ background: '#1A3A6B' }} className="px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-white text-lg font-semibold flex items-center gap-2">
              🏦 EchoBank
            </span>
            <nav className="hidden md:flex gap-5 text-sm">
              {['Accounts', 'Transfer', 'Cards', 'Support'].map((item) => (
                <span key={item} className="text-blue-200 hover:text-white cursor-pointer transition-colors">
                  {item}
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm text-blue-200">
            <span className="flex items-center gap-1">🔒 Secure</span>
            <span className="hover:text-white cursor-pointer">Logout</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop"
          alt="EchoBank headquarters building"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center" style={{ background: 'rgba(26,58,107,0.65)' }}>
          <div className="max-w-6xl mx-auto px-6 w-full">
            <h1 className="text-white text-2xl font-semibold">Tax Filing Portal</h1>
            <p className="text-blue-200 text-sm mt-1">Schedule your tax-related transactions and filing deadlines</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account dashboard card */}
            <div style={{ background: '#fefefe', borderRadius: 0 }} className="p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold" style={{ color: '#1A3A6B' }}>Account Overview</h2>
                <span className="text-xs px-2 py-1" style={{ background: '#f7f5f2', color: '#6b7280' }}>
                  Tax Season 2025
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div style={{ background: '#f9f8f6', borderRadius: 0 }} className="p-3">
                  <p className="text-xs" style={{ color: '#6b7280' }}>Checking Account</p>
                  <p className="text-lg font-semibold" style={{ color: '#1A3A6B' }}>$24,583.47</p>
                </div>
                <div style={{ background: '#f9f8f6', borderRadius: 0 }} className="p-3">
                  <p className="text-xs" style={{ color: '#6b7280' }}>Tax Reserve</p>
                  <p className="text-lg font-semibold" style={{ color: '#1A3A6B' }}>$8,200.00</p>
                </div>
              </div>
              <div className="text-xs" style={{ color: '#6b7280' }}>
                Recent: IRS Payment — $3,150.00 • State Filing Fee — $45.00 • Accountant Fee — $500.00
              </div>
            </div>

            {/* Transfer form context */}
            <div style={{ background: '#fefefe', borderRadius: 0 }} className="p-5 shadow-sm border border-gray-200">
              <h2 className="font-semibold mb-3" style={{ color: '#1A3A6B' }}>Schedule Tax Payment</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>From Account</label>
                  <select
                    className="w-full border border-gray-200 px-3 py-2 text-sm"
                    style={{ background: '#f9f8f6', borderRadius: 0, color: '#1A3A6B' }}
                  >
                    <option>Checking ••4821</option>
                    <option>Savings ••7390</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>To</label>
                  <select
                    className="w-full border border-gray-200 px-3 py-2 text-sm"
                    style={{ background: '#f9f8f6', borderRadius: 0, color: '#1A3A6B' }}
                  >
                    <option>IRS — Federal Tax</option>
                    <option>State Tax Authority</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>Amount (USD)</label>
                  <input
                    type="text"
                    defaultValue="3,150.00"
                    className="w-full border border-gray-200 px-3 py-2 text-sm"
                    style={{ background: '#f9f8f6', borderRadius: 0, color: '#1A3A6B' }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>Reference / Memo</label>
                  <input
                    type="text"
                    defaultValue="Q2 2025 Estimated Tax"
                    className="w-full border border-gray-200 px-3 py-2 text-sm"
                    style={{ background: '#f9f8f6', borderRadius: 0, color: '#1A3A6B' }}
                  />
                </div>
              </div>
              <p className="text-xs" style={{ color: '#6b7280' }}>
                Select a filing deadline below to schedule your payment date.
              </p>
            </div>

            {/* Datepicker widget */}
            <Datepicker
              widgetId="filing_deadline"
              label="Filing Deadline"
              description="Select an available date for your tax filing deadline. Grayed-out dates are unavailable due to processing blackout periods."
              initialYear={2025}
              initialMonth={6}
              disabledDates={filingDeadlineDisabled}
              onSubmit={props.onSubmit}
            />

            {/* Transaction history */}
            <div style={{ background: '#fefefe', borderRadius: 0 }} className="p-5 shadow-sm border border-gray-200">
              <h2 className="font-semibold mb-3" style={{ color: '#1A3A6B' }}>Transaction History</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #e7e5e3' }}>
                    <th className="text-left py-2 font-medium" style={{ color: '#6b7280' }}>Date</th>
                    <th className="text-left py-2 font-medium" style={{ color: '#6b7280' }}>Description</th>
                    <th className="text-right py-2 font-medium" style={{ color: '#6b7280' }}>Amount</th>
                    <th className="text-right py-2 font-medium" style={{ color: '#6b7280' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { date: '2025-06-15', desc: 'IRS Q2 Estimated Tax', amt: '-$3,150.00', status: 'Completed' },
                    { date: '2025-06-10', desc: 'State Filing Fee', amt: '-$45.00', status: 'Completed' },
                    { date: '2025-06-01', desc: 'Accountant Payment', amt: '-$500.00', status: 'Completed' },
                    { date: '2025-05-15', desc: 'Tax Refund Deposit', amt: '+$1,247.00', status: 'Completed' },
                  ].map((tx) => (
                    <tr key={tx.date + tx.desc} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td className="py-2" style={{ color: '#6b7280' }}>{tx.date}</td>
                      <td className="py-2" style={{ color: '#1A3A6B' }}>{tx.desc}</td>
                      <td className="py-2 text-right" style={{ color: tx.amt.startsWith('+') ? '#059669' : '#1A3A6B' }}>
                        {tx.amt}
                      </td>
                      <td className="py-2 text-right">
                        <span className="text-xs px-2 py-0.5" style={{ background: '#f7f5f2', color: '#6b7280' }}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick actions */}
            <div style={{ background: '#fefefe', borderRadius: 0 }} className="p-5 shadow-sm border border-gray-200">
              <h3 className="font-semibold mb-3 text-sm" style={{ color: '#1A3A6B' }}>Quick Actions</h3>
              <div className="space-y-2">
                {['Pay Federal Tax', 'Pay State Tax', 'Download W-2', 'View 1099 Forms'].map((action) => (
                  <div
                    key={action}
                    className="px-3 py-2 text-sm cursor-pointer hover:opacity-80 transition-colors"
                    style={{ background: '#f9f8f6', color: '#1A3A6B', borderRadius: 0 }}
                  >
                    {action}
                  </div>
                ))}
              </div>
            </div>

            <img
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop"
              alt="Coins and savings concept"
              className="w-full h-48 object-cover"
              style={{ borderRadius: 0 }}
            />

            {/* Filters */}
            <div style={{ background: '#fefefe', borderRadius: 0 }} className="p-5 shadow-sm border border-gray-200">
              <h3 className="font-semibold mb-3 text-sm" style={{ color: '#1A3A6B' }}>Filter Transactions</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>Type</label>
                  <select
                    className="w-full border border-gray-200 px-3 py-2 text-sm"
                    style={{ background: '#f9f8f6', borderRadius: 0, color: '#1A3A6B' }}
                  >
                    <option>All Transactions</option>
                    <option>Payments</option>
                    <option>Refunds</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>Period</label>
                  <select
                    className="w-full border border-gray-200 px-3 py-2 text-sm"
                    style={{ background: '#f9f8f6', borderRadius: 0, color: '#1A3A6B' }}
                  >
                    <option>Last 30 Days</option>
                    <option>Last 90 Days</option>
                    <option>Year to Date</option>
                  </select>
                </div>
              </div>
            </div>

            <img
              src="https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=400&h=300&fit=crop"
              alt="Calculator for tax calculations"
              className="w-full h-48 object-cover"
              style={{ borderRadius: 0 }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#1A3A6B' }} className="mt-8 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-200">
            <div>
              <p className="font-medium text-white mb-2">🏦 EchoBank</p>
              <p>Member FDIC. Equal Housing Lender.</p>
              <p className="mt-1">Deposits insured up to $250,000.</p>
            </div>
            <div>
              <p className="font-medium text-white mb-2">Security</p>
              <p>256-bit SSL encryption protects your data.</p>
              <p className="mt-1">Multi-factor authentication enabled.</p>
            </div>
            <div>
              <p className="font-medium text-white mb-2">Contact Support</p>
              <p>1-800-TRUST-BK (878-7825)</p>
              <p className="mt-1">support@trustbank.com</p>
            </div>
          </div>
          <div className="mt-4 pt-4 text-xs text-blue-300" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            © 2025 EchoBank, N.A. All rights reserved. NMLS #12345. Subject to regulatory disclosures and terms of service.
          </div>
        </div>
      </footer>
    </div>
  );
}
