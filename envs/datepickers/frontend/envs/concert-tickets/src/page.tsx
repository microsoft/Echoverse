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

/* ─── Widget 1: Show Date ─── */

const DISABLED_SHOW_DATES = new Set([
  "2025-05-31","2025-06-05","2025-06-07","2025-06-08",
  "2025-06-11","2025-06-17","2025-06-19",
]);

function ShowDatePicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const totalDays = daysInMonth(year, month);
  const startDay = startDayOfMonth(year, month);

  const isDisabled = useCallback(
    (day: number) => DISABLED_SHOW_DATES.has(toDateStr(year, month, day)),
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
      raw: { widget_id: "show_date", date: selectedDate },
    });
  };

  return (
    <div data-widget-id="show_date" className="rounded-xl border p-6 shadow-sm bg-white" style={{ borderColor: "#6366F1" }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#312E81" }}>Select Show Date</h3>
      <p className="text-sm mb-4 text-gray-500">Choose an available date for the concert. Grayed-out dates are sold out or unavailable.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Previous month">&larr;</button>
        <span className="font-semibold" style={{ color: "#312E81" }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Next month">&rarr;</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1 text-gray-500">
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
              className={`h-9 rounded text-sm font-medium transition-colors
                ${disabled ? "text-gray-300 cursor-not-allowed bg-gray-100 line-through" : ""}
                ${selected ? "text-white" : ""}
                ${!disabled && !selected ? "hover:bg-indigo-50 cursor-pointer text-gray-700" : ""}
              `}
              style={selected ? { background: "#6366F1" } : undefined}
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
        Confirm Show Date
      </button>
    </div>
  );
}

/* ─── Widget 2: Purchase Date & Time ─── */

function PurchaseDateTimePicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<"AM" | "PM">("AM");

  const totalDays = daysInMonth(year, month);
  const startDay = startDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  const handleSubmit = () => {
    if (!selectedDate) return;
    const h24 = ampm === "PM" ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    const iso = `${selectedDate}T${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
    props.onSubmit({
      type: "datetime",
      value: iso,
      raw: { widget_id: "purchase_datetime", date: selectedDate, hour, minute, ampm, iso },
    });
  };

  return (
    <div data-widget-id="purchase_datetime" className="rounded-xl border p-6 shadow-sm bg-white" style={{ borderColor: "#6366F1" }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#312E81" }}>Purchase Date &amp; Time</h3>
      <p className="text-sm mb-4 text-gray-500">Select when you'd like to complete your ticket purchase.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Previous month">&larr;</button>
        <span className="font-semibold" style={{ color: "#312E81" }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: "#6366F1" }} aria-label="Next month">&rarr;</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1 text-gray-500">
        {DAYS.map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const ds = toDateStr(year, month, day);
          const selected = selectedDate === ds;
          return (
            <button
              key={day}
              onClick={() => setSelectedDate(ds)}
              className={`h-9 rounded text-sm font-medium transition-colors cursor-pointer
                ${selected ? "text-white" : "text-gray-700 hover:bg-indigo-50"}
              `}
              style={selected ? { background: "#6366F1" } : undefined}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Time selectors */}
      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm font-medium text-gray-600">Time:</label>
        <select
          value={hour}
          onChange={e => setHour(Number(e.target.value))}
          className="border rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2"
          style={{ borderColor: "#C7D2FE", focusRingColor: "#6366F1" } as any}
        >
          {hours.map(h => (
            <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
          ))}
        </select>
        <span className="text-gray-400 font-bold">:</span>
        <select
          value={minute}
          onChange={e => setMinute(Number(e.target.value))}
          className="border rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2"
          style={{ borderColor: "#C7D2FE" }}
        >
          {minutes.map(m => (
            <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
          ))}
        </select>
        <div className="flex rounded overflow-hidden border" style={{ borderColor: "#C7D2FE" }}>
          <button
            onClick={() => setAmpm("AM")}
            className={`px-3 py-1.5 text-sm font-semibold transition-colors ${ampm === "AM" ? "text-white" : "text-gray-500 bg-white"}`}
            style={ampm === "AM" ? { background: "#6366F1" } : undefined}
          >
            AM
          </button>
          <button
            onClick={() => setAmpm("PM")}
            className={`px-3 py-1.5 text-sm font-semibold transition-colors ${ampm === "PM" ? "text-white" : "text-gray-500 bg-white"}`}
            style={ampm === "PM" ? { background: "#6366F1" } : undefined}
          >
            PM
          </button>
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
        Confirm Purchase Time
      </button>
    </div>
  );
}

/* ─── Main Page ─── */

export default function Page_concert_tickets(props: GeneratedPageProps) {
  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      {/* Header */}
      <header className="shadow-sm" style={{ background: "#6366F1" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-white font-bold text-xl tracking-tight">🎵 EchoLive</span>
            <div className="hidden md:flex items-center bg-white/20 rounded-lg px-3 py-1.5 gap-2 w-72">
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <span className="text-white/70 text-sm">Search events, artists...</span>
            </div>
            <div className="hidden lg:flex items-center text-white/80 text-sm gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span>New York, NY</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="hidden sm:block text-sm text-white/90 hover:text-white font-medium">Create Event</button>
            <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white text-sm font-bold">J</div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 text-white" style={{ background: "#F97316" }}>
              🔥 Trending
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
              Neon Pulse — Summer Stadium Tour 2025
            </h1>
            <p className="text-white/80 text-sm md:text-base mb-5 max-w-lg">
              Experience the electrifying live performance at Echo Arena. Limited seats available — secure your spot now!
            </p>
            <button className="px-6 py-3 rounded-lg font-bold text-sm shadow-lg transition-transform hover:scale-105" style={{ background: "#F97316", color: "#fff" }}>
              Get Tickets →
            </button>
          </div>
          {/* Event banner placeholder */}
          <div className="w-full md:w-96 h-56 rounded-xl flex items-center justify-center text-white/60 text-sm font-medium" style={{ background: "rgba(255,255,255,0.15)" }}>
            Event Banner — 800×400
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column — Datepickers + Form */}
          <div className="flex-1 space-y-8">
            {/* Context */}
            <div className="rounded-xl border bg-white p-6 shadow-sm" style={{ borderColor: "#E0E7FF" }}>
              <h2 className="text-xl font-bold mb-2" style={{ color: "#312E81" }}>Book Your Concert Tickets</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Choose the show date you'd like to attend, then select your preferred purchase date and time. Unavailable show dates are marked in gray. Complete both selections to finalize your booking.
              </p>
            </div>

            {/* Ticket Options Row */}
            <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col sm:flex-row gap-4" style={{ borderColor: "#E0E7FF" }}>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Quantity</label>
                <div className="flex items-center border rounded-lg overflow-hidden w-fit" style={{ borderColor: "#C7D2FE" }}>
                  <button className="px-3 py-2 text-gray-500 hover:bg-gray-50 font-bold">−</button>
                  <span className="px-4 py-2 text-sm font-semibold" style={{ color: "#312E81" }}>2</span>
                  <button className="px-3 py-2 text-gray-500 hover:bg-gray-50 font-bold">+</button>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Seat Section</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" style={{ borderColor: "#C7D2FE" }}>
                  <option>Floor — $249</option>
                  <option>Lower Bowl — $179</option>
                  <option>Upper Deck — $89</option>
                  <option>VIP Lounge — $499</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
                <input type="text" placeholder="Enter code" className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#C7D2FE" }} />
              </div>
            </div>

            {/* Widget 1 */}
            <ShowDatePicker onSubmit={props.onSubmit} />

            {/* Widget 2 */}
            <PurchaseDateTimePicker onSubmit={props.onSubmit} />
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            {/* Venue Info */}
            <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E0E7FF" }}>
              <h4 className="font-semibold text-sm mb-3" style={{ color: "#312E81" }}>Venue Information</h4>
              <div className="w-full h-40 rounded-lg mb-3 flex items-center justify-center text-gray-400 text-xs font-medium" style={{ background: "#EEF2FF" }}>
                Venue Photo — 300×200
              </div>
              <p className="font-semibold text-sm text-gray-800">Echo Arena</p>
              <p className="text-xs text-gray-500 mt-0.5">4 Pennsylvania Plaza, New York, NY 10001</p>
              <p className="text-xs text-gray-500 mt-2">Capacity: 20,789 · Doors open 6:30 PM</p>
            </div>

            {/* Organizer */}
            <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E0E7FF" }}>
              <h4 className="font-semibold text-sm mb-3" style={{ color: "#312E81" }}>Organizer</h4>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: "#6366F1" }}>NP</div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">Neon Pulse Official</p>
                  <p className="text-xs text-gray-500">142 events hosted</p>
                </div>
              </div>
            </div>

            {/* Similar Events */}
            <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E0E7FF" }}>
              <h4 className="font-semibold text-sm mb-3" style={{ color: "#312E81" }}>Similar Events</h4>
              <div className="space-y-3">
                {[
                  { name: "Synthwave Nights", date: "Jul 12, 2025", price: "$65" },
                  { name: "Bass Drop Festival", date: "Aug 3, 2025", price: "$120" },
                  { name: "Acoustic Sunset", date: "Jun 28, 2025", price: "$45" },
                ].map(ev => (
                  <div key={ev.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center text-xs text-white font-bold" style={{ background: "#818CF8" }}>🎤</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{ev.name}</p>
                      <p className="text-xs text-gray-500">{ev.date}</p>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "#F97316" }}>{ev.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12" style={{ borderColor: "#E0E7FF" }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <h5 className="font-semibold mb-2" style={{ color: "#312E81" }}>Policies</h5>
              <ul className="space-y-1 text-gray-500">
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
                <li>Cookie Settings</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2" style={{ color: "#312E81" }}>Refunds</h5>
              <ul className="space-y-1 text-gray-500">
                <li>Refund Policy</li>
                <li>Exchange Tickets</li>
                <li>Contact Support</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2" style={{ color: "#312E81" }}>Community</h5>
              <ul className="space-y-1 text-gray-500">
                <li>Guidelines</li>
                <li>Accessibility</li>
                <li>Blog</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2" style={{ color: "#312E81" }}>Connect</h5>
              <ul className="space-y-1 text-gray-500">
                <li>EchoX</li>
                <li>EchoGram</li>
                <li>EchoBook</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-6 text-center">© 2025 EchoLive Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
