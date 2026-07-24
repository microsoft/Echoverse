import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfWeek(y: number, m: number) { return new Date(y, m, 1).getDay(); }

const BG = "#5a90a8";
const SURFACE = "#ffffff";
const SURFACE_ALT = "#f7fafb";
const CARD_BG = "#fffeff";
const ACCENT = "#cde7f6";
const TEXT = "#1e3a4f";
const TEXT_MUTED = "#5d7a8c";
const BRAND = "#FF385C";
const BORDER = "#cde7f6";
const WHITE = "#ffffff";

/* ─── Widget 1: Camping Dates (range picker) ─── */
function CampingDatesPicker({ onSubmit }: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [month, setMonth] = useState(7); // August = index 7
  const [year, setYear] = useState(2025);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);
  const cells = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    while (c.length % 7 !== 0) c.push(null);
    return c;
  }, [daysInMonth, firstDay]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleDayClick = useCallback((day: number) => {
    const iso = toISO(year, month, day);
    if (!rangeStart || rangeEnd) {
      setRangeStart(iso);
      setRangeEnd(null);
    } else {
      if (iso < rangeStart) {
        setRangeEnd(rangeStart);
        setRangeStart(iso);
      } else if (iso === rangeStart) {
        setRangeStart(null);
      } else {
        setRangeEnd(iso);
      }
    }
  }, [year, month, rangeStart, rangeEnd]);

  const isInRange = useCallback((day: number) => {
    const iso = toISO(year, month, day);
    const end = rangeEnd || hoverDate;
    if (!rangeStart || !end) return false;
    const lo = rangeStart < end ? rangeStart : end;
    const hi = rangeStart < end ? end : rangeStart;
    return iso > lo && iso < hi;
  }, [year, month, rangeStart, rangeEnd, hoverDate]);

  const isRangeEdge = useCallback((day: number) => {
    const iso = toISO(year, month, day);
    return iso === rangeStart || iso === rangeEnd;
  }, [year, month, rangeStart, rangeEnd]);

  const handleSubmit = useCallback(() => {
    if (!rangeStart || !rangeEnd) return;
    onSubmit({
      type: "date_range",
      value: `${rangeStart}/${rangeEnd}`,
      raw: { widget_id: "camping_dates", start_date: rangeStart, end_date: rangeEnd },
    });
  }, [rangeStart, rangeEnd, onSubmit]);

  const startDisplay = rangeStart
    ? (() => { const [y, m, d] = rangeStart.split("-").map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; })()
    : "—";
  const endDisplay = rangeEnd
    ? (() => { const [y, m, d] = rangeEnd.split("-").map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; })()
    : "—";

  return (
    <div data-widget-id="camping_dates" className="rounded-xl p-6" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: TEXT }}>🏕️ Camping Dates</h3>
      <p className="text-xs mb-4" style={{ color: TEXT_MUTED }}>
        Select your check-in and check-out dates. Click start date, then end date.
      </p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: ACCENT, color: TEXT }}>‹</button>
        <span className="text-sm font-medium" style={{ color: TEXT }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: ACCENT, color: TEXT }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map(d => <div key={d} className="text-center text-xs py-1 font-medium" style={{ color: TEXT_MUTED }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const edge = isRangeEdge(day);
          const inRange = isInRange(day);
          return (
            <button
              key={i}
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => { if (rangeStart && !rangeEnd) setHoverDate(toISO(year, month, day)); }}
              onMouseLeave={() => setHoverDate(null)}
              className="h-9 text-sm rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: edge ? BRAND : inRange ? ACCENT : "transparent",
                color: edge ? WHITE : TEXT,
                fontWeight: edge ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 mt-3 text-xs" style={{ color: TEXT_MUTED }}>
        <span>Check-in: <strong style={{ color: TEXT }}>{startDisplay}</strong></span>
        <span>Check-out: <strong style={{ color: TEXT }}>{endDisplay}</strong></span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!rangeStart || !rangeEnd}
        className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-opacity"
        style={{ background: rangeStart && rangeEnd ? BRAND : ACCENT, color: rangeStart && rangeEnd ? WHITE : TEXT_MUTED, opacity: rangeStart && rangeEnd ? 1 : 0.6 }}
      >
        Confirm Camping Dates
      </button>
    </div>
  );
}

/* ─── Widget 2: Reservation Deadline (constrained, future only) ─── */
function ReservationDeadlinePicker({ onSubmit }: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [month, setMonth] = useState(5); // June = index 5
  const [year, setYear] = useState(2025);
  const [selected, setSelected] = useState<string | null>(null);

  const minDate = "2025-06-01";

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
    const iso = toISO(year, month, day);
    return iso < minDate;
  }, [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    const [sy, sm, sd] = selected.split("-").map(Number);
    onSubmit({
      type: "date",
      value: selected,
      raw: { widget_id: "reservation_deadline", year: sy, month: sm, day: sd, selectedDate: selected },
    });
  }, [selected, onSubmit]);

  const selectedDisplay = selected
    ? (() => { const [y, m, d] = selected.split("-").map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; })()
    : "Select a date";

  return (
    <div data-widget-id="reservation_deadline" className="rounded-xl p-6" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: TEXT }}>📋 Reservation Deadline</h3>
      <p className="text-xs mb-4" style={{ color: TEXT_MUTED }}>
        Select your reservation deadline. Only dates from June 1, 2025 onward are available.
      </p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: ACCENT, color: TEXT }}>‹</button>
        <span className="text-sm font-medium" style={{ color: TEXT }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: ACCENT, color: TEXT }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map(d => <div key={d} className="text-center text-xs py-1 font-medium" style={{ color: TEXT_MUTED }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const disabled = isDisabled(day);
          const isSel = selected === toISO(year, month, day);
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => !disabled && setSelected(toISO(year, month, day))}
              className="h-9 text-sm rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: isSel ? BRAND : "transparent",
                color: disabled ? "#b8cdd6" : isSel ? WHITE : TEXT,
                cursor: disabled ? "not-allowed" : "pointer",
                fontWeight: isSel ? 600 : 400,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <p className="text-xs mt-3" style={{ color: TEXT_MUTED }}>
        Selected: <strong style={{ color: TEXT }}>{selectedDisplay}</strong>
      </p>

      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-opacity"
        style={{ background: selected ? BRAND : ACCENT, color: selected ? WHITE : TEXT_MUTED, opacity: selected ? 1 : 0.6 }}
      >
        Confirm Deadline
      </button>
    </div>
  );
}

/* ─── Widget 3: Compound (standard date calendar) ─── */
function CompoundPicker({ onSubmit }: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [month, setMonth] = useState(5); // June = index 5
  const [year, setYear] = useState(2025);
  const [selected, setSelected] = useState<string | null>(null);

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfWeek(year, month), [year, month]);
  const cells = useMemo(() => {
    const c: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) c.push(null);
    for (let d = 1; d <= daysInMonth; d++) c.push(d);
    while (c.length % 7 !== 0) c.push(null);
    return c;
  }, [daysInMonth, firstDay]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    const [sy, sm, sd] = selected.split("-").map(Number);
    onSubmit({
      type: "date",
      value: selected,
      raw: { widget_id: "compound", year: sy, month: sm, day: sd, selectedDate: selected },
    });
  }, [selected, onSubmit]);

  const selectedDisplay = selected
    ? (() => { const [y, m, d] = selected.split("-").map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; })()
    : "Select a date";

  return (
    <div data-widget-id="compound" className="rounded-xl p-6" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: TEXT }}>🗓️ Camping Dates + Reservation Deadline</h3>
      <p className="text-xs mb-4" style={{ color: TEXT_MUTED }}>
        Pick a date from the calendar below.
      </p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: ACCENT, color: TEXT }}>‹</button>
        <span className="text-sm font-medium" style={{ color: TEXT }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: ACCENT, color: TEXT }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map(d => <div key={d} className="text-center text-xs py-1 font-medium" style={{ color: TEXT_MUTED }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const isSel = selected === toISO(year, month, day);
          return (
            <button
              key={i}
              onClick={() => setSelected(toISO(year, month, day))}
              className="h-9 text-sm rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: isSel ? BRAND : "transparent",
                color: isSel ? WHITE : TEXT,
                cursor: "pointer",
                fontWeight: isSel ? 600 : 400,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <p className="text-xs mt-3" style={{ color: TEXT_MUTED }}>
        Selected: <strong style={{ color: TEXT }}>{selectedDisplay}</strong>
      </p>

      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-opacity"
        style={{ background: selected ? BRAND : ACCENT, color: selected ? WHITE : TEXT_MUTED, opacity: selected ? 1 : 0.6 }}
      >
        Confirm Date
      </button>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_campsite_checkin(props: GeneratedPageProps) {
  const [guestCount, setGuestCount] = useState(2);
  const [siteType, setSiteType] = useState("tent");
  const [amenities, setAmenities] = useState<Record<string, boolean>>({ firewood: true, electricity: false, showers: false, picnic_table: true });
  const [activeFilter, setActiveFilter] = useState("All");

  const toggleAmenity = useCallback((key: string) => {
    setAmenities(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const filters = ["All", "Lakeside", "Forest", "Mountain", "Pet-friendly"];

  const properties = useMemo(() => [
    { name: "Pine Ridge Campsite", location: "Yosemite, CA", rating: 4.9, price: 45, img: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop" },
    { name: "Lakewood Cabin", location: "Lake Tahoe, CA", rating: 4.7, price: 129, img: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=400&h=300&fit=crop" },
    { name: "Mountain View Lodge", location: "Aspen, CO", rating: 4.8, price: 189, img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop" },
  ], []);

  return (
    <div className="min-h-screen font-sans" style={{ background: BG }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏨</span>
            <span className="text-lg font-semibold" style={{ color: TEXT }}>
              Stay<span style={{ color: BRAND }}>Finder</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: TEXT_MUTED }}>
            {["Rooms", "Deals", "Reviews", "Host"].map(item => (
              <a key={item} href="#" className="hover:opacity-80 transition-opacity">{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div
              className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs"
              style={{ background: SURFACE_ALT, color: TEXT_MUTED, border: `1px solid ${BORDER}` }}
            >
              <span>📍 Anywhere</span>
              <span style={{ color: BORDER }}>|</span>
              <span>Any week</span>
              <span style={{ color: BORDER }}>|</span>
              <span>Guests</span>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: ACCENT, color: TEXT }}
            >
              JD
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=400&fit=crop"
          alt="Hotel pool resort"
          className="w-full h-64 object-cover"
        />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "linear-gradient(to bottom, rgba(90,144,168,0.2), rgba(90,144,168,0.85))" }}
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: WHITE }}>Where to stay?</h1>
            <p className="text-sm" style={{ color: SURFACE_ALT }}>Find the perfect campsite for your next outdoor adventure</p>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Context */}
        <div className="rounded-xl p-5 mb-6" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
          <p className="text-sm" style={{ color: TEXT }}>
            Welcome to <strong>Campsite Checkin</strong> — your all-in-one portal for booking outdoor stays.
            Select your camping dates, set a reservation deadline, and confirm your combined trip details below.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-medium" style={{ color: SURFACE_ALT }}>Filters:</span>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
              style={{
                background: activeFilter === f ? SURFACE : "rgba(255,255,255,0.15)",
                color: activeFilter === f ? TEXT : WHITE,
                border: `1px solid ${activeFilter === f ? BORDER : "rgba(255,255,255,0.25)"}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Guest / Site controls */}
        <div className="rounded-xl p-5 mb-6 grid sm:grid-cols-3 gap-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: TEXT_MUTED }}>Guests</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                className="w-8 h-8 rounded-lg text-sm flex items-center justify-center font-bold"
                style={{ background: ACCENT, color: TEXT }}
              >
                −
              </button>
              <span className="text-sm font-medium w-6 text-center" style={{ color: TEXT }}>{guestCount}</span>
              <button
                onClick={() => setGuestCount(Math.min(12, guestCount + 1))}
                className="w-8 h-8 rounded-lg text-sm flex items-center justify-center font-bold"
                style={{ background: ACCENT, color: TEXT }}
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: TEXT_MUTED }}>Site Type</label>
            <select
              value={siteType}
              onChange={e => setSiteType(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: SURFACE_ALT, color: TEXT, border: `1px solid ${BORDER}` }}
            >
              <option value="tent">Tent Site</option>
              <option value="rv">RV Hookup</option>
              <option value="cabin">Cabin</option>
              <option value="glamping">Glamping</option>
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: TEXT_MUTED }}>Amenities</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(amenities).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => toggleAmenity(key)}
                  className="px-2.5 py-1 rounded-xl text-xs capitalize transition-colors"
                  style={{
                    background: val ? BRAND : SURFACE_ALT,
                    color: val ? WHITE : TEXT_MUTED,
                    border: `1px solid ${val ? BRAND : BORDER}`,
                  }}
                >
                  {key.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date Widgets */}
        <div className="space-y-6 mb-8">
          <CampingDatesPicker onSubmit={props.onSubmit} />
          <div className="grid md:grid-cols-2 gap-6">
            <ReservationDeadlinePicker onSubmit={props.onSubmit} />
            <CompoundPicker onSubmit={props.onSubmit} />
          </div>
        </div>

        {/* Property Cards */}
        <h3 className="text-lg font-semibold mb-4" style={{ color: WHITE }}>Featured Campsites</h3>
        <div className="grid sm:grid-cols-3 gap-5 mb-8">
          {properties.map((p, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <img src={p.img} alt={p.name} className="w-full h-48 object-cover rounded-lg" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold" style={{ color: TEXT }}>{p.name}</span>
                  <span className="text-xs font-medium" style={{ color: BRAND }}>★ {p.rating}</span>
                </div>
                <p className="text-xs" style={{ color: TEXT_MUTED }}>{p.location}</p>
                <p className="text-sm font-semibold mt-2" style={{ color: TEXT }}>
                  ${p.price}<span className="text-xs font-normal" style={{ color: TEXT_MUTED }}> / night</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 px-6" style={{ background: "rgba(0,0,0,0.15)" }}>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-4 gap-6 text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
          <div>
            <h4 className="font-semibold mb-2" style={{ color: WHITE }}>Hosting</h4>
            <ul className="space-y-1"><li>List your property</li><li>Host resources</li><li>Community forum</li></ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2" style={{ color: WHITE }}>Trust & Safety</h4>
            <ul className="space-y-1"><li>Guest verification</li><li>Insurance info</li><li>Safety guidelines</li></ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2" style={{ color: WHITE }}>Community</h4>
            <ul className="space-y-1"><li>Blog</li><li>Events</li><li>Referrals</li></ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2" style={{ color: WHITE }}>Legal</h4>
            <ul className="space-y-1"><li>Terms of Service</li><li>Privacy Policy</li><li>Cookie Preferences</li></ul>
          </div>
        </div>
        <p className="text-center text-xs mt-8" style={{ color: "rgba(255,255,255,0.35)" }}>© 2025 EchoStay, Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
