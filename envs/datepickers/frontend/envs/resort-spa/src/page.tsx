import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function startDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }

const BG = "#90817e";
const SURFACE = "#fbf9f8";
const SURFACE_ALT = "#f7f3f2";
const ACCENT = "#f0ecea";
const MUTED = "#d5cdc4";
const TEXT = "#222222";
const TEXT_DIM = "#6b6360";
const BRAND = "#FF385C";

const SPA_DISABLED = new Set([
  "2025-01-01","2025-07-04","2025-12-25","2025-11-28",
]);
const DISABLED_WEEKDAYS_SPA = new Set([0, 6]); // Sun=0, Sat=6

const COMPOUND_DISABLED = new Set([
  "2025-01-01","2025-07-04","2025-12-25","2025-11-28",
]);
const DISABLED_WEEKDAYS_COMPOUND = new Set([0, 6]);

function isFuture(y: number, m: number, d: number) {
  const date = new Date(y, m, d);
  const today = new Date(2025, 0, 1);
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

/* ─── Widget 1: Spa Appointment (datetime, business_days) ─── */

function SpaDateTimePicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(6); // July (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<"AM" | "PM">("AM");

  const cells = useMemo(() => {
    const first = startDay(viewYear, viewMonth);
    const total = daysInMonth(viewYear, viewMonth);
    const result: Array<{ day: number; iso: string; disabled: boolean; weekday: number } | null> = [];
    for (let i = 0; i < first; i++) result.push(null);
    for (let d = 1; d <= total; d++) {
      const iso = toDateStr(viewYear, viewMonth, d);
      const weekday = new Date(viewYear, viewMonth, d).getDay();
      const disabled = DISABLED_WEEKDAYS_SPA.has(weekday) || SPA_DISABLED.has(iso);
      result.push({ day: d, iso, disabled, weekday });
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
      raw: { widget_id: "spa_datetime", date: selectedDate, hour, minute, ampm, hour24: h24, iso },
    });
  }, [selectedDate, hour, minute, ampm, props]);

  return (
    <div data-widget-id="spa_datetime" className="p-5" style={{ background: SURFACE, borderRadius: 0 }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: TEXT }}>Spa Appointment</h3>
      <p className="text-xs mb-4" style={{ color: TEXT_DIM }}>Choose your preferred spa date and time. Only business days (Mon–Fri) are available.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-2 py-1 text-sm font-bold" style={{ color: BRAND }} aria-label="Previous month">←</button>
        <span className="text-sm font-semibold" style={{ color: TEXT }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="px-2 py-1 text-sm font-bold" style={{ color: BRAND }} aria-label="Next month">→</button>
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
              className={`h-8 text-xs font-medium transition-colors ${c.disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
              style={{
                background: selectedDate === c.iso ? BRAND : "transparent",
                color: selectedDate === c.iso ? "#fff" : c.disabled ? MUTED : TEXT,
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
          className="text-xs px-2 py-1" style={{ background: ACCENT, color: TEXT, border: `1px solid ${MUTED}`, borderRadius: 0 }}>
          {hours.map(h => <option key={h} value={h}>{pad(h)}</option>)}
        </select>
        <span style={{ color: TEXT_DIM }}>:</span>
        <select value={minute} onChange={e => setMinute(Number(e.target.value))}
          className="text-xs px-2 py-1" style={{ background: ACCENT, color: TEXT, border: `1px solid ${MUTED}`, borderRadius: 0 }}>
          {minutes.map(m => <option key={m} value={m}>{pad(m)}</option>)}
        </select>
        <div className="flex" style={{ border: `1px solid ${MUTED}` }}>
          <button onClick={() => setAmpm("AM")}
            className="px-2 py-1 text-xs font-semibold"
            style={{ background: ampm === "AM" ? BRAND : "transparent", color: ampm === "AM" ? "#fff" : TEXT_DIM, borderRadius: 0 }}>AM</button>
          <button onClick={() => setAmpm("PM")}
            className="px-2 py-1 text-xs font-semibold"
            style={{ background: ampm === "PM" ? BRAND : "transparent", color: ampm === "PM" ? "#fff" : TEXT_DIM, borderRadius: 0 }}>PM</button>
        </div>
      </div>

      {selectedDate && (
        <p className="text-xs mb-3 font-medium" style={{ color: BRAND }}>
          Selected: {selectedDate} at {pad(hour)}:{pad(minute)} {ampm}
        </p>
      )}

      <button onClick={handleSubmit} disabled={!selectedDate}
        className="w-full py-2 text-xs font-semibold transition-opacity disabled:opacity-40"
        style={{ background: BRAND, color: "#fff", borderRadius: 0 }}>
        Confirm Spa Appointment
      </button>
    </div>
  );
}

/* ─── Widget 2: Checkout Date (single_date, future_only) ─── */

function CheckoutDatePicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(5); // June (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const minDate = new Date(2025, 5, 1); // 2025-06-01

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

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    props.onSubmit({
      type: "date",
      value: selectedDate,
      raw: { widget_id: "checkout_date", date: selectedDate },
    });
  }, [selectedDate, props]);

  return (
    <div data-widget-id="checkout_date" className="p-5" style={{ background: SURFACE, borderRadius: 0 }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: TEXT }}>Checkout Date</h3>
      <p className="text-xs mb-4" style={{ color: TEXT_DIM }}>Select your checkout date. Only future dates from June 1, 2025 onward are available.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-2 py-1 text-sm font-bold" style={{ color: BRAND }} aria-label="Previous month">←</button>
        <span className="text-sm font-semibold" style={{ color: TEXT }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="px-2 py-1 text-sm font-bold" style={{ color: BRAND }} aria-label="Next month">→</button>
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
              className={`h-8 text-xs font-medium transition-colors ${c.disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
              style={{
                background: selectedDate === c.iso ? BRAND : "transparent",
                color: selectedDate === c.iso ? "#fff" : c.disabled ? MUTED : TEXT,
                borderRadius: 0,
              }}
            >
              {c.day}
            </button>
          )
        )}
      </div>

      {selectedDate && (
        <p className="text-xs mb-3 font-medium" style={{ color: BRAND }}>
          Selected: {selectedDate}
        </p>
      )}

      <button onClick={handleSubmit} disabled={!selectedDate}
        className="w-full py-2 text-xs font-semibold transition-opacity disabled:opacity-40"
        style={{ background: BRAND, color: "#fff", borderRadius: 0 }}>
        Confirm Checkout Date
      </button>
    </div>
  );
}

/* ─── Widget 3: Compound (datetime+single_date → date calendar) ─── */

function CompoundPicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(5); // June (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const cells = useMemo(() => {
    const first = startDay(viewYear, viewMonth);
    const total = daysInMonth(viewYear, viewMonth);
    const result: Array<{ day: number; iso: string; disabled: boolean } | null> = [];
    for (let i = 0; i < first; i++) result.push(null);
    for (let d = 1; d <= total; d++) {
      const iso = toDateStr(viewYear, viewMonth, d);
      const weekday = new Date(viewYear, viewMonth, d).getDay();
      const disabled = DISABLED_WEEKDAYS_COMPOUND.has(weekday) || COMPOUND_DISABLED.has(iso) || !isFuture(viewYear, viewMonth, d);
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
    <div data-widget-id="compound" className="p-5" style={{ background: SURFACE, borderRadius: 0 }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: TEXT }}>Spa Appointment + Checkout Date</h3>
      <p className="text-xs mb-4" style={{ color: TEXT_DIM }}>Select a date for your combined spa appointment and checkout. Weekdays only, future dates only.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-2 py-1 text-sm font-bold" style={{ color: BRAND }} aria-label="Previous month">←</button>
        <span className="text-sm font-semibold" style={{ color: TEXT }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="px-2 py-1 text-sm font-bold" style={{ color: BRAND }} aria-label="Next month">→</button>
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
              className={`h-8 text-xs font-medium transition-colors ${c.disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
              style={{
                background: selectedDate === c.iso ? BRAND : "transparent",
                color: selectedDate === c.iso ? "#fff" : c.disabled ? MUTED : TEXT,
                borderRadius: 0,
              }}
            >
              {c.day}
            </button>
          )
        )}
      </div>

      {selectedDate && (
        <p className="text-xs mb-3 font-medium" style={{ color: BRAND }}>
          Selected: {selectedDate}
        </p>
      )}

      <button onClick={handleSubmit} disabled={!selectedDate}
        className="w-full py-2 text-xs font-semibold transition-opacity disabled:opacity-40"
        style={{ background: BRAND, color: "#fff", borderRadius: 0 }}>
        Confirm Date
      </button>
    </div>
  );
}

/* ─── Main Page ─── */

export default function Page_resort_spa(props: GeneratedPageProps) {
  const [guests, setGuests] = useState(2);
  const [roomType, setRoomType] = useState("Deluxe Suite");
  const [amenities, setAmenities] = useState<Record<string, boolean>>({
    wifi: true,
    breakfast: false,
    parking: false,
    spa: true,
  });
  const [activeFilter, setActiveFilter] = useState("All");

  const toggleAmenity = (key: string) => {
    setAmenities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const properties = [
    { name: "Ocean View Suite", price: "$289", rating: 4.9, reviews: 128, img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop", alt: "hotel room" },
    { name: "Mountain Cabin Retreat", price: "$195", rating: 4.7, reviews: 86, img: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=400&h=300&fit=crop", alt: "cabin" },
    { name: "Luxury Beachfront Villa", price: "$450", rating: 4.95, reviews: 214, img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop", alt: "villa" },
  ];

  const filters = ["All", "Spa & Wellness", "Beachfront", "Mountain", "Luxury"];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG, color: TEXT, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <header style={{ background: SURFACE }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏨</span>
            <span className="text-base font-semibold tracking-tight" style={{ color: TEXT }}>EchoStay</span>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-xs" style={{ color: TEXT_DIM }}>
            <span className="cursor-pointer hover:opacity-70">Rooms</span>
            <span className="cursor-pointer hover:opacity-70">Deals</span>
            <span className="cursor-pointer hover:opacity-70">Reviews</span>
            <span className="cursor-pointer hover:opacity-70">Host</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center px-3 py-1 text-xs" style={{ background: ACCENT, border: `1px solid ${MUTED}`, borderRadius: 0 }}>
              <span style={{ color: TEXT_DIM }}>Location / Dates / Guests</span>
            </div>
            <div className="w-8 h-8 flex items-center justify-center text-xs font-semibold" style={{ background: BRAND, color: "#fff", borderRadius: 0 }}>JD</div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 280 }}>
        <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=400&fit=crop" alt="resort pool" className="w-full h-72 object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(34,34,34,0.25), rgba(34,34,34,0.75))" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center" style={{ color: "#fff" }}>Where to Stay?</h1>
          <p className="text-sm mb-4 text-center" style={{ color: "#ddd" }}>Find the perfect resort, spa, and getaway for your next trip</p>
          <div className="w-full max-w-xl px-4 py-2 flex items-center gap-2" style={{ background: SURFACE }}>
            <span className="text-sm" style={{ color: TEXT_DIM }}>🔍</span>
            <span className="text-sm" style={{ color: TEXT_DIM }}>Search destinations, resorts, activities…</span>
          </div>
        </div>
      </div>

      {/* Form context bar */}
      <div style={{ background: SURFACE_ALT }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 px-2 py-1" style={{ background: ACCENT, border: `1px solid ${MUTED}`, borderRadius: 0 }}>
            <button onClick={() => setGuests(Math.max(1, guests - 1))} className="px-1 text-xs font-bold" style={{ color: TEXT_DIM }}>−</button>
            <span className="text-xs px-2" style={{ color: TEXT }}>{guests} Guest{guests !== 1 ? "s" : ""}</span>
            <button onClick={() => setGuests(guests + 1)} className="px-1 text-xs font-bold" style={{ color: TEXT_DIM }}>+</button>
          </div>
          <select value={roomType} onChange={e => setRoomType(e.target.value)}
            className="text-xs px-2 py-1" style={{ background: ACCENT, color: TEXT, border: `1px solid ${MUTED}`, borderRadius: 0 }}>
            <option>Standard Room</option>
            <option>Deluxe Suite</option>
            <option>Penthouse</option>
            <option>Villa</option>
          </select>
          <div className="flex items-center gap-3 text-xs" style={{ color: TEXT_DIM }}>
            {Object.entries(amenities).map(([key, val]) => (
              <label key={key} className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={val} onChange={() => toggleAmenity(key)} style={{ accentColor: BRAND }} />
                <span className="capitalize">{key}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1">
        {/* Context */}
        <div className="mb-6 p-4" style={{ background: ACCENT }}>
          <h2 className="text-base font-semibold mb-1" style={{ color: TEXT }}>Resort Spa — Date Selection</h2>
          <p className="text-xs leading-relaxed" style={{ color: TEXT_DIM }}>
            Complete the date selections below to plan your resort stay. Schedule your spa appointment, choose your checkout date, and confirm the combined booking.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          {filters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className="px-3 py-1 text-xs font-medium"
              style={{ background: activeFilter === f ? BRAND : ACCENT, color: activeFilter === f ? "#fff" : TEXT_DIM, borderRadius: 0 }}>
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column: widgets */}
          <div className="flex-1 space-y-5">
            <SpaDateTimePicker onSubmit={props.onSubmit} />
            <CheckoutDatePicker onSubmit={props.onSubmit} />
            <CompoundPicker onSubmit={props.onSubmit} />
          </div>

          {/* Right sidebar */}
          <div className="w-full lg:w-72 space-y-5">
            {/* Property cards */}
            <div className="p-4" style={{ background: ACCENT }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: TEXT }}>Featured Properties</h4>
              <div className="space-y-4">
                {properties.map(p => (
                  <div key={p.name}>
                    <img src={p.img} alt={p.alt} className="w-full h-32 object-cover" style={{ borderRadius: 0 }} />
                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: TEXT }}>{p.name}</span>
                        <span className="text-xs font-semibold" style={{ color: BRAND }}>{p.price}<span className="font-normal" style={{ color: TEXT_DIM }}>/night</span></span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs" style={{ color: BRAND }}>★</span>
                        <span className="text-xs" style={{ color: TEXT }}>{p.rating}</span>
                        <span className="text-xs" style={{ color: TEXT_DIM }}>({p.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guest reviews */}
            <div className="p-4" style={{ background: ACCENT }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: TEXT }}>Guest Reviews</h4>
              {[
                { name: "Emma R.", text: "Absolutely loved the spa treatments. The staff was incredibly attentive.", rating: 5 },
                { name: "David K.", text: "Beautiful property with stunning views. Will definitely return.", rating: 4 },
              ].map(r => (
                <div key={r.name} className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 flex items-center justify-center text-xs font-bold" style={{ background: MUTED, color: TEXT, borderRadius: 0 }}>{r.name[0]}</div>
                    <span className="text-xs font-medium" style={{ color: TEXT }}>{r.name}</span>
                    <span className="text-xs" style={{ color: BRAND }}>{"★".repeat(r.rating)}</span>
                  </div>
                  <p className="text-xs" style={{ color: TEXT_DIM }}>{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: SURFACE, borderTop: `1px solid ${MUTED}` }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs" style={{ color: TEXT_DIM }}>
            <div>
              <h5 className="font-semibold mb-2" style={{ color: TEXT }}>Hosting</h5>
              <ul className="space-y-1"><li>List Your Property</li><li>Host Resources</li><li>Community Forum</li></ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2" style={{ color: TEXT }}>Trust &amp; Safety</h5>
              <ul className="space-y-1"><li>Guest Policies</li><li>Safety Standards</li><li>Insurance</li></ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2" style={{ color: TEXT }}>Community</h5>
              <ul className="space-y-1"><li>Travel Stories</li><li>Partnerships</li><li>Referral Program</li></ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2" style={{ color: TEXT }}>Terms</h5>
              <ul className="space-y-1"><li>Terms of Service</li><li>Privacy Policy</li><li>Cookie Policy</li></ul>
            </div>
          </div>
          <p className="text-xs mt-4 text-center" style={{ color: TEXT_DIM }}>© 2025 EchoStay Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
