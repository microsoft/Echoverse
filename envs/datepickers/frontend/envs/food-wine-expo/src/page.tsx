import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
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

function isBefore(dateStr: string, refStr: string) {
  return dateStr < refStr;
}

function isAfterOrEqual(a: string, b: string) {
  return a >= b;
}

/* ─── Widget 1: Tasting Date & Time (datetime, future_only) ─── */

function TastingDateTimePicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(9); // October = 9 (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<"AM" | "PM">("PM");

  const minDate = "2025-10-01";
  const today = useMemo(() => {
    const n = new Date(2025, 0, 1);
    return toDateStr(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const totalDays = daysInMonth(year, month);
  const startDay = startDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const isDisabled = useCallback(
    (day: number) => {
      const ds = toDateStr(year, month, day);
      if (isBefore(ds, minDate)) return true;
      if (isBefore(ds, today)) return true;
      return false;
    },
    [year, month, today]
  );

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  const handleSubmit = () => {
    if (!selectedDate) return;
    const h24 = ampm === "PM" ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    const iso = `${selectedDate}T${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
    props.onSubmit({
      type: "datetime",
      value: iso,
      raw: { widget_id: "tasting_datetime", date: selectedDate, hour, minute, ampm, iso },
    });
  };

  return (
    <div data-widget-id="tasting_datetime" className="rounded-xl p-6 shadow-sm" style={{ background: "#fcfdfd", border: "1px solid #e2e8f0" }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#6366F1" }}>🍷 Tasting Date &amp; Time</h3>
      <p className="text-sm mb-4" style={{ color: "#64748b" }}>Choose a future date and time for your wine tasting session.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Previous month">&larr;</button>
        <span className="font-semibold" style={{ color: "#312E81" }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Next month">&rarr;</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>
        {DAYS.map(d => <div key={d}>{d}</div>)}
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
              className={`h-9 rounded-lg text-sm font-medium transition-colors
                ${disabled ? "cursor-not-allowed line-through" : "cursor-pointer"}
                ${selected ? "text-white" : ""}
                ${!disabled && !selected ? "hover:bg-indigo-50" : ""}
              `}
              style={
                disabled
                  ? { color: "#cbd5e1", background: "#f1f5f9" }
                  : selected
                  ? { background: "#6366F1", color: "#fff" }
                  : { color: "#334155" }
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <label className="text-sm font-medium" style={{ color: "#475569" }}>Time:</label>
        <select
          value={hour}
          onChange={e => setHour(Number(e.target.value))}
          className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: "#c7d2fe", background: "#fff" }}
        >
          {hours.map(h => <option key={h} value={h}>{String(h).padStart(2, "0")}</option>)}
        </select>
        <span className="font-bold" style={{ color: "#6366F1" }}>:</span>
        <select
          value={minute}
          onChange={e => setMinute(Number(e.target.value))}
          className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: "#c7d2fe", background: "#fff" }}
        >
          {minutes.map(m => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}
        </select>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "#c7d2fe" }}>
          <button
            onClick={() => setAmpm("AM")}
            className="px-3 py-1.5 text-sm font-medium transition-colors"
            style={ampm === "AM" ? { background: "#6366F1", color: "#fff" } : { background: "#fff", color: "#6366F1" }}
          >AM</button>
          <button
            onClick={() => setAmpm("PM")}
            className="px-3 py-1.5 text-sm font-medium transition-colors"
            style={ampm === "PM" ? { background: "#6366F1", color: "#fff" } : { background: "#fff", color: "#6366F1" }}
          >PM</button>
        </div>
      </div>

      {selectedDate && (
        <p className="text-sm mb-3 font-medium" style={{ color: "#6366F1" }}>
          Selected: {selectedDate} at {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")} {ampm}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-40"
        style={{ background: "#6366F1" }}
      >
        Confirm Tasting Time
      </button>
    </div>
  );
}

/* ─── Widget 2: Expo Dates (range, no constraints) ─── */

function ExpoDateRangePicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5); // June = 5 (0-indexed)
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const totalDays = daysInMonth(year, month);
  const startDay = startDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const handleDayClick = (ds: string) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(ds);
      setEndDate(null);
    } else {
      if (ds < startDate) {
        setStartDate(ds);
        setEndDate(null);
      } else {
        setEndDate(ds);
      }
    }
  };

  const isInRange = useCallback(
    (ds: string) => {
      if (startDate && endDate) {
        return ds >= startDate && ds <= endDate;
      }
      if (startDate && !endDate && hoverDate) {
        const lo = startDate < hoverDate ? startDate : hoverDate;
        const hi = startDate < hoverDate ? hoverDate : startDate;
        return ds >= lo && ds <= hi;
      }
      return false;
    },
    [startDate, endDate, hoverDate]
  );

  const handleSubmit = () => {
    if (!startDate || !endDate) return;
    props.onSubmit({
      type: "date_range",
      value: `${startDate}/${endDate}`,
      raw: { widget_id: "expo_dates", startDate, endDate },
    });
  };

  return (
    <div data-widget-id="expo_dates" className="rounded-xl p-6 shadow-sm" style={{ background: "#fcfdfd", border: "1px solid #e2e8f0" }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#6366F1" }}>📅 Expo Dates</h3>
      <p className="text-sm mb-4" style={{ color: "#64748b" }}>Select a start and end date for the Food &amp; Wine Expo.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Previous month">&larr;</button>
        <span className="font-semibold" style={{ color: "#312E81" }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Next month">&rarr;</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>
        {DAYS.map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const ds = toDateStr(year, month, day);
          const isStart = startDate === ds;
          const isEnd = endDate === ds;
          const inRange = isInRange(ds);
          return (
            <button
              key={day}
              onClick={() => handleDayClick(ds)}
              onMouseEnter={() => setHoverDate(ds)}
              onMouseLeave={() => setHoverDate(null)}
              className={`h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer`}
              style={
                isStart || isEnd
                  ? { background: "#6366F1", color: "#fff" }
                  : inRange
                  ? { background: "#e0e7ff", color: "#4338ca" }
                  : { color: "#334155" }
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      {startDate && (
        <p className="text-sm mb-3 font-medium" style={{ color: "#6366F1" }}>
          {endDate ? `Range: ${startDate} → ${endDate}` : `Start: ${startDate} (click end date)`}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!startDate || !endDate}
        className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-40"
        style={{ background: "#6366F1" }}
      >
        Confirm Expo Dates
      </button>
    </div>
  );
}

/* ─── Widget 3: Compound (datetime+range) ─── */

function CompoundPicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // June = 5 (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const minDate = "2025-06-01";
  const today = useMemo(() => {
    const n = new Date(2025, 0, 1);
    return toDateStr(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const totalDays = daysInMonth(year, month);
  const startDay = startDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const isDisabled = useCallback(
    (day: number) => {
      const ds = toDateStr(year, month, day);
      if (isBefore(ds, minDate)) return true;
      return false;
    },
    [year, month]
  );

  const handleSubmit = () => {
    if (!selectedDate) return;
    props.onSubmit({
      type: "date",
      value: selectedDate,
      raw: { widget_id: "compound", date: selectedDate },
    });
  };

  return (
    <div data-widget-id="compound" className="rounded-xl p-6 shadow-sm" style={{ background: "#fcfdfd", border: "1px solid #e2e8f0" }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#6366F1" }}>🎫 Tasting Date &amp; Time + Expo Dates</h3>
      <p className="text-sm mb-4" style={{ color: "#64748b" }}>Select a date from the calendar below.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Previous month">&larr;</button>
        <span className="font-semibold" style={{ color: "#312E81" }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Next month">&rarr;</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>
        {DAYS.map(d => <div key={d}>{d}</div>)}
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
              className={`h-9 rounded-lg text-sm font-medium transition-colors
                ${disabled ? "cursor-not-allowed line-through" : "cursor-pointer"}
                ${selected ? "text-white" : ""}
                ${!disabled && !selected ? "hover:bg-indigo-50" : ""}
              `}
              style={
                disabled
                  ? { color: "#cbd5e1", background: "#f1f5f9" }
                  : selected
                  ? { background: "#6366F1", color: "#fff" }
                  : { color: "#334155" }
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <p className="text-sm mb-3 font-medium" style={{ color: "#6366F1" }}>
          Selected: {selectedDate}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-40"
        style={{ background: "#6366F1" }}
      >
        Confirm Date
      </button>
    </div>
  );
}

/* ─── Main Page ─── */

export default function Page_food_wine_expo(props: GeneratedPageProps) {
  const [ticketQty, setTicketQty] = useState(1);
  const [seatSection, setSeatSection] = useState("general");
  const [promoCode, setPromoCode] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  return (
    <div className="min-h-screen font-sans" style={{ background: "#9baab5" }}>
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 shadow-md" style={{ background: "#6366F1" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎫</span>
            <span className="text-xl font-bold text-white tracking-tight">EchoEvents</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {["Browse", "Tickets", "Calendar", "Saved"].map(item => (
              <a key={item} href="#" className="text-sm font-medium text-indigo-100 hover:text-white transition-colors">{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
              <input
                type="text"
                placeholder="Search events..."
                className="bg-transparent text-white placeholder-indigo-200 px-3 py-1.5 text-sm focus:outline-none w-40"
              />
            </div>
            <select className="text-sm rounded-lg px-2 py-1.5 border-0 focus:outline-none" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
              <option>New York</option>
              <option>San Francisco</option>
              <option>Chicago</option>
            </select>
            <button className="text-sm font-medium px-3 py-1.5 rounded-lg text-white" style={{ background: "#F97316" }}>
              + Create Event
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
              JD
            </div>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop"
          alt="Food Wine Expo crowd"
          className="w-full h-64 md:h-80 object-cover"
        />
        <div className="absolute inset-0 flex items-end" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
          <div className="max-w-7xl mx-auto w-full px-4 pb-8">
            <p className="text-sm font-medium mb-1" style={{ color: "#F97316" }}>FEATURED EVENT</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Food &amp; Wine Expo 2026</h1>
            <p className="text-indigo-100 text-sm mb-4">World-class wine tastings, culinary showcases, and gourmet experiences</p>
            <button className="px-6 py-2.5 rounded-lg font-semibold text-white text-sm" style={{ background: "#F97316" }}>
              Get Tickets
            </button>
          </div>
        </div>
      </section>

      {/* ─── Context + Filters ─── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-xl p-6 mb-6 shadow-sm" style={{ background: "#fcfdfd" }}>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#312E81" }}>Plan Your Expo Experience</h2>
          <p className="text-sm" style={{ color: "#64748b" }}>
            Select your tasting session time, choose expo dates, and finalize your schedule below. Each section has its own date picker — fill them all out to complete your booking.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["all", "tastings", "workshops", "showcases"].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize"
              style={
                filterCategory === cat
                  ? { background: "#6366F1", color: "#fff" }
                  : { background: "#f0f1f2", color: "#475569" }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ─── Two Column Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Widgets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket config bar */}
            <div className="rounded-xl p-5 shadow-sm flex flex-wrap items-center gap-4" style={{ background: "#fcfdfd", border: "1px solid #e2e8f0" }}>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium" style={{ color: "#475569" }}>Tickets:</label>
                <button
                  onClick={() => setTicketQty(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold"
                  style={{ background: "#f0f1f2", color: "#6366F1" }}
                >−</button>
                <span className="w-8 text-center font-semibold" style={{ color: "#312E81" }}>{ticketQty}</span>
                <button
                  onClick={() => setTicketQty(q => Math.min(10, q + 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold"
                  style={{ background: "#f0f1f2", color: "#6366F1" }}
                >+</button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium" style={{ color: "#475569" }}>Section:</label>
                <select
                  value={seatSection}
                  onChange={e => setSeatSection(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                  style={{ borderColor: "#c7d2fe", background: "#fff" }}
                >
                  <option value="general">General Admission</option>
                  <option value="vip">VIP Lounge</option>
                  <option value="premium">Premium Tasting</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none w-32"
                  style={{ borderColor: "#c7d2fe", background: "#fff" }}
                />
                <button className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: "#F97316", color: "#fff" }}>
                  Apply
                </button>
              </div>
            </div>

            {/* Widget 1 */}
            <TastingDateTimePicker onSubmit={props.onSubmit} />

            {/* Widget 2 */}
            <ExpoDateRangePicker onSubmit={props.onSubmit} />

            {/* Widget 3 */}
            <CompoundPicker onSubmit={props.onSubmit} />
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Venue Info */}
            <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: "#fcfdfd", border: "1px solid #e2e8f0" }}>
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop"
                alt="Food expo venue"
                className="w-full h-48 object-cover"
              />
              <div className="p-5">
                <h3 className="font-semibold mb-1" style={{ color: "#312E81" }}>Venue Information</h3>
                <p className="text-sm mb-2" style={{ color: "#64748b" }}>Grand Convention Center</p>
                <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>500 Exhibition Blvd, Napa Valley, CA 94558</p>
                <div className="rounded-lg h-32 flex items-center justify-center text-xs" style={{ background: "#f0f1f2", color: "#94a3b8" }}>
                  📍 Map view
                </div>
              </div>
            </div>

            {/* Organizer */}
            <div className="rounded-xl p-5 shadow-sm" style={{ background: "#fcfdfd", border: "1px solid #e2e8f0" }}>
              <h3 className="font-semibold mb-3" style={{ color: "#312E81" }}>Organizer</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: "#e0e7ff" }}>🍷</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#334155" }}>Napa Valley Wine Guild</p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>Hosting events since 2005</p>
                </div>
              </div>
            </div>

            {/* Similar Events */}
            <div className="rounded-xl p-5 shadow-sm" style={{ background: "#fcfdfd", border: "1px solid #e2e8f0" }}>
              <h3 className="font-semibold mb-3" style={{ color: "#312E81" }}>Similar Events</h3>
              <div className="space-y-3">
                {[
                  { title: "Bordeaux Wine Festival", date: "Jul 15, 2026", img: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&h=300&fit=crop" },
                  { title: "Summer Art Exhibition", date: "Aug 3, 2026", img: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400&h=300&fit=crop" },
                ].map(ev => (
                  <div key={ev.title} className="flex gap-3 items-center">
                    <img src={ev.img} alt={ev.title} className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#334155" }}>{ev.title}</p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>{ev.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="mt-12 py-8 px-4" style={{ background: "#1e293b" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Policies</h4>
            <ul className="space-y-1.5">
              {["Terms of Service", "Privacy Policy", "Cookie Policy"].map(l => (
                <li key={l}><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Refunds</h4>
            <ul className="space-y-1.5">
              {["Refund Policy", "Cancel Tickets", "Transfer Tickets"].map(l => (
                <li key={l}><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Community</h4>
            <ul className="space-y-1.5">
              {["Guidelines", "Help Center", "Blog"].map(l => (
                <li key={l}><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Connect</h4>
            <ul className="space-y-1.5">
              {["EchoX", "EchoGram", "EchoBook", "EchoTube"].map(l => (
                <li key={l}><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-slate-700 text-center">
          <p className="text-xs text-slate-500">© 2026 EchoEvents. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
