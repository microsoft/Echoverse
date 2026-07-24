import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_HEADERS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DISABLED_DATES = new Set(['2025-01-01','2025-07-04','2025-12-25','2025-11-28']);
const DISABLED_WEEKDAYS = new Set([0, 6]);

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isDisabled(
  year: number,
  month: number,
  day: number,
  disabledDates: Set<string>,
  disabledWeekdays: Set<number>,
) {
  const ds = `${year}-${pad(month + 1)}-${pad(day)}`;
  if (disabledDates.has(ds)) return true;
  const dow = new Date(year, month, day).getDay();
  return disabledWeekdays.has(dow);
}

function SingleDatePicker({
  initialYear,
  initialMonth,
  disabledDates,
  disabledWeekdays,
  selectedDate,
  onSelect,
}: {
  initialYear: number;
  initialMonth: number;
  disabledDates: Set<string>;
  disabledWeekdays: Set<number>;
  selectedDate: string | null;
  onSelect: (d: string) => void;
}) {
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const cells = useMemo(() => {
    const first = getFirstDayOfMonth(viewYear, viewMonth);
    const total = getDaysInMonth(viewYear, viewMonth);
    const arr: (number | null)[] = [];
    for (let i = 0; i < first; i++) arr.push(null);
    for (let d = 1; d <= total; d++) arr.push(d);
    return arr;
  }, [viewYear, viewMonth]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1" style={{ padding: '2px 0' }}>
        <button
          onClick={prevMonth}
          className="px-2 py-1 text-sm font-medium"
          style={{ background: '#e1e8ef', borderRadius: 0 }}
        >
          ◀
        </button>
        <span className="text-sm font-medium" style={{ color: '#222' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="px-2 py-1 text-sm font-medium"
          style={{ background: '#e1e8ef', borderRadius: 0 }}
        >
          ▶
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium py-1"
            style={{ color: '#222' }}
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const ds = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const off = isDisabled(viewYear, viewMonth, day, disabledDates, disabledWeekdays);
          const sel = selectedDate === ds;
          return (
            <button
              key={ds}
              disabled={off}
              onClick={() => !off && onSelect(ds)}
              className={`text-center text-sm py-1 ${off ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
              style={{
                background: sel ? '#c2bce7' : 'transparent',
                color: off ? '#999' : '#222',
                borderRadius: 0,
                fontWeight: sel ? 600 : 400,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MonthYearPicker({
  initialYear,
  selectedMonth,
  selectedYear,
  onSelect,
}: {
  initialYear: number;
  initialMonth: number;
  selectedMonth: number | null;
  selectedYear: number | null;
  onSelect: (m: number, y: number) => void;
}) {
  const [viewYear, setViewYear] = useState(initialYear);

  return (
    <div>
      <div className="flex items-center justify-between mb-1" style={{ padding: '2px 0' }}>
        <button
          onClick={() => setViewYear((y) => y - 1)}
          className="px-2 py-1 text-sm font-medium"
          style={{ background: '#e1e8ef', borderRadius: 0 }}
        >
          ◀
        </button>
        <span className="text-sm font-medium" style={{ color: '#222' }}>
          {viewYear}
        </span>
        <button
          onClick={() => setViewYear((y) => y + 1)}
          className="px-2 py-1 text-sm font-medium"
          style={{ background: '#e1e8ef', borderRadius: 0 }}
        >
          ▶
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {MONTH_SHORT.map((m, i) => {
          const sel = selectedMonth === i && selectedYear === viewYear;
          return (
            <button
              key={m}
              onClick={() => onSelect(i, viewYear)}
              className="text-sm py-2 cursor-pointer hover:opacity-80"
              style={{
                background: sel ? '#c2bce7' : '#e1e8ef',
                color: '#222',
                borderRadius: 0,
                fontWeight: sel ? 600 : 400,
              }}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Page_apartment_listing(props: GeneratedPageProps) {
  const [moveInDate, setMoveInDate] = useState<string | null>(null);

  const [leaseMonth, setLeaseMonth] = useState<number | null>(null);
  const [leaseYear, setLeaseYear] = useState<number | null>(null);

  const [compoundDate, setCompoundDate] = useState<string | null>(null);
  const [compoundMonth, setCompoundMonth] = useState<number | null>(null);
  const [compoundYear, setCompoundYear] = useState<number | null>(null);

  const handleMoveInSubmit = useCallback(() => {
    if (!moveInDate) return;
    props.onSubmit({
      type: 'date',
      value: moveInDate,
      raw: { widget_id: 'move_in_date', selected_date: moveInDate },
    });
  }, [moveInDate, props.onSubmit]);

  const handleLeaseSubmit = useCallback(() => {
    if (leaseMonth === null || leaseYear === null) return;
    const v = `${leaseYear}-${pad(leaseMonth + 1)}`;
    props.onSubmit({
      type: 'month_year',
      value: v,
      raw: { widget_id: 'lease_start_month', selected_month: leaseMonth + 1, selected_year: leaseYear },
    });
  }, [leaseMonth, leaseYear, props.onSubmit]);

  const handleCompoundDateSubmit = useCallback(() => {
    if (!compoundDate) return;
    props.onSubmit({
      type: 'date',
      value: compoundDate,
      raw: { widget_id: 'move_in_date', selected_date: compoundDate, compound_widget: 'compound' },
    });
  }, [compoundDate, props.onSubmit]);

  const handleCompoundMonthSubmit = useCallback(() => {
    if (compoundMonth === null || compoundYear === null) return;
    const v = `${compoundYear}-${pad(compoundMonth + 1)}`;
    props.onSubmit({
      type: 'month_year',
      value: v,
      raw: { widget_id: 'lease_start_month', selected_month: compoundMonth + 1, selected_year: compoundYear, compound_widget: 'compound' },
    });
  }, [compoundMonth, compoundYear, props.onSubmit]);

  const properties = useMemo(
    () => [
      {
        name: 'Modern Studio Apartment',
        price: 89,
        rating: 4.8,
        reviews: 124,
        img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
        type: 'Entire apartment',
      },
      {
        name: 'Cozy Mountain Cabin',
        price: 145,
        rating: 4.9,
        reviews: 87,
        img: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=400&h=300&fit=crop',
        type: 'Entire cabin',
      },
      {
        name: 'Luxury Hotel Suite',
        price: 210,
        rating: 4.7,
        reviews: 203,
        img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop',
        type: 'Hotel room',
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen font-sans" style={{ background: '#b198e2' }}>
      {/* Header */}
      <header className="w-full" style={{ background: '#ecf3fb', borderBottom: '1px solid #e1e8ef' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏨</span>
            <span className="text-base font-semibold" style={{ color: '#222' }}>
              EchoStay
            </span>
          </div>
          <nav className="hidden sm:flex gap-4 text-sm" style={{ color: '#222' }}>
            <a href="#" className="hover:opacity-70">Rooms</a>
            <a href="#" className="hover:opacity-70">Deals</a>
            <a href="#" className="hover:opacity-70">Reviews</a>
            <a href="#" className="hover:opacity-70">Host</a>
          </nav>
          <div
            className="w-8 h-8 flex items-center justify-center text-xs font-medium"
            style={{ background: '#c2bce7', color: '#222', borderRadius: 0 }}
          >
            JD
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full" style={{ height: '200px' }}>
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=400&fit=crop"
          alt="Hotel pool hero"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white mb-1">Find Your Perfect Apartment</h1>
            <p className="text-sm text-white opacity-90">
              Select your move-in date and lease details below
            </p>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Context */}
        <div className="mb-3 p-3" style={{ background: '#ecf3fb', borderRadius: 0 }}>
          <p className="text-sm" style={{ color: '#222' }}>
            Welcome to EchoStay&apos;s apartment listing portal. Please select your preferred move-in
            date and lease start month to check availability and pricing.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {['Studio', '1 Bedroom', '2 Bedroom', 'Pet Friendly', 'Parking'].map((f) => (
            <span
              key={f}
              className="text-xs px-2 py-1 cursor-pointer"
              style={{ background: '#e1e8ef', color: '#222', borderRadius: 0 }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* Widget 1: Move-in Date */}
        <div data-widget-id="move_in_date" className="mb-3 p-4" style={{ background: '#ecf3fb', borderRadius: 0 }}>
          <h2 className="text-base font-semibold mb-1" style={{ color: '#222' }}>
            Move-in Date
          </h2>
          <p className="text-xs mb-2" style={{ color: '#555' }}>
            Select a business day (Mon–Fri) for your apartment move-in. Holidays are disabled.
          </p>
          <SingleDatePicker
            initialYear={2025}
            initialMonth={6}
            disabledDates={DISABLED_DATES}
            disabledWeekdays={DISABLED_WEEKDAYS}
            selectedDate={moveInDate}
            onSelect={setMoveInDate}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs" style={{ color: '#555' }}>
              {moveInDate ? `Selected: ${moveInDate}` : 'No date selected'}
            </span>
            <button
              onClick={handleMoveInSubmit}
              disabled={!moveInDate}
              className="px-4 py-1 text-sm font-medium"
              style={{
                background: moveInDate ? '#c2bce7' : '#e1e8ef',
                color: '#222',
                borderRadius: 0,
                opacity: moveInDate ? 1 : 0.5,
              }}
            >
              Submit Move-in Date
            </button>
          </div>
        </div>

        {/* Widget 2: Lease Start Month */}
        <div data-widget-id="lease_start_month" className="mb-3 p-4" style={{ background: '#ecf3fb', borderRadius: 0 }}>
          <h2 className="text-base font-semibold mb-1" style={{ color: '#222' }}>
            Lease Start Month
          </h2>
          <p className="text-xs mb-2" style={{ color: '#555' }}>
            Choose the month and year when you&apos;d like your lease to begin.
          </p>
          <MonthYearPicker
            initialYear={2025}
            initialMonth={7}
            selectedMonth={leaseMonth}
            selectedYear={leaseYear}
            onSelect={(m, y) => {
              setLeaseMonth(m);
              setLeaseYear(y);
            }}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs" style={{ color: '#555' }}>
              {leaseMonth !== null && leaseYear !== null
                ? `Selected: ${MONTH_NAMES[leaseMonth]} ${leaseYear}`
                : 'No month selected'}
            </span>
            <button
              onClick={handleLeaseSubmit}
              disabled={leaseMonth === null}
              className="px-4 py-1 text-sm font-medium"
              style={{
                background: leaseMonth !== null ? '#c2bce7' : '#e1e8ef',
                color: '#222',
                borderRadius: 0,
                opacity: leaseMonth !== null ? 1 : 0.5,
              }}
            >
              Submit Lease Month
            </button>
          </div>
        </div>

        {/* Widget 3: Compound */}
        <div data-widget-id="compound" className="mb-3 p-4" style={{ background: '#ecf3fb', borderRadius: 0 }}>
          <h2 className="text-base font-semibold mb-1" style={{ color: '#222' }}>
            Move-in Date + Lease Start Month
          </h2>
          <p className="text-xs mb-2" style={{ color: '#555' }}>
            Select both your move-in date and lease start month, then submit each selection.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Compound date sub-picker */}
            <div className="p-3" style={{ background: '#e1e8ef', borderRadius: 0 }}>
              <h3 className="text-sm font-medium mb-2" style={{ color: '#222' }}>
                Move-in Date
              </h3>
              <SingleDatePicker
                initialYear={2025}
                initialMonth={5}
                disabledDates={DISABLED_DATES}
                disabledWeekdays={DISABLED_WEEKDAYS}
                selectedDate={compoundDate}
                onSelect={setCompoundDate}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs" style={{ color: '#555' }}>
                  {compoundDate || 'None'}
                </span>
                <button
                  onClick={handleCompoundDateSubmit}
                  disabled={!compoundDate}
                  className="px-3 py-1 text-xs font-medium"
                  style={{
                    background: compoundDate ? '#c2bce7' : '#c1d3eb',
                    color: '#222',
                    borderRadius: 0,
                    opacity: compoundDate ? 1 : 0.5,
                  }}
                >
                  Submit Date
                </button>
              </div>
            </div>
            {/* Compound month sub-picker */}
            <div className="p-3" style={{ background: '#e1e8ef', borderRadius: 0 }}>
              <h3 className="text-sm font-medium mb-2" style={{ color: '#222' }}>
                Lease Start Month
              </h3>
              <MonthYearPicker
                initialYear={2025}
                initialMonth={5}
                selectedMonth={compoundMonth}
                selectedYear={compoundYear}
                onSelect={(m, y) => {
                  setCompoundMonth(m);
                  setCompoundYear(y);
                }}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs" style={{ color: '#555' }}>
                  {compoundMonth !== null && compoundYear !== null
                    ? `${MONTH_SHORT[compoundMonth]} ${compoundYear}`
                    : 'None'}
                </span>
                <button
                  onClick={handleCompoundMonthSubmit}
                  disabled={compoundMonth === null}
                  className="px-3 py-1 text-xs font-medium"
                  style={{
                    background: compoundMonth !== null ? '#c2bce7' : '#c1d3eb',
                    color: '#222',
                    borderRadius: 0,
                    opacity: compoundMonth !== null ? 1 : 0.5,
                  }}
                >
                  Submit Month
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Availability Table */}
        <div className="mb-3 p-4" style={{ background: '#ecf3fb', borderRadius: 0 }}>
          <h2 className="text-base font-semibold mb-2" style={{ color: '#222' }}>
            Current Availability
          </h2>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#e1e8ef' }}>
                <th className="text-left p-2 font-medium" style={{ color: '#222' }}>Unit</th>
                <th className="text-left p-2 font-medium" style={{ color: '#222' }}>Type</th>
                <th className="text-left p-2 font-medium" style={{ color: '#222' }}>Rent/mo</th>
                <th className="text-left p-2 font-medium" style={{ color: '#222' }}>Available</th>
              </tr>
            </thead>
            <tbody>
              {[
                { unit: '4A', type: 'Studio', rent: '$1,200', avail: 'Jul 2025' },
                { unit: '7B', type: '1 Bed', rent: '$1,650', avail: 'Aug 2025' },
                { unit: '12C', type: '2 Bed', rent: '$2,100', avail: 'Jul 2025' },
                { unit: '3D', type: 'Studio', rent: '$1,150', avail: 'Sep 2025' },
              ].map((row) => (
                <tr key={row.unit} style={{ borderBottom: '1px solid #e1e8ef' }}>
                  <td className="p-2" style={{ color: '#222' }}>{row.unit}</td>
                  <td className="p-2" style={{ color: '#222' }}>{row.type}</td>
                  <td className="p-2" style={{ color: '#222' }}>{row.rent}</td>
                  <td className="p-2" style={{ color: '#222' }}>{row.avail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Property Cards */}
        <div className="mb-3">
          <h2 className="text-base font-semibold mb-2" style={{ color: '#fff' }}>
            Featured Properties
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {properties.map((p) => (
              <div key={p.name} style={{ background: '#ecf3fb', borderRadius: 0 }}>
                <img src={p.img} alt={p.name} className="w-full h-36 object-cover" />
                <div className="p-3">
                  <p className="text-xs" style={{ color: '#555' }}>{p.type}</p>
                  <h3 className="text-sm font-medium" style={{ color: '#222' }}>{p.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs" style={{ color: '#555' }}>
                      ★ {p.rating} ({p.reviews})
                    </span>
                    <span className="text-sm font-semibold" style={{ color: '#222' }}>
                      ${p.price}/night
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full mt-4 py-4" style={{ background: '#ecf3fb', borderTop: '1px solid #e1e8ef' }}>
        <div
          className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs"
          style={{ color: '#555' }}
        >
          <div>
            <h4 className="font-medium mb-1" style={{ color: '#222' }}>Hosting</h4>
            <p>List your property</p>
            <p>Host resources</p>
            <p>Community forum</p>
          </div>
          <div>
            <h4 className="font-medium mb-1" style={{ color: '#222' }}>Trust &amp; Safety</h4>
            <p>Guest verification</p>
            <p>Insurance</p>
            <p>Safety guidelines</p>
          </div>
          <div>
            <h4 className="font-medium mb-1" style={{ color: '#222' }}>Community</h4>
            <p>Referral program</p>
            <p>Blog</p>
            <p>Careers</p>
          </div>
          <div>
            <h4 className="font-medium mb-1" style={{ color: '#222' }}>Legal</h4>
            <p>Terms of Service</p>
            <p>Privacy Policy</p>
            <p>Cookie Policy</p>
          </div>
        </div>
        <div className="text-center text-xs mt-3" style={{ color: '#999' }}>
          © 2025 EchoStay. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
