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

function DOBPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const maxDate = new Date(2025, 7, 31);
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = 2015; y >= 1950; y--) arr.push(y);
    return arr;
  }, []);

  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(7);
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfWeek(viewYear, viewMonth), [viewYear, viewMonth]);

  const isDateDisabled = useCallback((y: number, m: number, d: number) => {
    const date = new Date(y, m, d);
    if (date > maxDate) return true;
    return false;
  }, []);

  const goToPrevMonth = useCallback(() => {
    setViewMonth(prev => {
      if (prev === 0) { setViewYear(y => y - 1); return 11; }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    if (new Date(nextYear, nextMonth, 1) > new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0)) return;
    setViewMonth(nextMonth);
    setViewYear(nextYear);
  }, [viewMonth, viewYear]);

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = parseInt(e.target.value);
    setViewYear(y);
    if (new Date(y, viewMonth, 1) > maxDate) {
      setViewMonth(maxDate.getMonth());
    }
  }, [viewMonth]);

  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value);
    setViewMonth(m);
  }, []);

  const handleDayClick = useCallback((day: number) => {
    if (isDateDisabled(viewYear, viewMonth, day)) return;
    setSelectedDate({ year: viewYear, month: viewMonth, day });
  }, [viewYear, viewMonth, isDateDisabled]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    const iso = toISO(selectedDate.year, selectedDate.month, selectedDate.day);
    onSubmit({
      type: 'dob',
      value: iso,
      raw: {
        widget_id: 'applicant_dob',
        year: selectedDate.year,
        month: selectedDate.month + 1,
        day: selectedDate.day,
        iso,
      },
    });
  }, [selectedDate, onSubmit]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="h-8" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const disabled = isDateDisabled(viewYear, viewMonth, d);
    const isSelected = selectedDate && selectedDate.year === viewYear && selectedDate.month === viewMonth && selectedDate.day === d;
    cells.push(
      <button
        key={d}
        type="button"
        disabled={disabled}
        onClick={() => handleDayClick(d)}
        className={`h-8 w-8 flex items-center justify-center text-sm rounded transition-colors
          ${disabled ? 'text-gray-600 cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-blue-600 hover:text-white'}
          ${isSelected ? 'bg-blue-600 text-white font-bold' : ''}`}
        style={!disabled && !isSelected ? { color: '#d1d5db' } : undefined}
      >
        {d}
      </button>
    );
  }

  const canGoNext = (() => {
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    return new Date(nextYear, nextMonth, 1) <= new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
  })();

  return (
    <div data-widget-id="applicant_dob" className="w-full">
      <div className="mb-3">
        <label className="block text-sm font-semibold mb-1" style={{ color: '#e2e8f0', fontFamily: 'Georgia, serif' }}>
          Date of Birth <span className="text-red-400">*</span>
        </label>
        <p className="text-xs" style={{ color: '#94a3b8' }}>Select your date of birth using the calendar below</p>
      </div>

      <div className="p-4 rounded" style={{ backgroundColor: '#110f24', borderRadius: '4px' }}>
        <div className="flex items-center gap-2 mb-3">
          <select
            value={viewMonth}
            onChange={handleMonthChange}
            className="px-2 py-1.5 text-sm rounded border-0 outline-none"
            style={{ backgroundColor: '#0d0c22', color: '#e2e8f0', borderRadius: '4px' }}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select
            value={viewYear}
            onChange={handleYearChange}
            className="px-2 py-1.5 text-sm rounded border-0 outline-none"
            style={{ backgroundColor: '#0d0c22', color: '#e2e8f0', borderRadius: '4px' }}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="flex-1" />
          <button type="button" onClick={goToPrevMonth} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 text-gray-300" style={{ borderRadius: '4px' }}>‹</button>
          <button type="button" onClick={goToNextMonth} disabled={!canGoNext} className={`w-8 h-8 flex items-center justify-center rounded text-gray-300 ${canGoNext ? 'hover:bg-gray-700' : 'opacity-30 cursor-not-allowed'}`} style={{ borderRadius: '4px' }}>›</button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DAYS_OF_WEEK.map(dow => (
            <div key={dow} className="h-8 flex items-center justify-center text-xs font-medium" style={{ color: '#64748b' }}>{dow}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells}
        </div>
      </div>

      {selectedDate && (
        <p className="mt-2 text-sm" style={{ color: '#93c5fd' }}>
          Selected: {MONTHS[selectedDate.month]} {selectedDate.day}, {selectedDate.year}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedDate}
        className={`mt-3 w-full py-2 text-sm font-semibold rounded transition-colors ${selectedDate ? 'hover:opacity-90 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
        style={{ backgroundColor: '#0A7CFF', color: '#fff', borderRadius: '4px' }}
      >
        Confirm Date of Birth
      </button>
    </div>
  );
}

const TRANSACTIONS = [
  { id: 'TXN-4821', date: '2025-08-28', desc: 'Payroll Deposit', amount: '+$3,450.00', status: 'Completed' },
  { id: 'TXN-4820', date: '2025-08-27', desc: 'Electric Bill', amount: '-$142.50', status: 'Completed' },
  { id: 'TXN-4819', date: '2025-08-25', desc: 'Grocery Store', amount: '-$87.32', status: 'Completed' },
  { id: 'TXN-4818', date: '2025-08-22', desc: 'Wire Transfer', amount: '-$500.00', status: 'Pending' },
  { id: 'TXN-4817', date: '2025-08-20', desc: 'ATM Withdrawal', amount: '-$200.00', status: 'Completed' },
];

export default function Page_loan_application(props: GeneratedPageProps) {
  const [txnFilter, setTxnFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const filteredTxns = useMemo(() => {
    if (txnFilter === 'all') return TRANSACTIONS;
    return TRANSACTIONS.filter(t => t.status.toLowerCase() === txnFilter);
  }, [txnFilter]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#070212', color: '#e2e8f0', fontFamily: '"Georgia", "Times New Roman", serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#110f24' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏦</span>
              <span className="text-lg font-bold" style={{ color: '#fff' }}>EchoBank</span>
            </div>
            <nav className="hidden md:flex items-center gap-4 text-sm" style={{ color: '#94a3b8' }}>
              <a href="#" className="hover:text-white transition-colors">Accounts</a>
              <a href="#" className="hover:text-white transition-colors">Transfer</a>
              <a href="#" className="hover:text-white transition-colors">Cards</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-400 text-xs">🔒 Secure</span>
            <span style={{ color: '#94a3b8' }}>John D.</span>
            <button className="text-xs px-3 py-1 rounded" style={{ backgroundColor: '#323145', color: '#e2e8f0', borderRadius: '4px' }}>Logout</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ backgroundColor: '#0d0c22' }}>
        <img
          src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop"
          alt="Modern bank building exterior"
          className="w-full h-48 object-cover"
          style={{ opacity: 0.25 }}
        />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-4 w-full">
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#fff' }}>Personal Loan Application</h1>
            <p className="text-sm" style={{ color: '#94a3b8' }}>Complete your application details to get started with competitive rates.</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Account Dashboard Card */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded" style={{ backgroundColor: '#110f24', borderRadius: '4px' }}>
            <p className="text-xs mb-1" style={{ color: '#64748b' }}>Checking Balance</p>
            <p className="text-xl font-bold" style={{ color: '#fff' }}>$12,847.63</p>
            <p className="text-xs mt-1 text-green-400">+$3,450.00 this month</p>
          </div>
          <div className="p-4 rounded" style={{ backgroundColor: '#110f24', borderRadius: '4px' }}>
            <p className="text-xs mb-1" style={{ color: '#64748b' }}>Savings Balance</p>
            <p className="text-xl font-bold" style={{ color: '#fff' }}>$45,210.00</p>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>APY 4.25%</p>
          </div>
          <div className="p-4 rounded" style={{ backgroundColor: '#110f24', borderRadius: '4px' }}>
            <p className="text-xs mb-1" style={{ color: '#64748b' }}>Loan Eligibility</p>
            <p className="text-xl font-bold" style={{ color: '#0A7CFF' }}>Pre-Approved</p>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>Up to $50,000</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left column - Form */}
          <div className="md:col-span-2 space-y-4">
            {/* Loan Form Context */}
            <div className="p-4 rounded" style={{ backgroundColor: '#110f24', borderRadius: '4px' }}>
              <h2 className="text-base font-bold mb-3" style={{ color: '#fff' }}>Applicant Information</h2>
              <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>Please provide your personal details to proceed with the loan application. All fields are required.</p>

              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>From Account</label>
                  <select className="w-full px-3 py-2 text-sm rounded border-0 outline-none" style={{ backgroundColor: '#0d0c22', color: '#e2e8f0', borderRadius: '4px' }}>
                    <option>Checking ••••4821</option>
                    <option>Savings ••••7932</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>Loan Amount</label>
                  <div className="flex items-center rounded overflow-hidden" style={{ backgroundColor: '#0d0c22', borderRadius: '4px' }}>
                    <span className="px-2 text-sm" style={{ color: '#64748b' }}>$</span>
                    <input type="text" defaultValue="25,000" className="flex-1 px-2 py-2 text-sm border-0 outline-none bg-transparent" style={{ color: '#e2e8f0' }} />
                    <span className="px-2 text-xs" style={{ color: '#64748b' }}>USD</span>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>Memo / Reference</label>
                <input type="text" placeholder="Personal loan for home renovation" className="w-full px-3 py-2 text-sm rounded border-0 outline-none" style={{ backgroundColor: '#0d0c22', color: '#e2e8f0', borderRadius: '4px' }} />
              </div>

              <DOBPicker onSubmit={props.onSubmit} />
            </div>

            {/* Transaction History */}
            <div className="p-4 rounded" style={{ backgroundColor: '#110f24', borderRadius: '4px' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold" style={{ color: '#fff' }}>Recent Transactions</h2>
                <div className="flex gap-1">
                  {(['all', 'completed', 'pending'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setTxnFilter(f)}
                      className="px-2 py-1 text-xs rounded capitalize transition-colors"
                      style={{
                        backgroundColor: txnFilter === f ? '#323145' : 'transparent',
                        color: txnFilter === f ? '#fff' : '#64748b',
                        borderRadius: '4px',
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e1b3a' }}>
                      <th className="text-left py-2 text-xs font-medium" style={{ color: '#64748b' }}>ID</th>
                      <th className="text-left py-2 text-xs font-medium" style={{ color: '#64748b' }}>Date</th>
                      <th className="text-left py-2 text-xs font-medium" style={{ color: '#64748b' }}>Description</th>
                      <th className="text-right py-2 text-xs font-medium" style={{ color: '#64748b' }}>Amount</th>
                      <th className="text-right py-2 text-xs font-medium" style={{ color: '#64748b' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxns.map(txn => (
                      <tr key={txn.id} style={{ borderBottom: '1px solid #1e1b3a' }}>
                        <td className="py-2 text-xs" style={{ color: '#94a3b8' }}>{txn.id}</td>
                        <td className="py-2 text-xs" style={{ color: '#94a3b8' }}>{txn.date}</td>
                        <td className="py-2" style={{ color: '#e2e8f0' }}>{txn.desc}</td>
                        <td className="py-2 text-right font-medium" style={{ color: txn.amount.startsWith('+') ? '#4ade80' : '#f87171' }}>{txn.amount}</td>
                        <td className="py-2 text-right">
                          <span className="text-xs px-2 py-0.5 rounded" style={{
                            backgroundColor: txn.status === 'Completed' ? '#064e3b' : '#78350f',
                            color: txn.status === 'Completed' ? '#6ee7b7' : '#fcd34d',
                            borderRadius: '4px',
                          }}>{txn.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <div className="rounded overflow-hidden" style={{ borderRadius: '4px' }}>
              <img
                src="https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400&h=300&fit=crop"
                alt="Credit card on dark surface"
                className="w-full h-36 object-cover"
              />
              <div className="p-3" style={{ backgroundColor: '#110f24' }}>
                <h3 className="text-sm font-bold mb-1" style={{ color: '#fff' }}>EchoBank Platinum Card</h3>
                <p className="text-xs" style={{ color: '#94a3b8' }}>Earn 2% cashback on all purchases. No annual fee first year.</p>
              </div>
            </div>

            <div className="rounded overflow-hidden" style={{ borderRadius: '4px' }}>
              <img
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop"
                alt="Coins and savings concept"
                className="w-full h-36 object-cover"
              />
              <div className="p-3" style={{ backgroundColor: '#110f24' }}>
                <h3 className="text-sm font-bold mb-1" style={{ color: '#fff' }}>High-Yield Savings</h3>
                <p className="text-xs" style={{ color: '#94a3b8' }}>4.25% APY. No minimum balance. FDIC insured up to $250,000.</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-3 rounded" style={{ backgroundColor: '#110f24', borderRadius: '4px' }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: '#fff' }}>Quick Actions</h3>
              <div className="space-y-1.5">
                {['Schedule Transfer', 'Pay Bills', 'View Statements', 'Update Profile'].map(action => (
                  <button
                    key={action}
                    className="w-full text-left px-3 py-2 text-xs rounded transition-colors hover:opacity-80"
                    style={{ backgroundColor: '#0d0c22', color: '#94a3b8', borderRadius: '4px' }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 py-6 border-t" style={{ backgroundColor: '#0d0c22', borderColor: '#1e1b3a' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-4 mb-4 text-xs" style={{ color: '#64748b' }}>
            <div>
              <p className="font-semibold mb-1" style={{ color: '#94a3b8' }}>Security</p>
              <p>256-bit SSL encryption. Multi-factor authentication enabled. Session timeout after 15 minutes.</p>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: '#94a3b8' }}>Regulatory</p>
              <p>EchoBank, N.A. Member FDIC. Equal Housing Lender. NMLS #123456.</p>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: '#94a3b8' }}>Contact</p>
              <p>1-800-TRUST-BK (878-7825)<br />Mon–Fri 8am–9pm ET</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs" style={{ color: '#475569' }}>
            <p>© 2025 EchoBank, N.A. All rights reserved. FDIC insured.</p>
            <div className="flex gap-3">
              <a href="#" className="hover:underline">Privacy</a>
              <a href="#" className="hover:underline">Terms</a>
              <a href="#" className="hover:underline">Disclosures</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
