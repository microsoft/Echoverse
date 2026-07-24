import React, { useState, useCallback } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/* ─── Single Date Picker ─── */

function SingleDatePicker({
  widgetId,
  label,
  description,
  initialYear,
  initialMonth,
  disabledDates,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  initialMonth: number;
  disabledDates: Set<string>;
  onSubmit: GeneratedPageProps["onSubmit"];
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const totalDays = daysInMonth(year, month);
  const startDay = startDayOfMonth(year, month);

  const isDisabled = useCallback(
    (day: number) => disabledDates.has(toDateStr(year, month, day)),
    [year, month, disabledDates],
  );

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const handleSubmit = () => {
    if (!selectedDate) return;
    onSubmit({
      type: "date",
      value: selectedDate,
      raw: { widget_id: widgetId, date: selectedDate },
    });
  };

  return (
    <div>
      <h3 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>{label}</h3>
      <p className="text-xs mb-4" style={{ color: "#d6d2cd" }}>{description}</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold" style={{ color: "#0D9488" }} aria-label="Previous month">←</button>
        <span className="text-sm font-semibold" style={{ color: "#ffffff" }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold" style={{ color: "#0D9488" }} aria-label="Next month">→</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1" style={{ color: "#d6d2cd" }}>
        {DAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const ds = toDateStr(year, month, day);
          const disabled = isDisabled(day);
          const selected = selectedDate === ds;
          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => !disabled && setSelectedDate(ds)}
              className={`py-1.5 text-xs rounded-full transition-colors ${
                disabled
                  ? "cursor-not-allowed opacity-30"
                  : selected
                  ? "font-bold"
                  : "hover:opacity-80"
              }`}
              style={
                selected
                  ? { backgroundColor: "#0D9488", color: "#ffffff" }
                  : disabled
                  ? { color: "#d6d2cd" }
                  : { color: "#f6f6f7" }
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <p className="text-xs mb-3" style={{ color: "#F59E0B" }}>Selected: {selectedDate}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="w-full py-2.5 rounded-full font-semibold text-sm transition-colors"
        style={{
          backgroundColor: selectedDate ? "#0D9488" : "#3a3a4e",
          color: selectedDate ? "#ffffff" : "#d6d2cd",
          cursor: selectedDate ? "pointer" : "not-allowed",
        }}
      >
        Confirm Selection
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
  disabledDates,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  initialMonth: number;
  disabledDates: Set<string>;
  onSubmit: GeneratedPageProps["onSubmit"];
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const totalDays = daysInMonth(year, month);
  const startDay = startDayOfMonth(year, month);

  const isDisabled = useCallback(
    (day: number) => disabledDates.has(toDateStr(year, month, day)),
    [year, month, disabledDates],
  );

  const isInRange = useCallback(
    (ds: string) => {
      if (!rangeStart || !rangeEnd) return false;
      return ds >= rangeStart && ds <= rangeEnd;
    },
    [rangeStart, rangeEnd],
  );

  const handleDayClick = (day: number) => {
    const ds = toDateStr(year, month, day);
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(ds);
      setRangeEnd(null);
    } else {
      if (ds < rangeStart) {
        setRangeStart(ds);
        setRangeEnd(rangeStart);
      } else {
        setRangeEnd(ds);
      }
    }
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const handleSubmit = () => {
    if (!rangeStart || !rangeEnd) return;
    onSubmit({
      type: "date_range",
      value: `${rangeStart}/${rangeEnd}`,
      raw: { widget_id: widgetId, start: rangeStart, end: rangeEnd },
    });
  };

  return (
    <div>
      <h3 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>{label}</h3>
      <p className="text-xs mb-4" style={{ color: "#d6d2cd" }}>{description}</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold" style={{ color: "#0D9488" }} aria-label="Previous month">←</button>
        <span className="text-sm font-semibold" style={{ color: "#ffffff" }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold" style={{ color: "#0D9488" }} aria-label="Next month">→</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1" style={{ color: "#d6d2cd" }}>
        {DAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const ds = toDateStr(year, month, day);
          const disabled = isDisabled(day);
          const isStart = rangeStart === ds;
          const isEnd = rangeEnd === ds;
          const inRange = isInRange(ds);
          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => !disabled && handleDayClick(day)}
              className={`py-1.5 text-xs rounded-full transition-colors ${
                disabled
                  ? "cursor-not-allowed opacity-30"
                  : isStart || isEnd
                  ? "font-bold"
                  : inRange
                  ? "font-medium"
                  : "hover:opacity-80"
              }`}
              style={
                isStart || isEnd
                  ? { backgroundColor: "#0D9488", color: "#ffffff" }
                  : inRange
                  ? { backgroundColor: "rgba(13,148,136,0.25)", color: "#f6f6f7" }
                  : disabled
                  ? { color: "#d6d2cd" }
                  : { color: "#f6f6f7" }
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      {rangeStart && (
        <p className="text-xs mb-3" style={{ color: "#F59E0B" }}>
          {rangeEnd ? `Range: ${rangeStart} → ${rangeEnd}` : `Start: ${rangeStart} — select end date`}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!rangeStart || !rangeEnd}
        className="w-full py-2.5 rounded-full font-semibold text-sm transition-colors"
        style={{
          backgroundColor: rangeStart && rangeEnd ? "#0D9488" : "#3a3a4e",
          color: rangeStart && rangeEnd ? "#ffffff" : "#d6d2cd",
          cursor: rangeStart && rangeEnd ? "pointer" : "not-allowed",
        }}
      >
        Confirm Range
      </button>
    </div>
  );
}

/* ─── Constants ─── */

const VENUE_DISABLED = new Set([
  "2025-08-11", "2025-08-14", "2025-08-15", "2025-08-20",
  "2025-08-24", "2025-08-25", "2025-08-28", "2025-09-02", "2025-09-07",
]);

const NO_DISABLED = new Set<string>();

/* ─── Page Component ─── */

export default function Page_wedding_planner(props: GeneratedPageProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#232333", fontFamily: "sans-serif" }}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-8 py-4" style={{ borderBottom: "1px solid #3a3a4e" }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔧</span>
          <span className="text-xl font-bold" style={{ color: "#ffffff" }}>EchoServe</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: "#d6d2cd" }}>
          <a href="#" className="hover:opacity-80">Home</a>
          <a href="#" className="hover:opacity-80">Services</a>
          <a href="#" className="hover:opacity-80">Book</a>
          <a href="#" className="hover:opacity-80">Contact</a>
        </nav>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs" style={{ backgroundColor: "#2d2d42", color: "#d6d2cd" }}>
            <span>📍</span><span>90210</span>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "#0D9488", color: "#ffffff" }}>A</div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=400&fit=crop"
          alt="Wedding celebration"
          className="w-full h-56 object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center" style={{ backgroundColor: "rgba(35,35,51,0.72)" }}>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "#ffffff" }}>Wedding Planner</h1>
          <p className="text-base" style={{ color: "#d6d2cd" }}>Plan your perfect day — choose dates, venues &amp; more</p>
        </div>
      </section>

      {/* ── Search Bar ── */}
      <div className="max-w-3xl mx-auto -mt-6 relative z-10 px-4">
        <div className="flex items-center rounded-full overflow-hidden shadow-lg" style={{ backgroundColor: "#2d2d42" }}>
          <span className="pl-4 text-lg">🔍</span>
          <input
            type="text"
            placeholder="What do you need help with?"
            className="flex-1 px-4 py-3 text-sm outline-none bg-transparent"
            style={{ color: "#f6f6f7" }}
            readOnly
          />
          <button className="px-6 py-3 text-sm font-semibold" style={{ backgroundColor: "#0D9488", color: "#ffffff" }}>Search</button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Widgets */}
        <div className="lg:col-span-2 space-y-8">

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {["All Services", "Venues", "Photography", "Catering", "Flowers"].map((f) => (
              <button
                key={f}
                className="px-4 py-1.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: f === "All Services" ? "#0D9488" : "#2d2d42",
                  color: f === "All Services" ? "#ffffff" : "#d6d2cd",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Widget 1 — Wedding Date (single_date, no constraints) */}
          <div data-widget-id="wedding_date" className="rounded-3xl p-6" style={{ backgroundColor: "#2d2d42", border: "1px solid #3a3a4e" }}>
            <SingleDatePicker
              widgetId="wedding_date"
              label="Wedding Date"
              description="Select the date for your wedding ceremony. All dates are available."
              initialYear={2025}
              initialMonth={9}
              disabledDates={NO_DISABLED}
              onSubmit={props.onSubmit}
            />
          </div>

          {/* Widget 2 — Venue Booking Dates (range, specific disabled) */}
          <div data-widget-id="venue_dates" className="rounded-3xl p-6" style={{ backgroundColor: "#2d2d42", border: "1px solid #3a3a4e" }}>
            <RangeDatePicker
              widgetId="venue_dates"
              label="Venue Booking Dates"
              description="Select your venue reservation period. Grayed-out dates are already booked."
              initialYear={2025}
              initialMonth={7}
              disabledDates={VENUE_DISABLED}
              onSubmit={props.onSubmit}
            />
          </div>

          {/* Widget 3 — Compound (single_date + range) */}
          <div data-widget-id="compound" className="rounded-3xl p-6" style={{ backgroundColor: "#2d2d42", border: "1px solid #3a3a4e" }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: "#ffffff" }}>Wedding Date + Venue Booking Dates</h2>
            <p className="text-xs mb-6" style={{ color: "#d6d2cd" }}>
              Combine your wedding date and venue booking in one place.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl p-4" style={{ backgroundColor: "#343450" }}>
                <SingleDatePicker
                  widgetId="compound"
                  label="Ceremony Date"
                  description="Pick the wedding ceremony date."
                  initialYear={2025}
                  initialMonth={5}
                  disabledDates={NO_DISABLED}
                  onSubmit={props.onSubmit}
                />
              </div>
              <div className="rounded-2xl p-4" style={{ backgroundColor: "#343450" }}>
                <RangeDatePicker
                  widgetId="compound"
                  label="Venue Dates"
                  description="Pick the venue booking range."
                  initialYear={2025}
                  initialMonth={5}
                  disabledDates={NO_DISABLED}
                  onSubmit={props.onSubmit}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <aside className="space-y-6">

          {/* Provider Cards */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: "#2d2d42", border: "1px solid #3a3a4e" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#ffffff" }}>Top Providers</h3>
            {[
              { name: "Elena's Photography", img: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=300&fit=crop", rating: 4.9, price: "$1,200" },
              { name: "Grand Ballroom Venue", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop", rating: 4.8, price: "$3,500" },
            ].map((p) => (
              <div key={p.name} className="mb-4 last:mb-0">
                <img src={p.img} alt={p.name} className="w-full h-32 object-cover rounded-2xl mb-2" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: "#f6f6f7" }}>{p.name}</span>
                  <span className="text-xs rounded-full px-2 py-0.5 font-semibold" style={{ backgroundColor: "#F59E0B", color: "#232333" }}>⭐ {p.rating}</span>
                </div>
                <span className="text-xs" style={{ color: "#d6d2cd" }}>Starting at {p.price}</span>
              </div>
            ))}
          </div>

          {/* Urgency */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: "#2d2d42", border: "1px solid #3a3a4e" }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#ffffff" }}>How urgent is your request?</h3>
            <div className="space-y-2">
              {["Flexible", "Within a month", "ASAP"].map((u) => (
                <label key={u} className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "#d6d2cd" }}>
                  <input type="radio" name="urgency" className="accent-teal-500" />
                  {u}
                </label>
              ))}
            </div>
          </div>

          {/* Service Guarantee */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: "#2d2d42", border: "1px solid #3a3a4e" }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#ffffff" }}>Service Guarantee</h3>
            <p className="text-xs leading-relaxed" style={{ color: "#d6d2cd" }}>
              All providers are verified and insured. 100% satisfaction guaranteed or your money back.
            </p>
          </div>
        </aside>
      </main>

      {/* ── Footer ── */}
      <footer className="px-8 py-6 text-center text-xs" style={{ backgroundColor: "#1c1c2e", color: "#d6d2cd", borderTop: "1px solid #3a3a4e" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🔧</span>
            <span className="font-bold" style={{ color: "#ffffff" }}>EchoServe</span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:opacity-80">Help Center</a>
            <a href="#" className="hover:opacity-80">Provider Verification</a>
            <a href="#" className="hover:opacity-80">Terms</a>
            <a href="#" className="hover:opacity-80">Privacy</a>
          </div>
          <span>© 2025 EchoServe. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
