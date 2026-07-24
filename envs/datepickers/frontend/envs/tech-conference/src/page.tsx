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

function buildCells(year: number, month: number) {
  const dim = getDaysInMonth(year, month);
  const fdow = getFirstDayOfWeek(year, month);
  const c: (number | null)[] = [];
  for (let i = 0; i < fdow; i++) c.push(null);
  for (let d = 1; d <= dim; d++) c.push(d);
  while (c.length % 7 !== 0) c.push(null);
  return c;
}

const PRIMARY = "#6366F1";
const BG = "#d5d6d6";
const SURFACE = "#fdfdfd";
const SURFACE_ALT = "#fbfbfb";
const CARD = "#f8f8f8";
const CARD_MUTED = "#f4f4f4";
const TEXT = "#1f2937";
const TEXT_MUTED = "#6b7280";
const ACCENT = "#F97316";

const TODAY_ISO = new Date(2025, 0, 1).toISOString().slice(0, 10);

/* ─── Widget 1: Conference Dates (range, future_only, min 2026-02-01) ─── */
function ConferenceDatesPicker({ onSubmit }: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [month, setMonth] = useState(1); // Feb = 1
  const [year, setYear] = useState(2026);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const minDate = "2026-02-01";

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const isDisabled = useCallback((day: number) => {
    const iso = toISO(year, month, day);
    return iso < minDate || iso <= TODAY_ISO;
  }, [year, month]);

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

  const isEdge = useCallback((day: number) => {
    const iso = toISO(year, month, day);
    return iso === rangeStart || iso === rangeEnd;
  }, [year, month, rangeStart, rangeEnd]);

  const handleSubmit = useCallback(() => {
    if (!rangeStart || !rangeEnd) return;
    onSubmit({
      type: "date_range",
      value: `${rangeStart}/${rangeEnd}`,
      raw: { widget_id: "conference_dates", start_date: rangeStart, end_date: rangeEnd },
    });
  }, [rangeStart, rangeEnd, onSubmit]);

  const fmt = (iso: string | null) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-").map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
  };

  return (
    <div data-widget-id="conference_dates" className="p-6" style={{ background: SURFACE, border: `1px solid ${CARD_MUTED}` }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: TEXT }}>📅 Conference Dates</h3>
      <p className="text-xs mb-4" style={{ color: TEXT_MUTED }}>
        Select the start and end dates for the conference. Click start date, then end date. Past dates are unavailable.
      </p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-sm font-bold" style={{ background: CARD_MUTED, color: TEXT }}>‹</button>
        <span className="text-sm font-medium" style={{ color: TEXT }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-sm font-bold" style={{ background: CARD_MUTED, color: TEXT }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map(d => <div key={d} className="text-center text-xs py-1 font-medium" style={{ color: TEXT_MUTED }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const disabled = isDisabled(day);
          const edge = isEdge(day);
          const inRange = isInRange(day);
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => !disabled && handleDayClick(day)}
              onMouseEnter={() => !disabled && setHoverDate(toISO(year, month, day))}
              onMouseLeave={() => setHoverDate(null)}
              className="h-8 text-sm flex items-center justify-center transition-colors"
              style={{
                background: edge ? PRIMARY : inRange ? "#c7d2fe" : "transparent",
                color: disabled ? "#c5c6c6" : edge ? "#fff" : TEXT,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 mt-3 text-xs" style={{ color: TEXT_MUTED }}>
        <span>Start: <strong style={{ color: TEXT }}>{fmt(rangeStart)}</strong></span>
        <span>End: <strong style={{ color: TEXT }}>{fmt(rangeEnd)}</strong></span>
      </div>
      <button
        onClick={handleSubmit}
        disabled={!rangeStart || !rangeEnd}
        className="mt-3 w-full py-2 text-sm font-medium transition-opacity"
        style={{
          background: rangeStart && rangeEnd ? PRIMARY : CARD_MUTED,
          color: rangeStart && rangeEnd ? "#fff" : TEXT_MUTED,
          opacity: rangeStart && rangeEnd ? 1 : 0.6,
        }}
      >
        Confirm Conference Dates
      </button>
    </div>
  );
}

/* ─── Widget 2: Registration Deadline (single_date, min_max_bounds) ─── */
function RegistrationDeadlinePicker({ onSubmit }: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [month, setMonth] = useState(7); // Aug = 7
  const [year, setYear] = useState(2025);
  const [selected, setSelected] = useState<string | null>(null);

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const minDate = "2025-05-26";
  const maxDate = "2025-10-10";

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const isDisabled = useCallback((day: number) => {
    const iso = toISO(year, month, day);
    return iso < minDate || iso > maxDate;
  }, [year, month]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    const [y, m, d] = selected.split("-").map(Number);
    onSubmit({
      type: "date",
      value: selected,
      raw: { widget_id: "registration_deadline", year: y, month: m, day: d },
    });
  }, [selected, onSubmit]);

  const fmt = (iso: string | null) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-").map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
  };

  return (
    <div data-widget-id="registration_deadline" className="p-6" style={{ background: SURFACE, border: `1px solid ${CARD_MUTED}` }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: TEXT }}>⏰ Registration Deadline</h3>
      <p className="text-xs mb-4" style={{ color: TEXT_MUTED }}>
        Choose a registration deadline between May 26, 2025 and October 10, 2025.
      </p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-sm font-bold" style={{ background: CARD_MUTED, color: TEXT }}>‹</button>
        <span className="text-sm font-medium" style={{ color: TEXT }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-sm font-bold" style={{ background: CARD_MUTED, color: TEXT }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map(d => <div key={d} className="text-center text-xs py-1 font-medium" style={{ color: TEXT_MUTED }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const iso = toISO(year, month, day);
          const disabled = isDisabled(day);
          const isSel = selected === iso;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => !disabled && setSelected(iso)}
              className="h-8 text-sm flex items-center justify-center transition-colors"
              style={{
                background: isSel ? PRIMARY : "transparent",
                color: disabled ? "#c5c6c6" : isSel ? "#fff" : TEXT,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <p className="text-xs mt-3" style={{ color: TEXT_MUTED }}>
        Selected: <strong style={{ color: TEXT }}>{fmt(selected)}</strong>
      </p>
      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="mt-3 w-full py-2 text-sm font-medium transition-opacity"
        style={{
          background: selected ? PRIMARY : CARD_MUTED,
          color: selected ? "#fff" : TEXT_MUTED,
          opacity: selected ? 1 : 0.6,
        }}
      >
        Confirm Registration Deadline
      </button>
    </div>
  );
}

/* ─── Widget 3: Compound (range + single, future_only + min_max_bounds) ─── */
function CompoundPicker({ onSubmit }: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [month, setMonth] = useState(5); // June = 5
  const [year, setYear] = useState(2025);
  const [selected, setSelected] = useState<string | null>(null);

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const minDate = "2025-06-01";

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const isDisabled = useCallback((day: number) => {
    const iso = toISO(year, month, day);
    return iso < minDate || iso <= TODAY_ISO;
  }, [year, month]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    const [y, m, d] = selected.split("-").map(Number);
    onSubmit({
      type: "date",
      value: selected,
      raw: { widget_id: "compound", year: y, month: m, day: d },
    });
  }, [selected, onSubmit]);

  const fmt = (iso: string | null) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-").map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
  };

  return (
    <div data-widget-id="compound" className="p-6" style={{ background: SURFACE, border: `1px solid ${CARD_MUTED}` }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: TEXT }}>🗓️ Conference Dates + Registration Deadline</h3>
      <p className="text-xs mb-4" style={{ color: TEXT_MUTED }}>
        Select a date from the calendar. Only future dates from June 1, 2025 onward are available.
      </p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-sm font-bold" style={{ background: CARD_MUTED, color: TEXT }}>‹</button>
        <span className="text-sm font-medium" style={{ color: TEXT }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-sm font-bold" style={{ background: CARD_MUTED, color: TEXT }}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map(d => <div key={d} className="text-center text-xs py-1 font-medium" style={{ color: TEXT_MUTED }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const iso = toISO(year, month, day);
          const disabled = isDisabled(day);
          const isSel = selected === iso;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => !disabled && setSelected(iso)}
              className="h-8 text-sm flex items-center justify-center transition-colors"
              style={{
                background: isSel ? PRIMARY : "transparent",
                color: disabled ? "#c5c6c6" : isSel ? "#fff" : TEXT,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <p className="text-xs mt-3" style={{ color: TEXT_MUTED }}>
        Selected: <strong style={{ color: TEXT }}>{fmt(selected)}</strong>
      </p>
      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="mt-3 w-full py-2 text-sm font-medium transition-opacity"
        style={{
          background: selected ? PRIMARY : CARD_MUTED,
          color: selected ? "#fff" : TEXT_MUTED,
          opacity: selected ? 1 : 0.6,
        }}
      >
        Confirm Date
      </button>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_tech_conference(props: GeneratedPageProps) {
  const [activeFilter, setActiveFilter] = useState("All Events");
  const filters = ["All Events", "Conferences", "Workshops", "Meetups", "Hackathons"];

  return (
    <div className="min-h-screen font-sans" style={{ background: BG }}>
      {/* Header */}
      <header className="w-full" style={{ background: PRIMARY }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold text-white">🎫 EchoEvents</span>
            <nav className="hidden md:flex gap-5 text-sm text-white/80">
              <a href="#" className="hover:text-white">Browse</a>
              <a href="#" className="hover:text-white">Tickets</a>
              <a href="#" className="hover:text-white">Calendar</a>
              <a href="#" className="hover:text-white">Saved</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search events..."
              className="hidden sm:block px-3 py-1.5 text-sm outline-none w-48"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}
            />
            <select className="hidden sm:block px-2 py-1.5 text-sm outline-none" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
              <option>San Francisco</option>
              <option>New York</option>
              <option>Austin</option>
            </select>
            <button className="px-3 py-1.5 text-sm font-medium" style={{ background: ACCENT, color: "#fff" }}>+ Create Event</button>
            <div className="w-8 h-8 flex items-center justify-center text-white text-sm font-bold" style={{ background: "rgba(255,255,255,0.2)" }}>JD</div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full overflow-hidden" style={{ height: 280 }}>
        <img
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop"
          alt="Tech conference crowd"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(99,102,241,0.85), rgba(99,102,241,0.4))" }} />
        <div className="absolute inset-0 flex flex-col justify-center px-6 max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Tech Conference 2026</h1>
          <p className="text-white/80 text-sm mb-4 max-w-lg">
            Join industry leaders, innovators, and developers for three days of keynotes, workshops, and networking.
          </p>
          <button className="w-fit px-6 py-2 text-sm font-semibold text-white" style={{ background: ACCENT }}>
            Get Tickets
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-6 mt-6">
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                background: activeFilter === f ? PRIMARY : SURFACE,
                color: activeFilter === f ? "#fff" : TEXT,
                border: `1px solid ${activeFilter === f ? PRIMARY : CARD_MUTED}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Datepickers + Form */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="p-6" style={{ background: SURFACE }}>
              <h2 className="text-xl font-bold mb-1" style={{ color: TEXT }}>Select Your Dates</h2>
              <p className="text-sm mb-0" style={{ color: TEXT_MUTED }}>
                Choose conference dates, registration deadline, and more to plan your experience.
              </p>
            </div>

            {/* Form context: Ticket quantity, seat section, promo */}
            <div className="p-6 flex flex-wrap gap-4 items-end" style={{ background: SURFACE }}>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: TEXT_MUTED }}>Tickets</label>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 flex items-center justify-center text-sm font-bold" style={{ background: CARD_MUTED, color: TEXT }}>−</button>
                  <span className="text-sm font-medium w-6 text-center" style={{ color: TEXT }}>2</span>
                  <button className="w-8 h-8 flex items-center justify-center text-sm font-bold" style={{ background: CARD_MUTED, color: TEXT }}>+</button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: TEXT_MUTED }}>Seat Section</label>
                <select className="px-3 py-1.5 text-sm outline-none" style={{ background: CARD, color: TEXT, border: `1px solid ${CARD_MUTED}` }}>
                  <option>General Admission</option>
                  <option>VIP Front Row</option>
                  <option>Balcony</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: TEXT_MUTED }}>Promo Code</label>
                <input type="text" placeholder="Enter code" className="px-3 py-1.5 text-sm outline-none" style={{ background: CARD, color: TEXT, border: `1px solid ${CARD_MUTED}` }} />
              </div>
            </div>

            <ConferenceDatesPicker onSubmit={props.onSubmit} />
            <RegistrationDeadlinePicker onSubmit={props.onSubmit} />
            <CompoundPicker onSubmit={props.onSubmit} />
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-6">
            {/* Venue info */}
            <div className="p-5" style={{ background: SURFACE }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: TEXT }}>Venue Information</h3>
              <img
                src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop"
                alt="Conference venue"
                className="w-full h-36 object-cover mb-3"
              />
              <p className="text-xs mb-1" style={{ color: TEXT }}>Moscone Center</p>
              <p className="text-xs" style={{ color: TEXT_MUTED }}>747 Howard St, San Francisco, CA 94103</p>
              <div className="mt-3 h-24 flex items-center justify-center text-xs" style={{ background: CARD_MUTED, color: TEXT_MUTED }}>
                📍 Map placeholder
              </div>
            </div>

            {/* Organizer */}
            <div className="p-5" style={{ background: SURFACE }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: TEXT }}>Organizer</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center text-sm font-bold" style={{ background: PRIMARY, color: "#fff" }}>TC</div>
                <div>
                  <p className="text-sm font-medium" style={{ color: TEXT }}>TechConf Inc.</p>
                  <p className="text-xs" style={{ color: TEXT_MUTED }}>127 events hosted</p>
                </div>
              </div>
            </div>

            {/* Similar events */}
            <div className="p-5" style={{ background: SURFACE }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: TEXT }}>Similar Events</h3>
              <div className="flex flex-col gap-3">
                {[
                  { title: "Art & Design Summit", date: "Mar 15, 2026", img: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400&h=300&fit=crop" },
                  { title: "Global Food Expo", date: "Apr 8, 2026", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop" },
                ].map(ev => (
                  <div key={ev.title} className="flex gap-3 items-center">
                    <img src={ev.img} alt={ev.title} className="w-16 h-12 object-cover" />
                    <div>
                      <p className="text-xs font-medium" style={{ color: TEXT }}>{ev.title}</p>
                      <p className="text-xs" style={{ color: TEXT_MUTED }}>{ev.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 py-8 px-6" style={{ background: SURFACE }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs" style={{ color: TEXT_MUTED }}>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: TEXT }}>Policies</h4>
              <p className="mb-1">Terms of Service</p>
              <p className="mb-1">Privacy Policy</p>
              <p>Cookie Settings</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: TEXT }}>Refunds</h4>
              <p className="mb-1">Refund Policy</p>
              <p className="mb-1">Cancel Tickets</p>
              <p>Transfer Tickets</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: TEXT }}>Community</h4>
              <p className="mb-1">Guidelines</p>
              <p className="mb-1">Accessibility</p>
              <p>Help Center</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: TEXT }}>Connect</h4>
              <p className="mb-1">EchoX</p>
              <p className="mb-1">EchoLink</p>
              <p>EchoGram</p>
            </div>
          </div>
          <div className="mt-6 pt-4 text-xs text-center" style={{ color: TEXT_MUTED, borderTop: `1px solid ${CARD_MUTED}` }}>
            © 2026 EchoEvents. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
