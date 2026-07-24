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

function dayOfWeek(y: number, m: number, d: number) {
  return new Date(y, m, d).getDay();
}

/* ─── Widget 1: Workshop Date & Time (datetime, weekdays only) ─── */

function WorkshopDateTimePicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(9); // October = index 9
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<"AM" | "PM">("AM");

  const totalDays = daysInMonth(year, month);
  const startDay = startDayOfMonth(year, month);

  const isDisabled = useCallback(
    (day: number) => {
      const dow = dayOfWeek(year, month, day);
      return dow === 0 || dow === 6;
    },
    [year, month]
  );

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const handleSubmit = () => {
    if (!selectedDate) return;
    const h24 = ampm === "PM" ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    const iso = `${selectedDate}T${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
    props.onSubmit({
      type: "datetime",
      value: iso,
      raw: { widget_id: "workshop_datetime", date: selectedDate, hour, minute, ampm, iso },
    });
  };

  return (
    <div data-widget-id="workshop_datetime" className="border p-6 shadow-sm" style={{ background: "#fefefe", borderColor: "#e4e7e8" }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#333" }}>Workshop Date &amp; Time</h3>
      <p className="text-sm mb-4" style={{ color: "#666" }}>Select a weekday for your workshop session. Weekends are unavailable.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Previous month">&larr;</button>
        <span className="font-semibold" style={{ color: "#333" }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Next month">&rarr;</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1" style={{ color: "#888" }}>
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
              className={`py-1 text-sm text-center ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:opacity-80"} ${selected ? "font-bold" : ""}`}
              style={{
                background: selected ? "#6366F1" : "transparent",
                color: selected ? "#fff" : disabled ? "#bbb" : "#333",
                borderRadius: 0,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <label className="text-sm font-medium" style={{ color: "#333" }}>Time:</label>
        <select
          value={hour}
          onChange={e => setHour(Number(e.target.value))}
          className="border px-2 py-1 text-sm"
          style={{ borderColor: "#e4e7e8", background: "#fafafa" }}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span style={{ color: "#333" }}>:</span>
        <select
          value={minute}
          onChange={e => setMinute(Number(e.target.value))}
          className="border px-2 py-1 text-sm"
          style={{ borderColor: "#e4e7e8", background: "#fafafa" }}
        >
          {[0, 15, 30, 45].map(m => (
            <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
          ))}
        </select>
        <div className="flex">
          <button
            onClick={() => setAmpm("AM")}
            className="px-3 py-1 text-sm border font-medium"
            style={{
              background: ampm === "AM" ? "#6366F1" : "#fafafa",
              color: ampm === "AM" ? "#fff" : "#333",
              borderColor: "#e4e7e8",
            }}
          >
            AM
          </button>
          <button
            onClick={() => setAmpm("PM")}
            className="px-3 py-1 text-sm border-t border-b border-r font-medium"
            style={{
              background: ampm === "PM" ? "#6366F1" : "#fafafa",
              color: ampm === "PM" ? "#fff" : "#333",
              borderColor: "#e4e7e8",
            }}
          >
            PM
          </button>
        </div>
      </div>

      {selectedDate && (
        <p className="text-sm mb-3" style={{ color: "#6366F1" }}>
          Selected: {selectedDate} at {hour}:{String(minute).padStart(2, "0")} {ampm}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="px-5 py-2 text-sm font-medium text-white"
        style={{ background: selectedDate ? "#6366F1" : "#ccc", cursor: selectedDate ? "pointer" : "not-allowed" }}
      >
        Submit Workshop Date &amp; Time
      </button>
    </div>
  );
}

/* ─── Widget 2: Exhibit Dates (range, specific disabled) ─── */

const DISABLED_EXHIBIT_DATES = new Set([
  "2025-07-14","2025-07-16","2025-07-22","2025-07-24",
  "2025-07-28","2025-07-30","2025-08-02","2025-08-06","2025-08-07",
]);

function ExhibitDatesPicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(6); // July = index 6
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const totalDays = daysInMonth(year, month);
  const startDay = startDayOfMonth(year, month);

  const isDisabled = useCallback(
    (day: number) => DISABLED_EXHIBIT_DATES.has(toDateStr(year, month, day)),
    [year, month]
  );

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const handleDayClick = (ds: string) => {
    if (!rangeStart || rangeEnd) {
      setRangeStart(ds);
      setRangeEnd(null);
    } else {
      if (ds < rangeStart) {
        setRangeStart(ds);
        setRangeEnd(null);
      } else {
        setRangeEnd(ds);
      }
    }
  };

  const isInRange = useCallback(
    (ds: string) => {
      if (!rangeStart || !rangeEnd) return false;
      return ds >= rangeStart && ds <= rangeEnd;
    },
    [rangeStart, rangeEnd]
  );

  const handleSubmit = () => {
    if (!rangeStart || !rangeEnd) return;
    const value = `${rangeStart}/${rangeEnd}`;
    props.onSubmit({
      type: "date_range",
      value,
      raw: { widget_id: "exhibit_dates", start: rangeStart, end: rangeEnd },
    });
  };

  return (
    <div data-widget-id="exhibit_dates" className="border p-6 shadow-sm" style={{ background: "#fefefe", borderColor: "#e4e7e8" }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#333" }}>Exhibit Dates</h3>
      <p className="text-sm mb-4" style={{ color: "#666" }}>Pick a start and end date for the exhibit. Some dates are blocked.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Previous month">&larr;</button>
        <span className="font-semibold" style={{ color: "#333" }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Next month">&rarr;</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1" style={{ color: "#888" }}>
        {DAYS.map(d => <div key={d}>{d}</div>)}
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
          const highlight = isStart || isEnd;
          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => !disabled && handleDayClick(ds)}
              className={`py-1 text-sm text-center ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:opacity-80"} ${highlight ? "font-bold" : ""}`}
              style={{
                background: highlight ? "#6366F1" : inRange ? "#c7d2fe" : "transparent",
                color: highlight ? "#fff" : disabled ? "#bbb" : inRange ? "#312E81" : "#333",
                borderRadius: 0,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {rangeStart && (
        <p className="text-sm mb-3" style={{ color: "#6366F1" }}>
          {rangeEnd ? `Range: ${rangeStart} → ${rangeEnd}` : `Start: ${rangeStart} — now pick end date`}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!rangeStart || !rangeEnd}
        className="px-5 py-2 text-sm font-medium text-white"
        style={{ background: rangeStart && rangeEnd ? "#6366F1" : "#ccc", cursor: rangeStart && rangeEnd ? "pointer" : "not-allowed" }}
      >
        Submit Exhibit Dates
      </button>
    </div>
  );
}

/* ─── Widget 3: Compound (datetime+range → date, weekdays only) ─── */

function CompoundPicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // June = index 5
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const totalDays = daysInMonth(year, month);
  const startDay = startDayOfMonth(year, month);

  const isDisabled = useCallback(
    (day: number) => {
      const dow = dayOfWeek(year, month, day);
      return dow === 0 || dow === 6;
    },
    [year, month]
  );

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const handleSubmit = () => {
    if (!selectedDate) return;
    props.onSubmit({
      type: "date",
      value: selectedDate,
      raw: { widget_id: "compound", date: selectedDate },
    });
  };

  return (
    <div data-widget-id="compound" className="border p-6 shadow-sm" style={{ background: "#fefefe", borderColor: "#e4e7e8" }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#333" }}>Workshop &amp; Exhibit — Select Date</h3>
      <p className="text-sm mb-4" style={{ color: "#666" }}>Choose a single weekday for the combined workshop and exhibit session.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Previous month">&larr;</button>
        <span className="font-semibold" style={{ color: "#333" }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Next month">&rarr;</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1" style={{ color: "#888" }}>
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
              className={`py-1 text-sm text-center ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:opacity-80"} ${selected ? "font-bold" : ""}`}
              style={{
                background: selected ? "#6366F1" : "transparent",
                color: selected ? "#fff" : disabled ? "#bbb" : "#333",
                borderRadius: 0,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <p className="text-sm mb-3" style={{ color: "#6366F1" }}>
          Selected: {selectedDate}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="px-5 py-2 text-sm font-medium text-white"
        style={{ background: selectedDate ? "#6366F1" : "#ccc", cursor: selectedDate ? "pointer" : "not-allowed" }}
      >
        Submit Date
      </button>
    </div>
  );
}

/* ─── Main Page ─── */

export default function Page_design_week(props: GeneratedPageProps) {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const categories = ["All", "Workshops", "Exhibits", "Talks", "Networking"];

  return (
    <div className="min-h-screen font-sans" style={{ background: "#e4e7e8" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3" style={{ background: "#fefefe", borderBottom: "1px solid #e4e7e8" }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎫</span>
            <span className="font-semibold text-base" style={{ color: "#333" }}>EchoEvents</span>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm" style={{ color: "#555" }}>
            <a href="#" className="hover:opacity-70">Browse</a>
            <a href="#" className="hover:opacity-70">Tickets</a>
            <a href="#" className="hover:opacity-70">Calendar</a>
            <a href="#" className="hover:opacity-70">Saved</a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search events..."
            className="border px-3 py-1.5 text-sm w-48"
            style={{ background: "#fafafa", borderColor: "#e4e7e8", color: "#333" }}
          />
          <select className="border px-2 py-1.5 text-sm" style={{ background: "#fafafa", borderColor: "#e4e7e8", color: "#555" }}>
            <option>New York</option>
            <option>Los Angeles</option>
            <option>Chicago</option>
            <option>London</option>
          </select>
          <button className="px-3 py-1.5 text-sm font-medium text-white" style={{ background: "#6366F1" }}>Create Event</button>
          <div className="w-8 h-8 flex items-center justify-center text-sm font-bold" style={{ background: "#f5f5f5", color: "#6366F1" }}>U</div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop"
          alt="Design Week concert crowd"
          className="w-full h-56 object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-8" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.55))" }}>
          <h1 className="text-3xl font-bold text-white mb-1">Design Week 2025</h1>
          <p className="text-white text-sm opacity-90 mb-3">Workshops, exhibits, and creative sessions — curate your schedule</p>
          <button className="px-5 py-2 text-sm font-medium text-white w-fit" style={{ background: "#F97316" }}>Get Tickets</button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Context */}
        <div className="p-5" style={{ background: "#fefefe", borderLeft: "3px solid #6366F1" }}>
          <p className="text-sm" style={{ color: "#555" }}>
            Welcome to Design Week! Use the date pickers below to schedule your workshop session, select exhibit viewing dates, and pick a combined event date. Each selection is submitted independently.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className="px-3 py-1 text-sm font-medium"
              style={{
                background: categoryFilter === c ? "#6366F1" : "#f5f5f5",
                color: categoryFilter === c ? "#fff" : "#555",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Ticket / promo context row */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2 p-3 flex-1 min-w-[180px]" style={{ background: "#fafafa", border: "1px solid #e4e7e8" }}>
            <label className="text-sm" style={{ color: "#555" }}>Tickets</label>
            <div className="flex items-center border" style={{ borderColor: "#e4e7e8" }}>
              <button className="px-2 py-0.5 text-sm" style={{ background: "#f5f5f5", color: "#333" }}>−</button>
              <span className="px-3 text-sm" style={{ color: "#333" }}>2</span>
              <button className="px-2 py-0.5 text-sm" style={{ background: "#f5f5f5", color: "#333" }}>+</button>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 flex-1 min-w-[180px]" style={{ background: "#fafafa", border: "1px solid #e4e7e8" }}>
            <label className="text-sm" style={{ color: "#555" }}>Section</label>
            <select className="border px-2 py-1 text-sm flex-1" style={{ borderColor: "#e4e7e8", background: "#fefefe", color: "#333" }}>
              <option>General Admission</option>
              <option>VIP</option>
              <option>Gallery Floor</option>
            </select>
          </div>
          <div className="flex items-center gap-2 p-3 flex-1 min-w-[180px]" style={{ background: "#fafafa", border: "1px solid #e4e7e8" }}>
            <input type="text" placeholder="Promo code" className="border px-2 py-1 text-sm flex-1" style={{ borderColor: "#e4e7e8", background: "#fefefe", color: "#333" }} />
            <button className="px-3 py-1 text-sm font-medium text-white" style={{ background: "#6366F1" }}>Apply</button>
          </div>
        </div>

        {/* Widget 1 */}
        <WorkshopDateTimePicker onSubmit={props.onSubmit} />

        {/* Widget 2 */}
        <ExhibitDatesPicker onSubmit={props.onSubmit} />

        {/* Widget 3 */}
        <CompoundPicker onSubmit={props.onSubmit} />

        {/* Similar Events */}
        <div>
          <h2 className="text-base font-semibold mb-3" style={{ color: "#333" }}>Similar Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div style={{ background: "#fefefe", border: "1px solid #e4e7e8" }}>
              <img src="https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400&h=300&fit=crop" alt="Art gallery" className="w-full h-36 object-cover" />
              <div className="p-3">
                <h3 className="text-sm font-semibold" style={{ color: "#333" }}>Modern Art Showcase</h3>
                <p className="text-xs mt-1" style={{ color: "#888" }}>Jul 18 – Jul 25 · Gallery District</p>
              </div>
            </div>
            <div style={{ background: "#fefefe", border: "1px solid #e4e7e8" }}>
              <img src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop" alt="Conference" className="w-full h-36 object-cover" />
              <div className="p-3">
                <h3 className="text-sm font-semibold" style={{ color: "#333" }}>Creative Conf 2025</h3>
                <p className="text-xs mt-1" style={{ color: "#888" }}>Aug 4 – Aug 6 · Convention Center</p>
              </div>
            </div>
            <div style={{ background: "#fefefe", border: "1px solid #e4e7e8" }}>
              <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop" alt="Food expo" className="w-full h-36 object-cover" />
              <div className="p-3">
                <h3 className="text-sm font-semibold" style={{ color: "#333" }}>Design &amp; Dine Expo</h3>
                <p className="text-xs mt-1" style={{ color: "#888" }}>Sep 12 – Sep 14 · Waterfront</p>
              </div>
            </div>
          </div>
        </div>

        {/* Venue info */}
        <div className="p-5" style={{ background: "#fafafa", border: "1px solid #e4e7e8" }}>
          <h2 className="text-base font-semibold mb-2" style={{ color: "#333" }}>Venue Information</h2>
          <p className="text-sm" style={{ color: "#555" }}>Design Center, 450 Innovation Blvd, New York, NY 10001</p>
          <p className="text-xs mt-2" style={{ color: "#888" }}>Accessible venue · Free parking · Public transit nearby</p>
        </div>

        {/* Organizer */}
        <div className="flex items-center gap-4 p-5" style={{ background: "#fafafa", border: "1px solid #e4e7e8" }}>
          <div className="w-12 h-12 flex items-center justify-center text-lg font-bold" style={{ background: "#6366F1", color: "#fff" }}>DW</div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "#333" }}>Design Week Collective</h3>
            <p className="text-xs" style={{ color: "#888" }}>Organizer · 42 events hosted · 15K followers</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 px-6 py-6" style={{ background: "#fefefe", borderTop: "1px solid #e4e7e8" }}>
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs" style={{ color: "#888" }}>
          <div>
            <h4 className="font-semibold mb-2" style={{ color: "#555" }}>Policies</h4>
            <p>Terms of Service</p>
            <p>Privacy Policy</p>
            <p>Cookie Preferences</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2" style={{ color: "#555" }}>Refunds</h4>
            <p>Refund Policy</p>
            <p>Cancellation Info</p>
            <p>Contact Support</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2" style={{ color: "#555" }}>Community</h4>
            <p>Community Guidelines</p>
            <p>Event Standards</p>
            <p>Accessibility</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2" style={{ color: "#555" }}>Connect</h4>
            <p>EchoX</p>
            <p>EchoGram</p>
            <p>EchoLink</p>
          </div>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: "#aaa" }}>© 2025 EchoEvents. All rights reserved.</p>
      </footer>
    </div>
  );
}
