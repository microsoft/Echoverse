import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_HEADERS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const BG = "#0c0b21";
const SURFACE = "#fcfcfc";
const SURFACE_ALT = "#f3f3f3";
const ACCENT = "#c7dce0";
const TEXT_DARK = "#0c0b21";
const TEXT_MUTED = "#495a6b";
const BRAND = "#FF385C";
const CARD_BG = "#161533";
const BORDER = "#2a2950";

const MY_MIN_YEAR = 2025;
const MY_MIN_MONTH = 0;
const MY_MAX_YEAR = 2025;
const MY_MAX_MONTH = 4;

function isMonthInBounds(monthIdx: number, year: number) {
  if (year < MY_MIN_YEAR || year > MY_MAX_YEAR) return false;
  if (year === MY_MIN_YEAR && monthIdx < MY_MIN_MONTH) return false;
  if (year === MY_MAX_YEAR && monthIdx > MY_MAX_MONTH) return false;
  return true;
}

export default function Page_villa_availability(props: GeneratedPageProps) {
  const [dtViewYear, dtSetViewYear] = useState(2025);
  const [dtViewMonth, dtSetViewMonth] = useState(9);
  const [dtSelectedDate, dtSetSelectedDate] = useState<string | null>(null);
  const [dtHour, dtSetHour] = useState(12);
  const [dtMinute, dtSetMinute] = useState(0);
  const [dtAmpm, dtSetAmpm] = useState<"AM" | "PM">("AM");

  const [myViewYear, mySetViewYear] = useState(2025);
  const [mySelectedMonth, mySetSelectedMonth] = useState<number | null>(null);
  const [mySelectedYear, mySetSelectedYear] = useState<number | null>(null);

  const [cpViewYear, cpSetViewYear] = useState(2025);
  const [cpViewMonth, cpSetViewMonth] = useState(5);
  const [cpSelectedDate, cpSetSelectedDate] = useState<string | null>(null);

  const [guests, setGuests] = useState(2);
  const [activeFilter, setActiveFilter] = useState("All");

  const dtCells = useMemo(() => {
    const first = getFirstDayOfMonth(dtViewYear, dtViewMonth);
    const total = getDaysInMonth(dtViewYear, dtViewMonth);
    const arr: (number | null)[] = [];
    for (let i = 0; i < first; i++) arr.push(null);
    for (let d = 1; d <= total; d++) arr.push(d);
    return arr;
  }, [dtViewYear, dtViewMonth]);

  const dtPrevMonth = useCallback(() => {
    dtSetViewMonth(m => {
      if (m === 0) { dtSetViewYear(y => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const dtNextMonth = useCallback(() => {
    dtSetViewMonth(m => {
      if (m === 11) { dtSetViewYear(y => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const handleDateTimeSubmit = useCallback(() => {
    if (!dtSelectedDate) return;
    const h24 = dtAmpm === "PM" ? (dtHour === 12 ? 12 : dtHour + 12) : (dtHour === 12 ? 0 : dtHour);
    const iso = `${dtSelectedDate}T${pad(h24)}:${pad(dtMinute)}:00`;
    props.onSubmit({
      type: "datetime",
      value: iso,
      raw: {
        widget_id: "villa_datetime",
        selected_date: dtSelectedDate,
        hour: dtHour,
        minute: dtMinute,
        ampm: dtAmpm,
        iso,
      },
    });
  }, [dtSelectedDate, dtHour, dtMinute, dtAmpm, props]);

  const handleMonthYearSubmit = useCallback(() => {
    if (mySelectedMonth === null || mySelectedYear === null) return;
    const v = `${mySelectedYear}-${pad(mySelectedMonth + 1)}`;
    props.onSubmit({
      type: "month_year",
      value: v,
      raw: {
        widget_id: "availability_month",
        month: mySelectedMonth + 1,
        year: mySelectedYear,
        month_name: MONTH_NAMES[mySelectedMonth],
        iso: v,
      },
    });
  }, [mySelectedMonth, mySelectedYear, props]);

  const cpCells = useMemo(() => {
    const first = getFirstDayOfMonth(cpViewYear, cpViewMonth);
    const total = getDaysInMonth(cpViewYear, cpViewMonth);
    const arr: (number | null)[] = [];
    for (let i = 0; i < first; i++) arr.push(null);
    for (let d = 1; d <= total; d++) arr.push(d);
    return arr;
  }, [cpViewYear, cpViewMonth]);

  const cpPrevMonth = useCallback(() => {
    cpSetViewMonth(m => {
      if (m === 0) { cpSetViewYear(y => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const cpNextMonth = useCallback(() => {
    cpSetViewMonth(m => {
      if (m === 11) { cpSetViewYear(y => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const handleCompoundSubmit = useCallback(() => {
    if (!cpSelectedDate) return;
    props.onSubmit({
      type: "date",
      value: cpSelectedDate,
      raw: {
        widget_id: "compound",
        selected_date: cpSelectedDate,
      },
    });
  }, [cpSelectedDate, props]);

  const properties = useMemo(() => [
    { name: "Oceanfront Villa", price: 320, rating: 4.9, reviews: 156, img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop" },
    { name: "Mountain Cabin Retreat", price: 175, rating: 4.8, reviews: 89, img: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=400&h=300&fit=crop" },
    { name: "Luxury Hotel Suite", price: 280, rating: 4.7, reviews: 234, img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop" },
  ], []);

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  return (
    <div className="min-h-screen font-sans" style={{ background: BG, color: SURFACE }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: CARD_BG, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏨</span>
            <span className="text-lg font-semibold" style={{ color: BRAND }}>EchoStay</span>
          </div>
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <div
              className="flex items-center w-full px-4 py-2 text-sm"
              style={{ background: BORDER, borderRadius: 9999, color: TEXT_MUTED }}
            >
              <span>Location</span>
              <span className="mx-2 opacity-40">|</span>
              <span>Dates</span>
              <span className="mx-2 opacity-40">|</span>
              <span>Guests</span>
              <span className="ml-auto">🔍</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex gap-4 text-sm" style={{ color: ACCENT }}>
              <a href="#" className="hover:opacity-80">Rooms</a>
              <a href="#" className="hover:opacity-80">Deals</a>
              <a href="#" className="hover:opacity-80">Reviews</a>
              <a href="#" className="hover:opacity-80">Host</a>
            </nav>
            <div
              className="w-8 h-8 flex items-center justify-center text-xs font-semibold"
              style={{ background: ACCENT, color: TEXT_DARK, borderRadius: 9999 }}
            >
              JD
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative w-full" style={{ height: 280 }}>
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=400&fit=crop"
          alt="Luxury hotel pool at sunset"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: "linear-gradient(to bottom, rgba(12,11,33,0.4), rgba(12,11,33,0.85))" }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center" style={{ color: SURFACE }}>
            Villa Availability
          </h1>
          <p className="text-base text-center max-w-lg" style={{ color: ACCENT }}>
            Find your perfect villa getaway — check dates, times, and availability
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Context */}
        <div className="p-4" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9999 }}>
          <p className="text-sm text-center" style={{ color: ACCENT }}>
            Welcome to EchoStay&apos;s villa booking portal. Select your check-in time and availability month below.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {["All", "Villas", "Cabins", "Hotels", "Pet Friendly"].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-4 py-1 text-xs font-medium transition-colors"
              style={{
                background: activeFilter === f ? ACCENT : BORDER,
                color: activeFilter === f ? TEXT_DARK : SURFACE_ALT,
                borderRadius: 9999,
              }}
            >
              {f}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs" style={{ color: TEXT_MUTED }}>Guests:</span>
            <button
              onClick={() => setGuests(g => Math.max(1, g - 1))}
              className="w-7 h-7 flex items-center justify-center text-sm font-bold"
              style={{ background: BORDER, color: SURFACE, borderRadius: 9999 }}
            >
              −
            </button>
            <span className="text-sm font-semibold w-5 text-center">{guests}</span>
            <button
              onClick={() => setGuests(g => Math.min(12, g + 1))}
              className="w-7 h-7 flex items-center justify-center text-sm font-bold"
              style={{ background: BORDER, color: SURFACE, borderRadius: 9999 }}
            >
              +
            </button>
          </div>
        </div>

        {/* Widget 1: Villa Check-in Time (datetime) */}
        <div data-widget-id="villa_datetime" className="p-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16 }}>
          <h2 className="text-lg font-bold mb-1" style={{ color: SURFACE }}>Villa Check-in Time</h2>
          <p className="text-xs mb-4" style={{ color: TEXT_MUTED }}>
            Select a date and time for your villa check-in.
          </p>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={dtPrevMonth}
              className="w-8 h-8 flex items-center justify-center text-lg font-bold hover:opacity-80"
              style={{ background: BORDER, color: SURFACE, borderRadius: 9999 }}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="text-sm font-semibold" style={{ color: SURFACE }}>
              {MONTH_NAMES[dtViewMonth]} {dtViewYear}
            </span>
            <button
              onClick={dtNextMonth}
              className="w-8 h-8 flex items-center justify-center text-lg font-bold hover:opacity-80"
              style={{ background: BORDER, color: SURFACE, borderRadius: 9999 }}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_HEADERS.map(d => (
              <div key={d} className="text-center text-xs font-medium py-1" style={{ color: TEXT_MUTED }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dtCells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const ds = `${dtViewYear}-${pad(dtViewMonth + 1)}-${pad(day)}`;
              const sel = dtSelectedDate === ds;
              return (
                <button
                  key={ds}
                  onClick={() => dtSetSelectedDate(ds)}
                  className="text-center text-sm py-2 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    background: sel ? ACCENT : "transparent",
                    color: sel ? TEXT_DARK : SURFACE,
                    borderRadius: 9999,
                    fontWeight: sel ? 600 : 400,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time selectors */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <label className="text-xs font-medium" style={{ color: TEXT_MUTED }}>Time:</label>
            <select
              value={dtHour}
              onChange={e => dtSetHour(Number(e.target.value))}
              className="px-3 py-1 text-sm"
              style={{ background: BORDER, color: SURFACE, borderRadius: 9999, border: "none", outline: "none" }}
            >
              {hours.map(h => (
                <option key={h} value={h}>{pad(h)}</option>
              ))}
            </select>
            <span style={{ color: TEXT_MUTED }}>:</span>
            <select
              value={dtMinute}
              onChange={e => dtSetMinute(Number(e.target.value))}
              className="px-3 py-1 text-sm"
              style={{ background: BORDER, color: SURFACE, borderRadius: 9999, border: "none", outline: "none" }}
            >
              {minutes.map(m => (
                <option key={m} value={m}>{pad(m)}</option>
              ))}
            </select>
            <div className="flex" style={{ borderRadius: 9999, overflow: "hidden" }}>
              <button
                onClick={() => dtSetAmpm("AM")}
                className="px-3 py-1 text-xs font-semibold"
                style={{
                  background: dtAmpm === "AM" ? ACCENT : BORDER,
                  color: dtAmpm === "AM" ? TEXT_DARK : TEXT_MUTED,
                }}
              >
                AM
              </button>
              <button
                onClick={() => dtSetAmpm("PM")}
                className="px-3 py-1 text-xs font-semibold"
                style={{
                  background: dtAmpm === "PM" ? ACCENT : BORDER,
                  color: dtAmpm === "PM" ? TEXT_DARK : TEXT_MUTED,
                }}
              >
                PM
              </button>
            </div>
          </div>

          {/* Selection & submit */}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: TEXT_MUTED }}>
              {dtSelectedDate
                ? `Selected: ${dtSelectedDate} ${pad(dtHour)}:${pad(dtMinute)} ${dtAmpm}`
                : "No date selected"}
            </span>
            <button
              onClick={handleDateTimeSubmit}
              disabled={!dtSelectedDate}
              className="px-5 py-2 text-sm font-semibold transition-opacity"
              style={{
                background: dtSelectedDate ? BRAND : BORDER,
                color: dtSelectedDate ? "#fff" : TEXT_MUTED,
                borderRadius: 9999,
                opacity: dtSelectedDate ? 1 : 0.5,
                cursor: dtSelectedDate ? "pointer" : "not-allowed",
              }}
            >
              Submit Check-in Time
            </button>
          </div>
        </div>

        {/* Widget 2: Availability Month (month_year with min/max bounds) */}
        <div data-widget-id="availability_month" className="p-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16 }}>
          <h2 className="text-lg font-bold mb-1" style={{ color: SURFACE }}>Availability Month</h2>
          <p className="text-xs mb-4" style={{ color: TEXT_MUTED }}>
            Select a month to check villa availability. Available range: January – May 2025.
          </p>

          {/* Year navigation */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => mySetViewYear(y => y - 1)}
              className="w-8 h-8 flex items-center justify-center text-lg font-bold hover:opacity-80"
              style={{ background: BORDER, color: SURFACE, borderRadius: 9999 }}
              aria-label="Previous year"
            >
              ‹
            </button>
            <span className="text-lg font-bold min-w-[4rem] text-center" style={{ color: SURFACE }}>
              {myViewYear}
            </span>
            <button
              onClick={() => mySetViewYear(y => y + 1)}
              className="w-8 h-8 flex items-center justify-center text-lg font-bold hover:opacity-80"
              style={{ background: BORDER, color: SURFACE, borderRadius: 9999 }}
              aria-label="Next year"
            >
              ›
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {MONTH_SHORT.map((m, idx) => {
              const inBounds = isMonthInBounds(idx, myViewYear);
              const sel = mySelectedMonth === idx && mySelectedYear === myViewYear;
              return (
                <button
                  key={m}
                  disabled={!inBounds}
                  onClick={() => {
                    if (!inBounds) return;
                    mySetSelectedMonth(idx);
                    mySetSelectedYear(myViewYear);
                  }}
                  className="py-3 text-sm font-medium transition-all"
                  style={{
                    background: sel ? ACCENT : inBounds ? BORDER : "transparent",
                    color: sel ? TEXT_DARK : inBounds ? SURFACE : BORDER,
                    borderRadius: 9999,
                    opacity: inBounds ? 1 : 0.3,
                    cursor: inBounds ? "pointer" : "not-allowed",
                    fontWeight: sel ? 600 : 400,
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Selection & submit */}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: TEXT_MUTED }}>
              {mySelectedMonth !== null && mySelectedYear !== null
                ? `Selected: ${MONTH_NAMES[mySelectedMonth]} ${mySelectedYear}`
                : "No month selected"}
            </span>
            <button
              onClick={handleMonthYearSubmit}
              disabled={mySelectedMonth === null}
              className="px-5 py-2 text-sm font-semibold transition-opacity"
              style={{
                background: mySelectedMonth !== null ? BRAND : BORDER,
                color: mySelectedMonth !== null ? "#fff" : TEXT_MUTED,
                borderRadius: 9999,
                opacity: mySelectedMonth !== null ? 1 : 0.5,
                cursor: mySelectedMonth !== null ? "pointer" : "not-allowed",
              }}
            >
              Submit Availability Month
            </button>
          </div>
        </div>

        {/* Widget 3: Compound (standard date calendar) */}
        <div data-widget-id="compound" className="p-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16 }}>
          <h2 className="text-lg font-bold mb-1" style={{ color: SURFACE }}>
            Villa Check-in Time + Availability Month
          </h2>
          <p className="text-xs mb-4" style={{ color: TEXT_MUTED }}>
            Select a date from the calendar below.
          </p>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={cpPrevMonth}
              className="w-8 h-8 flex items-center justify-center text-lg font-bold hover:opacity-80"
              style={{ background: BORDER, color: SURFACE, borderRadius: 9999 }}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="text-sm font-semibold" style={{ color: SURFACE }}>
              {MONTH_NAMES[cpViewMonth]} {cpViewYear}
            </span>
            <button
              onClick={cpNextMonth}
              className="w-8 h-8 flex items-center justify-center text-lg font-bold hover:opacity-80"
              style={{ background: BORDER, color: SURFACE, borderRadius: 9999 }}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_HEADERS.map(d => (
              <div key={d} className="text-center text-xs font-medium py-1" style={{ color: TEXT_MUTED }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {cpCells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const ds = `${cpViewYear}-${pad(cpViewMonth + 1)}-${pad(day)}`;
              const sel = cpSelectedDate === ds;
              return (
                <button
                  key={ds}
                  onClick={() => cpSetSelectedDate(ds)}
                  className="text-center text-sm py-2 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    background: sel ? ACCENT : "transparent",
                    color: sel ? TEXT_DARK : SURFACE,
                    borderRadius: 9999,
                    fontWeight: sel ? 600 : 400,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Selection & submit */}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: TEXT_MUTED }}>
              {cpSelectedDate ? `Selected: ${cpSelectedDate}` : "No date selected"}
            </span>
            <button
              onClick={handleCompoundSubmit}
              disabled={!cpSelectedDate}
              className="px-5 py-2 text-sm font-semibold transition-opacity"
              style={{
                background: cpSelectedDate ? BRAND : BORDER,
                color: cpSelectedDate ? "#fff" : TEXT_MUTED,
                borderRadius: 9999,
                opacity: cpSelectedDate ? 1 : 0.5,
                cursor: cpSelectedDate ? "pointer" : "not-allowed",
              }}
            >
              Submit Date
            </button>
          </div>
        </div>

        {/* Property Cards */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: TEXT_MUTED }}>Featured Properties</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {properties.map(p => (
              <div key={p.name} className="overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16 }}>
                <img src={p.img} alt={p.name} className="w-full h-48 object-cover rounded-lg" />
                <div className="p-3">
                  <h4 className="text-sm font-semibold mb-1" style={{ color: SURFACE }}>{p.name}</h4>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs" style={{ color: "#fbbf24" }}>★</span>
                    <span className="text-xs font-semibold" style={{ color: SURFACE }}>{p.rating}</span>
                    <span className="text-xs" style={{ color: TEXT_MUTED }}>({p.reviews})</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: BRAND }}>
                    ${p.price}<span className="text-xs font-normal" style={{ color: TEXT_MUTED }}>/night</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-6 px-4" style={{ background: CARD_BG, borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-xs" style={{ color: TEXT_MUTED }}>
          <div>
            <h5 className="font-semibold mb-2" style={{ color: SURFACE }}>Hosting</h5>
            <p>List your property</p>
            <p>Host resources</p>
            <p>Community forum</p>
          </div>
          <div>
            <h5 className="font-semibold mb-2" style={{ color: SURFACE }}>Trust &amp; Safety</h5>
            <p>Guest verification</p>
            <p>Insurance</p>
            <p>Safety guidelines</p>
          </div>
          <div>
            <h5 className="font-semibold mb-2" style={{ color: SURFACE }}>Community</h5>
            <p>Referral program</p>
            <p>Blog</p>
            <p>Careers</p>
          </div>
          <div>
            <h5 className="font-semibold mb-2" style={{ color: SURFACE }}>Legal</h5>
            <p>Terms of Service</p>
            <p>Privacy Policy</p>
            <p>Cookie Policy</p>
          </div>
        </div>
        <div className="text-center text-xs mt-4" style={{ color: BORDER }}>
          © 2025 EchoStay. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
