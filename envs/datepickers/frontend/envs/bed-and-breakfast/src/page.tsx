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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function pad(n: number) {
  return n < 10 ? '0' + n : '' + n;
}

/* ─── Widget 1: Arrival Date (weekdays only) ─── */
function ArrivalDatePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [month, setMonth] = useState(6); // July = index 6
  const [year, setYear] = useState(2025);
  const [selected, setSelected] = useState<number | null>(null);

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);
  const cells = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    while (c.length % 7 !== 0) c.push(null);
    return c;
  }, [daysInMonth, firstDay]);

  const isDisabled = useCallback((day: number) => {
    const dow = new Date(year, month, day).getDay();
    return dow === 0 || dow === 6;
  }, [year, month]);

  const prevMonth = useCallback(() => {
    setSelected(null);
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    setSelected(null);
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const iso = `${year}-${pad(month + 1)}-${pad(selected)}`;
    onSubmit({ type: 'date', value: iso, raw: { widget_id: 'arrival_date', year, month: month + 1, day: selected } });
  }, [selected, year, month, onSubmit]);

  return (
    <div data-widget-id="arrival_date" className="rounded-2xl p-5" style={{ background: '#121136', border: '1px solid #2a2d70' }}>
      <h3 className="text-lg font-serif font-semibold mb-1" style={{ color: '#fdfdfd' }}>Arrival Date</h3>
      <p className="text-xs mb-3" style={{ color: '#a8a9c2' }}>Select a weekday for your check-in. Weekends are unavailable.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full text-sm" style={{ background: '#2a2d70', color: '#fdfdfd' }}>‹</button>
        <span className="text-sm font-medium" style={{ color: '#fdfdfd' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full text-sm" style={{ background: '#2a2d70', color: '#fdfdfd' }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-px mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-xs py-1" style={{ color: '#a8a9c2' }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const disabled = isDisabled(day);
          const isSel = selected === day;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => !disabled && setSelected(day)}
              className="h-8 text-sm rounded-full flex items-center justify-center transition-colors"
              style={{
                background: isSel ? '#FF385C' : 'transparent',
                color: disabled ? '#3d3d6b' : isSel ? '#fff' : '#fdfdfd',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="text-xs mt-2" style={{ color: '#a8a9c2' }}>
          Selected: {MONTHS[month]} {selected}, {year}
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={selected === null}
        className="mt-3 w-full py-2 rounded-full text-sm font-medium transition-opacity"
        style={{ background: selected !== null ? '#FF385C' : '#2a2d70', color: '#fdfdfd', opacity: selected !== null ? 1 : 0.5 }}
      >
        Confirm Arrival Date
      </button>
    </div>
  );
}

/* ─── Widget 2: Guest Birthday (DOB picker, past only) ─── */
function GuestBirthdayPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [dobYear, setDobYear] = useState(1990);
  const [dobMonth, setDobMonth] = useState(10); // November = index 10
  const [selected, setSelected] = useState<number | null>(null);

  const maxDate = new Date(2025, 10, 30); // 2025-11-30

  const daysInMonth = useMemo(() => getDaysInMonth(dobYear, dobMonth), [dobYear, dobMonth]);
  const firstDay = useMemo(() => getFirstDayOfWeek(dobYear, dobMonth), [dobYear, dobMonth]);
  const cells = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    while (c.length % 7 !== 0) c.push(null);
    return c;
  }, [daysInMonth, firstDay]);

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = 1950; y <= 2015; y++) arr.push(y);
    return arr;
  }, []);

  const isDayDisabled = useCallback((day: number) => {
    const d = new Date(dobYear, dobMonth, day);
    return d > maxDate;
  }, [dobYear, dobMonth]);

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDobYear(Number(e.target.value));
    setSelected(null);
  }, []);
  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDobMonth(Number(e.target.value));
    setSelected(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const iso = `${dobYear}-${pad(dobMonth + 1)}-${pad(selected)}`;
    onSubmit({ type: 'dob', value: iso, raw: { widget_id: 'guest_birthday', year: dobYear, month: dobMonth + 1, day: selected } });
  }, [selected, dobYear, dobMonth, onSubmit]);

  return (
    <div data-widget-id="guest_birthday" className="rounded-2xl p-5" style={{ background: '#121136', border: '1px solid #2a2d70' }}>
      <h3 className="text-lg font-serif font-semibold mb-1" style={{ color: '#fdfdfd' }}>Guest Birthday</h3>
      <p className="text-xs mb-3" style={{ color: '#a8a9c2' }}>Enter your date of birth. Only past dates through Nov 30, 2025 are valid.</p>

      <div className="flex gap-2 mb-3">
        <select
          value={dobYear}
          onChange={handleYearChange}
          className="flex-1 rounded-full px-3 py-1.5 text-sm outline-none"
          style={{ background: '#2a2d70', color: '#fdfdfd', border: '1px solid #3d3d8b' }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={dobMonth}
          onChange={handleMonthChange}
          className="flex-1 rounded-full px-3 py-1.5 text-sm outline-none"
          style={{ background: '#2a2d70', color: '#fdfdfd', border: '1px solid #3d3d8b' }}
        >
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-7 gap-px mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-xs py-1" style={{ color: '#a8a9c2' }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const disabled = isDayDisabled(day);
          const isSel = selected === day;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => !disabled && setSelected(day)}
              className="h-8 text-sm rounded-full flex items-center justify-center transition-colors"
              style={{
                background: isSel ? '#FF385C' : 'transparent',
                color: disabled ? '#3d3d6b' : isSel ? '#fff' : '#fdfdfd',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="text-xs mt-2" style={{ color: '#a8a9c2' }}>
          Selected: {MONTHS[dobMonth]} {selected}, {dobYear}
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={selected === null}
        className="mt-3 w-full py-2 rounded-full text-sm font-medium transition-opacity"
        style={{ background: selected !== null ? '#FF385C' : '#2a2d70', color: '#fdfdfd', opacity: selected !== null ? 1 : 0.5 }}
      >
        Confirm Birthday
      </button>
    </div>
  );
}

/* ─── Widget 3: Compound (weekday calendar) ─── */
function CompoundPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [month, setMonth] = useState(5); // June = index 5
  const [year, setYear] = useState(2025);
  const [selected, setSelected] = useState<number | null>(null);

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);
  const cells = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    while (c.length % 7 !== 0) c.push(null);
    return c;
  }, [daysInMonth, firstDay]);

  const isDisabled = useCallback((day: number) => {
    const dow = new Date(year, month, day).getDay();
    return dow === 0 || dow === 6;
  }, [year, month]);

  const prevMonth = useCallback(() => {
    setSelected(null);
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    setSelected(null);
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const iso = `${year}-${pad(month + 1)}-${pad(selected)}`;
    onSubmit({ type: 'date', value: iso, raw: { widget_id: 'compound', year, month: month + 1, day: selected } });
  }, [selected, year, month, onSubmit]);

  return (
    <div data-widget-id="compound" className="rounded-2xl p-5" style={{ background: '#121136', border: '1px solid #2a2d70' }}>
      <h3 className="text-lg font-serif font-semibold mb-1" style={{ color: '#fdfdfd' }}>Arrival Date + Guest Birthday</h3>
      <p className="text-xs mb-3" style={{ color: '#a8a9c2' }}>Pick a date from the calendar. Weekends are disabled.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full text-sm" style={{ background: '#2a2d70', color: '#fdfdfd' }}>‹</button>
        <span className="text-sm font-medium" style={{ color: '#fdfdfd' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full text-sm" style={{ background: '#2a2d70', color: '#fdfdfd' }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-px mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-xs py-1" style={{ color: '#a8a9c2' }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const disabled = isDisabled(day);
          const isSel = selected === day;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => !disabled && setSelected(day)}
              className="h-8 text-sm rounded-full flex items-center justify-center transition-colors"
              style={{
                background: isSel ? '#FF385C' : 'transparent',
                color: disabled ? '#3d3d6b' : isSel ? '#fff' : '#fdfdfd',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="text-xs mt-2" style={{ color: '#a8a9c2' }}>
          Selected: {MONTHS[month]} {selected}, {year}
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={selected === null}
        className="mt-3 w-full py-2 rounded-full text-sm font-medium transition-opacity"
        style={{ background: selected !== null ? '#FF385C' : '#2a2d70', color: '#fdfdfd', opacity: selected !== null ? 1 : 0.5 }}
      >
        Confirm Date
      </button>
    </div>
  );
}

/* ─── Property Card ─── */
function PropertyCard({ img, name, location, rating, price }: { img: string; name: string; location: string; rating: number; price: number }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#121136', border: '1px solid #2a2d70' }}>
      <img src={img} alt={name} className="w-full h-48 object-cover" />
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium" style={{ color: '#fdfdfd' }}>{name}</span>
          <span className="text-xs" style={{ color: '#FF385C' }}>★ {rating.toFixed(1)}</span>
        </div>
        <p className="text-xs" style={{ color: '#a8a9c2' }}>{location}</p>
        <p className="text-sm font-semibold mt-1" style={{ color: '#fdfdfd' }}>${price}<span className="text-xs font-normal" style={{ color: '#a8a9c2' }}> / night</span></p>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_bed_and_breakfast(props: GeneratedPageProps) {
  const [guestCount, setGuestCount] = useState(2);
  const [roomType, setRoomType] = useState('standard');
  const [amenities, setAmenities] = useState<Record<string, boolean>>({ wifi: true, breakfast: true, parking: false, pool: false });

  const toggleAmenity = useCallback((key: string) => {
    setAmenities(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0b0a20', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: '#0e0d26', borderBottom: '1px solid #2a2d70' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏨</span>
            <span className="text-lg font-semibold" style={{ color: '#fdfdfd' }}>EchoStay</span>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm" style={{ color: '#a8a9c2' }}>
            <a href="#" className="hover:opacity-80">Rooms</a>
            <a href="#" className="hover:opacity-80">Deals</a>
            <a href="#" className="hover:opacity-80">Reviews</a>
            <a href="#" className="hover:opacity-80">Host</a>
          </nav>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: '#2a2d70', color: '#fdfdfd' }}>JD</div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=400&fit=crop"
          alt="Hotel pool"
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, rgba(11,10,32,0.3), rgba(11,10,32,0.85))' }}>
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: '#fdfdfd' }}>Where to stay?</h1>
            <p className="text-sm" style={{ color: '#a8a9c2' }}>Find the perfect bed &amp; breakfast for your next getaway</p>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Context */}
        <div className="rounded-2xl p-4 mb-6" style={{ background: '#121136', border: '1px solid #2a2d70' }}>
          <p className="text-sm" style={{ color: '#a8a9c2' }}>
            Welcome to EchoStay's Bed &amp; Breakfast portal. Please complete the booking details below — select your arrival date, provide your birthday for loyalty perks, and confirm combined travel details.
          </p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-xs font-medium" style={{ color: '#a8a9c2' }}>Filters:</span>
          {['All', 'Pet-friendly', 'Waterfront', 'Mountain view'].map(f => (
            <button key={f} className="px-3 py-1 rounded-full text-xs" style={{ background: '#2a2d70', color: '#fdfdfd', border: '1px solid #3d3d8b' }}>{f}</button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left column — form controls + widgets */}
          <div className="lg:col-span-2 space-y-5">
            {/* Guest / Room controls */}
            <div className="rounded-2xl p-5 grid sm:grid-cols-3 gap-4" style={{ background: '#121136', border: '1px solid #2a2d70' }}>
              {/* Guest count */}
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a8a9c2' }}>Guests</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-7 h-7 rounded-full text-sm flex items-center justify-center" style={{ background: '#2a2d70', color: '#fdfdfd' }}>−</button>
                  <span className="text-sm w-6 text-center" style={{ color: '#fdfdfd' }}>{guestCount}</span>
                  <button onClick={() => setGuestCount(Math.min(10, guestCount + 1))} className="w-7 h-7 rounded-full text-sm flex items-center justify-center" style={{ background: '#2a2d70', color: '#fdfdfd' }}>+</button>
                </div>
              </div>

              {/* Room type */}
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a8a9c2' }}>Room Type</label>
                <select
                  value={roomType}
                  onChange={e => setRoomType(e.target.value)}
                  className="w-full rounded-full px-3 py-1.5 text-sm outline-none"
                  style={{ background: '#2a2d70', color: '#fdfdfd', border: '1px solid #3d3d8b' }}
                >
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                </select>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a8a9c2' }}>Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(amenities).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => toggleAmenity(key)}
                      className="px-2 py-0.5 rounded-full text-xs capitalize"
                      style={{ background: val ? '#FF385C' : '#2a2d70', color: '#fdfdfd', border: '1px solid #3d3d8b' }}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Widgets */}
            <div className="grid md:grid-cols-2 gap-5">
              <ArrivalDatePicker onSubmit={props.onSubmit} />
              <GuestBirthdayPicker onSubmit={props.onSubmit} />
            </div>
            <CompoundPicker onSubmit={props.onSubmit} />

            {/* Table: Recent Bookings */}
            <div className="rounded-2xl p-5 overflow-x-auto" style={{ background: '#121136', border: '1px solid #2a2d70' }}>
              <h3 className="text-sm font-serif font-semibold mb-3" style={{ color: '#fdfdfd' }}>Recent Bookings</h3>
              <table className="w-full text-xs" style={{ color: '#a8a9c2' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a2d70' }}>
                    <th className="text-left py-2 pr-3 font-medium" style={{ color: '#fdfdfd' }}>Guest</th>
                    <th className="text-left py-2 pr-3 font-medium" style={{ color: '#fdfdfd' }}>Room</th>
                    <th className="text-left py-2 pr-3 font-medium" style={{ color: '#fdfdfd' }}>Check-in</th>
                    <th className="text-left py-2 font-medium" style={{ color: '#fdfdfd' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { guest: 'Alice M.', room: 'Deluxe', checkin: 'Jul 14, 2025', status: 'Confirmed' },
                    { guest: 'Bob T.', room: 'Standard', checkin: 'Jul 21, 2025', status: 'Pending' },
                    { guest: 'Clara S.', room: 'Suite', checkin: 'Aug 2, 2025', status: 'Confirmed' },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a40' }}>
                      <td className="py-2 pr-3">{r.guest}</td>
                      <td className="py-2 pr-3">{r.room}</td>
                      <td className="py-2 pr-3">{r.checkin}</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: r.status === 'Confirmed' ? '#1a3a2a' : '#3a2a1a', color: r.status === 'Confirmed' ? '#4ade80' : '#fbbf24' }}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column — property cards */}
          <div className="space-y-5">
            <h3 className="text-sm font-serif font-semibold" style={{ color: '#fdfdfd' }}>Featured Stays</h3>
            <PropertyCard
              img="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop"
              name="Seaside B&B"
              location="Monterey, California"
              rating={4.9}
              price={145}
            />
            <PropertyCard
              img="https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=400&h=300&fit=crop"
              name="Mountain Cabin Retreat"
              location="Asheville, North Carolina"
              rating={4.7}
              price={112}
            />
            <PropertyCard
              img="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop"
              name="Urban Apartment Loft"
              location="Portland, Oregon"
              rating={4.5}
              price={98}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-10 py-8 px-4" style={{ borderTop: '1px solid #2a2d70' }}>
        <div className="max-w-6xl mx-auto grid sm:grid-cols-4 gap-6 text-xs" style={{ color: '#a8a9c2' }}>
          <div>
            <h4 className="font-semibold mb-2" style={{ color: '#fdfdfd' }}>Hosting</h4>
            <ul className="space-y-1"><li>List your property</li><li>Host resources</li><li>Community forum</li></ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2" style={{ color: '#fdfdfd' }}>Trust &amp; Safety</h4>
            <ul className="space-y-1"><li>Guest verification</li><li>Insurance info</li><li>Safety guidelines</li></ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2" style={{ color: '#fdfdfd' }}>Community</h4>
            <ul className="space-y-1"><li>Blog</li><li>Events</li><li>Referrals</li></ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2" style={{ color: '#fdfdfd' }}>Legal</h4>
            <ul className="space-y-1"><li>Terms of Service</li><li>Privacy Policy</li><li>Cookie Preferences</li></ul>
          </div>
        </div>
        <p className="text-center text-xs mt-6" style={{ color: '#3d3d6b' }}>© 2025 EchoStay, Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
