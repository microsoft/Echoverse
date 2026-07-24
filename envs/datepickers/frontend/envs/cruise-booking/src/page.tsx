import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function startDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }

const PRIMARY = "#535563";
const SECONDARY = "#343743";
const BG = "#0c0b21";
const ACCENT = "#2b2d39";
const SURFACE = "#191929";
const TEXT = "#e8e8ec";
const TEXT_DIM = "#8e8ea0";
const HIGHLIGHT = "#febb02";
const BRAND = "#003580";

const MIN_DATE = new Date(2025, 5, 1); // 2025-06-01

function isFuture(y: number, m: number, d: number) {
  const date = new Date(y, m, d);
  const today = new Date(2025, 0, 1);
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

function isMonthFuture(y: number, m: number) {
  const now = new Date(2025, 0, 1);
  return y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth());
}

/* ─── Widget 1: Embarkation Date (datetime) ─── */

function EmbarkDatePicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(6); // July 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<"AM" | "PM">("AM");

  const minDate = new Date(2025, 6, 1); // 2025-07-01

  const cells = useMemo(() => {
    const first = startDay(viewYear, viewMonth);
    const total = daysInMonth(viewYear, viewMonth);
    const result: Array<{ day: number; iso: string; disabled: boolean } | null> = [];
    for (let i = 0; i < first; i++) result.push(null);
    for (let d = 1; d <= total; d++) {
      const iso = toDateStr(viewYear, viewMonth, d);
      const date = new Date(viewYear, viewMonth, d);
      const disabled = date < minDate || !isFuture(viewYear, viewMonth, d);
      result.push({ day: d, iso, disabled });
    }
    return result;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    const h24 = ampm === "PM" ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    const iso = `${selectedDate}T${pad(h24)}:${pad(minute)}:00`;
    props.onSubmit({
      type: "datetime",
      value: iso,
      raw: { widget_id: "embark_date", date: selectedDate, hour, minute, ampm, hour24: h24, iso },
    });
  }, [selectedDate, hour, minute, ampm, props]);

  return (
    <div data-widget-id="embark_date" className="p-5" style={{ background: ACCENT, borderRadius: 0 }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: TEXT }}>Embarkation Date &amp; Time</h3>
      <p className="text-xs mb-4" style={{ color: TEXT_DIM }}>Select your cruise departure date and preferred boarding time.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-2 py-1 text-sm font-bold" style={{ color: HIGHLIGHT }} aria-label="Previous month">←</button>
        <span className="text-sm font-semibold" style={{ color: TEXT }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="px-2 py-1 text-sm font-bold" style={{ color: HIGHLIGHT }} aria-label="Next month">→</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1" style={{ color: TEXT_DIM }}>
        {DAYS.map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {cells.map((c, i) =>
          c === null ? <div key={`e${i}`} /> : (
            <button
              key={c.iso}
              disabled={c.disabled}
              onClick={() => !c.disabled && setSelectedDate(c.iso)}
              className={`h-8 text-xs font-medium transition-colors ${c.disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
              style={{
                background: selectedDate === c.iso ? HIGHLIGHT : "transparent",
                color: selectedDate === c.iso ? BG : c.disabled ? TEXT_DIM : TEXT,
                borderRadius: 0,
              }}
            >
              {c.day}
            </button>
          )
        )}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs font-medium" style={{ color: TEXT_DIM }}>Time:</span>
        <select value={hour} onChange={e => setHour(Number(e.target.value))}
          className="text-xs px-2 py-1" style={{ background: SURFACE, color: TEXT, border: `1px solid ${PRIMARY}`, borderRadius: 0 }}>
          {hours.map(h => <option key={h} value={h}>{pad(h)}</option>)}
        </select>
        <span style={{ color: TEXT_DIM }}>:</span>
        <select value={minute} onChange={e => setMinute(Number(e.target.value))}
          className="text-xs px-2 py-1" style={{ background: SURFACE, color: TEXT, border: `1px solid ${PRIMARY}`, borderRadius: 0 }}>
          {minutes.map(m => <option key={m} value={m}>{pad(m)}</option>)}
        </select>
        <div className="flex" style={{ border: `1px solid ${PRIMARY}` }}>
          <button onClick={() => setAmpm("AM")}
            className="px-2 py-1 text-xs font-semibold"
            style={{ background: ampm === "AM" ? HIGHLIGHT : "transparent", color: ampm === "AM" ? BG : TEXT_DIM }}>AM</button>
          <button onClick={() => setAmpm("PM")}
            className="px-2 py-1 text-xs font-semibold"
            style={{ background: ampm === "PM" ? HIGHLIGHT : "transparent", color: ampm === "PM" ? BG : TEXT_DIM }}>PM</button>
        </div>
      </div>

      {selectedDate && (
        <p className="text-xs mb-3 font-medium" style={{ color: HIGHLIGHT }}>
          Selected: {selectedDate} at {pad(hour)}:{pad(minute)} {ampm}
        </p>
      )}

      <button onClick={handleSubmit} disabled={!selectedDate}
        className="w-full py-2 text-xs font-semibold transition-opacity disabled:opacity-40"
        style={{ background: HIGHLIGHT, color: BG, borderRadius: 0 }}>
        Confirm Embarkation Date
      </button>
    </div>
  );
}

/* ─── Widget 2: Passport Expiry Month (month_year) ─── */

function PassportExpiryPicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [year, setYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const handleSubmit = useCallback(() => {
    if (selectedMonth === null) return;
    const iso = `${year}-${pad(selectedMonth + 1)}`;
    props.onSubmit({
      type: "month_year",
      value: iso,
      raw: { widget_id: "passport_expiry", year, month: selectedMonth + 1, month_name: MONTHS[selectedMonth], iso },
    });
  }, [selectedMonth, year, props]);

  return (
    <div data-widget-id="passport_expiry" className="p-5" style={{ background: ACCENT, borderRadius: 0 }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: TEXT }}>Passport Expiry Month</h3>
      <p className="text-xs mb-4" style={{ color: TEXT_DIM }}>Select the month and year your passport expires. Must be a future date.</p>

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setYear(y => y - 1)} className="px-2 py-1 text-sm font-bold" style={{ color: HIGHLIGHT }} aria-label="Previous year">←</button>
        <span className="text-sm font-semibold" style={{ color: TEXT }}>{year}</span>
        <button onClick={() => setYear(y => y + 1)} className="px-2 py-1 text-sm font-bold" style={{ color: HIGHLIGHT }} aria-label="Next year">→</button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {MONTH_SHORT.map((m, i) => {
          const future = isMonthFuture(year, i);
          const aboveMin = new Date(year, i, 1) >= new Date(2025, 5, 1);
          const enabled = future && aboveMin;
          const selected = selectedMonth === i;
          return (
            <button key={m} disabled={!enabled}
              onClick={() => enabled && setSelectedMonth(i)}
              className={`py-2 text-xs font-medium transition-colors ${!enabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
              style={{
                background: selected ? HIGHLIGHT : SURFACE,
                color: selected ? BG : enabled ? TEXT : TEXT_DIM,
                borderRadius: 0,
              }}>
              {m}
            </button>
          );
        })}
      </div>

      {selectedMonth !== null && (
        <p className="text-xs mb-3 font-medium" style={{ color: HIGHLIGHT }}>
          Selected: {MONTHS[selectedMonth]} {year}
        </p>
      )}

      <button onClick={handleSubmit} disabled={selectedMonth === null}
        className="w-full py-2 text-xs font-semibold transition-opacity disabled:opacity-40"
        style={{ background: HIGHLIGHT, color: BG, borderRadius: 0 }}>
        Confirm Passport Expiry
      </button>
    </div>
  );
}

/* ─── Widget 3: Compound (date calendar for both) ─── */

function CompoundPicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(5); // June 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const cells = useMemo(() => {
    const first = startDay(viewYear, viewMonth);
    const total = daysInMonth(viewYear, viewMonth);
    const result: Array<{ day: number; iso: string; disabled: boolean } | null> = [];
    for (let i = 0; i < first; i++) result.push(null);
    for (let d = 1; d <= total; d++) {
      const iso = toDateStr(viewYear, viewMonth, d);
      const date = new Date(viewYear, viewMonth, d);
      const disabled = date < MIN_DATE || !isFuture(viewYear, viewMonth, d);
      result.push({ day: d, iso, disabled });
    }
    return result;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    props.onSubmit({
      type: "date",
      value: selectedDate,
      raw: { widget_id: "compound", date: selectedDate },
    });
  }, [selectedDate, props]);

  return (
    <div data-widget-id="compound" className="p-5" style={{ background: ACCENT, borderRadius: 0 }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: TEXT }}>Embarkation Date + Passport Expiry</h3>
      <p className="text-xs mb-4" style={{ color: TEXT_DIM }}>Select a date for your combined cruise embarkation and passport verification.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-2 py-1 text-sm font-bold" style={{ color: HIGHLIGHT }} aria-label="Previous month">←</button>
        <span className="text-sm font-semibold" style={{ color: TEXT }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="px-2 py-1 text-sm font-bold" style={{ color: HIGHLIGHT }} aria-label="Next month">→</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1" style={{ color: TEXT_DIM }}>
        {DAYS.map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {cells.map((c, i) =>
          c === null ? <div key={`e${i}`} /> : (
            <button
              key={c.iso}
              disabled={c.disabled}
              onClick={() => !c.disabled && setSelectedDate(c.iso)}
              className={`h-8 text-xs font-medium transition-colors ${c.disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
              style={{
                background: selectedDate === c.iso ? HIGHLIGHT : "transparent",
                color: selectedDate === c.iso ? BG : c.disabled ? TEXT_DIM : TEXT,
                borderRadius: 0,
              }}
            >
              {c.day}
            </button>
          )
        )}
      </div>

      {selectedDate && (
        <p className="text-xs mb-3 font-medium" style={{ color: HIGHLIGHT }}>
          Selected: {selectedDate}
        </p>
      )}

      <button onClick={handleSubmit} disabled={!selectedDate}
        className="w-full py-2 text-xs font-semibold transition-opacity disabled:opacity-40"
        style={{ background: HIGHLIGHT, color: BG, borderRadius: 0 }}>
        Confirm Date
      </button>
    </div>
  );
}

/* ─── Main Page ─── */

export default function Page_cruise_booking(props: GeneratedPageProps) {
  const [travelers, setTravelers] = useState(2);
  const [cabin, setCabin] = useState("Balcony");
  const [tripType, setTripType] = useState("round-trip");

  const cruises = [
    { route: "Miami → Cozumel", ship: "Ocean Majesty", duration: "5 nights", price: "$899", cabin: "Balcony" },
    { route: "Barcelona → Naples", ship: "Mediterranean Star", duration: "7 nights", price: "$1,249", cabin: "Suite" },
    { route: "Sydney → Auckland", ship: "Pacific Voyager", duration: "10 nights", price: "$2,150", cabin: "Interior" },
    { route: "Southampton → Reykjavik", ship: "Nordic Explorer", duration: "12 nights", price: "$2,890", cabin: "Ocean View" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG, color: TEXT, fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* Header */}
      <header style={{ background: SECONDARY }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✈️</span>
            <span className="text-base font-semibold tracking-tight" style={{ color: TEXT }}>EchoWay</span>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-xs" style={{ color: TEXT_DIM, fontFamily: "system-ui, sans-serif" }}>
            <span className="cursor-pointer hover:text-white">Flights</span>
            <span className="cursor-pointer hover:text-white">Hotels</span>
            <span className="cursor-pointer hover:text-white">Cars</span>
            <span className="cursor-pointer hover:text-white">Deals</span>
          </nav>
          <div className="flex items-center gap-2" style={{ fontFamily: "system-ui, sans-serif" }}>
            <span className="text-xs px-2 py-1" style={{ background: SURFACE, color: TEXT_DIM }}>USD</span>
            <span className="text-xs px-2 py-1" style={{ background: SURFACE, color: TEXT_DIM }}>EN</span>
            <div className="w-7 h-7 flex items-center justify-center text-xs font-medium" style={{ background: PRIMARY, color: TEXT_DIM }}>JD</div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 280 }}>
        <img src="https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=1200&h=400&fit=crop" alt="airport" className="w-full h-72 object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(12,11,33,0.5), rgba(12,11,33,0.95))" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center" style={{ color: TEXT }}>Book Your Dream Cruise</h1>
          <p className="text-sm mb-4 text-center" style={{ color: TEXT_DIM }}>Explore the world's finest cruise destinations</p>
          <div className="w-full max-w-xl px-3 py-2 flex items-center gap-2" style={{ background: ACCENT }}>
            <span className="text-sm" style={{ color: TEXT_DIM }}>🔍</span>
            <span className="text-sm" style={{ color: TEXT_DIM }}>Where are you going?</span>
          </div>
        </div>
      </div>

      {/* Search bar / form context */}
      <div style={{ background: SECONDARY }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3" style={{ fontFamily: "system-ui, sans-serif" }}>
          <div className="flex items-center gap-1">
            {["one-way", "round-trip"].map(t => (
              <button key={t} onClick={() => setTripType(t)}
                className="px-3 py-1 text-xs font-medium"
                style={{ background: tripType === t ? HIGHLIGHT : SURFACE, color: tripType === t ? BG : TEXT_DIM, borderRadius: 0 }}>
                {t === "one-way" ? "One-way" : "Round-trip"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 px-2 py-1" style={{ background: SURFACE }}>
            <button onClick={() => setTravelers(Math.max(1, travelers - 1))} className="px-1 text-xs font-bold" style={{ color: TEXT_DIM }}>−</button>
            <span className="text-xs px-2" style={{ color: TEXT }}>{travelers} Traveler{travelers !== 1 ? "s" : ""}</span>
            <button onClick={() => setTravelers(travelers + 1)} className="px-1 text-xs font-bold" style={{ color: TEXT_DIM }}>+</button>
          </div>
          <select value={cabin} onChange={e => setCabin(e.target.value)}
            className="text-xs px-2 py-1" style={{ background: SURFACE, color: TEXT, border: "none", borderRadius: 0 }}>
            <option>Interior</option>
            <option>Ocean View</option>
            <option>Balcony</option>
            <option>Suite</option>
          </select>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1" style={{ fontFamily: "system-ui, sans-serif" }}>
        {/* Context */}
        <div className="mb-6 p-4" style={{ background: ACCENT }}>
          <h2 className="text-base font-semibold mb-1" style={{ color: TEXT }}>Cruise Booking — Date Selection</h2>
          <p className="text-xs leading-relaxed" style={{ color: TEXT_DIM }}>
            Complete all three date selections below to finalize your cruise booking. Choose your embarkation date and time, verify your passport expiry, and confirm the combined booking date.
          </p>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2 mb-5">
          {["All Cruises", "Caribbean", "Mediterranean", "Pacific", "Northern Europe"].map(f => (
            <button key={f} className="px-3 py-1 text-xs" style={{ background: f === "All Cruises" ? PRIMARY : SURFACE, color: TEXT_DIM, borderRadius: 0 }}>{f}</button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: widgets */}
          <div className="flex-1 space-y-5">
            <EmbarkDatePicker onSubmit={props.onSubmit} />
            <PassportExpiryPicker onSubmit={props.onSubmit} />
            <CompoundPicker onSubmit={props.onSubmit} />
          </div>

          {/* Right sidebar */}
          <div className="w-full lg:w-72 space-y-5">
            {/* Cruise results table */}
            <div className="p-4" style={{ background: ACCENT }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: TEXT }}>Available Cruises</h4>
              <table className="w-full text-xs" style={{ color: TEXT_DIM }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${PRIMARY}` }}>
                    <th className="text-left pb-2 font-medium">Route</th>
                    <th className="text-right pb-2 font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {cruises.map(c => (
                    <tr key={c.route} style={{ borderBottom: `1px solid ${SURFACE}` }}>
                      <td className="py-2">
                        <span className="block font-medium" style={{ color: TEXT }}>{c.route}</span>
                        <span className="text-xs">{c.ship} · {c.duration}</span>
                      </td>
                      <td className="py-2 text-right font-semibold" style={{ color: HIGHLIGHT }}>{c.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Destination cards */}
            <div className="p-4" style={{ background: ACCENT }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: TEXT }}>Popular Destinations</h4>
              <div className="space-y-3">
                <div>
                  <img src="https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=300&fit=crop" alt="cruise ship" className="w-full h-32 object-cover" />
                  <p className="text-xs font-medium mt-1" style={{ color: TEXT }}>Caribbean Cruise</p>
                  <p className="text-xs" style={{ color: TEXT_DIM }}>From $799 · 7 nights</p>
                </div>
                <div>
                  <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop" alt="beach" className="w-full h-32 object-cover" />
                  <p className="text-xs font-medium mt-1" style={{ color: TEXT }}>Mediterranean Escape</p>
                  <p className="text-xs" style={{ color: TEXT_DIM }}>From $1,199 · 10 nights</p>
                </div>
                <div>
                  <img src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop" alt="city skyline" className="w-full h-32 object-cover" />
                  <p className="text-xs font-medium mt-1" style={{ color: TEXT }}>Northern Europe</p>
                  <p className="text-xs" style={{ color: TEXT_DIM }}>From $2,490 · 14 nights</p>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="p-4" style={{ background: ACCENT }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: TEXT }}>Traveler Reviews</h4>
              {[
                { name: "Sarah M.", text: "Incredible experience on the Mediterranean route!", rating: 5 },
                { name: "James L.", text: "Staff were friendly, cabins very comfortable.", rating: 4 },
              ].map(r => (
                <div key={r.name} className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 flex items-center justify-center text-xs font-bold" style={{ background: PRIMARY, color: TEXT_DIM }}>{r.name[0]}</div>
                    <span className="text-xs font-medium" style={{ color: TEXT }}>{r.name}</span>
                    <span className="text-xs" style={{ color: HIGHLIGHT }}>{"★".repeat(r.rating)}</span>
                  </div>
                  <p className="text-xs" style={{ color: TEXT_DIM }}>{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: SECONDARY, borderTop: `1px solid ${PRIMARY}` }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs" style={{ color: TEXT_DIM }}>
            <div>
              <h5 className="font-semibold mb-2" style={{ color: TEXT }}>Company</h5>
              <ul className="space-y-1"><li>About</li><li>Careers</li><li>Press</li></ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2" style={{ color: TEXT }}>Support</h5>
              <ul className="space-y-1"><li>Help Center</li><li>Contact Us</li><li>Safety</li></ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2" style={{ color: TEXT }}>Legal</h5>
              <ul className="space-y-1"><li>Terms</li><li>Privacy</li><li>Cookies</li></ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2" style={{ color: TEXT }}>Get the App</h5>
              <div className="space-y-1">
                <div className="px-2 py-1 text-center" style={{ background: SURFACE }}>EchoStore</div>
                <div className="px-2 py-1 text-center" style={{ background: SURFACE }}>EchoPlay</div>
              </div>
            </div>
          </div>
          <p className="text-xs mt-4 text-center" style={{ color: TEXT_DIM }}>© 2025 EchoWay Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
