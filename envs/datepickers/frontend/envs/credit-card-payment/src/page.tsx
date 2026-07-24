import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
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

const DISABLED_DATES = new Set(['2025-01-01','2025-07-04','2025-12-25','2025-11-28']);

// ─── Widget 1: Payment Date (constrained, business days only) ───
function PaymentDatePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(7); // August (0-indexed)
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfWeek(viewYear, viewMonth), [viewYear, viewMonth]);

  const isDisabled = useCallback((y: number, m: number, d: number) => {
    const date = new Date(y, m, d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) return true;
    if (DISABLED_DATES.has(toISO(y, m, d))) return true;
    return false;
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
    onSubmit({ type: 'date', value: iso, raw: { widget_id: 'payment_date', year: selectedDate.year, month: selectedDate.month + 1, day: selectedDate.day, iso } });
  }, [selectedDate, onSubmit]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="h-9" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const disabled = isDisabled(viewYear, viewMonth, d);
    const sel = selectedDate && selectedDate.year === viewYear && selectedDate.month === viewMonth && selectedDate.day === d;
    cells.push(
      <button key={d} type="button" disabled={disabled} onClick={() => handleDayClick(d)}
        className={`h-9 w-9 flex items-center justify-center text-sm transition-all
          ${disabled ? 'opacity-30 cursor-not-allowed line-through' : 'cursor-pointer hover:bg-blue-500 hover:text-white'}
          ${sel ? 'font-bold' : ''}`}
        style={{
          borderRadius: '9999px',
          backgroundColor: sel ? '#0A7CFF' : undefined,
          color: sel ? '#fff' : disabled ? '#666' : '#f6f7f8',
        }}>
        {d}
      </button>
    );
  }

  return (
    <div data-widget-id="payment_date" className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1">
        <button type="button" onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-lg hover:opacity-70" style={{ color: '#f6f7f8', borderRadius: '9999px' }}>‹</button>
        <span className="text-sm font-semibold" style={{ color: '#f6f7f8' }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-lg hover:opacity-70" style={{ color: '#f6f7f8', borderRadius: '9999px' }}>›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_OF_WEEK.map(d => <div key={d} className="h-8 flex items-center justify-center text-xs font-medium" style={{ color: '#bec6cc' }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
      {selectedDate && (
        <div className="mt-2 text-xs text-center" style={{ color: '#bec6cc' }}>
          Selected: {MONTHS[selectedDate.month]} {selectedDate.day}, {selectedDate.year}
        </div>
      )}
      <button type="button" onClick={handleSubmit} disabled={!selectedDate}
        className={`mt-3 w-full py-2.5 text-sm font-semibold transition-all ${selectedDate ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'}`}
        style={{ borderRadius: '9999px', backgroundColor: '#0A7CFF', color: '#fff' }}>
        Confirm Payment Date
      </button>
    </div>
  );
}

// ─── Widget 2: Billing Month (month/year selector, past only) ───
function BillingMonthPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const maxDate = new Date(2025, 8, 30); // Sept 30 2025
  const [viewYear, setViewYear] = useState(2025);
  const [selected, setSelected] = useState<{ year: number; month: number } | null>(null);

  const isMonthDisabled = useCallback((y: number, m: number) => {
    const lastDay = new Date(y, m + 1, 0);
    return lastDay > maxDate;
  }, []);

  const prevYear = useCallback(() => setViewYear(y => y - 1), []);
  const nextYear = useCallback(() => setViewYear(y => y + 1), []);

  const handleMonthClick = useCallback((m: number) => {
    if (isMonthDisabled(viewYear, m)) return;
    setSelected({ year: viewYear, month: m });
  }, [viewYear, isMonthDisabled]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    const val = `${selected.year}-${String(selected.month + 1).padStart(2, '0')}`;
    onSubmit({ type: 'month_year', value: val, raw: { widget_id: 'billing_month', year: selected.year, month: selected.month + 1, formatted: `${MONTHS[selected.month]} ${selected.year}` } });
  }, [selected, onSubmit]);

  return (
    <div data-widget-id="billing_month" className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1">
        <button type="button" onClick={prevYear} className="w-8 h-8 flex items-center justify-center text-lg hover:opacity-70" style={{ color: '#f6f7f8', borderRadius: '9999px' }}>‹</button>
        <span className="text-sm font-semibold" style={{ color: '#f6f7f8' }}>{viewYear}</span>
        <button type="button" onClick={nextYear} className="w-8 h-8 flex items-center justify-center text-lg hover:opacity-70" style={{ color: '#f6f7f8', borderRadius: '9999px' }}>›</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTHS_SHORT.map((label, i) => {
          const disabled = isMonthDisabled(viewYear, i);
          const sel = selected && selected.year === viewYear && selected.month === i;
          return (
            <button key={label} type="button" disabled={disabled} onClick={() => handleMonthClick(i)}
              className={`py-2.5 text-sm font-medium transition-all
                ${disabled ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                ${sel ? 'font-bold' : ''}`}
              style={{
                borderRadius: '9999px',
                backgroundColor: sel ? '#0A7CFF' : '#23242b',
                color: sel ? '#fff' : disabled ? '#555' : '#f6f7f8',
              }}>
              {label}
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="mt-2 text-xs text-center" style={{ color: '#bec6cc' }}>
          Selected: {MONTHS[selected.month]} {selected.year}
        </div>
      )}
      <button type="button" onClick={handleSubmit} disabled={!selected}
        className={`mt-3 w-full py-2.5 text-sm font-semibold transition-all ${selected ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'}`}
        style={{ borderRadius: '9999px', backgroundColor: '#0A7CFF', color: '#fff' }}>
        Confirm Billing Month
      </button>
    </div>
  );
}

// ─── Widget 3: Compound (constrained date calendar) ───
function CompoundPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(5); // June (0-indexed)
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfWeek(viewYear, viewMonth), [viewYear, viewMonth]);

  const isDisabled = useCallback((y: number, m: number, d: number) => {
    const date = new Date(y, m, d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) return true;
    if (DISABLED_DATES.has(toISO(y, m, d))) return true;
    return false;
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
    onSubmit({ type: 'date', value: iso, raw: { widget_id: 'compound', year: selectedDate.year, month: selectedDate.month + 1, day: selectedDate.day, iso } });
  }, [selectedDate, onSubmit]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="h-9" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const disabled = isDisabled(viewYear, viewMonth, d);
    const sel = selectedDate && selectedDate.year === viewYear && selectedDate.month === viewMonth && selectedDate.day === d;
    cells.push(
      <button key={d} type="button" disabled={disabled} onClick={() => handleDayClick(d)}
        className={`h-9 w-9 flex items-center justify-center text-sm transition-all
          ${disabled ? 'opacity-30 cursor-not-allowed line-through' : 'cursor-pointer hover:bg-blue-500 hover:text-white'}
          ${sel ? 'font-bold' : ''}`}
        style={{
          borderRadius: '9999px',
          backgroundColor: sel ? '#0A7CFF' : undefined,
          color: sel ? '#fff' : disabled ? '#666' : '#f6f7f8',
        }}>
        {d}
      </button>
    );
  }

  return (
    <div data-widget-id="compound" className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1">
        <button type="button" onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-lg hover:opacity-70" style={{ color: '#f6f7f8', borderRadius: '9999px' }}>‹</button>
        <span className="text-sm font-semibold" style={{ color: '#f6f7f8' }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-lg hover:opacity-70" style={{ color: '#f6f7f8', borderRadius: '9999px' }}>›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_OF_WEEK.map(d => <div key={d} className="h-8 flex items-center justify-center text-xs font-medium" style={{ color: '#bec6cc' }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
      {selectedDate && (
        <div className="mt-2 text-xs text-center" style={{ color: '#bec6cc' }}>
          Selected: {MONTHS[selectedDate.month]} {selectedDate.day}, {selectedDate.year}
        </div>
      )}
      <button type="button" onClick={handleSubmit} disabled={!selectedDate}
        className={`mt-3 w-full py-2.5 text-sm font-semibold transition-all ${selectedDate ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'}`}
        style={{ borderRadius: '9999px', backgroundColor: '#0A7CFF', color: '#fff' }}>
        Confirm Date
      </button>
    </div>
  );
}

// ─── Main Page ───
export default function Page_credit_card_payment(props: GeneratedPageProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'scheduled' | 'pending'>('all');

  const transactions = [
    { id: 'TXN-4821', desc: 'EchoShop', amount: '-$14.99', date: 'Aug 12, 2025', status: 'Completed' },
    { id: 'TXN-4820', desc: 'EchoMart', amount: '-$87.32', date: 'Aug 11, 2025', status: 'Completed' },
    { id: 'TXN-4819', desc: 'Payment Received', amount: '+$500.00', date: 'Aug 10, 2025', status: 'Completed' },
    { id: 'TXN-4818', desc: 'EchoStream', amount: '-$15.99', date: 'Aug 09, 2025', status: 'Pending' },
    { id: 'TXN-4817', desc: 'Scheduled Transfer', amount: '-$200.00', date: 'Aug 15, 2025', status: 'Scheduled' },
  ];

  const filtered = transactions.filter(t => {
    if (activeFilter === 'scheduled') return t.status === 'Scheduled';
    if (activeFilter === 'pending') return t.status === 'Pending';
    return true;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#111118', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: '#13141b', borderColor: '#23242b' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏦</span>
              <span className="text-base font-bold" style={{ color: '#f6f7f8' }}>EchoBank</span>
            </div>
            <nav className="hidden md:flex items-center gap-5">
              {['Accounts', 'Transfer', 'Cards', 'Support'].map(item => (
                <button key={item} type="button" className="text-sm hover:opacity-80 transition-opacity" style={{ color: item === 'Cards' ? '#0A7CFF' : '#bec6cc' }}>
                  {item}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs flex items-center gap-1" style={{ color: '#4ade80' }}>🔒 Secure</span>
            <div className="w-8 h-8 flex items-center justify-center text-xs font-semibold" style={{ borderRadius: '9999px', backgroundColor: '#23242b', color: '#f6f7f8' }}>JD</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="relative overflow-hidden mb-6" style={{ borderRadius: '12px' }}>
          <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop" alt="Banking services" className="w-full h-48 object-cover" style={{ borderRadius: '12px' }} />
          <div className="absolute inset-0 flex items-end p-6" style={{ background: 'linear-gradient(to top, #111118 0%, transparent 100%)', borderRadius: '12px' }}>
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: '#f6f7f8' }}>Credit Card Payment</h1>
              <p className="text-sm" style={{ color: '#bec6cc' }}>Manage your card payments, view billing history, and schedule upcoming transfers</p>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4" style={{ backgroundColor: '#13141b', borderRadius: '12px', border: '1px solid #23242b' }}>
            <div className="text-xs mb-1" style={{ color: '#bec6cc' }}>Current Balance</div>
            <div className="text-xl font-bold" style={{ color: '#f6f7f8' }}>$4,281.56</div>
            <div className="text-xs mt-1" style={{ color: '#4ade80' }}>↑ Payment due in 12 days</div>
          </div>
          <div className="p-4" style={{ backgroundColor: '#13141b', borderRadius: '12px', border: '1px solid #23242b' }}>
            <div className="text-xs mb-1" style={{ color: '#bec6cc' }}>Credit Limit</div>
            <div className="text-xl font-bold" style={{ color: '#f6f7f8' }}>$15,000.00</div>
            <div className="text-xs mt-1" style={{ color: '#bec6cc' }}>Available: $10,718.44</div>
          </div>
          <div className="p-4" style={{ backgroundColor: '#13141b', borderRadius: '12px', border: '1px solid #23242b' }}>
            <div className="text-xs mb-1" style={{ color: '#bec6cc' }}>Last Payment</div>
            <div className="text-xl font-bold" style={{ color: '#f6f7f8' }}>$500.00</div>
            <div className="text-xs mt-1" style={{ color: '#bec6cc' }}>Aug 10, 2025</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Datepickers */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Payment Form Context */}
            <div className="p-5" style={{ backgroundColor: '#13141b', borderRadius: '12px', border: '1px solid #23242b' }}>
              <h2 className="text-base font-semibold mb-4" style={{ color: '#f6f7f8' }}>Schedule Payment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#bec6cc' }}>From Account</label>
                  <div className="w-full px-3 py-2.5 text-sm" style={{ backgroundColor: '#23242b', borderRadius: '9999px', color: '#f6f7f8' }}>Checking ••••4582</div>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#bec6cc' }}>To Card</label>
                  <div className="w-full px-3 py-2.5 text-sm" style={{ backgroundColor: '#23242b', borderRadius: '9999px', color: '#f6f7f8' }}>EchoPay ••••7891</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#bec6cc' }}>Amount (USD)</label>
                  <div className="w-full px-3 py-2.5 text-sm" style={{ backgroundColor: '#23242b', borderRadius: '9999px', color: '#f6f7f8' }}>$500.00</div>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#bec6cc' }}>Memo / Reference</label>
                  <div className="w-full px-3 py-2.5 text-sm" style={{ backgroundColor: '#23242b', borderRadius: '9999px', color: '#bec6cc' }}>Monthly credit card payment</div>
                </div>
              </div>
            </div>

            {/* Widget 1: Payment Date */}
            <div className="p-5" style={{ backgroundColor: '#13141b', borderRadius: '12px', border: '1px solid #23242b' }}>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-lg">📅</span>
                <h3 className="text-base font-semibold" style={{ color: '#f6f7f8' }}>Payment Date</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: '#bec6cc' }}>
                Select a business day for your payment. Weekends and holidays are unavailable.
              </p>
              <PaymentDatePicker onSubmit={props.onSubmit} />
            </div>

            {/* Widget 2: Billing Month */}
            <div className="p-5" style={{ backgroundColor: '#13141b', borderRadius: '12px', border: '1px solid #23242b' }}>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-lg">🗓️</span>
                <h3 className="text-base font-semibold" style={{ color: '#f6f7f8' }}>Billing Month</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: '#bec6cc' }}>
                Choose the billing cycle month for your statement. Only past months through September 2025 are available.
              </p>
              <BillingMonthPicker onSubmit={props.onSubmit} />
            </div>

            {/* Widget 3: Compound */}
            <div className="p-5" style={{ backgroundColor: '#13141b', borderRadius: '12px', border: '1px solid #23242b' }}>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-lg">📆</span>
                <h3 className="text-base font-semibold" style={{ color: '#f6f7f8' }}>Payment Date + Billing Month</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: '#bec6cc' }}>
                Select a specific date for combined payment scheduling and billing reconciliation.
              </p>
              <CompoundPicker onSubmit={props.onSubmit} />
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-6">
            {/* Quick Actions */}
            <div className="p-5" style={{ backgroundColor: '#13141b', borderRadius: '12px', border: '1px solid #23242b' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#f6f7f8' }}>Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {[{ icon: '💳', label: 'Pay Bill' }, { icon: '🔄', label: 'Auto-Pay' }, { icon: '📊', label: 'Statements' }, { icon: '⚙️', label: 'Settings' }].map(a => (
                  <button key={a.label} type="button" className="flex flex-col items-center gap-1.5 py-3 text-xs transition-opacity hover:opacity-80"
                    style={{ backgroundColor: '#23242b', borderRadius: '12px', color: '#f6f7f8' }}>
                    <span className="text-lg">{a.icon}</span>{a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Image */}
            <div className="overflow-hidden" style={{ borderRadius: '12px', border: '1px solid #23242b' }}>
              <img src="https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400&h=300&fit=crop" alt="Credit card" className="w-full h-40 object-cover" />
              <div className="p-4" style={{ backgroundColor: '#13141b' }}>
                <div className="text-sm font-semibold" style={{ color: '#f6f7f8' }}>EchoBank EchoPay Platinum</div>
                <div className="text-xs mt-1" style={{ color: '#bec6cc' }}>••••  ••••  ••••  7891</div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="p-5" style={{ backgroundColor: '#13141b', borderRadius: '12px', border: '1px solid #23242b' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#f6f7f8' }}>Recent Transactions</h3>
              <div className="flex gap-2 mb-3">
                {(['all', 'scheduled', 'pending'] as const).map(f => (
                  <button key={f} type="button" onClick={() => setActiveFilter(f)}
                    className="px-3 py-1 text-xs font-medium transition-all capitalize"
                    style={{
                      borderRadius: '9999px',
                      backgroundColor: activeFilter === f ? '#0A7CFF' : '#23242b',
                      color: activeFilter === f ? '#fff' : '#bec6cc',
                    }}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {filtered.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#23242b' }}>
                    <div>
                      <div className="text-sm" style={{ color: '#f6f7f8' }}>{t.desc}</div>
                      <div className="text-xs" style={{ color: '#bec6cc' }}>{t.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium" style={{ color: t.amount.startsWith('+') ? '#4ade80' : '#f6f7f8' }}>{t.amount}</div>
                      <div className="text-xs" style={{ color: t.status === 'Pending' ? '#fbbf24' : t.status === 'Scheduled' ? '#0A7CFF' : '#bec6cc' }}>{t.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Savings Card */}
            <div className="overflow-hidden" style={{ borderRadius: '12px', border: '1px solid #23242b' }}>
              <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop" alt="Savings and coins" className="w-full h-32 object-cover" />
              <div className="p-4" style={{ backgroundColor: '#13141b' }}>
                <div className="text-sm font-semibold" style={{ color: '#f6f7f8' }}>Rewards Balance</div>
                <div className="text-xs mt-1" style={{ color: '#bec6cc' }}>12,450 points available — redeem for cashback</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-10 border-t py-6 px-4" style={{ borderColor: '#23242b', backgroundColor: '#13141b' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs" style={{ color: '#bec6cc' }}>
            <div>
              <div className="font-semibold mb-1" style={{ color: '#f6f7f8' }}>🏦 EchoBank</div>
              <p>Member FDIC. Equal Housing Lender. NMLS #123456</p>
            </div>
            <div>
              <div className="font-semibold mb-1" style={{ color: '#f6f7f8' }}>Security</div>
              <p>256-bit SSL encryption. Your data is protected under federal banking regulations.</p>
            </div>
            <div>
              <div className="font-semibold mb-1" style={{ color: '#f6f7f8' }}>Contact Support</div>
              <p>1-800-TRUST-BK · support@trustbank.com · Available 24/7</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t text-center text-xs" style={{ borderColor: '#23242b', color: '#666' }}>
            © 2025 EchoBank, N.A. All rights reserved. Subject to regulatory disclosures.
          </div>
        </div>
      </footer>
    </div>
  );
}
