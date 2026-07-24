import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MIN_DATE = new Date(2017, 0, 1);
const MAX_DATE = new Date(2019, 11, 31);

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const BG = "#3c3658";
const SURFACE = "#ffffff";
const SURFACE_ALT = "#fefefe";
const ACCENT = "#f6f7f9";
const BORDER = "#e0e3e8";
const TEXT_DARK = "#3c3658";
const PRIMARY_BLUE = "#003580";
const ACCENT_YELLOW = "#febb02";

export default function Page_bus_pass_renewal(props: GeneratedPageProps) {
  const [viewMonth, setViewMonth] = useState(7);
  const [viewYear, setViewYear] = useState(2018);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [from] = useState("Los Angeles (LAX)");
  const [to] = useState("Singapore (SIN)");
  const [travelers] = useState(1);
  const [cabinClass, setCabinClass] = useState("Economy");
  const [tripType, setTripType] = useState<"round-trip" | "one-way">("round-trip");
  const [activeFilter, setActiveFilter] = useState("Cheapest");

  const canGoPrev = useMemo(() => {
    const prev = viewMonth === 0 ? new Date(viewYear - 1, 11, 1) : new Date(viewYear, viewMonth - 1, 1);
    return prev >= new Date(MIN_DATE.getFullYear(), MIN_DATE.getMonth(), 1);
  }, [viewMonth, viewYear]);

  const canGoNext = useMemo(() => {
    const next = viewMonth === 11 ? new Date(viewYear + 1, 0, 1) : new Date(viewYear, viewMonth + 1, 1);
    return next <= new Date(MAX_DATE.getFullYear(), MAX_DATE.getMonth(), 1);
  }, [viewMonth, viewYear]);

  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else { setViewMonth(m => m - 1); }
  }, [canGoPrev, viewMonth]);

  const goNext = useCallback(() => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else { setViewMonth(m => m + 1); }
  }, [canGoNext, viewMonth]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number; iso: string; disabled: boolean } | null> = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toISO(viewYear, viewMonth, d);
      const date = new Date(viewYear, viewMonth, d);
      const outOfRange = date < MIN_DATE || date > MAX_DATE;
      cells.push({ day: d, iso, disabled: outOfRange });
    }
    return cells;
  }, [viewMonth, viewYear]);

  const handleDayClick = useCallback((iso: string) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(iso);
      setRangeEnd(null);
    } else {
      if (iso < rangeStart) {
        setRangeStart(iso);
        setRangeEnd(null);
      } else if (iso === rangeStart) {
        setRangeStart(null);
      } else {
        setRangeEnd(iso);
      }
    }
  }, [rangeStart, rangeEnd]);

  const isInRange = useCallback((iso: string) => {
    if (rangeStart && rangeEnd) {
      return iso >= rangeStart && iso <= rangeEnd;
    }
    if (rangeStart && hoverDate && !rangeEnd) {
      const effectiveEnd = hoverDate >= rangeStart ? hoverDate : rangeStart;
      const effectiveStart = hoverDate >= rangeStart ? rangeStart : hoverDate;
      return iso >= effectiveStart && iso <= effectiveEnd;
    }
    return false;
  }, [rangeStart, rangeEnd, hoverDate]);

  const isRangeStart = useCallback((iso: string) => iso === rangeStart, [rangeStart]);
  const isRangeEnd = useCallback((iso: string) => {
    if (rangeEnd) return iso === rangeEnd;
    if (rangeStart && hoverDate && hoverDate >= rangeStart) return iso === hoverDate;
    return false;
  }, [rangeEnd, rangeStart, hoverDate]);

  const rangeLabel = useMemo(() => {
    if (rangeStart && rangeEnd) {
      const s = parseISO(rangeStart);
      const e = parseISO(rangeEnd);
      return `${MONTH_NAMES[s.getMonth()].slice(0,3)} ${s.getDate()}, ${s.getFullYear()} — ${MONTH_NAMES[e.getMonth()].slice(0,3)} ${e.getDate()}, ${e.getFullYear()}`;
    }
    if (rangeStart) {
      const s = parseISO(rangeStart);
      return `${MONTH_NAMES[s.getMonth()].slice(0,3)} ${s.getDate()}, ${s.getFullYear()} — Select end date`;
    }
    return "Select dates";
  }, [rangeStart, rangeEnd]);

  const handleSubmit = useCallback(() => {
    if (!rangeStart || !rangeEnd) return;
    props.onSubmit({
      type: "date_range",
      value: `${rangeStart} to ${rangeEnd}`,
      raw: { rangeStart, rangeEnd, from, to, travelers, cabinClass, tripType },
    });
  }, [rangeStart, rangeEnd, from, to, travelers, cabinClass, tripType, props]);

  const destinations = [
    { name: "Singapore", tag: "Direct", price: "$687", color: "#003580" },
    { name: "Bangkok", tag: "Popular", price: "$412", color: "#0071c2" },
    { name: "Tokyo", tag: "Trending", price: "$549", color: "#00487a" },
    { name: "Bali", tag: "Hot Deal", price: "$398", color: "#005999" },
  ];

  const filters = ["Cheapest", "Best", "Fastest", "Direct Only"];

  return (
    <div className="min-h-screen font-sans" style={{ background: BG }}>
      {/* Header */}
      <header className="w-full" style={{ background: PRIMARY_BLUE }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: ACCENT_YELLOW, color: PRIMARY_BLUE }}>
              ✈
            </div>
            <span className="text-lg font-semibold" style={{ color: SURFACE }}>EchoTrip</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>Flights</span>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Hotels</span>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Car Rental</span>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Packages</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>USD</span>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>EN</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: "rgba(255,255,255,0.15)", color: SURFACE }}>
              👤
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="w-full py-8" style={{ background: `linear-gradient(135deg, ${PRIMARY_BLUE} 0%, ${BG} 100%)` }}>
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: SURFACE }}>
            Book a flight from Los Angeles to Singapore
          </h1>
          <p className="text-base mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
            Find the best fares and plan your journey
          </p>
          <div className="inline-block px-4 py-2 text-sm font-medium" style={{ background: "rgba(254,187,2,0.15)", color: ACCENT_YELLOW, borderRadius: 9999 }}>
            ✈ Bus Pass Renewal Portal — Flight Booking
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Filters + Info */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Route Card */}
            <div className="p-6" style={{ background: SURFACE, borderRadius: 9999 > 24 ? 24 : 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: PRIMARY_BLUE }}>Route</div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center text-lg" style={{ background: ACCENT, borderRadius: 9999, color: TEXT_DARK }}>✈</div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: TEXT_DARK }}>{from}</div>
                  <div className="text-xs" style={{ color: "#8b8fa3" }}>Departure</div>
                </div>
              </div>
              <div className="flex items-center ml-5 mb-4">
                <div className="w-0.5 h-8" style={{ background: BORDER }}></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center text-lg" style={{ background: ACCENT, borderRadius: 9999, color: TEXT_DARK }}>📍</div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: TEXT_DARK }}>{to}</div>
                  <div className="text-xs" style={{ color: "#8b8fa3" }}>Arrival</div>
                </div>
              </div>
            </div>

            {/* Trip Options */}
            <div className="p-6" style={{ background: SURFACE, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: PRIMARY_BLUE }}>Trip Options</div>
              <div className="flex gap-2 mb-5">
                {(["round-trip", "one-way"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTripType(t)}
                    className="px-4 py-2 text-sm font-medium transition-all"
                    style={{
                      borderRadius: 9999,
                      background: tripType === t ? PRIMARY_BLUE : ACCENT,
                      color: tripType === t ? SURFACE : TEXT_DARK,
                    }}
                  >
                    {t === "round-trip" ? "Round Trip" : "One Way"}
                  </button>
                ))}
              </div>
              <div className="mb-4">
                <label className="text-xs font-medium mb-1 block" style={{ color: "#8b8fa3" }}>Travelers</label>
                <div className="px-4 py-2.5 text-sm" style={{ background: ACCENT, borderRadius: 9999, color: TEXT_DARK }}>
                  {travelers} Adult
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#8b8fa3" }}>Cabin Class</label>
                <select
                  value={cabinClass}
                  onChange={e => setCabinClass(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border-0 outline-none cursor-pointer"
                  style={{ background: ACCENT, borderRadius: 9999, color: TEXT_DARK }}
                >
                  <option>Economy</option>
                  <option>Premium Economy</option>
                  <option>Business</option>
                  <option>First</option>
                </select>
              </div>
            </div>

            {/* Filters */}
            <div className="p-6" style={{ background: SURFACE, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: PRIMARY_BLUE }}>Sort By</div>
              <div className="flex flex-wrap gap-2">
                {filters.map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className="px-4 py-2 text-sm font-medium transition-all"
                    style={{
                      borderRadius: 9999,
                      background: activeFilter === f ? PRIMARY_BLUE : ACCENT,
                      color: activeFilter === f ? SURFACE : TEXT_DARK,
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Calendar + Submit */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Instruction Card */}
            <div className="p-5 flex items-start gap-3" style={{ background: SURFACE, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-lg" style={{ background: `rgba(0,53,128,0.1)`, borderRadius: 9999, color: PRIMARY_BLUE }}>📅</div>
              <div>
                <div className="text-sm font-semibold mb-1" style={{ color: TEXT_DARK }}>Select Your Travel Dates</div>
                <div className="text-sm" style={{ color: "#6b7084" }}>
                  Book a flight from Los Angeles to Singapore. Select your departure date: August 13, 2018 to August 20, 2018.
                </div>
              </div>
            </div>

            {/* Date Display Bar */}
            <div className="p-4 flex items-center justify-between" style={{ background: SURFACE, borderRadius: 9999, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <div className="flex items-center gap-3">
                <span className="text-lg">🗓</span>
                <span className="text-sm font-medium" style={{ color: TEXT_DARK }}>{rangeLabel}</span>
              </div>
              {rangeStart && (
                <button
                  onClick={() => { setRangeStart(null); setRangeEnd(null); }}
                  className="text-xs px-3 py-1 font-medium"
                  style={{ borderRadius: 9999, background: ACCENT, color: "#8b8fa3" }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Calendar */}
            <div className="p-6 md:p-8" style={{ background: SURFACE, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={goPrev}
                  disabled={!canGoPrev}
                  className="w-10 h-10 flex items-center justify-center text-lg font-bold transition-all"
                  style={{
                    borderRadius: 9999,
                    background: canGoPrev ? ACCENT : "transparent",
                    color: canGoPrev ? TEXT_DARK : BORDER,
                    cursor: canGoPrev ? "pointer" : "not-allowed",
                  }}
                >
                  ‹
                </button>
                <div className="text-lg font-semibold" style={{ color: TEXT_DARK }}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </div>
                <button
                  onClick={goNext}
                  disabled={!canGoNext}
                  className="w-10 h-10 flex items-center justify-center text-lg font-bold transition-all"
                  style={{
                    borderRadius: 9999,
                    background: canGoNext ? ACCENT : "transparent",
                    color: canGoNext ? TEXT_DARK : BORDER,
                    cursor: canGoNext ? "pointer" : "not-allowed",
                  }}
                >
                  ›
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: "#8b8fa3" }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((cell, i) => {
                  if (!cell) return <div key={`e-${i}`} className="h-11" />;
                  const { day, iso, disabled } = cell;
                  const inRange = isInRange(iso);
                  const isStart = isRangeStart(iso);
                  const isEnd = isRangeEnd(iso);
                  const isSelected = isStart || isEnd;

                  let bgColor = "transparent";
                  let textColor = TEXT_DARK;
                  let fontWeight = "400";

                  if (disabled) {
                    textColor = BORDER;
                  } else if (isSelected) {
                    bgColor = PRIMARY_BLUE;
                    textColor = SURFACE;
                    fontWeight = "600";
                  } else if (inRange) {
                    bgColor = "rgba(0,53,128,0.1)";
                    textColor = PRIMARY_BLUE;
                    fontWeight = "500";
                  }

                  const cellRadius = isStart && inRange
                    ? "9999px 0 0 9999px"
                    : isEnd && inRange
                    ? "0 9999px 9999px 0"
                    : isSelected
                    ? "9999px"
                    : "0";

                  const wrapRadius = isStart && (rangeEnd || (hoverDate && hoverDate > rangeStart!))
                    ? "9999px 0 0 9999px"
                    : isEnd
                    ? "0 9999px 9999px 0"
                    : "0";

                  return (
                    <div
                      key={iso}
                      className="relative h-11 flex items-center justify-center"
                      style={{
                        background: inRange && !isSelected ? "rgba(0,53,128,0.06)" : "transparent",
                        borderRadius: inRange ? wrapRadius : "0",
                      }}
                    >
                      <button
                        disabled={disabled}
                        onClick={() => !disabled && handleDayClick(iso)}
                        onMouseEnter={() => !disabled && setHoverDate(iso)}
                        onMouseLeave={() => setHoverDate(null)}
                        className="w-10 h-10 flex items-center justify-center text-sm transition-all"
                        style={{
                          borderRadius: isSelected ? "9999px" : inRange ? cellRadius : "9999px",
                          background: bgColor,
                          color: textColor,
                          fontWeight,
                          cursor: disabled ? "not-allowed" : "pointer",
                        }}
                      >
                        {day}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!rangeStart || !rangeEnd}
              className="w-full py-4 text-base font-semibold transition-all"
              style={{
                borderRadius: 9999,
                background: rangeStart && rangeEnd ? PRIMARY_BLUE : BORDER,
                color: rangeStart && rangeEnd ? SURFACE : "#8b8fa3",
                cursor: rangeStart && rangeEnd ? "pointer" : "not-allowed",
                boxShadow: rangeStart && rangeEnd ? "0 4px 16px rgba(0,53,128,0.3)" : "none",
              }}
            >
              {rangeStart && rangeEnd ? "Confirm Dates & Search Flights" : "Select departure and return dates"}
            </button>
          </div>
        </div>

        {/* Popular Destinations */}
        <div className="mt-12 mb-8">
          <h2 className="text-xl font-bold mb-6" style={{ color: SURFACE }}>Popular Destinations from LAX</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {destinations.map(d => (
              <div key={d.name} className="overflow-hidden" style={{ background: SURFACE, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                <div className="h-36 flex items-end p-4" style={{ background: `linear-gradient(135deg, ${d.color} 0%, ${BG} 100%)` }}>
                  <span className="text-xs font-semibold px-3 py-1" style={{ background: "rgba(255,255,255,0.2)", color: SURFACE, borderRadius: 9999 }}>
                    {d.tag}
                  </span>
                </div>
                <div className="p-4">
                  <div className="text-sm font-semibold" style={{ color: TEXT_DARK }}>{d.name}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: "#8b8fa3" }}>from</span>
                    <span className="text-lg font-bold" style={{ color: PRIMARY_BLUE }}>{d.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6" style={{ color: SURFACE }}>What Travelers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Sarah M.", text: "Seamless booking experience. Found great deals on Singapore flights!", rating: 5 },
              { name: "James K.", text: "The date picker made it so easy to plan our family trip.", rating: 4 },
              { name: "Priya L.", text: "Best prices I've found for LAX to SIN routes. Highly recommend!", rating: 5 },
            ].map((r, i) => (
              <div key={i} className="p-5" style={{ background: SURFACE_ALT, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 flex items-center justify-center text-sm font-bold" style={{ background: ACCENT, borderRadius: 9999, color: PRIMARY_BLUE }}>
                    {r.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: TEXT_DARK }}>{r.name}</div>
                    <div className="text-xs" style={{ color: ACCENT_YELLOW }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  </div>
                </div>
                <p className="text-sm" style={{ color: "#6b7084" }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-8" style={{ background: "rgba(0,0,0,0.2)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Company</div>
              {["About Us","Careers","Press","Blog"].map(l => (
                <div key={l} className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>{l}</div>
              ))}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Support</div>
              {["Help Center","Contact Us","FAQ","Refund Policy"].map(l => (
                <div key={l} className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>{l}</div>
              ))}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Legal</div>
              {["Terms of Service","Privacy Policy","Cookie Policy","Licenses"].map(l => (
                <div key={l} className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>{l}</div>
              ))}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Get the App</div>
              <div className="flex flex-col gap-2">
                <div className="px-4 py-2 text-xs text-center" style={{ background: "rgba(255,255,255,0.1)", borderRadius: 9999, color: "rgba(255,255,255,0.7)" }}>
                  📱 EchoStore
                </div>
                <div className="px-4 py-2 text-xs text-center" style={{ background: "rgba(255,255,255,0.1)", borderRadius: 9999, color: "rgba(255,255,255,0.7)" }}>
                  📱 EchoPlay
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 text-center text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
            © 2018 EchoTrip. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
