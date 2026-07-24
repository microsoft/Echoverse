import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const DISABLED_DATES = new Set([
  '2025-01-01','2025-07-04','2025-12-25','2025-11-28',
]);

function pad(n: number) { return n < 10 ? '0' + n : '' + n; }

function toISO(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getStartDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function isWeekendDay(year: number, month: number, day: number) {
  const d = new Date(year, month, day).getDay();
  return d === 0 || d === 6;
}

function isDisabled(year: number, month: number, day: number) {
  if (isWeekendDay(year, month, day)) return true;
  return DISABLED_DATES.has(toISO(year, month, day));
}

/* ─── Transfer Date Picker ─── */
function TransferDatePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // June 2025 (0-indexed)
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const startDay = useMemo(() => getStartDayOfWeek(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleSelect = useCallback((day: number) => {
    if (isDisabled(year, month, day)) return;
    setSelected(toISO(year, month, day));
  }, [year, month]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    onSubmit({
      type: 'date',
      value: selected,
      raw: { widget_id: 'transfer_date', date: selected, year, month: month + 1 },
    });
  }, [selected, onSubmit, year, month]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDay; i++) cells.push(<div key={`e-${i}`} />);
  for (let d = 1; d <= days; d++) {
    const iso = toISO(year, month, d);
    const disabled = isDisabled(year, month, d);
    const isSel = selected === iso;
    cells.push(
      <button
        key={d}
        type="button"
        disabled={disabled}
        onClick={() => handleSelect(d)}
        className={`h-9 rounded-md text-sm font-medium transition-colors
          ${disabled ? 'text-gray-600 cursor-not-allowed opacity-40' : ''}
          ${isSel ? 'text-white' : ''}
          ${!disabled && !isSel ? 'text-gray-300 hover:bg-gray-700' : ''}`}
        style={isSel ? { backgroundColor: '#0A7CFF' } : undefined}
      >
        {d}
      </button>
    );
  }

  return (
    <div data-widget-id="transfer_date" className="rounded-lg p-5" style={{ backgroundColor: '#282e32' }}>
      <h3 className="text-white text-base font-semibold mb-1">Transfer Date</h3>
      <p className="text-gray-400 text-xs mb-4">Select a business day for your wire transfer. Weekends and holidays are unavailable.</p>

      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="text-gray-400 hover:text-white p-1 rounded transition-colors">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        <span className="text-white text-sm font-medium">{MONTHS[month]} {year}</span>
        <button type="button" onClick={nextMonth} className="text-gray-400 hover:text-white p-1 rounded transition-colors">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>

      {selected && (
        <p className="text-xs text-gray-400 mt-3">Selected: <span className="text-white font-medium">{selected}</span></p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selected}
        className={`mt-4 w-full py-2 rounded-md text-sm font-semibold transition-colors
          ${selected ? 'text-white hover:opacity-90' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
        style={selected ? { backgroundColor: '#0A7CFF' } : undefined}
      >
        Confirm Transfer Date
      </button>
    </div>
  );
}

/* ─── Transactions Table ─── */
const TRANSACTIONS = [
  { id: 'TXN-8291', to: 'Apex Industries', amount: '$12,450.00', date: 'Jun 02, 2025', status: 'Completed' },
  { id: 'TXN-8290', to: 'Global Freight Co.', amount: '$8,320.00', date: 'May 28, 2025', status: 'Completed' },
  { id: 'TXN-8289', to: 'Summit Holdings', amount: '$23,100.00', date: 'May 21, 2025', status: 'Pending' },
  { id: 'TXN-8288', to: 'Pacific Ventures', amount: '$5,750.00', date: 'May 15, 2025', status: 'Completed' },
  { id: 'TXN-8287', to: 'Northern Supply', amount: '$17,900.00', date: 'May 10, 2025', status: 'Failed' },
];

/* ─── Main Page ─── */
export default function Page_wire_transfer(props: GeneratedPageProps) {
  const [fromAccount, setFromAccount] = useState('checking');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTxns = useMemo(() => {
    if (statusFilter === 'all') return TRANSACTIONS;
    return TRANSACTIONS.filter(t => t.status.toLowerCase() === statusFilter);
  }, [statusFilter]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1e2226', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#1A3A6B' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏦</span>
              <span className="text-white text-lg font-bold tracking-tight">EchoBank</span>
            </div>
            <nav className="hidden md:flex items-center gap-5">
              {['Accounts', 'Transfer', 'Cards', 'Support'].map(item => (
                <span
                  key={item}
                  className={`text-sm cursor-pointer transition-colors ${item === 'Transfer' ? 'text-white font-semibold' : 'text-blue-200 hover:text-white'}`}
                >
                  {item}
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-green-400 text-xs flex items-center gap-1">
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8"/></svg>
              Secure
            </span>
            <span className="text-blue-200 text-sm">J. Morrison</span>
            <button className="text-blue-300 text-xs hover:text-white transition-colors">Logout</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop"
          alt="bank building"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(26,58,107,0.92), rgba(26,58,107,0.6))' }}>
          <div className="max-w-6xl mx-auto px-4 h-full flex flex-col justify-center">
            <h1 className="text-white text-2xl font-bold">Wire Transfer</h1>
            <p className="text-blue-200 text-sm mt-1">Send domestic or international wire transfers securely from your account.</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Account Overview Card */}
        <div className="rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-4" style={{ backgroundColor: '#282e32' }}>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider">Business Checking ••4821</p>
            <p className="text-white text-2xl font-bold mt-1">$148,320.56</p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-gray-400 text-xs">Pending</p>
              <p className="text-yellow-400 text-sm font-semibold">$23,100.00</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">Available</p>
              <p className="text-green-400 text-sm font-semibold">$125,220.56</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Transfer Form + Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transfer Details */}
            <div className="rounded-lg p-5" style={{ backgroundColor: '#282e32' }}>
              <h2 className="text-white text-base font-semibold mb-4">Transfer Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">From Account</label>
                  <select
                    value={fromAccount}
                    onChange={e => setFromAccount(e.target.value)}
                    className="w-full rounded-md px-3 py-2 text-sm text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                    style={{ backgroundColor: '#1e2226' }}
                  >
                    <option value="checking">Business Checking ••4821</option>
                    <option value="savings">Business Savings ••7653</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">To Account / Routing</label>
                  <input
                    type="text"
                    value={toAccount}
                    onChange={e => setToAccount(e.target.value)}
                    placeholder="Enter account or routing number"
                    className="w-full rounded-md px-3 py-2 text-sm text-white border border-gray-600 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    style={{ backgroundColor: '#1e2226' }}
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Amount (USD)</label>
                  <input
                    type="text"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="$0.00"
                    className="w-full rounded-md px-3 py-2 text-sm text-white border border-gray-600 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    style={{ backgroundColor: '#1e2226' }}
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Memo / Reference</label>
                  <input
                    type="text"
                    value={memo}
                    onChange={e => setMemo(e.target.value)}
                    placeholder="Invoice #, PO, or note"
                    className="w-full rounded-md px-3 py-2 text-sm text-white border border-gray-600 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    style={{ backgroundColor: '#1e2226' }}
                  />
                </div>
              </div>
            </div>

            {/* Calendar Widget */}
            <TransferDatePicker onSubmit={props.onSubmit} />

            {/* Transaction History */}
            <div className="rounded-lg p-5" style={{ backgroundColor: '#282e32' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-base font-semibold">Recent Wire Transfers</h2>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">Filter:</span>
                  {['all', 'completed', 'pending', 'failed'].map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setStatusFilter(f)}
                      className={`text-xs px-2 py-1 rounded transition-colors capitalize
                        ${statusFilter === f ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                      style={statusFilter === f ? { backgroundColor: '#0A7CFF' } : undefined}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-400 text-xs font-medium py-2 pr-4">ID</th>
                      <th className="text-left text-gray-400 text-xs font-medium py-2 pr-4">Recipient</th>
                      <th className="text-right text-gray-400 text-xs font-medium py-2 pr-4">Amount</th>
                      <th className="text-left text-gray-400 text-xs font-medium py-2 pr-4">Date</th>
                      <th className="text-left text-gray-400 text-xs font-medium py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxns.map(tx => (
                      <tr key={tx.id} className="border-b border-gray-700/50">
                        <td className="py-2.5 pr-4 text-gray-300 font-mono text-xs">{tx.id}</td>
                        <td className="py-2.5 pr-4 text-white">{tx.to}</td>
                        <td className="py-2.5 pr-4 text-white text-right font-medium">{tx.amount}</td>
                        <td className="py-2.5 pr-4 text-gray-400">{tx.date}</td>
                        <td className="py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${tx.status === 'Completed' ? 'bg-green-900/40 text-green-400' : ''}
                            ${tx.status === 'Pending' ? 'bg-yellow-900/40 text-yellow-400' : ''}
                            ${tx.status === 'Failed' ? 'bg-red-900/40 text-red-400' : ''}`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-lg p-4" style={{ backgroundColor: '#282e32' }}>
              <h3 className="text-white text-sm font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Domestic Wire', icon: '🏠' },
                  { label: 'International Wire', icon: '🌐' },
                  { label: 'Recurring Transfer', icon: '🔄' },
                  { label: 'Transfer Templates', icon: '📋' },
                ].map(a => (
                  <button
                    key={a.label}
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-gray-300 hover:text-white transition-colors text-left"
                    style={{ backgroundColor: '#1e2226' }}
                  >
                    <span>{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Image */}
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#282e32' }}>
              <img
                src="https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400&h=300&fit=crop"
                alt="credit card"
                className="w-full h-36 object-cover"
              />
              <div className="p-4">
                <p className="text-white text-sm font-semibold">Business Platinum Card</p>
                <p className="text-gray-400 text-xs mt-1">Earn 2% back on all wire transfer fees</p>
              </div>
            </div>

            {/* Savings Card */}
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#282e32' }}>
              <img
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop"
                alt="coins savings"
                className="w-full h-36 object-cover"
              />
              <div className="p-4">
                <p className="text-white text-sm font-semibold">High-Yield Business Savings</p>
                <p className="text-gray-400 text-xs mt-1">4.25% APY — park idle funds between transfers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 border-t border-gray-700/50" style={{ backgroundColor: '#1e2226' }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-wrap gap-8 text-xs text-gray-500 mb-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security Center</span>
            <span>Contact Support</span>
            <span>Accessibility</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            EchoBank is a Member FDIC. Deposits are insured up to $250,000 per depositor. Wire transfers are subject to
            review and may be delayed for compliance verification. Equal Housing Lender. NMLS #123456.
          </p>
          <p className="text-xs text-gray-600 mt-2">© 2025 EchoBank Corporation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
